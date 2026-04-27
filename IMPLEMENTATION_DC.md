# 🚀 Discord Alternatifi (Communic8) — Tam Implementation Rehberi

> **Agent Talimatı:** Bu döküman, bir Discord alternatifi uygulamasının sıfırdan geliştirilmesi için hazırlanmış adım adım implementation rehberidir. Her faz sırayla uygulanmalı, bir önceki faz tamamlanmadan sonrakine geçilmemelidir. Tüm kod TypeScript ile yazılacak, hiçbir `any` tipi kullanılmayacaktır.

---

## 📋 İçindekiler

1. [Proje Genel Bakış](#1-proje-genel-bakış)
2. [Teknoloji Yığını](#2-teknoloji-yığını)
3. [Proje Yapısı](#3-proje-yapısı)
4. [Ortam Kurulumu](#4-ortam-kurulumu)
5. [Veritabanı Şeması](#5-veritabanı-şeması)
6. [Backend Implementation](#6-backend-implementation)
7. [Frontend Implementation](#7-frontend-implementation)
8. [Desktop App (Tauri)](#8-desktop-app-tauri)
9. [WebSocket Mimarisi](#9-websocket-mimarisi)
10. [Auth Sistemi](#10-auth-sistemi)
11. [Dosya Upload](#11-dosya-upload)
12. [Sesli Kanal (WebRTC)](#12-sesli-kanal-webrtc)
13. [Deployment](#13-deployment)
14. [Faz Planı & Checklist](#14-faz-planı--checklist)

---

## 1. Proje Genel Bakış

### Hedef

Türkiye'de Discord'a erişimin engellenmesi nedeniyle, aynı özellikleri sağlayan, self-host edilebilir, açık kaynaklı bir iletişim platformu geliştirmek.

### Kapsam (Bu Döküman)

- ✅ Web uygulaması (React)
- ✅ Desktop uygulaması (Tauri — Web kodundan türetilecek)
- ❌ Mobil uygulama (sonraki faz)

### Temel Özellikler

| Özellik                                     | Faz |
| ------------------------------------------- | --- |
| Kullanıcı kaydı / girişi                    | 1   |
| Sunucu (guild) oluşturma & yönetme          | 1   |
| Metin kanalları & gerçek zamanlı mesajlaşma | 1   |
| Dosya & resim gönderme                      | 2   |
| Rol ve izin sistemi                         | 2   |
| Direkt mesajlaşma (DM)                      | 2   |
| Sesli kanallar (WebRTC)                     | 3   |
| Video kanallar                              | 3   |

---

## 2. Teknoloji Yığını

### Frontend

```
React 18 + TypeScript + Vite
Tailwind CSS v3
shadcn/ui (bileşen kütüphanesi)
Zustand (global state)
TanStack Query v5 (server state & caching)
Socket.io-client (WebSocket)
React Router v6
React Hook Form + Zod (form validasyonu)
date-fns (tarih formatting)
Lucide React (ikonlar)
```

### Backend

```
Node.js 20+
Hono (HTTP framework)
Socket.io (WebSocket server)
Drizzle ORM (veritabanı ORM)
PostgreSQL (ana veritabanı)
Redis (session cache, pub/sub)
Zod (şema validasyonu)
Jose (JWT işlemleri)
bcryptjs (şifre hashleme)
```

### Desktop

```
Tauri v2 (Rust tabanlı desktop wrapper)
— Web kodunu sarmalamak için kullanılır
— Ekstra Rust kodu minimumda tutulacak
```

### Altyapı (Ücretsiz Tier)

```
Supabase       — PostgreSQL + Auth yedek
Upstash        — Redis
Cloudflare R2  — Dosya depolama (S3 uyumlu)
Railway        — Backend deploy
Vercel         — Frontend deploy
```

---

## 3. Proje Yapısı

```
project-root/
├── apps/
│   ├── web/                        # React web uygulaması
│   │   ├── src/
│   │   │   ├── assets/
│   │   │   ├── components/
│   │   │   │   ├── ui/             # shadcn/ui bileşenleri (otomatik oluşturulur)
│   │   │   │   ├── layout/         # Sidebar, Header, vb.
│   │   │   │   ├── server/         # Sunucu ile ilgili bileşenler
│   │   │   │   ├── channel/        # Kanal bileşenleri
│   │   │   │   ├── message/        # Mesaj bileşenleri
│   │   │   │   ├── auth/           # Auth bileşenleri
│   │   │   │   └── voice/          # Sesli kanal bileşenleri
│   │   │   ├── hooks/              # Custom React hook'ları
│   │   │   ├── lib/                # Yardımcı fonksiyonlar
│   │   │   │   ├── api.ts          # API istemcisi
│   │   │   │   ├── socket.ts       # Socket.io istemcisi
│   │   │   │   └── utils.ts
│   │   │   ├── pages/              # Sayfa bileşenleri
│   │   │   ├── stores/             # Zustand store'ları
│   │   │   │   ├── auth.store.ts
│   │   │   │   ├── server.store.ts
│   │   │   │   └── ui.store.ts
│   │   │   ├── types/              # Frontend tip tanımları
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   ├── desktop/                    # Tauri desktop uygulaması
│   │   ├── src-tauri/
│   │   │   ├── src/
│   │   │   │   └── main.rs
│   │   │   ├── Cargo.toml
│   │   │   └── tauri.conf.json
│   │   └── package.json            # web/package.json'ı extend eder
│   │
│   └── server/                     # Node.js backend
│       ├── src/
│       │   ├── db/
│       │   │   ├── schema/         # Drizzle şema dosyaları
│       │   │   │   ├── users.ts
│       │   │   │   ├── servers.ts
│       │   │   │   ├── channels.ts
│       │   │   │   ├── messages.ts
│       │   │   │   └── index.ts
│       │   │   ├── migrations/     # Drizzle migrate dosyaları
│       │   │   └── index.ts        # DB bağlantısı
│       │   ├── routes/
│       │   │   ├── auth.routes.ts
│       │   │   ├── server.routes.ts
│       │   │   ├── channel.routes.ts
│       │   │   ├── message.routes.ts
│       │   │   ├── user.routes.ts
│       │   │   └── upload.routes.ts
│       │   ├── middleware/
│       │   │   ├── auth.middleware.ts
│       │   │   └── ratelimit.middleware.ts
│       │   ├── socket/
│       │   │   ├── socket.manager.ts
│       │   │   ├── handlers/
│       │   │   │   ├── message.handler.ts
│       │   │   │   ├── channel.handler.ts
│       │   │   │   └── voice.handler.ts
│       │   │   └── events.ts       # Socket event sabitler
│       │   ├── services/
│       │   │   ├── auth.service.ts
│       │   │   ├── server.service.ts
│       │   │   ├── message.service.ts
│       │   │   └── upload.service.ts
│       │   ├── lib/
│       │   │   ├── redis.ts
│       │   │   ├── jwt.ts
│       │   │   └── r2.ts
│       │   ├── types/
│       │   └── index.ts            # Uygulama giriş noktası
│       ├── drizzle.config.ts
│       └── package.json
│
├── packages/
│   └── shared/                     # Ortak tipler & yardımcılar
│       ├── src/
│       │   ├── types/
│       │   │   ├── api.types.ts    # API request/response tipleri
│       │   │   ├── socket.types.ts # Socket event tipleri
│       │   │   └── models.types.ts # Domain model tipleri
│       │   └── index.ts
│       └── package.json
│
├── package.json                    # Monorepo kök
├── pnpm-workspace.yaml
├── turbo.json
└── .env.example
```

---

## 4. Ortam Kurulumu

### 4.1 Gereksinimler

```bash
node >= 20.0.0
pnpm >= 9.0.0
rust >= 1.77 (Tauri için)
```

### 4.2 Monorepo Başlatma

```bash
# Proje klasörünü oluştur
mkdir discord-alt && cd discord-alt

# pnpm workspace dosyaları
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF

# Kök package.json
cat > package.json << 'EOF'
{
  "name": "discord-alt",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "dev:web": "turbo run dev --filter=web",
    "dev:server": "turbo run dev --filter=server",
    "build": "turbo run build",
    "db:push": "turbo run db:push --filter=server",
    "db:migrate": "turbo run db:migrate --filter=server",
    "db:studio": "turbo run db:studio --filter=server"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  }
}
EOF

# Turbo config
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": { "persistent": true, "cache": false },
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "db:push": { "cache": false },
    "db:migrate": { "cache": false },
    "db:studio": { "persistent": true, "cache": false }
  }
}
EOF

pnpm install
```

### 4.3 Shared Package Kurulumu

```bash
mkdir -p packages/shared/src/types
cd packages/shared

cat > package.json << 'EOF'
{
  "name": "@discord-alt/shared",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  }
}
EOF
```

### 4.4 Çevre Değişkenleri (.env.example)

```bash
# apps/server/.env

# Veritabanı
DATABASE_URL="postgresql://user:password@localhost:5432/discordalt"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_ACCESS_SECRET="en-az-32-karakter-guclu-secret-buraya"
JWT_REFRESH_SECRET="baska-bir-guclu-secret-buraya"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Cloudflare R2
R2_ACCOUNT_ID="cloudflare-account-id"
R2_ACCESS_KEY_ID="r2-access-key"
R2_SECRET_ACCESS_KEY="r2-secret-key"
R2_BUCKET_NAME="discord-alt-files"
R2_PUBLIC_URL="https://files.seninadresiburaya.com"

# Uygulama
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
```

```bash
# apps/web/.env
VITE_API_URL="http://localhost:3001"
VITE_WS_URL="http://localhost:3001"
```

---

## 5. Veritabanı Şeması

### 5.1 Backend Kurulumu

```bash
cd apps/server
pnpm init

pnpm add hono @hono/node-server socket.io drizzle-orm pg
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
pnpm add bcryptjs jose zod ioredis dotenv
pnpm add -D drizzle-kit @types/pg @types/bcryptjs tsx typescript
```

### 5.2 Drizzle Şema Tanımları

**`apps/server/src/db/schema/users.ts`**

```typescript
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 32 }).notNull().unique(),
  displayName: varchar("display_name", { length: 64 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  avatarUrl: text("avatar_url"),
  status: varchar("status", { length: 16 }).notNull().default("offline"),
  // 'online' | 'idle' | 'dnd' | 'offline'
  customStatus: varchar("custom_status", { length: 128 }),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

**`apps/server/src/db/schema/servers.ts`**

```typescript
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const servers = pgTable("servers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  iconUrl: text("icon_url"),
  bannerUrl: text("banner_url"),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id),
  isPublic: boolean("is_public").notNull().default(false),
  inviteCode: varchar("invite_code", { length: 16 }).unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const serverMembers = pgTable("server_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  serverId: uuid("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  nickname: varchar("nickname", { length: 64 }),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  serverId: uuid("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 64 }).notNull(),
  color: varchar("color", { length: 7 }).default("#99AAB5"),
  position: integer("position").notNull().default(0),
  // Bit flag tabanlı izinler (Discord gibi)
  permissions: varchar("permissions", { length: 20 }).notNull().default("0"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const memberRoles = pgTable("member_roles", {
  memberId: uuid("member_id")
    .notNull()
    .references(() => serverMembers.id, { onDelete: "cascade" }),
  roleId: uuid("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
});

export type Server = typeof servers.$inferSelect;
export type NewServer = typeof servers.$inferInsert;
export type ServerMember = typeof serverMembers.$inferSelect;
export type Role = typeof roles.$inferSelect;
```

**`apps/server/src/db/schema/channels.ts`**

```typescript
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { servers } from "./servers";

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  serverId: uuid("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  position: integer("position").notNull().default(0),
});

export const channels = pgTable("channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  serverId: uuid("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 16 }).notNull().default("text"),
  // 'text' | 'voice' | 'announcement'
  topic: text("topic"),
  position: integer("position").notNull().default(0),
  isNsfw: boolean("is_nsfw").notNull().default(false),
  slowModeSeconds: integer("slow_mode_seconds").notNull().default(0),
  // Son mesaj referansı (optimizasyon için)
  lastMessageId: uuid("last_message_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Channel = typeof channels.$inferSelect;
export type NewChannel = typeof channels.$inferInsert;
export type Category = typeof categories.$inferSelect;
```

**`apps/server/src/db/schema/messages.ts`**

```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { channels } from "./channels";

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id")
    .notNull()
    .references(() => channels.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id),
  content: text("content"),
  // Düzenleme
  editedAt: timestamp("edited_at"),
  isDeleted: boolean("is_deleted").notNull().default(false),
  // Yanıt (reply)
  replyToId: uuid("reply_to_id"),
  // Ekler [{ url, name, type, size }]
  attachments: jsonb("attachments").$type<Attachment[]>().default([]),
  // Embeds (link preview, vb.)
  embeds: jsonb("embeds").$type<Embed[]>().default([]),
  // Tepkiler { emoji: string, count: number, userIds: string[] }
  reactions: jsonb("reactions").$type<Reaction[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export interface Attachment {
  url: string;
  name: string;
  contentType: string;
  size: number;
  width?: number;
  height?: number;
}

export interface Embed {
  type: "link" | "image" | "video";
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  color?: number;
}

export interface Reaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
```

**`apps/server/src/db/schema/direct_messages.ts`**

```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import type { Attachment } from "./messages";

export const dmChannels = pgTable("dm_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dmChannelMembers = pgTable("dm_channel_members", {
  dmChannelId: uuid("dm_channel_id")
    .notNull()
    .references(() => dmChannels.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const directMessages = pgTable("direct_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  dmChannelId: uuid("dm_channel_id")
    .notNull()
    .references(() => dmChannels.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id),
  content: text("content"),
  editedAt: timestamp("edited_at"),
  isDeleted: boolean("is_deleted").notNull().default(false),
  attachments: jsonb("attachments").$type<Attachment[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

**`apps/server/src/db/schema/index.ts`**

```typescript
export * from "./users";
export * from "./servers";
export * from "./channels";
export * from "./messages";
export * from "./direct_messages";
```

### 5.3 Drizzle Konfigürasyonu

**`apps/server/drizzle.config.ts`**

```typescript
import type { Config } from "drizzle-kit";
import { config } from "dotenv";

config();

export default {
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

**`apps/server/src/db/index.ts`**

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
});

export const db = drizzle(pool, { schema });
export type Database = typeof db;
```

---

## 6. Backend Implementation

### 6.1 JWT Yardımcısı

**`apps/server/src/lib/jwt.ts`**

```typescript
import { SignJWT, jwtVerify } from "jose";

const accessSecret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);

export interface TokenPayload {
  userId: string;
  username: string;
}

export async function signAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_ACCESS_EXPIRES_IN ?? "15m")
    .sign(accessSecret);
}

export async function signRefreshToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_REFRESH_EXPIRES_IN ?? "7d")
    .sign(refreshSecret);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, accessSecret);
  return payload as unknown as TokenPayload;
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, refreshSecret);
  return payload as unknown as TokenPayload;
}
```

### 6.2 Redis Client

**`apps/server/src/lib/redis.ts`**

```typescript
import { Redis } from "ioredis";

export const redis = new Redis(
  process.env.REDIS_URL ?? "redis://localhost:6379",
  {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
  },
);

redis.on("error", (err) => {
  console.error("[Redis] Bağlantı hatası:", err);
});

// Kullanıcı online durumu
export const UserPresence = {
  async setOnline(userId: string, socketId: string): Promise<void> {
    await redis.hset(
      "user:presence",
      userId,
      JSON.stringify({ status: "online", socketId, lastSeen: Date.now() }),
    );
    await redis.expire("user:presence", 86400);
  },

  async setOffline(userId: string): Promise<void> {
    const data = await redis.hget("user:presence", userId);
    if (data) {
      const parsed = JSON.parse(data);
      await redis.hset(
        "user:presence",
        userId,
        JSON.stringify({ ...parsed, status: "offline", lastSeen: Date.now() }),
      );
    }
  },

  async getStatus(userId: string): Promise<string> {
    const data = await redis.hget("user:presence", userId);
    if (!data) return "offline";
    return JSON.parse(data).status;
  },

  async getBulkStatus(userIds: string[]): Promise<Record<string, string>> {
    if (userIds.length === 0) return {};
    const results = await redis.hmget("user:presence", ...userIds);
    return userIds.reduce(
      (acc, id, i) => {
        acc[id] = results[i] ? JSON.parse(results[i]!).status : "offline";
        return acc;
      },
      {} as Record<string, string>,
    );
  },
};
```

### 6.3 Auth Middleware

**`apps/server/src/middleware/auth.middleware.ts`**

```typescript
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
```

### 6.4 Auth Routes

**`apps/server/src/routes/auth.routes.ts`**

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, refreshTokens } from "../db/schema";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt";
import { redis } from "../lib/redis";

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
  login: z.string(), // email veya username
  password: z.string(),
});

// POST /api/auth/register
router.post("/register", zValidator("json", registerSchema), async (c) => {
  const { username, displayName, email, password } = c.req.valid("json");

  // Mevcut kullanıcı kontrolü
  const existing = await db.query.users.findFirst({
    where: (u, { or }) => or(eq(u.email, email), eq(u.username, username)),
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

  // Refresh token'ı DB'ye kaydet
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
```

### 6.5 Server Routes

**`apps/server/src/routes/server.routes.ts`**

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../db";
import {
  servers,
  serverMembers,
  channels,
  categories,
  roles,
} from "../db/schema";
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
  const userId = c.get("userId");

  const memberships = await db.query.serverMembers.findMany({
    where: eq(serverMembers.userId, userId),
    with: {
      server: {
        with: {
          channels: {
            where: eq(channels.type, "text"),
            orderBy: (ch, { asc }) => asc(ch.position),
            limit: 1,
          },
        },
      },
    },
  });

  return c.json(memberships.map((m) => m.server));
});

// POST /api/servers — Yeni sunucu oluştur
router.post("/", zValidator("json", createServerSchema), async (c) => {
  const userId = c.get("userId");
  const data = c.req.valid("json");

  const inviteCode = nanoid(8);

  const [server] = await db.transaction(async (tx) => {
    // Sunucuyu oluştur
    const [srv] = await tx
      .insert(servers)
      .values({
        ...data,
        ownerId: userId,
        inviteCode,
      })
      .returning();

    // Varsayılan "everyone" rolünü oluştur
    await tx.insert(roles).values({
      serverId: srv.id,
      name: "@everyone",
      isDefault: true,
      permissions: "1071698660929", // Temel izinler
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
  const userId = c.get("userId");
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
  const userId = c.get("userId");
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

export default router;
```

### 6.6 Message Routes

**`apps/server/src/routes/message.routes.ts`**

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and, lt, desc } from "drizzle-orm";
import { db } from "../db";
import { messages, channels, serverMembers } from "../db/schema";
import { authMiddleware } from "../middleware/auth.middleware";

const router = new Hono();
router.use("*", authMiddleware);

// GET /api/channels/:channelId/messages
router.get("/:channelId/messages", async (c) => {
  const userId = c.get("userId");
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

  const msgs = await db.query.messages.findMany({
    where: and(
      eq(messages.channelId, channelId),
      eq(messages.isDeleted, false),
      before ? lt(messages.createdAt, new Date(before)) : undefined,
    ),
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
    const userId = c.get("userId");
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
  const userId = c.get("userId");
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
```

### 6.7 Ana Uygulama

**`apps/server/src/index.ts`**

```typescript
import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { Server as SocketIOServer } from "socket.io";
import { createServer } from "node:http";
import { redis } from "./lib/redis";
import authRoutes from "./routes/auth.routes";
import serverRoutes from "./routes/server.routes";
import messageRoutes from "./routes/message.routes";
import { initSocketHandlers } from "./socket/socket.manager";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Health check
app.get("/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() }),
);

// API rotaları
app.route("/api/auth", authRoutes);
app.route("/api/servers", serverRoutes);
app.route("/api/channels", messageRoutes);

// HTTP sunucusu
const httpServer = createServer((req, res) => {
  // Hono'yu HTTP server ile entegre et
  app.fetch(req as unknown as Request).then((response) => {
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.statusCode = response.status;
    response.text().then((body) => res.end(body));
  });
});

// Socket.io
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

initSocketHandlers(io);

// Redis bağlantısı
redis
  .connect()
  .then(() => {
    console.log("[Redis] Bağlandı");
  })
  .catch(console.error);

const PORT = Number(process.env.PORT ?? 3001);

httpServer.listen(PORT, () => {
  console.log(`🚀 Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});
```

---

## 7. Frontend Implementation

### 7.1 Web Uygulaması Kurulumu

```bash
cd apps/web
pnpm create vite@latest . -- --template react-ts
pnpm install

# Temel bağımlılıklar
pnpm add @tanstack/react-query axios socket.io-client zustand
pnpm add react-router-dom date-fns react-hook-form @hookform/resolvers zod
pnpm add lucide-react clsx tailwind-merge class-variance-authority

# shadcn/ui altyapısı
pnpm add -D tailwindcss postcss autoprefixer
pnpm dlx tailwindcss init -p

# shadcn/ui bileşenlerini ekle
pnpm dlx shadcn-ui@latest init
pnpm dlx shadcn-ui@latest add button input label avatar badge scroll-area
pnpm dlx shadcn-ui@latest add dropdown-menu dialog tooltip separator
pnpm dlx shadcn-ui@latest add form toast popover
```

### 7.2 Tailwind Konfigürasyonu

**`apps/web/tailwind.config.ts`**

```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Discord benzeri renk paleti
        brand: {
          primary: "#5865F2", // Blurple
          green: "#57F287",
          yellow: "#FEE75C",
          fuchsia: "#EB459E",
          red: "#ED4245",
        },
        surface: {
          900: "#0D0D0E", // En koyu arka plan
          800: "#111214", // Sidebar arka planı
          700: "#1A1B1E", // Ana içerik
          600: "#232428", // Kanal listesi
          500: "#2B2D31", // Üye listesi
          400: "#35373C", // Input arka planı
          300: "#3F4147", // Hover durumu
          200: "#4E5058", // Kenarlıklar
          100: "#6D6F78", // Alt yazılar
        },
        text: {
          primary: "#F2F3F5",
          secondary: "#B5BAC1",
          muted: "#80848E",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

### 7.3 API İstemcisi

**`apps/web/src/lib/api.ts`**

```typescript
import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "../stores/auth.store";

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — access token ekle
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — token yenile
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
          {
            refreshToken,
          },
        );
        useAuthStore.getState().setAccessToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
```

### 7.4 Socket İstemcisi

**`apps/web/src/lib/socket.ts`**

```typescript
import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@discord-alt/shared";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function connectSocket(
  token: string,
): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (socket?.connected) return socket;

  socket = io(import.meta.env.VITE_WS_URL, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => console.log("[Socket] Bağlandı:", socket?.id));
  socket.on("disconnect", (reason) =>
    console.log("[Socket] Bağlantı kesildi:", reason),
  );
  socket.on("connect_error", (err) =>
    console.error("[Socket] Bağlantı hatası:", err),
  );

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket<
  ServerToClientEvents,
  ClientToServerEvents
> | null {
  return socket;
}
```

### 7.5 Auth Store

**`apps/web/src/stores/auth.store.ts`**

```typescript
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@discord-alt/shared";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setAccessToken: (token: string) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      setAccessToken: (accessToken) => set({ accessToken }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        // accessToken localStorage'a kaydedilmez — sadece bellekte tutulur
      }),
    },
  ),
);
```

### 7.6 Server Store

**`apps/web/src/stores/server.store.ts`**

```typescript
import { create } from "zustand";
import type { Server, Channel } from "@discord-alt/shared";

interface ServerState {
  servers: Server[];
  activeServerId: string | null;
  activeChannelId: string | null;

  setServers: (servers: Server[]) => void;
  addServer: (server: Server) => void;
  setActiveServer: (serverId: string) => void;
  setActiveChannel: (channelId: string) => void;
  updateServerMemberCount: (serverId: string, delta: number) => void;
}

export const useServerStore = create<ServerState>((set) => ({
  servers: [],
  activeServerId: null,
  activeChannelId: null,

  setServers: (servers) => set({ servers }),
  addServer: (server) => set((s) => ({ servers: [...s.servers, server] })),
  setActiveServer: (serverId) => set({ activeServerId: serverId }),
  setActiveChannel: (channelId) => set({ activeChannelId: channelId }),
  updateServerMemberCount: (serverId, delta) =>
    set((s) => ({
      servers: s.servers.map((srv) =>
        srv.id === serverId
          ? { ...srv, memberCount: (srv.memberCount ?? 0) + delta }
          : srv,
      ),
    })),
}));
```

### 7.7 Ana Layout Yapısı

**`apps/web/src/components/layout/AppLayout.tsx`**

```tsx
import { ServerSidebar } from "./ServerSidebar";
import { ChannelSidebar } from "./ChannelSidebar";
import { MainContent } from "./MainContent";
import { MemberList } from "./MemberList";

export function AppLayout(): JSX.Element {
  return (
    <div className="flex h-screen bg-surface-700 overflow-hidden">
      {/* Sol: Sunucu listesi (72px) */}
      <ServerSidebar />

      {/* Kanal listesi (240px) */}
      <ChannelSidebar />

      {/* Ana içerik */}
      <div className="flex flex-1 overflow-hidden">
        <MainContent />
        {/* Sağ: Üye listesi (240px) */}
        <MemberList />
      </div>
    </div>
  );
}
```

**`apps/web/src/components/layout/ServerSidebar.tsx`**

```tsx
import { Plus, Compass } from "lucide-react";
import { cn } from "../../lib/utils";
import { useServerStore } from "../../stores/server.store";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";

export function ServerSidebar(): JSX.Element {
  const { servers, activeServerId, setActiveServer } = useServerStore();

  return (
    <div className="flex flex-col items-center w-[72px] bg-surface-800 py-3 gap-2 overflow-y-auto scrollbar-hide">
      {/* DM butonu */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              "w-12 h-12 rounded-[24px] bg-surface-600 hover:bg-brand-primary",
              "flex items-center justify-center transition-all duration-200",
              "hover:rounded-[16px] text-brand-primary hover:text-white",
            )}
          >
            <span className="font-bold text-lg">D</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Direkt Mesajlar</TooltipContent>
      </Tooltip>

      <Separator className="w-8 bg-surface-300 my-1" />

      {/* Sunucu listesi */}
      {servers.map((server) => (
        <Tooltip key={server.id}>
          <TooltipTrigger asChild>
            <button
              onClick={() => setActiveServer(server.id)}
              className={cn(
                "relative w-12 h-12 transition-all duration-200",
                activeServerId === server.id
                  ? "rounded-[16px]"
                  : "rounded-[24px] hover:rounded-[16px]",
              )}
            >
              {/* Aktif göstergesi */}
              <span
                className={cn(
                  "absolute left-0 top-1/2 -translate-x-full -translate-y-1/2",
                  "w-1 bg-text-primary rounded-r-full transition-all duration-200",
                  activeServerId === server.id ? "h-10" : "h-2 group-hover:h-5",
                )}
              />
              <Avatar className="w-full h-full">
                <AvatarImage src={server.iconUrl ?? undefined} />
                <AvatarFallback className="bg-surface-600 text-text-primary text-sm font-semibold rounded-inherit">
                  {server.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{server.name}</TooltipContent>
        </Tooltip>
      ))}

      {/* Sunucu ekle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              "w-12 h-12 rounded-[24px] bg-surface-600 hover:bg-brand-green",
              "flex items-center justify-center transition-all duration-200",
              "hover:rounded-[16px] text-brand-green hover:text-white",
            )}
          >
            <Plus size={24} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Sunucu Ekle</TooltipContent>
      </Tooltip>
    </div>
  );
}
```

### 7.8 Mesaj Bileşeni

**`apps/web/src/components/message/MessageItem.tsx`**

```tsx
import { useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { tr } from "date-fns/locale";
import { Edit, Trash2, Reply, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import type { MessageWithAuthor } from "@discord-alt/shared";
import { cn } from "../../lib/utils";

interface MessageItemProps {
  message: MessageWithAuthor;
  isGrouped?: boolean; // Aynı kullanıcının ardışık mesajı
  onDelete?: (messageId: string) => void;
  onEdit?: (messageId: string, content: string) => void;
  onReply?: (message: MessageWithAuthor) => void;
  currentUserId: string;
}

function formatMessageTime(date: Date): string {
  if (isToday(date)) return `Bugün saat ${format(date, "HH:mm")}`;
  if (isYesterday(date)) return `Dün saat ${format(date, "HH:mm")}`;
  return format(date, "dd MMMM yyyy HH:mm", { locale: tr });
}

export function MessageItem({
  message,
  isGrouped = false,
  onDelete,
  onEdit,
  onReply,
  currentUserId,
}: MessageItemProps): JSX.Element {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content ?? "");

  const isOwnMessage = message.authorId === currentUserId;

  function handleEditSubmit(): void {
    if (editContent.trim() && editContent !== message.content) {
      onEdit?.(message.id, editContent.trim());
    }
    setIsEditing(false);
  }

  return (
    <div
      className={cn(
        "relative group flex gap-4 px-4 hover:bg-surface-600/40 transition-colors",
        isGrouped ? "py-0.5" : "pt-4 pb-1",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar veya zaman (gruplu mesajlar için) */}
      <div className="w-10 flex-shrink-0 mt-0.5">
        {!isGrouped ? (
          <Avatar className="w-10 h-10 cursor-pointer hover:opacity-80">
            <AvatarImage src={message.author.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-brand-primary text-white text-sm">
              {message.author.displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <span
            className={cn(
              "text-[11px] text-text-muted text-right block leading-5",
              "opacity-0 group-hover:opacity-100 transition-opacity",
            )}
          >
            {format(new Date(message.createdAt), "HH:mm")}
          </span>
        )}
      </div>

      {/* İçerik */}
      <div className="flex-1 min-w-0">
        {!isGrouped && (
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-semibold text-text-primary hover:underline cursor-pointer text-sm">
              {message.author.displayName}
            </span>
            <span className="text-[11px] text-text-muted">
              {formatMessageTime(new Date(message.createdAt))}
            </span>
          </div>
        )}

        {isEditing ? (
          <div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleEditSubmit();
                }
                if (e.key === "Escape") setIsEditing(false);
              }}
              className="w-full bg-surface-400 text-text-primary rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary"
              rows={3}
              autoFocus
            />
            <p className="text-xs text-text-muted mt-1">
              Kaydetmek için{" "}
              <kbd className="bg-surface-400 px-1 rounded">Enter</kbd>, iptal
              için <kbd className="bg-surface-400 px-1 rounded">Esc</kbd>
            </p>
          </div>
        ) : (
          <p
            className={cn(
              "text-text-secondary text-sm leading-relaxed break-words",
              message.isDeleted && "italic text-text-muted",
            )}
          >
            {message.isDeleted ? "[Bu mesaj silindi]" : message.content}
            {message.editedAt && !message.isDeleted && (
              <span className="text-[11px] text-text-muted ml-1">
                (düzenlendi)
              </span>
            )}
          </p>
        )}

        {/* Ekler */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map((att, i) =>
              att.contentType.startsWith("image/") ? (
                <img
                  key={i}
                  src={att.url}
                  alt={att.name}
                  className="max-w-sm max-h-64 rounded-md object-cover cursor-pointer hover:opacity-90"
                />
              ) : (
                <a
                  key={i}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-surface-600 rounded-md p-3 text-sm text-text-primary hover:bg-surface-500"
                >
                  📎 {att.name}
                  <span className="text-text-muted text-xs">
                    ({Math.round(att.size / 1024)} KB)
                  </span>
                </a>
              ),
            )}
          </div>
        )}
      </div>

      {/* Hover aksiyonları */}
      {isHovered && !message.isDeleted && (
        <div className="absolute right-4 top-0 -translate-y-1/2 bg-surface-500 border border-surface-300 rounded-md flex items-center shadow-lg">
          <button
            onClick={() => onReply?.(message)}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-400 rounded-l-md transition-colors"
            title="Yanıtla"
          >
            <Reply size={16} />
          </button>
          {isOwnMessage && (
            <button
              onClick={() => {
                setIsEditing(true);
                setEditContent(message.content ?? "");
              }}
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-400 transition-colors"
              title="Düzenle"
            >
              <Edit size={16} />
            </button>
          )}
          {isOwnMessage && (
            <button
              onClick={() => onDelete?.(message.id)}
              className="p-1.5 text-text-muted hover:text-brand-red hover:bg-surface-400 rounded-r-md transition-colors"
              title="Sil"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

### 7.9 Mesaj Giriş Alanı

**`apps/web/src/components/message/MessageInput.tsx`**

```tsx
import { useState, useRef, useCallback } from "react";
import { Send, Paperclip, Smile } from "lucide-react";
import { cn } from "../../lib/utils";
import type { MessageWithAuthor } from "@discord-alt/shared";

interface MessageInputProps {
  channelName: string;
  replyTo?: MessageWithAuthor | null;
  onCancelReply?: () => void;
  onSend: (content: string, files?: File[]) => void;
  disabled?: boolean;
}

export function MessageInput({
  channelName,
  replyTo,
  onCancelReply,
  onSend,
  disabled = false,
}: MessageInputProps): JSX.Element {
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed && files.length === 0) return;
    onSend(trimmed, files.length > 0 ? files : undefined);
    setContent("");
    setFiles([]);
    // Textarea yüksekliğini sıfırla
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [content, files, onSend]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleTextareaChange(
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ): void {
    setContent(e.target.value);
    // Auto resize
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>): void {
    const selected = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...selected].slice(0, 10)); // Max 10 dosya
  }

  return (
    <div className="px-4 pb-6">
      {/* Yanıt önizlemesi */}
      {replyTo && (
        <div className="flex items-center gap-2 bg-surface-600 rounded-t-lg px-4 py-2 text-sm">
          <span className="text-text-muted">
            <span className="text-text-primary font-medium">
              {replyTo.author.displayName}
            </span>{" "}
            adlı kullanıcıya yanıt veriyorsunuz
          </span>
          <button
            onClick={onCancelReply}
            className="ml-auto text-text-muted hover:text-text-primary"
          >
            ✕
          </button>
        </div>
      )}

      {/* Dosya önizleme */}
      {files.length > 0 && (
        <div className="flex gap-2 bg-surface-600 px-4 py-2 flex-wrap">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-1 bg-surface-500 rounded px-2 py-1 text-xs"
            >
              <span className="text-text-secondary">{file.name}</span>
              <button
                onClick={() =>
                  setFiles((prev) => prev.filter((_, idx) => idx !== i))
                }
                className="text-text-muted hover:text-brand-red"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Giriş alanı */}
      <div
        className={cn(
          "flex items-end gap-2 bg-surface-400 rounded-lg px-4 py-2",
          replyTo && "rounded-t-none",
        )}
      >
        {/* Dosya ekleme */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-text-muted hover:text-text-primary transition-colors mb-2 flex-shrink-0"
          disabled={disabled}
        >
          <Paperclip size={20} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />

        {/* Metin alanı */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={`#${channelName} kanalına mesaj gönder`}
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 bg-transparent text-text-primary text-sm resize-none",
            "placeholder:text-text-muted focus:outline-none leading-6",
            "max-h-[200px] overflow-y-auto scrollbar-thin",
          )}
        />

        {/* Emoji */}
        <button className="text-text-muted hover:text-text-primary transition-colors mb-2 flex-shrink-0">
          <Smile size={20} />
        </button>

        {/* Gönder */}
        <button
          onClick={handleSubmit}
          disabled={disabled || (!content.trim() && files.length === 0)}
          className={cn(
            "mb-2 flex-shrink-0 transition-colors",
            content.trim() || files.length > 0
              ? "text-brand-primary hover:text-brand-primary/80"
              : "text-text-muted cursor-not-allowed",
          )}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
```

---

## 8. Desktop App (Tauri)

### 8.1 Tauri Kurulumu

```bash
cd apps/desktop

# Kopyala veya symlink ile web kaynak kodunu kullan
# Desktop uygulaması web kodunu Tauri ile sarar

pnpm add -D @tauri-apps/cli @tauri-apps/api

# Tauri projesini başlat
pnpm tauri init
```

### 8.2 Tauri Konfigürasyonu

**`apps/desktop/src-tauri/tauri.conf.json`**

```json
{
  "$schema": "../node_modules/@tauri-apps/cli/schema.json",
  "build": {
    "beforeDevCommand": "pnpm --filter web dev",
    "beforeBuildCommand": "pnpm --filter web build",
    "devUrl": "http://localhost:5173",
    "frontendDist": "../web/dist"
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "identifier": "com.discord-alt.app",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  },
  "app": {
    "windows": [
      {
        "title": "Discord Alt",
        "width": 1280,
        "height": 800,
        "minWidth": 900,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false,
        "decorations": true,
        "transparent": false,
        "titleBarStyle": "Overlay"
      }
    ],
    "security": {
      "csp": null
    }
  },
  "plugins": {
    "notification": {},
    "updater": {
      "active": true,
      "endpoints": [
        "https://releases.discord-alt.com/{{target}}/{{arch}}/{{current_version}}"
      ],
      "dialog": true
    }
  }
}
```

**`apps/desktop/src-tauri/src/main.rs`**

```rust
// Tauri v2 minimum konfigürasyonu
// Ek native özellikler buraya eklenebilir

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("Tauri uygulaması başlatılamadı");
}
```

### 8.3 Desktop Özel Hook

Web tarafında, Tauri ortamında olup olmadığını anlayan bir hook ekle:

**`apps/web/src/hooks/useTauri.ts`**

```typescript
import { useEffect, useState } from "react";

interface TauriAPI {
  isDesktop: boolean;
  sendNotification: (title: string, body: string) => Promise<void>;
}

export function useTauri(): TauriAPI {
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    setIsTauri("__TAURI_INTERNALS__" in window);
  }, []);

  async function sendNotification(title: string, body: string): Promise<void> {
    if (!isTauri) {
      // Web Notifications API
      if (Notification.permission === "granted") {
        new Notification(title, { body });
      }
      return;
    }
    // Tauri notification plugin
    const { sendNotification } =
      await import("@tauri-apps/plugin-notification");
    await sendNotification({ title, body });
  }

  return { isDesktop: isTauri, sendNotification };
}
```

---

## 9. WebSocket Mimarisi

### 9.1 Socket Event Tanımları (Shared)

**`packages/shared/src/types/socket.types.ts`**

```typescript
import type { MessageWithAuthor } from "./models.types";

// Client → Server events
export interface ClientToServerEvents {
  // Kanala katıl
  "channel:join": (channelId: string) => void;
  // Kanaldan ayrıl
  "channel:leave": (channelId: string) => void;
  // Mesaj gönder
  "message:send": (payload: {
    channelId: string;
    content: string;
    replyToId?: string;
    nonce: string; // Client-side geçici ID
  }) => void;
  // Yazıyor göstergesi
  "typing:start": (channelId: string) => void;
  "typing:stop": (channelId: string) => void;
  // Ses kanalı
  "voice:join": (channelId: string) => void;
  "voice:leave": (channelId: string) => void;
  "voice:signal": (payload: {
    to: string;
    signal: RTCSessionDescriptionInit | RTCIceCandidateInit;
  }) => void;
}

// Server → Client events
export interface ServerToClientEvents {
  // Yeni mesaj
  "message:new": (message: MessageWithAuthor & { nonce?: string }) => void;
  // Mesaj güncellendi
  "message:update": (payload: {
    id: string;
    content: string;
    editedAt: string;
  }) => void;
  // Mesaj silindi
  "message:delete": (payload: { id: string; channelId: string }) => void;
  // Yazıyor göstergesi
  "typing:update": (payload: {
    channelId: string;
    userId: string;
    username: string;
    isTyping: boolean;
  }) => void;
  // Presence
  "presence:update": (payload: { userId: string; status: string }) => void;
  // Ses sinyali
  "voice:signal": (payload: {
    from: string;
    signal: RTCSessionDescriptionInit | RTCIceCandidateInit;
  }) => void;
  "voice:user_joined": (payload: { userId: string; channelId: string }) => void;
  "voice:user_left": (payload: { userId: string; channelId: string }) => void;
  // Hata
  error: (payload: { code: string; message: string }) => void;
}
```

### 9.2 Socket Manager (Backend)

**`apps/server/src/socket/socket.manager.ts`**

```typescript
import type { Server as SocketIOServer } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@discord-alt/shared";
import { verifyAccessToken } from "../lib/jwt";
import { redis, UserPresence } from "../lib/redis";
import { db } from "../db";
import { messages, channels, serverMembers } from "../db/schema";
import { eq, and } from "drizzle-orm";

// Typing debounce süresi (ms)
const TYPING_TIMEOUT = 5000;
const typingTimers = new Map<string, NodeJS.Timeout>();

export function initSocketHandlers(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>,
): void {
  // Auth middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) return next(new Error("Token gerekli"));

    try {
      const payload = await verifyAccessToken(token);
      socket.data.userId = payload.userId;
      socket.data.username = payload.username;
      next();
    } catch {
      next(new Error("Geçersiz token"));
    }
  });

  io.on("connection", async (socket) => {
    const { userId, username } = socket.data;
    console.log(`[Socket] Kullanıcı bağlandı: ${username} (${socket.id})`);

    // Kullanıcıyı kendi odasına ekle
    await socket.join(`user:${userId}`);
    await UserPresence.setOnline(userId, socket.id);

    // Kullanıcının üye olduğu sunuculara yayınla
    await broadcastPresenceUpdate(io, userId, "online");

    // KANAL OLAYLARI
    socket.on("channel:join", (channelId) => {
      socket.join(`channel:${channelId}`);
    });

    socket.on("channel:leave", (channelId) => {
      socket.leave(`channel:${channelId}`);
    });

    // MESAJ OLAYLARI
    socket.on(
      "message:send",
      async ({ channelId, content, replyToId, nonce }) => {
        // Kullanıcının bu kanala erişim hakkı var mı?
        const channel = await db.query.channels.findFirst({
          where: eq(channels.id, channelId),
          with: {
            server: {
              with: {
                members: { where: eq(serverMembers.userId, userId) },
              },
            },
          },
        });

        if (!channel || channel.server.members.length === 0) {
          socket.emit("error", {
            code: "FORBIDDEN",
            message: "Bu kanala mesaj gönderme yetkiniz yok",
          });
          return;
        }

        const [message] = await db
          .insert(messages)
          .values({
            channelId,
            authorId: userId,
            content: content.slice(0, 4000),
            replyToId,
          })
          .returning();

        // Yazarın bilgilerini çek
        const author = await db.query.users.findFirst({
          where: (u, { eq }) => eq(u.id, userId),
          columns: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        });

        // Kanaldaki herkese yayınla
        io.to(`channel:${channelId}`).emit("message:new", {
          ...message,
          author: author!,
          nonce,
        });
      },
    );

    // YAZMA GÖSTERGESİ
    socket.on("typing:start", (channelId) => {
      const key = `${channelId}:${userId}`;

      // Mevcut timer'ı sıfırla
      const existing = typingTimers.get(key);
      if (existing) clearTimeout(existing);

      // Kanaldaki diğerlerine bildir
      socket.to(`channel:${channelId}`).emit("typing:update", {
        channelId,
        userId,
        username,
        isTyping: true,
      });

      // 5 saniye sonra otomatik durdur
      const timer = setTimeout(() => {
        socket.to(`channel:${channelId}`).emit("typing:update", {
          channelId,
          userId,
          username,
          isTyping: false,
        });
        typingTimers.delete(key);
      }, TYPING_TIMEOUT);

      typingTimers.set(key, timer);
    });

    socket.on("typing:stop", (channelId) => {
      const key = `${channelId}:${userId}`;
      const existing = typingTimers.get(key);
      if (existing) {
        clearTimeout(existing);
        typingTimers.delete(key);
      }

      socket.to(`channel:${channelId}`).emit("typing:update", {
        channelId,
        userId,
        username,
        isTyping: false,
      });
    });

    // SES KANALI SİNYALLEŞME
    socket.on("voice:join", (channelId) => {
      socket.join(`voice:${channelId}`);
      socket
        .to(`voice:${channelId}`)
        .emit("voice:user_joined", { userId, channelId });
    });

    socket.on("voice:leave", (channelId) => {
      socket.leave(`voice:${channelId}`);
      socket
        .to(`voice:${channelId}`)
        .emit("voice:user_left", { userId, channelId });
    });

    socket.on("voice:signal", ({ to, signal }) => {
      io.to(`user:${to}`).emit("voice:signal", { from: userId, signal });
    });

    // BAĞLANTI KESİLDİ
    socket.on("disconnect", async () => {
      console.log(`[Socket] Kullanıcı ayrıldı: ${username}`);
      await UserPresence.setOffline(userId);
      await broadcastPresenceUpdate(io, userId, "offline");
    });
  });
}

async function broadcastPresenceUpdate(
  io: SocketIOServer,
  userId: string,
  status: string,
): Promise<void> {
  // Kullanıcının üye olduğu tüm sunuculara presence güncellemesi gönder
  const memberships = await db.query.serverMembers.findMany({
    where: eq(serverMembers.userId, userId),
    columns: { serverId: true },
  });

  for (const { serverId } of memberships) {
    io.to(`server:${serverId}`).emit("presence:update", { userId, status });
  }
}
```

---

## 10. Auth Sistemi

### 10.1 Auth Sayfası (Frontend)

**`apps/web/src/pages/AuthPage.tsx`**

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "../lib/api";
import { useAuthStore } from "../stores/auth.store";
import { connectSocket } from "../lib/socket";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const loginSchema = z.object({
  login: z.string().min(1, "Gerekli"),
  password: z.string().min(1, "Gerekli"),
});

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "En az 3 karakter")
      .max(32)
      .regex(/^[a-z0-9_.]+$/),
    displayName: z.string().min(1).max(64),
    email: z.string().email("Geçerli bir e-posta girin"),
    password: z.string().min(8, "En az 8 karakter"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Şifreler uyuşmuyor",
    path: ["confirmPassword"],
  });

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export function AuthPage(): JSX.Element {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  async function handleLogin(data: LoginForm): Promise<void> {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", data);
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      connectSocket(res.data.accessToken);
      navigate("/app");
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error ?? "Giriş yapılamadı",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(data: RegisterForm): Promise<void> {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/api/auth/register", data);
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      connectSocket(res.data.accessToken);
      navigate("/app");
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error ?? "Kayıt oluşturulamadı",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-600 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">
            {mode === "login" ? "Tekrar Hoş Geldin!" : "Hesap Oluştur"}
          </h1>
          <p className="text-text-muted text-sm mt-1">
            {mode === "login"
              ? "Arkadaşlarınla konuşmaya devam et"
              : "Topluluğa katıl"}
          </p>
        </div>

        {/* Form içerikleri burada devam eder */}
        {/* ... */}

        {error && (
          <div className="bg-brand-red/20 border border-brand-red/50 rounded-md p-3 text-sm text-brand-red mt-4">
            {error}
          </div>
        )}

        <p className="text-center text-text-muted text-sm mt-6">
          {mode === "login" ? "Hesabın yok mu?" : "Zaten hesabın var mı?"}{" "}
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-brand-primary hover:underline"
          >
            {mode === "login" ? "Kayıt ol" : "Giriş yap"}
          </button>
        </p>
      </div>
    </div>
  );
}
```

---

## 11. Dosya Upload

### 11.1 Cloudflare R2 Entegrasyonu

**`apps/server/src/lib/r2.ts`**

```typescript
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import path from "node:path";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function generateUploadUrl(
  originalFilename: string,
  contentType: string,
  userId: string,
): Promise<{ uploadUrl: string; fileKey: string; publicUrl: string }> {
  const ext = path.extname(originalFilename);
  const fileKey = `uploads/${userId}/${nanoid()}${ext}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
    Metadata: { uploadedBy: userId },
  });

  // 5 dakika geçerli imzalı URL
  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileKey}`;

  return { uploadUrl, fileKey, publicUrl };
}

export async function deleteFile(fileKey: string): Promise<void> {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
    }),
  );
}
```

**`apps/server/src/routes/upload.routes.ts`**

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.middleware";
import { generateUploadUrl } from "../lib/r2";

const router = new Hono();
router.use("*", authMiddleware);

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "application/pdf",
  "text/plain",
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const uploadSchema = z.object({
  filename: z.string().max(255),
  contentType: z
    .string()
    .refine((t) => ALLOWED_TYPES.includes(t), "Desteklenmeyen dosya türü"),
  size: z.number().max(MAX_FILE_SIZE, "Dosya 25 MB limitini aşıyor"),
});

// POST /api/upload/presign — İmzalı upload URL'si al
router.post("/presign", zValidator("json", uploadSchema), async (c) => {
  const userId = c.get("userId");
  const { filename, contentType, size } = c.req.valid("json");

  const { uploadUrl, fileKey, publicUrl } = await generateUploadUrl(
    filename,
    contentType,
    userId,
  );

  return c.json({ uploadUrl, fileKey, publicUrl });
});

export default router;
```

---

## 12. Sesli Kanal (WebRTC)

### 12.1 Peer-to-Peer Ses (Küçük Gruplar)

**`apps/web/src/hooks/useVoiceChannel.ts`**

```typescript
import { useEffect, useRef, useState, useCallback } from "react";
import { getSocket } from "../lib/socket";

interface VoiceParticipant {
  userId: string;
  stream?: MediaStream;
  isMuted: boolean;
  isDeafened: boolean;
}

export function useVoiceChannel(channelId: string | null) {
  const [participants, setParticipants] = useState<
    Map<string, VoiceParticipant>
  >(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // Kendi TURN sunucunuzu ekleyebilirsiniz
  ];

  function createPeerConnection(targetUserId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers });

    // Local ses parçalarını ekle
    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // ICE candidate'leri karşı tarafa ilet
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        getSocket()?.emit("voice:signal", {
          to: targetUserId,
          signal: event.candidate.toJSON(),
        });
      }
    };

    // Uzak ses akışını al
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setParticipants((prev) => {
        const updated = new Map(prev);
        const participant = updated.get(targetUserId) ?? {
          userId: targetUserId,
          isMuted: false,
          isDeafened: false,
        };
        updated.set(targetUserId, { ...participant, stream: remoteStream });
        return updated;
      });
    };

    peersRef.current.set(targetUserId, pc);
    return pc;
  }

  const joinVoice = useCallback(async () => {
    if (!channelId) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsConnected(true);

      getSocket()?.emit("voice:join", channelId);
    } catch (err) {
      console.error("[Voice] Mikrofon erişimi hatası:", err);
    }
  }, [channelId]);

  const leaveVoice = useCallback(() => {
    if (!channelId) return;

    // Tüm peer bağlantılarını kapat
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();

    // Local stream'i durdur
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setParticipants(new Map());
    setIsConnected(false);

    getSocket()?.emit("voice:leave", channelId);
  }, [channelId]);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted((prev) => !prev);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Yeni kullanıcı sese katıldı — offer gönder
    socket.on("voice:user_joined", async ({ userId }) => {
      const pc = createPeerConnection(userId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("voice:signal", { to: userId, signal: offer });
    });

    // Kullanıcı ses kanalından ayrıldı
    socket.on("voice:user_left", ({ userId }) => {
      peersRef.current.get(userId)?.close();
      peersRef.current.delete(userId);
      setParticipants((prev) => {
        const updated = new Map(prev);
        updated.delete(userId);
        return updated;
      });
    });

    // WebRTC sinyali alındı
    socket.on("voice:signal", async ({ from, signal }) => {
      let pc = peersRef.current.get(from);

      if (!pc) pc = createPeerConnection(from);

      const isOffer = "type" in signal && signal.type === "offer";
      const isAnswer = "type" in signal && signal.type === "answer";
      const isCandidate = "candidate" in signal;

      if (isOffer) {
        await pc.setRemoteDescription(
          new RTCSessionDescription(signal as RTCSessionDescriptionInit),
        );
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("voice:signal", { to: from, signal: answer });
      } else if (isAnswer) {
        await pc.setRemoteDescription(
          new RTCSessionDescription(signal as RTCSessionDescriptionInit),
        );
      } else if (isCandidate) {
        await pc.addIceCandidate(
          new RTCIceCandidate(signal as RTCIceCandidateInit),
        );
      }
    });

    return () => {
      socket.off("voice:user_joined");
      socket.off("voice:user_left");
      socket.off("voice:signal");
    };
  }, []);

  return {
    participants,
    localStream,
    isMuted,
    isConnected,
    joinVoice,
    leaveVoice,
    toggleMute,
  };
}
```

---

## 13. Deployment

### 13.1 Railway (Backend)

```bash
# Railway CLI kur
npm install -g @railway/cli
railway login

# Proje oluştur
railway init

# PostgreSQL ve Redis ekle
railway add --plugin postgresql
railway add --plugin redis

# Ortam değişkenlerini ayarla
railway variables set JWT_ACCESS_SECRET=<guclu-secret>
railway variables set JWT_REFRESH_SECRET=<baska-guclu-secret>
# ... diğer değişkenler

# Deploy et
railway up --service server
```

**`apps/server/Dockerfile`**

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter server build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### 13.2 Vercel (Frontend)

**`apps/web/vercel.json`**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }],
  "env": {
    "VITE_API_URL": "@api_url",
    "VITE_WS_URL": "@ws_url"
  }
}
```

### 13.3 Docker Compose (Yerel Geliştirme)

**`docker-compose.yml`**

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: discordalt
      POSTGRES_USER: discordalt
      POSTGRES_PASSWORD: discordalt123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

```bash
# Yerel geliştirme ortamını başlat
docker-compose up -d
pnpm dev
```

---

## 14. Faz Planı & Checklist

### ✅ Faz 1 — Temel Altyapı (Yaklaşık 2-3 Hafta)

#### Backend

- [ ] Monorepo kurulumu (pnpm + Turborepo)
- [ ] Shared types package
- [ ] PostgreSQL şeması + Drizzle migration
- [ ] Redis bağlantısı
- [ ] JWT auth (register / login / refresh / logout)
- [ ] Server CRUD API
- [ ] Kanal yönetimi API
- [ ] Mesaj API (sayfalama ile)
- [ ] Socket.io sunucu (bağlantı, auth middleware)
- [ ] Gerçek zamanlı mesaj gönderme
- [ ] Yazıyor göstergesi
- [ ] Kullanıcı presence sistemi

#### Frontend

- [ ] Vite + React + TypeScript kurulumu
- [ ] Tailwind + shadcn/ui kurulumu
- [ ] API istemcisi (axios + interceptor)
- [ ] Socket istemcisi
- [ ] Auth store (Zustand + persist)
- [ ] Server store
- [ ] Auth sayfası (login + register)
- [ ] Korumalı route sistemi
- [ ] Ana layout (3-panel Discord tarzı)
- [ ] Sunucu sidebar
- [ ] Kanal sidebar
- [ ] Mesaj akışı (sonsuz scroll ile geçmişe gitme)
- [ ] Mesaj giriş alanı
- [ ] Mesaj bileşeni (gruplu mesajlar)
- [ ] Sunucu oluşturma modalı
- [ ] Davet kodu ile katılma

---

### 🔄 Faz 2 — Zengin Özellikler (3-4 Hafta)

#### Backend

- [ ] Dosya upload (Cloudflare R2 presigned URL)
- [ ] Dosya metadata kayıt
- [ ] DM kanalı API
- [ ] Arkadaş sistemi (istek / kabul / reddet)
- [ ] Rol sistemi
- [ ] Kanal izin sistemi (bit flag)
- [ ] Rate limiting (endpoint başına)
- [ ] Mesaj arama (PostgreSQL full-text search)

#### Frontend

- [ ] Dosya & resim upload (drag-drop destekli)
- [ ] Resim lightbox görüntüleyici
- [ ] Direkt mesajlar (DM) ekranı
- [ ] Arkadaş listesi
- [ ] Rol yönetimi ekranı
- [ ] Sunucu ayarları modalı
- [ ] Kanal düzenleme
- [ ] Üye listesi (online/offline ayrımı)
- [ ] Mesaj reaksiyonları (emoji)
- [ ] Mesaj bağlamı menüsü (sağ tık)
- [ ] Bildirim sistemi
- [ ] @mention desteği

---

### 🚀 Faz 3 — Sesli & Video (2-3 Hafta)

#### Backend

- [ ] WebRTC sinyal sunucusu (mevcut Socket.io üzerinde)
- [ ] TURN sunucu konfigürasyonu (coturn veya Cloudflare TURN)
- [ ] Ses kanalı üye takibi

#### Frontend

- [ ] Ses kanalı bileşenleri
- [ ] WebRTC peer connection yönetimi
- [ ] Mikrofon/ses kontrolü
- [ ] Konuşan kullanıcı göstergesi
- [ ] Ses kanalı üye listesi

---

### 🖥️ Faz 4 — Desktop App (1 Hafta)

- [ ] Tauri v2 kurulumu
- [ ] Windows build
- [ ] macOS build
- [ ] Linux build
- [ ] Native bildirimler
- [ ] Sistem tepsisi entegrasyonu
- [ ] Auto-updater
- [ ] Deep link desteği (`discordalt://`)

---

## 📝 Geliştirici Notları

### Performans İpuçları

1. **Mesaj pagination**: `cursor-based pagination` kullan, offset tabanlı değil — büyük veritabanlarında çok daha hızlı
2. **Görüntü optimizasyonu**: Upload sırasında Cloudflare Image Resizing kullan
3. **React sanal liste**: Uzun mesaj listelerinde `@tanstack/react-virtual` kullan
4. **WebSocket bağlantı havuzu**: Redis Pub/Sub ile birden fazla sunucu instance'ı destekle (ölçeklenme için)

### Güvenlik Kontrol Listesi

- [ ] Tüm input'larda Zod validasyonu
- [ ] SQL injection — Drizzle ORM'in parametreli sorguları zaten önler
- [ ] XSS — React zaten JSX içinde escape eder, markdown render'da dikkatli ol
- [ ] Rate limiting — auth endpoint'leri için özellikle sıkı tut
- [ ] Dosya upload — MIME type + boyut kontrolü
- [ ] CORS — sadece kendi domain'ine izin ver
- [ ] Helmet.js — güvenlik header'ları

### Kod Kalite Araçları

```bash
# ESLint + Prettier
pnpm add -D eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin
pnpm add -D eslint-config-prettier eslint-plugin-react-hooks

# Commit hook'ları
pnpm add -D husky lint-staged
```

---

_Son güncelleme: 2026 | Bu döküman yaşayan bir belgedir, her faz tamamlandıkça güncellenmelidir._
