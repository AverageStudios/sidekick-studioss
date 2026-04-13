import { randomUUID } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseServerConfigured } from "@/lib/env";

export async function uploadAsset(file: File, folder: string) {
  if (!file || file.size === 0) return null;
  if (!isSupabaseServerConfigured()) return null;

  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const extension = file.name.split(".").pop() || "png";
  const path = `${folder}/${randomUUID()}.${extension}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from("assets")
    .upload(path, Buffer.from(arrayBuffer), {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from("assets").getPublicUrl(path);
  return data.publicUrl;
}
