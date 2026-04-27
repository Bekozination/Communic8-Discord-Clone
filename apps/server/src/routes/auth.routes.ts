import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { users, refreshTokens } from "../db/schema/index";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt";

const router = new Hono();

const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9_.]+$/, "Sadece küçük harf, rakam, nokta ve alt çizgi"),
  displayName: z.string().min(1).max(64),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  login: z.string(),
  password: z.string(),
});

// POST /api/auth/register
router.post("/register", zValidator("json", registerSchema), async (c) => {
  const { username, displayName, email, password } = c.req.valid("json");

  const existing = await db.query.users.findFirst({
    where: (u, { or, eq }) => or(eq(u.email, email), eq(u.username, username)),
  });

  if (existing) {
    if (existing.email === email)
      return c.json({ error: "Bu e-posta zaten kullanılıyor" }, 409);
    return c.json({ error: "Bu kullanıcı adı zaten alınmış" }, 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(users)
    .values({
      username,
      displayName,
      email,
      passwordHash,
    })
    .returning({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      email: users.email,
      avatarUrl: users.avatarUrl,
      status: users.status,
      createdAt: users.createdAt,
    });

  const accessToken = await signAccessToken({
    userId: user.id,
    username: user.username,
  });
  const refreshToken = await signRefreshToken({
    userId: user.id,
    username: user.username,
  });

  await db.insert(refreshTokens).values({
    userId: user.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return c.json({ user, accessToken, refreshToken }, 201);
});

// POST /api/auth/login
router.post("/login", zValidator("json", loginSchema), async (c) => {
  const { login, password } = c.req.valid("json");

  const isEmail = login.includes("@");
  const user = await db.query.users.findFirst({
    where: isEmail ? eq(users.email, login) : eq(users.username, login),
  });

  if (!user) return c.json({ error: "Kullanıcı bulunamadı" }, 404);

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return c.json({ error: "Hatalı şifre" }, 401);

  const accessToken = await signAccessToken({
    userId: user.id,
    username: user.username,
  });
  const refreshToken = await signRefreshToken({
    userId: user.id,
    username: user.username,
  });

  await db.insert(refreshTokens).values({
    userId: user.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const { passwordHash: _, ...safeUser } = user;
  return c.json({ user: safeUser, accessToken, refreshToken });
});

// POST /api/auth/refresh
router.post("/refresh", async (c) => {
  const body = await c.req.json<{ refreshToken: string }>();
  if (!body.refreshToken)
    return c.json({ error: "Refresh token gerekli" }, 400);

  try {
    const payload = await verifyRefreshToken(body.refreshToken);

    const stored = await db.query.refreshTokens.findFirst({
      where: eq(refreshTokens.token, body.refreshToken),
    });

    if (!stored || stored.expiresAt < new Date()) {
      return c.json({ error: "Geçersiz refresh token" }, 401);
    }

    const accessToken = await signAccessToken({
      userId: payload.userId,
      username: payload.username,
    });
    return c.json({ accessToken });
  } catch {
    return c.json({ error: "Geçersiz refresh token" }, 401);
  }
});

// POST /api/auth/logout
router.post("/logout", async (c) => {
  const body = await c.req.json<{ refreshToken: string }>();
  if (body.refreshToken) {
    await db
      .delete(refreshTokens)
      .where(eq(refreshTokens.token, body.refreshToken));
  }
  return c.json({ success: true });
});

export default router;
