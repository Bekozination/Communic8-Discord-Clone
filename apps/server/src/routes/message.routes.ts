import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and, lt, desc } from "drizzle-orm";
import { db } from "../db/index";
import { messages, channels, serverMembers } from "../db/schema/index";
import { authMiddleware } from "../middleware/auth.middleware";

const router = new Hono();
router.use("*", authMiddleware);

// GET /api/channels/:channelId/messages
router.get("/:channelId/messages", async (c) => {
  const userId = c.get("userId") as string;
  const { channelId } = c.req.param();
  const { before, limit = "50" } = c.req.query();

  const channel = await db.query.channels.findFirst({
    where: eq(channels.id, channelId),
    with: {
      server: {
        with: { members: { where: eq(serverMembers.userId, userId) } },
      },
    },
  });

  if (!channel || channel.server.members.length === 0) {
    return c.json({ error: "Erişim reddedildi" }, 403);
  }

  const conditions = [
    eq(messages.channelId, channelId),
    eq(messages.isDeleted, false),
  ];
  if (before) {
    conditions.push(lt(messages.createdAt, new Date(before)));
  }

  const msgs = await db.query.messages.findMany({
    where: and(...conditions),
    with: {
      author: {
        columns: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: (m, { desc }) => desc(m.createdAt),
    limit: Math.min(Number(limit), 100),
  });

  return c.json(msgs.reverse());
});

// PATCH /api/channels/:channelId/messages/:messageId
router.patch(
  "/:channelId/messages/:messageId",
  zValidator("json", z.object({ content: z.string().min(1).max(4000) })),
  async (c) => {
    const userId = c.get("userId") as string;
    const { messageId } = c.req.param();
    const { content } = c.req.valid("json");

    const message = await db.query.messages.findFirst({
      where: and(eq(messages.id, messageId), eq(messages.authorId, userId)),
    });

    if (!message)
      return c.json(
        { error: "Mesaj bulunamadı veya düzenleme yetkiniz yok" },
        404,
      );

    const [updated] = await db
      .update(messages)
      .set({ content, editedAt: new Date() })
      .where(eq(messages.id, messageId))
      .returning();

    return c.json(updated);
  },
);

// DELETE /api/channels/:channelId/messages/:messageId
router.delete("/:channelId/messages/:messageId", async (c) => {
  const userId = c.get("userId") as string;
  const { messageId } = c.req.param();

  const message = await db.query.messages.findFirst({
    where: eq(messages.id, messageId),
    with: {
      channel: {
        with: { server: { columns: { ownerId: true } } },
      },
    },
  });

  if (!message) return c.json({ error: "Mesaj bulunamadı" }, 404);

  const isOwner = message.channel.server.ownerId === userId;
  const isAuthor = message.authorId === userId;

  if (!isOwner && !isAuthor)
    return c.json({ error: "Silme yetkiniz yok" }, 403);

  await db
    .update(messages)
    .set({ isDeleted: true, content: null })
    .where(eq(messages.id, messageId));

  return c.json({ success: true });
});

export default router;
