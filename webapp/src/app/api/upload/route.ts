import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);
const FILE_EXTENSIONS = new Set([".pdf", ".txt", ".md", ".json", ".yaml", ".yml", ".xml", ".csv", ".toml", ".ini"]);

const IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

const FILE_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/json",
  "application/x-yaml",
  "text/yaml",
  "application/xml",
  "text/xml",
  "text/csv",
  "application/toml",
]);

const IMAGE_MAX_SIZE = 5 * 1024 * 1024;   // 5 MB
const FILE_MAX_SIZE = 10 * 1024 * 1024;     // 10 MB

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  if (idx === -1) return "";
  return filename.slice(idx).toLowerCase();
}

function sanitizeName(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return filename.replace(/[^a-zA-Z0-9_-]/g, "-");
  const name = filename.slice(0, dot).replace(/[^a-zA-Z0-9_-]/g, "-");
  const ext = filename.slice(dot);
  return `${name}${ext}`;
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.isPro) {
    return NextResponse.json({ error: "File uploads require a Pro subscription" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = getExtension(file.name);
  const mimeType = file.type.toLowerCase();

  const isImageExt = IMAGE_EXTENSIONS.has(ext);
  const isFileExt = FILE_EXTENSIONS.has(ext);

  if (!isImageExt && !isFileExt) {
    return NextResponse.json({ error: `Unsupported file type: ${ext}` }, { status: 400 });
  }

  if (isImageExt) {
    if (!IMAGE_MIME_TYPES.has(mimeType)) {
      return NextResponse.json({ error: `Invalid image MIME type: ${mimeType}` }, { status: 400 });
    }
    if (file.size > IMAGE_MAX_SIZE) {
      return NextResponse.json({ error: "Image must be under 5 MB" }, { status: 400 });
    }
  }

  if (isFileExt) {
    if (!FILE_MIME_TYPES.has(mimeType) && mimeType !== "text/plain") {
      return NextResponse.json({ error: `Invalid file MIME type: ${mimeType}` }, { status: 400 });
    }
    if (file.size > FILE_MAX_SIZE) {
      return NextResponse.json({ error: "File must be under 10 MB" }, { status: 400 });
    }
  }

  const key = `uploads/${Date.now()}-${sanitizeName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }),
  );

  const fileUrl = `${R2_PUBLIC_URL}/${key}`;

  return NextResponse.json({
    fileUrl,
    fileName: file.name,
    fileSize: file.size,
    contentType: isImageExt ? "image" : "file",
  });
}
