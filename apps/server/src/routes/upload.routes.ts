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

// POST /api/upload
router.post("/", async (c) => {
  const userId = c.get("userId") as string;
  const body = await c.req.parseBody();
  const file = body["file"] as File;

  if (!file) return c.json({ error: "Dosya bulunamadı" }, 400);

  if (!ALLOWED_TYPES.includes(file.type)) {
    return c.json({ error: "Desteklenmeyen dosya türü" }, 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return c.json({ error: "Dosya 25 MB limitini aşıyor" }, 400);
  }

  // Local fallback
  const fs = await import("fs");
  const path = await import("path");
  
  const uploadDir = path.join(process.cwd(), "public", "uploads", userId);
  fs.mkdirSync(uploadDir, { recursive: true });

  const ext = path.extname(file.name);
  const fileName = `${crypto.randomUUID()}${ext}`;
  const filePath = path.join(uploadDir, fileName);

  const arrayBuffer = await file.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

  const publicUrl = `/uploads/${userId}/${fileName}`;

  return c.json({ url: publicUrl, name: file.name, contentType: file.type, size: file.size });
});

// POST /api/upload/presign
router.post("/presign", zValidator("json", uploadSchema), async (c) => {
  const userId = c.get("userId") as string;
  const { filename, contentType } = c.req.valid("json");

  if (!process.env.R2_ACCESS_KEY_ID) {
    return c.json({ error: "R2 yapılandırılmamış, yerel yükleme kullanın" }, 400);
  }

  const { uploadUrl, fileKey, publicUrl } = await generateUploadUrl(
    filename,
    contentType,
    userId,
  );

  return c.json({ uploadUrl, fileKey, publicUrl });
});

export default router;
