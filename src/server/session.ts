import { createClerkClient, verifyToken } from "@clerk/backend";
import { serverSql } from "./database";
import { requireServerEnv } from "./env";
import { HttpError } from "./http";

export async function requireUser(request: Request) {
  const secret = process.env.CLERK_SECRET_KEY?.trim();
  if (!secret)
    throw new HttpError(503, "서버의 CLERK_SECRET_KEY 설정이 필요해요.");
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) throw new HttpError(401, "로그인 후 다시 시도해 주세요.");
  let userId: string;
  try {
    const pk = requireServerEnv("EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
    const host = Buffer.from(pk.replace(/^pk_(test|live)_/, ""), "base64")
      .toString()
      .replace(/\$$/, "");
    const parties = process.env.CLERK_AUTHORIZED_PARTIES?.split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = await verifyToken(token, {
      secretKey: secret,
      issuer: `https://${host}`,
      authorizedParties: parties?.length ? parties : undefined,
    });
    if (!payload.sub || !payload.sid) throw Error("Not a session token");
    userId = payload.sub;
  } catch {
    throw new HttpError(401, "로그인이 만료됐어요. 다시 로그인해 주세요.");
  }
  const sql = serverSql();
  const rows = await sql`SELECT id, deleted_at FROM users WHERE id=${userId}`;
  if (rows[0]?.deleted_at)
    throw new HttpError(401, "삭제된 계정이에요. 다시 로그인해 주세요.");
  if (!rows.length) {
    // A webhook may arrive after the user's first API request.
    let user;
    try {
      user = await createClerkClient({ secretKey: secret }).users.getUser(
        userId,
      );
    } catch {
      throw new HttpError(401, "계정 정보를 확인하지 못했어요.");
    }
    const email =
      user.emailAddresses.find((x) => x.id === user.primaryEmailAddressId)
        ?.emailAddress ?? null;
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
    await sql`INSERT INTO users(id,email,name,image_url,clerk_updated_at) VALUES(${userId},${email},${name},${user.imageUrl},${user.updatedAt}) ON CONFLICT(id) DO NOTHING`;
  }
  return userId;
}
