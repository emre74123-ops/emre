import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucket = process.env.R2_BUCKET_NAME || "";
const publicBaseUrl = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");

function client() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("R2 bağlantı ayarları eksik.");
  }
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function r2PublicUrl(key: string) {
  if (!publicBaseUrl) throw new Error("R2 genel medya adresi eksik.");
  return `${publicBaseUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export async function createR2UploadUrl(key: string, contentType: string) {
  return getSignedUrl(
    client(),
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
    { expiresIn: 300 },
  );
}

export async function deleteR2Keys(keys: string[]) {
  const uniqueKeys = [...new Set(keys.filter(Boolean))];
  if (!uniqueKeys.length) return;
  for (let index = 0; index < uniqueKeys.length; index += 1000) {
    await client().send(new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: uniqueKeys.slice(index, index + 1000).map((Key) => ({ Key })), Quiet: true },
    }));
  }
}

export async function deleteR2Prefix(prefix: string) {
  let continuationToken: string | undefined;
  do {
    const result = await client().send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    }));
    await deleteR2Keys((result.Contents || []).flatMap((item) => item.Key ? [item.Key] : []));
    continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
  } while (continuationToken);
}

