import type { Context, Next } from "hono";
import { verifyAccessToken } from "../lib/jwt";

export async function authMiddleware(
  c: Context,
  next: Next,
): Promise<Response | void> {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Yetkisiz erişim" }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyAccessToken(token);
    c.set("userId", payload.userId);
    c.set("username", payload.username);
    await next();
  } catch {
    return c.json({ error: "Geçersiz veya süresi dolmuş token" }, 401);
  }
}
