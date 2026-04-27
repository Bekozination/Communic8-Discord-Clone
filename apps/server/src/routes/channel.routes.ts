import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index";
import { channels, categories, servers, serverMembers } from "../db/schema/index";
import { authMiddleware } from "../middleware/auth.middleware";

const router = new Hono();
router.use("*", authMiddleware);

const createChannelSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["text", "voice", "announcement"]).default("text"),
  categoryId: z.string().uuid().optional(),
  topic: z.string().max(1024).optional(),
});

// GET /api/servers/:serverId/channels — Sunucunun kanalları
router.get("/:serverId/channels", async (c) => {
  const userId = c.get("userId") as string;
  const { serverId } = c.req.param();

  // Üyelik kontrolü
  const member = await db.query.serverMembers.findFirst({
    where: and(
      eq(serverMembers.serverId, serverId),
      eq(serverMembers.userId, userId),
    ),
  });
  if (!member) return c.json({ error: "Erişim reddedildi" }, 403);

  const serverChannels = await db.query.channels.findMany({
    where: eq(channels.serverId, serverId),
    orderBy: (ch, { asc }) => asc(ch.position),
  });

  const serverCategories = await db.query.categories.findMany({
    where: eq(categories.serverId, serverId),
    orderBy: (cat, { asc }) => asc(cat.position),
  });

  return c.json({ channels: serverChannels, categories: serverCategories });
});

// POST /api/servers/:serverId/channels — Yeni kanal oluştur
router.post(
  "/:serverId/channels",
  zValidator("json", createChannelSchema),
  async (c) => {
    const userId = c.get("userId") as string;
    const { serverId } = c.req.param();
    const data = c.req.valid("json");

    // Sunucu sahibi kontrolü
    const server = await db.query.servers.findFirst({
      where: eq(servers.id, serverId),
    });
    if (!server || server.ownerId !== userId)
      return c.json({ error: "Yetkiniz yok" }, 403);

    // Pozisyonu hesapla
    const existingChannels = await db.query.channels.findMany({
      where: eq(channels.serverId, serverId),
    });

    const [channel] = await db
      .insert(channels)
      .values({
        ...data,
        serverId,
        position: existingChannels.length,
      })
      .returning();

    return c.json(channel, 201);
  },
);

export default router;
