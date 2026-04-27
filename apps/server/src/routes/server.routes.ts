import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../db/index";
import {
  servers,
  serverMembers,
  channels,
  categories,
  roles,
  memberRoles,
} from "../db/schema/index";
import { authMiddleware } from "../middleware/auth.middleware";

const router = new Hono();
router.use("*", authMiddleware);

const createServerSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
});

// GET /api/servers — Kullanıcının üye olduğu sunucular
router.get("/", async (c) => {
  const userId = c.get("userId") as string;

  const memberships = await db.query.serverMembers.findMany({
    where: eq(serverMembers.userId, userId),
    with: {
      server: true,
    },
  });

  return c.json(memberships.map((m) => m.server));
});

// POST /api/servers — Yeni sunucu oluştur
router.post("/", zValidator("json", createServerSchema), async (c) => {
  const userId = c.get("userId") as string;
  const data = c.req.valid("json");

  const inviteCode = nanoid(8);

  const [server] = await db.transaction(async (tx) => {
    const [srv] = await tx
      .insert(servers)
      .values({
        ...data,
        ownerId: userId,
        inviteCode,
      })
      .returning();

    // Varsayılan "@everyone" rolü
    await tx.insert(roles).values({
      serverId: srv.id,
      name: "@everyone",
      isDefault: true,
      permissions: "1071698660929",
    });

    // Varsayılan kategori
    const [cat] = await tx
      .insert(categories)
      .values({
        serverId: srv.id,
        name: "METİN KANALLARI",
        position: 0,
      })
      .returning();

    // Varsayılan #genel kanalı
    await tx.insert(channels).values({
      serverId: srv.id,
      categoryId: cat.id,
      name: "genel",
      type: "text",
      position: 0,
    });

    // Ses kategorisi
    const [voiceCat] = await tx
      .insert(categories)
      .values({
        serverId: srv.id,
        name: "SES KANALLARI",
        position: 1,
      })
      .returning();

    // Varsayılan Ses kanalı
    await tx.insert(channels).values({
      serverId: srv.id,
      categoryId: voiceCat.id,
      name: "Genel Ses",
      type: "voice",
      position: 0,
    });

    // Kurucuyu üye yap
    await tx.insert(serverMembers).values({
      serverId: srv.id,
      userId,
    });

    return [srv];
  });

  return c.json(server, 201);
});

// GET /api/servers/:serverId — Sunucu detayı
router.get("/:serverId", async (c) => {
  const userId = c.get("userId") as string;
  const { serverId } = c.req.param();

  const member = await db.query.serverMembers.findFirst({
    where: and(
      eq(serverMembers.serverId, serverId),
      eq(serverMembers.userId, userId),
    ),
  });

  if (!member) return c.json({ error: "Bu sunucuya erişim izniniz yok" }, 403);

  const server = await db.query.servers.findFirst({
    where: eq(servers.id, serverId),
    with: {
      channels: { orderBy: (ch, { asc }) => asc(ch.position) },
      categories: { orderBy: (cat, { asc }) => asc(cat.position) },
      members: {
        with: {
          user: {
            columns: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              status: true,
            },
          },
        },
      },
      roles: { orderBy: (r, { asc }) => asc(r.position) },
    },
  });

  return c.json(server);
});

// POST /api/servers/join/:inviteCode — Davet koduyla katıl
router.post("/join/:inviteCode", async (c) => {
  const userId = c.get("userId") as string;
  const { inviteCode } = c.req.param();

  const server = await db.query.servers.findFirst({
    where: eq(servers.inviteCode, inviteCode),
  });

  if (!server) return c.json({ error: "Geçersiz davet kodu" }, 404);

  const existingMember = await db.query.serverMembers.findFirst({
    where: and(
      eq(serverMembers.serverId, server.id),
      eq(serverMembers.userId, userId),
    ),
  });

  if (existingMember) return c.json({ error: "Zaten bu sunucudasınız" }, 409);

  await db.insert(serverMembers).values({ serverId: server.id, userId });

  return c.json(server, 201);
});

// POST /api/servers/:serverId/channels — Kanal ekle
router.post("/:serverId/channels", zValidator("json", z.object({ name: z.string().min(1).max(32), type: z.enum(["text", "voice"]) })), async (c) => {
  const userId = c.get("userId") as string;
  const { serverId } = c.req.param();
  const { name, type } = c.req.valid("json");

  const server = await db.query.servers.findFirst({
    where: and(eq(servers.id, serverId), eq(servers.ownerId, userId)),
    with: { categories: true }
  });

  if (!server) return c.json({ error: "Yetkisiz erişim" }, 403);

  // Ses veya Metin için uygun kategoriyi bul (basit mantık, ilkini seçer veya kategori atamaz)
  const targetCategoryName = type === "voice" ? "SES KANALLARI" : "METİN KANALLARI";
  let targetCategory = server.categories.find(cat => cat.name === targetCategoryName);
  
  if (!targetCategory && server.categories.length > 0) {
    targetCategory = server.categories[0];
  }

  const [channel] = await db.insert(channels)
    .values({
      serverId,
      categoryId: targetCategory?.id || null,
      name,
      type,
      position: 99
    })
    .returning();

  return c.json(channel, 201);
});

// POST /api/servers/:serverId/roles — Rol ekle
router.post("/:serverId/roles", zValidator("json", z.object({ name: z.string().min(1).max(64) })), async (c) => {
  const userId = c.get("userId") as string;
  const { serverId } = c.req.param();
  const { name } = c.req.valid("json");

  // TODO: Yetki kontrolü yapılmalı (sadece sunucu sahibi/yetkilisi ekleyebilir)
  const server = await db.query.servers.findFirst({
    where: and(eq(servers.id, serverId), eq(servers.ownerId, userId))
  });

  if (!server) return c.json({ error: "Yetkisiz erişim" }, 403);

  const [role] = await db.insert(roles)
    .values({
      serverId,
      name,
      color: "#99AAB5"
    })
    .returning();

  return c.json(role, 201);
});

// DELETE /api/servers/:serverId/roles/:roleId — Rol sil
router.delete("/:serverId/roles/:roleId", async (c) => {
  const userId = c.get("userId") as string;
  const { serverId, roleId } = c.req.param();

  const server = await db.query.servers.findFirst({
    where: and(eq(servers.id, serverId), eq(servers.ownerId, userId))
  });

  if (!server) return c.json({ error: "Yetkisiz erişim" }, 403);

  await db.delete(roles).where(and(eq(roles.id, roleId), eq(roles.serverId, serverId)));

  return c.json({ success: true });
});

// POST /api/servers/:serverId/members/:memberId/roles — Üyeye rol ata
router.post("/:serverId/members/:memberId/roles", zValidator("json", z.object({ roleId: z.string().uuid() })), async (c) => {
  const userId = c.get("userId") as string;
  const { serverId, memberId } = c.req.param();
  const { roleId } = c.req.valid("json");

  const server = await db.query.servers.findFirst({
    where: and(eq(servers.id, serverId), eq(servers.ownerId, userId))
  });

  if (!server) return c.json({ error: "Yetkisiz erişim" }, 403);

  // Check if role exists and belongs to this server
  const role = await db.query.roles.findFirst({
    where: and(eq(roles.id, roleId), eq(roles.serverId, serverId))
  });

  if (!role) return c.json({ error: "Rol bulunamadı" }, 404);

  const [memberRole] = await db.insert(memberRoles).values({
    memberId,
    roleId
  }).returning();

  return c.json(memberRole, 201);
});

// DELETE /api/servers/:serverId/members/:memberId/roles/:roleId — Üyeden rol al
router.delete("/:serverId/members/:memberId/roles/:roleId", async (c) => {
  const userId = c.get("userId") as string;
  const { serverId, memberId, roleId } = c.req.param();

  const server = await db.query.servers.findFirst({
    where: and(eq(servers.id, serverId), eq(servers.ownerId, userId))
  });

  if (!server) return c.json({ error: "Yetkisiz erişim" }, 403);

  await db.delete(memberRoles).where(
    and(
      eq(memberRoles.memberId, memberId),
      eq(memberRoles.roleId, roleId)
    )
  );

  return c.json({ success: true });
});

export default router;
