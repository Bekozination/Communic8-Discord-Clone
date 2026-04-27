import Redis from "ioredis";

export const redis = new Redis(
  process.env.REDIS_URL ?? "redis://localhost:6379",
  {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
  },
);

redis.on("error", (err) => {
  console.error("[Redis] Bağlantı hatası:", err.message);
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
