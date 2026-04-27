import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { users } from "../db/schema/index";
import { authMiddleware } from "../middleware/auth.middleware";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const router = new Hono();
router.use("*", authMiddleware);

// GET /api/users/me — Mevcut kullanıcı bilgileri
router.get("/me", async (c) => {
  const userId = c.get("userId") as string;

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      avatarUrl: true,
      status: true,
      customStatus: true,
      createdAt: true,
    },
  });

  if (!user) return c.json({ error: "Kullanıcı bulunamadı" }, 404);
  return c.json(user);
});

router.patch("/me", zValidator("json", z.object({ displayName: z.string().min(2).max(64) })), async (c) => {
  const userId = c.get("userId") as string;
  const { displayName } = c.req.valid("json");

  const [updated] = await db.update(users)
    .set({ displayName, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      email: users.email,
      avatarUrl: users.avatarUrl,
      status: users.status,
    });

  return c.json(updated);
});

export default router;
