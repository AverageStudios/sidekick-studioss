import { randomUUID } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env, isSupabaseServerConfigured } from "@/lib/env";

export const storageBucketName = env.supabaseStorageBucket;

async function ensureStorageBucketExists() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    throw new Error(`Could not inspect Supabase storage buckets: ${listError.message}`);
  }

  const existingBucket = buckets?.find((bucket) => bucket.name === storageBucketName);
  if (existingBucket) {
    return supabase;
  }

  const { error: createError } = await supabase.storage.createBucket(storageBucketName, {
    public: true,
  });

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw new Error(
      `Supabase storage bucket "${storageBucketName}" could not be created: ${createError.message}`,
    );
  }

  return supabase;
}

export async function uploadAsset(file: File, folder: string) {
  if (!file || file.size === 0) return null;
  if (!isSupabaseServerConfigured()) return null;

  const supabase = await ensureStorageBucketExists();
  if (!supabase) return null;

  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${folder}/${randomUUID()}.${extension}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(storageBucketName)
    .upload(path, Buffer.from(arrayBuffer), {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    const normalizedMessage = error.message.toLowerCase();
    if (normalizedMessage.includes("bucket") && normalizedMessage.includes("not found")) {
      throw new Error(
        `Supabase storage bucket "${storageBucketName}" was not found and could not be created automatically.`,
      );
    }

    throw new Error(`Upload failed in bucket "${storageBucketName}": ${error.message}`);
  }

  const { data } = supabase.storage.from(storageBucketName).getPublicUrl(path);
  return data.publicUrl;
}

function getSupabaseStoragePublicPrefix() {
  if (!env.supabaseUrl) return null;

  try {
    const origin = new URL(env.supabaseUrl).origin;
    return `${origin}/storage/v1/object/public/${storageBucketName}/`;
  } catch {
    return null;
  }
}

export function getStoragePathFromPublicUrl(url: string | null | undefined) {
  const normalized = (url || "").trim();
  if (!normalized) return null;

  const publicPrefix = getSupabaseStoragePublicPrefix();
  if (!publicPrefix || !normalized.startsWith(publicPrefix)) {
    return null;
  }

  return decodeURIComponent(normalized.slice(publicPrefix.length));
}

export async function deleteStoragePaths(paths: string[]) {
  if (!isSupabaseServerConfigured()) return;

  const supabase = createSupabaseAdminClient();
  if (!supabase) return;

  const uniquePaths = Array.from(new Set(paths.map((path) => path.trim()).filter(Boolean)));
  if (!uniquePaths.length) return;

  const { error } = await supabase.storage.from(storageBucketName).remove(uniquePaths);
  if (error) {
    throw new Error(`Could not delete Supabase storage assets: ${error.message}`);
  }
}

export async function deleteStoragePrefix(prefix: string) {
  if (!isSupabaseServerConfigured()) return;

  const supabase = createSupabaseAdminClient();
  if (!supabase) return;

  const normalizedPrefix = prefix.trim().replace(/^\/+|\/+$/g, "");
  if (!normalizedPrefix) return;

  const { data, error } = await supabase.storage.from(storageBucketName).list(normalizedPrefix, {
    limit: 1000,
    offset: 0,
  });

  if (error) {
    throw new Error(`Could not inspect Supabase storage assets for "${normalizedPrefix}": ${error.message}`);
  }

  const paths = (data || [])
    .filter((entry) => Boolean(entry.name) && typeof entry.id === "string")
    .map((entry) => `${normalizedPrefix}/${entry.name}`);

  if (!paths.length) return;

  await deleteStoragePaths(paths);
}
