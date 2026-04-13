import "server-only";

import { getTemplateBySlug, hydrateTemplateRecord, templateFallbackCatalog } from "@/data/templates";
import { isSupabasePublicConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TemplateRecord, TemplateSeed } from "@/types";

async function getPublishedTemplateRecordsFromSupabase() {
  if (!isSupabasePublicConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to load published templates from Supabase", error.message);
    return null;
  }

  return (data || []) as TemplateRecord[];
}

export async function listPublishedTemplates(): Promise<TemplateSeed[]> {
  const records = await getPublishedTemplateRecordsFromSupabase();

  if (!records) {
    return templateFallbackCatalog;
  }

  return records.map(hydrateTemplateRecord);
}

export async function getPublishedTemplateBySlug(slug: string): Promise<TemplateSeed | null> {
  if (!isSupabasePublicConfigured()) {
    return getTemplateBySlug(slug) || null;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return getTemplateBySlug(slug) || null;
  }

  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error(`Failed to load template ${slug} from Supabase`, error.message);
    return getTemplateBySlug(slug) || null;
  }

  if (!data) {
    return null;
  }

  return hydrateTemplateRecord(data as TemplateRecord);
}
