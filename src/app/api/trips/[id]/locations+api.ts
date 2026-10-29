import {requireUser} from "../../../../server/session";
import {apiError,json,jsonBody} from "../../../../server/http";
import {findTrip} from "../../../../server/trips";
import {locationState,requestLocations} from "../../../../server/trip-locations";
export async function GET(request:Request,{id}:{id:string}){try{const userId=await requireUser(request);await findTrip(id,userId);return json({locations:await locationState(id)})}catch(e){return apiError(e)}}
export async function POST(request:Request,{id}:{id:string}){try{const userId=await requireUser(request);const body=await jsonBody(request);return json({locations:await requestLocations(id,userId,body?.retry===true)})}catch(e){return apiError(e)}}
