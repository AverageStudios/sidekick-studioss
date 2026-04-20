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
