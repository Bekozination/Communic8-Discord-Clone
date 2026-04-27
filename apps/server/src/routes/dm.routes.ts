import { Hono } from "hono";
import { eq, or, and } from "drizzle-orm";
import { db } from "../db/index";
import { dmChannels, dmChannelMembers, directMessages, users } from "../db/schema/index";
import { authMiddleware } from "../middleware/auth.middleware";
import { getIO } from "../socket/socket.manager";

const router = new Hono();
router.use("*", authMiddleware);

// GET /api/dms
router.get("/", async (c) => {
  const userId = c.get("userId") as string;

  const userDMs = await db.query.dmChannelMembers.findMany({
    where: eq(dmChannelMembers.userId, userId),
    with: {
      channel: {
        with: {
          members: {
            with: {
              user: {
                columns: { id: true, username: true, displayName: true, avatarUrl: true, status: true }
              }
            }
          }
        }
      }
    }
  });

  const formattedDMs = userDMs.map(dm => {
    const otherMember = dm.channel.members.find(m => m.userId !== userId)?.user;
    return {
      id: dm.dmChannelId,
      otherUser: otherMember
    };
  }).filter(dm => dm.otherUser);

  return c.json(formattedDMs);
});

// Get or create DM channel with a user
router.post("/:targetUserId", async (c) => {
  const userId = c.get("userId") as string;
  const { targetUserId } = c.req.param();

  if (userId === targetUserId) return c.json({ error: "Kendinizle konuşamazsınız" }, 400);

  // Check if DM channel exists
  const user1Dms = await db.query.dmChannelMembers.findMany({ where: eq(dmChannelMembers.userId, userId) });
  const user2Dms = await db.query.dmChannelMembers.findMany({ where: eq(dmChannelMembers.userId, targetUserId) });
  
  const commonChannel = user1Dms.find(u1 => user2Dms.some(u2 => u2.dmChannelId === u1.dmChannelId));

  if (commonChannel) {
    const channel = await db.query.dmChannels.findFirst({ where: eq(dmChannels.id, commonChannel.dmChannelId) });
    return c.json(channel);
  }

  // Create new DM Channel
  const [newChannel] = await db.insert(dmChannels).values({}).returning();
  await db.insert(dmChannelMembers).values([
    { dmChannelId: newChannel.id, userId },
    { dmChannelId: newChannel.id, userId: targetUserId }
  ]);

  return c.json(newChannel);
});

// GET /api/dms/:dmId/messages
router.get("/:dmId/messages", async (c) => {
  const userId = c.get("userId") as string;
  const { dmId } = c.req.param();

  const isMember = await db.query.dmChannelMembers.findFirst({
    where: and(eq(dmChannelMembers.dmChannelId, dmId), eq(dmChannelMembers.userId, userId))
  });
  if (!isMember) return c.json({ error: "Erişim reddedildi" }, 403);

  const msgs = await db.query.directMessages.findMany({
    where: eq(directMessages.dmChannelId, dmId),
    with: {
      author: {
        columns: { id: true, username: true, displayName: true, avatarUrl: true }
      }
    },
    orderBy: (m, { desc }) => desc(m.createdAt),
    limit: 50
  });

  return c.json(msgs.reverse());
});

// POST /api/dms/:dmId/messages
router.post("/:dmId/messages", async (c) => {
  const userId = c.get("userId") as string;
  const { dmId } = c.req.param();
  const body = await c.req.json();

  const [message] = await db.insert(directMessages).values({
    dmChannelId: dmId,
    authorId: userId,
    content: body.content,
    attachments: body.attachments || []
  }).returning();

  const author = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, username: true, displayName: true, avatarUrl: true }
  });

  const fullMessage = { ...message, author: author! };

  // Soket üzerinden mesajı tüm dm channel üyelerine gönder
  try {
    const io = getIO();
    io.to(`channel:${dmId}`).emit("message:new", fullMessage);
  } catch (err) {
    console.error("Socket emit hatası:", err);
  }

  return c.json(fullMessage);
});

export default router;
