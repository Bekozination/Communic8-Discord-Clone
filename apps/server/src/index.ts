import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { Server as SocketIOServer } from "socket.io";
import { createServer } from "node:http";
import { redis } from "./lib/redis";
import authRoutes from "./routes/auth.routes";
import serverRoutes from "./routes/server.routes";
import messageRoutes from "./routes/message.routes";
import channelRoutes from "./routes/channel.routes";
import userRoutes from "./routes/user.routes";
import uploadRoutes from "./routes/upload.routes";
import friendRoutes from "./routes/friend.routes";
import dmRoutes from "./routes/dm.routes";
import { initSocketHandlers } from "./socket/socket.manager";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin) => origin || "http://localhost:5173",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Health check
app.get("/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() }),
);

// Statik dosyaları sun (Dosya yüklemeleri için)
app.use("/uploads/*", serveStatic({ root: "./public" }));

// API rotaları
app.route("/api/auth", authRoutes);
app.route("/api/servers", serverRoutes);
app.route("/api/channels", messageRoutes);
app.route("/api/server", channelRoutes);
app.route("/api/users", userRoutes);
app.route("/api/upload", uploadRoutes);
app.route("/api/friends", friendRoutes);
app.route("/api/dms", dmRoutes);

// HTTP sunucusu
const httpServer = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    
    // Body'yi oku
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk as Buffer);
    }
    const body = Buffer.concat(chunks);

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        if (Array.isArray(value)) {
          value.forEach(v => headers.append(key, v));
        } else {
          headers.set(key, value);
        }
      }
    }

    const request = new Request(url.toString(), {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method ?? "GET") ? undefined : body,
    });

    const response = await app.fetch(request);
    
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.statusCode = response.status;
    
    const responseBody = await response.arrayBuffer();
    res.end(Buffer.from(responseBody));
  } catch (err) {
    console.error("Request handling error:", err);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

// Socket.io
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => callback(null, origin || "http://localhost:5173"),
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
  .catch((err) => {
    console.warn("[Redis] Bağlantı hatası (opsiyonel):", err.message);
  });

const PORT = Number(process.env.PORT ?? 3001);

httpServer.listen(PORT, () => {
  console.log(`🚀 Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});
