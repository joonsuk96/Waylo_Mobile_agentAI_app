// Integration checks use isolated test rows in Neon and mocked external providers.
// No real OpenAI requests or real image uploads are made.
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');const {randomUUID}=require('node:crypto');
const ts=require('typescript');require('dotenv').config({quiet:true});
const root=path.resolve(__dirname,'..');const out=path.join(root,'.expo','trip-check');
const sources=['lib/calendar','lib/trip-contract','server/env','server/database','server/http','server/session','server/trips','server/openai','server/images','inngest/client','inngest/generate-trip'];
for(const source of sources){const destination=path.join(out,source+'.js');fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,ts.transpileModule(fs.readFileSync(path.join(root,'src',source+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText)}
const {neon}=require('@neondatabase/serverless');const sql=neon(process.env.DATABASE_URL);
const repo=require(path.join(out,'server/trips.js'));
const contract=require(path.join(out,'lib/trip-contract.js'));
const userId='user_generation_check_'+randomUUID();
const input={destination:'테스트 도시',startDate:'2040-06-01',endDate:'2040-06-01',numTravelers:2,budgetTier:'medium',interests:['자연'],pace:'balanced'};
const realFetch=global.fetch;let aiCalls=0,uploads=0,photoMode='found',failBatchOnce=false; const batchCalls=[];
const itinerary={title:'테스트 여행',summary:'검증용 일정',imageQuery:'Test city',days:[{day:1,date:'2040-06-01',title:'산책',activities:[{time:'오후',name:'공원',description:'검증용 활동',location:'테스트 공원',latitude:null,longitude:null,estimatedCostKrw:10000}]}],hotels:[],budgetBreakdown:{currency:'KRW',scope:'total_group',accommodation:0,food:30000,transport:10000,activities:10000,other:0},tips:['검증용 안내']};
global.fetch=async(resource,options)=>{
  const url=String(resource?.url??resource);
  if(url.startsWith('https://api.openai.com/')){
    aiCalls++;const body=JSON.parse(options.body);assert.equal(body.model,'gpt-4o-mini');assert.equal(body.store,false);assert.equal(body.text.format.type,'json_schema');
    let output=itinerary;
    const payload=JSON.parse(body.input[1].content);
    if(body.text.format.name==='travel_overview'){const {days,...overview}=itinerary;output=overview;}
    if(body.text.format.name==='travel_day_batch'){
      batchCalls.push(payload.requiredCalendar[0].day);
      if(failBatchOnce&&payload.requiredCalendar[0].day===4){failBatchOnce=false;throw Error('Simulated provider connection timeout');}
      output={days:payload.requiredCalendar.map(spec=>({title:'검증 '+spec.day+'일차',activities:itinerary.days[0].activities}))};
    }
    return Response.json({id:'resp_check',object:'response',status:'completed',output:[{id:'msg_check',type:'message',role:'assistant',status:'completed',content:[{type:'output_text',annotations:[],text:JSON.stringify(output)}]}]});
  }
  if(url.startsWith('https://api.unsplash.com/search/'))return Response.json({results:photoMode==='found'?[{urls:{regular:'https://images.unsplash.com/check-photo?w=1080'},links:{html:'https://unsplash.com/photos/check',download_location:'https://api.unsplash.com/photos/check/download'},user:{name:'Test photographer',links:{html:'https://unsplash.com/@check'}}}]:[]});
  if(url.startsWith('https://api.unsplash.com/photos/check/download'))return Response.json({url:'https://images.unsplash.com/check-photo'});
  if(url.startsWith('https://upload.imagekit.io/')){uploads++;assert.ok(options.body.get('file'));return Response.json({url:'https://ik.imagekit.io/check/waylo/trips/fallback.svg'})}
  return realFetch(resource,options);
};
async function main(){
  assert.equal(contract.tripInputSchema.safeParse({...input,startDate:'2040-02-30'}).success,false);
  assert.equal(contract.tripInputSchema.safeParse({...input,numTravelers:0}).success,false);
  assert.equal(contract.tripInputSchema.safeParse({...input,endDate:'2040-07-15'}).success,false);
  assert.throws(()=>contract.validateItinerary({...itinerary,days:[]},input));
  const {requireUser}=require(path.join(out,'server/session.js'));
  process.env.CLERK_SECRET_KEY='sk_test_local_check_only';
  await assert.rejects(()=>requireUser(new Request('http://localhost/api/trips')),e=>e.status===401);
  await assert.rejects(()=>requireUser(new Request('http://localhost/api/trips',{headers:{Authorization:'Bearer invalid-token'}})),e=>e.status===401);
  console.log('Input validation, itinerary validation and unauthorized requests: passed');
  await sql`INSERT INTO users(id,clerk_updated_at) VALUES(${userId},0)`;
  const request=randomUUID();
  const duplicated=await Promise.all(Array.from({length:3},()=>repo.reserveTrip(userId,input,request)));
  assert.equal(new Set(duplicated.map(t=>t.id)).size,1);
  let quota=await sql`SELECT count FROM generation_usage WHERE user_id=${userId}`;assert.equal(quota[0].count,1);
  const batch=await Promise.allSettled(Array.from({length:20},()=>repo.reserveTrip(userId,input,randomUUID())));
  assert.equal(batch.filter(r=>r.status==='fulfilled').length,19);
  assert.equal(batch.filter(r=>r.status==='rejected'&&r.reason.status===429).length,1);
  const first=duplicated[0];
  await assert.rejects(()=>repo.findTrip(first.id,'user_someone_else'),e=>e.status===404);
  console.log('Concurrent duplicate request, atomic daily cap and ownership isolation: passed');
  await Promise.all([repo.failTrip(first.id,first.attempt_id,'test failure'),repo.failTrip(first.id,first.attempt_id,'test failure')]);
  quota=await sql`SELECT count FROM generation_usage WHERE user_id=${userId}`;assert.equal(quota[0].count,19);
  const retried=await Promise.all([repo.retryTrip(first.id,userId),repo.retryTrip(first.id,userId)]);
  assert.equal(retried[0].attempt_id,retried[1].attempt_id);assert.notEqual(retried[0].attempt_id,first.attempt_id);
  await repo.failTrip(first.id,first.attempt_id,'stale failure');
  assert.equal((await repo.findTrip(first.id,userId)).status,'pending');
  quota=await sql`SELECT count FROM generation_usage WHERE user_id=${userId}`;assert.equal(quota[0].count,20);
  console.log('Idempotent refund, concurrent retry and stale-attempt protection: passed');
  process.env.OPENAI_API_KEY='test-only-not-a-real-key';process.env.UNSPLASH_ACCESS_KEY='test-only-not-a-real-key';
  const {generateTrip}=require(path.join(out,'inngest/generate-trip.js'));
  await generateTrip.fn({event:{data:{tripId:first.id,attemptId:retried[0].attempt_id}},step:{run:async(_name,fn)=>fn()}});
  const ready=await repo.findTrip(first.id,userId);assert.equal(ready.status,'ready');assert.equal(ready.itinerary.title,itinerary.title);assert.equal(ready.cover.provider,'unsplash');assert.equal(aiCalls,1);assert.equal(uploads,0);
  assert.equal(contract.totalBudget(ready.itinerary),50000);
  await repo.failTrip(first.id,retried[0].attempt_id,'late failure');assert.equal((await repo.findTrip(first.id,userId)).status,'ready');
  console.log('Actual Inngest handler -> mocked OpenAI/Unsplash -> real Neon -> ready: passed');
  const spare=batch.find(result=>result.status==='fulfilled').value;
  await repo.failTrip(spare.id,spare.attempt_id,'free isolated test slot');
  const longInput={...input,endDate:'2040-06-14'};
  const longTrip=await repo.reserveTrip(userId,longInput,randomUUID());
  const memo=new Map();
  const context={event:{data:{tripId:longTrip.id,attemptId:longTrip.attempt_id}},step:{run:async(name,fn)=>{if(memo.has(name))return memo.get(name);const value=await fn();memo.set(name,value);return value;}}};
  failBatchOnce=true;
  await assert.rejects(()=>generateTrip.fn(context));
  await generateTrip.fn(context);
  const longReady=await repo.findTrip(longTrip.id,userId);
  assert.equal(longReady.status,'ready');assert.equal(longReady.itinerary.days.length,14);
  assert.deepEqual(longReady.itinerary.days.map(day=>day.day),Array.from({length:14},(_,i)=>i+1));
  assert.equal(longReady.itinerary.days.at(-1).date,'2040-06-14');
  assert.equal(batchCalls.filter(day=>day===1).length,1);
  assert.equal(batchCalls.filter(day=>day===4).length,2);
  console.log('14-day batching, server-assigned dates and resume after failed batch: passed');

  const {findCover}=require(path.join(out,'server/images.js'));photoMode='empty';process.env.IMAGEKIT_PRIVATE_KEY='test-only';process.env.IMAGEKIT_URL_ENDPOINT='https://ik.imagekit.io/check';
  const fallback=await findCover('No results','fallback');assert.equal(fallback.provider,'imagekit');assert.equal(uploads,1);
  console.log('ImageKit branded fallback and Unsplash hotlink/credit path: passed');
}
main().catch(e=>{console.error('Integration check failed:',e.message);process.exitCode=1}).finally(async()=>{global.fetch=realFetch;await sql`DELETE FROM users WHERE id=${userId}`;console.log('Only isolated test user/trips/quota rows removed.');});
