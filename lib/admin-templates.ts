import "server-only";

import { cache } from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseServerConfigured } from "@/lib/env";
import { TemplateRecord } from "@/types";

export async function listAdminTemplates({
  status,
  category,
}: {
  status?: string;
  category?: string;
} = {}) {
  if (!isSupabaseServerConfigured()) {
    return [] as TemplateRecord[];
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return [] as TemplateRecord[];
  }

  let query = supabase.from("templates").select("*").order("updated_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to load admin templates", error.message);
    return [];
  }

  return (data || []) as TemplateRecord[];
}

export const getAdminTemplateById = cache(async (id: string) => {
  if (!isSupabaseServerConfigured()) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.from("templates").select("*").eq("id", id).maybeSingle();

  if (error) {
    console.error(`Failed to load admin template ${id}`, error.message);
    return null;
  }

  return (data as TemplateRecord | null) || null;
});

export const getAdminTemplateStats = cache(async () => {
  const templates = await listAdminTemplates();

  return {
    total: templates.length,
    published: templates.filter((template) => template.status === "published").length,
    draft: templates.filter((template) => template.status === "draft").length,
    archived: templates.filter((template) => template.status === "archived").length,
    featured: templates.filter((template) => template.is_featured).length,
    recent: templates.slice(0, 5),
  };
});
