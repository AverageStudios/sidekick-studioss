import "server-only";

import { cache } from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseServerConfigured } from "@/lib/env";
import { TemplateRecord } from "@/types";
import { normalizeIndustryLabel, normalizeOfferTypeLabel } from "@/data/template-taxonomy";

export async function listAdminTemplates({
  status,
  industry,
  offerType,
}: {
  status?: string;
  industry?: string;
  offerType?: string;
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

  const { data, error } = await query;

  if (error) {
    console.error("Failed to load admin templates", error.message);
    return [];
  }

  const records = (data || []) as TemplateRecord[];
  if ((industry && industry !== "all") || (offerType && offerType !== "all")) {
    return records.filter((template) => {
      const templateIndustry = normalizeIndustryLabel(template.industry || template.config_json?.industry || template.category);
      const templateOfferType = normalizeOfferTypeLabel(template.offer_type || template.config_json?.offerType);
      const matchesIndustry = !industry || industry === "all" || templateIndustry === industry;
      const matchesOfferType = !offerType || offerType === "all" || templateOfferType === offerType;
      return matchesIndustry && matchesOfferType;
    });
  }

  return records;
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
