export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function apiError(error: unknown) {
  if (error instanceof HttpError)
    return Response.json(
      { error: error.message },
      { status: error.status, headers: { "Cache-Control": "no-store" } },
    );
  console.error(
    "[trip-api] Request failed",
    error instanceof Error ? error.name : "UnknownError",
  );
  return Response.json(
    { error: "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요." },
    { status: 500 },
  );
}
export async function jsonBody(request: Request) {
  const text = await request.text();
  if (text.length > 16000) throw new HttpError(413, "입력 내용이 너무 길어요.");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "올바른 요청 형식이 아니에요.");
  }
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
