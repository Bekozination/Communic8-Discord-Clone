import { Hono } from "hono";
import { eq, or, and } from "drizzle-orm";
import { db } from "../db/index";
import { friends, users } from "../db/schema/index";
import { authMiddleware } from "../middleware/auth.middleware";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const router = new Hono();
router.use("*", authMiddleware);

// Arkadaş listesini ve bekleyen istekleri getir
router.get("/", async (c) => {
  const userId = c.get("userId") as string;

  const friendships = await db.query.friends.findMany({
    where: or(eq(friends.user1Id, userId), eq(friends.user2Id, userId)),
    with: {
      user1: {
        columns: { id: true, username: true, displayName: true, avatarUrl: true, status: true }
      },
      user2: {
        columns: { id: true, username: true, displayName: true, avatarUrl: true, status: true }
      }
    }
  });

  const formatted = friendships.map(f => {
    const isUser1 = f.user1Id === userId;
    const friend = isUser1 ? f.user2 : f.user1;
    // Eğer pending ise ve user1 ise "gönderilen", user2 ise "gelen" istek
    const type = f.status === "accepted" ? "friend" : (isUser1 ? "outgoing_request" : "incoming_request");
    return {
      id: f.id,
      friend,
      type,
      createdAt: f.createdAt
    };
  });

  return c.json(formatted);
});

// Arkadaşlık isteği gönder
router.post("/request", zValidator("json", z.object({ username: z.string() })), async (c) => {
  const userId = c.get("userId") as string;
  const { username } = c.req.valid("json");

  const targetUser = await db.query.users.findFirst({
    where: eq(users.username, username)
  });

  if (!targetUser) return c.json({ error: "Kullanıcı bulunamadı" }, 404);
  if (targetUser.id === userId) return c.json({ error: "Kendine istek gönderemezsin" }, 400);

  const existing = await db.query.friends.findFirst({
    where: or(
      and(eq(friends.user1Id, userId), eq(friends.user2Id, targetUser.id)),
      and(eq(friends.user1Id, targetUser.id), eq(friends.user2Id, userId))
    )
  });

  if (existing) {
    if (existing.status === "accepted") return c.json({ error: "Zaten arkadaşsınız" }, 400);
    return c.json({ error: "Zaten bekleyen bir istek var" }, 400);
  }

  const [friendReq] = await db.insert(friends).values({
    user1Id: userId,
    user2Id: targetUser.id,
    status: "pending"
  }).returning();

  return c.json(friendReq, 201);
});

// Arkadaşlık isteğini kabul et
router.post("/accept/:id", async (c) => {
  const userId = c.get("userId") as string;
  const { id } = c.req.param();

  const friendReq = await db.query.friends.findFirst({
    where: and(eq(friends.id, id), eq(friends.user2Id, userId), eq(friends.status, "pending"))
  });

  if (!friendReq) return c.json({ error: "İstek bulunamadı veya yetkiniz yok" }, 404);

  const [updated] = await db.update(friends)
    .set({ status: "accepted" })
    .where(eq(friends.id, id))
    .returning();

  return c.json(updated);
});

// Arkadaşı veya isteği sil
router.delete("/:id", async (c) => {
  const userId = c.get("userId") as string;
  const { id } = c.req.param();

  const existing = await db.query.friends.findFirst({
    where: and(
      eq(friends.id, id),
      or(eq(friends.user1Id, userId), eq(friends.user2Id, userId))
    )
  });

  if (!existing) return c.json({ error: "Bulunamadı" }, 404);

  await db.delete(friends).where(eq(friends.id, id));

  return c.json({ success: true });
});

export default router;
