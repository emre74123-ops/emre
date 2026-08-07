import {
  DeleteObjectsCommand,
  HeadObjectCommand,
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
    requestChecksumCalculation: "WHEN_REQUIRED",
  });
}

export function r2PublicUrl(key: string) {
  if (!publicBaseUrl) throw new Error("R2 genel medya adresi eksik.");
  return `${publicBaseUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export type R2UploadOptions = {
  metadata?: Record<string, string>;
  cacheControl?: string;
  expiresInSeconds?: number;
};

export type R2ObjectSummary = {
  key: string;
  size: number;
  lastModified: Date | undefined;
  eTag: string | undefined;
};

export type R2ObjectDetails = R2ObjectSummary & {
  contentType: string | undefined;
  cacheControl: string | undefined;
  metadata: Record<string, string>;
};

export async function createR2UploadUrl(
  key: string,
  contentType: string,
  options: R2UploadOptions = {},
) {
  const expiresIn = Math.min(900, Math.max(60, options.expiresInSeconds ?? 300));
  return getSignedUrl(
    client(),
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      CacheControl: options.cacheControl || "public, max-age=31536000, immutable",
      Metadata: options.metadata,
    }),
    { expiresIn },
  );
}

export async function listR2Objects(prefix: string) {
  const objects: R2ObjectSummary[] = [];
  let continuationToken: string | undefined;
  do {
    const result = await client().send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    }));
    for (const item of result.Contents || []) {
      if (!item.Key) continue;
      objects.push({
        key: item.Key,
        size: Number(item.Size || 0),
        lastModified: item.LastModified,
        eTag: item.ETag,
      });
    }
    continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
  } while (continuationToken);
  return objects;
}

export async function headR2Object(key: string): Promise<R2ObjectDetails> {
  const result = await client().send(new HeadObjectCommand({
    Bucket: bucket,
    Key: key,
  }));
  return {
    key,
    size: Number(result.ContentLength || 0),
    lastModified: result.LastModified,
    eTag: result.ETag,
    contentType: result.ContentType,
    cacheControl: result.CacheControl,
    metadata: result.Metadata || {},
  };
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
  const objects = await listR2Objects(prefix);
  await deleteR2Keys(objects.map((item) => item.key));
}

