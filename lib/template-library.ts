import "server-only";

import { cache } from "react";
import { templateFallbackCatalog } from "@/data/templates";
import { normalizeIndustryLabel, normalizeTemplateCategoryKey, resolveTemplateLaunchCategory } from "@/data/template-taxonomy";
import { isSupabasePublicConfigured, isSupabaseServerConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import {
  TemplateCategoryNode,
  TemplateCategoryRecord,
  TemplateIndustryNode,
  TemplateIndustryRecord,
  TemplateRecord,
  TemplateSeed,
} from "@/types";

type TemplateLibraryTree = {
  industries: TemplateIndustryNode[];
  supportsHierarchyTables: boolean;
};

function isMissingRelationError(message?: string | null) {
  const normalized = message?.toLowerCase() || "";
  return normalized.includes("could not find the table") || normalized.includes("does not exist");
}

function toFallbackTemplateRecord(template: TemplateSeed): TemplateRecord {
  return {
    id: template.id,
    slug: template.slug,
    name: template.name,
    description: template.description,
    category: template.category,
    industry: template.industry,
    offer_type: template.offerType,
    preview_image_url: template.previewImage,
    config_json: null,
    status: "published",
    is_featured: false,
    version: 1,
  };
}

function buildFallbackLibrary(records: TemplateRecord[]): TemplateLibraryTree {
  const industryMap = new Map<string, TemplateIndustryNode>();

  for (const template of records) {
    const industryName = normalizeIndustryLabel(template.industry || template.category || "Unassigned") || "Unassigned";
    const categoryName = (template.category || template.industry || "Uncategorized").trim() || "Uncategorized";
    const industryKey = slugify(industryName);
    const categoryKey = `${industryKey}:${slugify(categoryName)}`;

    let industry = industryMap.get(industryKey);
    if (!industry) {
      industry = {
        id: `legacy-industry-${industryKey}`,
        name: industryName,
        slug: industryKey,
        description: null,
        status: "active",
        sort_order: 0,
        categories: [],
        template_count: 0,
        published_count: 0,
      };
      industryMap.set(industryKey, industry);
    }

    let category = industry.categories.find((item) => item.id === `legacy-category-${categoryKey}`);
    if (!category) {
      category = {
        id: `legacy-category-${categoryKey}`,
        industry_id: industry.id,
        industry_name: industry.name,
        name: categoryName,
        slug: slugify(categoryName),
        description: null,
        status: "active",
        sort_order: 0,
        templates: [],
        template_count: 0,
        published_count: 0,
      };
      industry.categories.push(category);
    }

    category.templates.push(template);
    category.template_count += 1;
    if (template.status === "published") {
      category.published_count += 1;
    }
    industry.template_count += 1;
    if (template.status === "published") {
      industry.published_count += 1;
    }
  }

  const industries = Array.from(industryMap.values())
    .map((industry) => ({
      ...industry,
      categories: [...industry.categories].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { industries, supportsHierarchyTables: false };
}

function buildTemplateLibraryTree(
  industries: TemplateIndustryRecord[],
  categories: TemplateCategoryRecord[],
  templates: TemplateRecord[],
): TemplateLibraryTree {
  const industryMap = new Map<string, TemplateIndustryNode>();

  for (const industry of industries) {
    industryMap.set(industry.id, {
      ...industry,
      categories: [],
      template_count: 0,
      published_count: 0,
    });
  }

  const categoryMap = new Map<string, TemplateCategoryNode>();
  for (const category of categories) {
    const parent = industryMap.get(category.industry_id);
    if (!parent) continue;
    const node: TemplateCategoryNode = {
      ...category,
      industry_name: parent.name,
      templates: [],
      template_count: 0,
      published_count: 0,
    };
    parent.categories.push(node);
    categoryMap.set(category.id, node);
  }

  for (const template of templates) {
    const categoryNode = template.category_id ? categoryMap.get(template.category_id) : null;
    const industryNode = template.industry_id ? industryMap.get(template.industry_id) : null;
    const resolvedCategoryLabel = resolveTemplateLaunchCategory({
      slug: template.slug,
      name: template.name,
      description: template.description,
      category: template.category,
      industry: template.industry,
      config_json: template.config_json,
    });
    const resolvedCategoryKey = normalizeTemplateCategoryKey(
      resolvedCategoryLabel || template.category || template.config_json?.category || "",
    );
    const fallbackCategoryNode =
      !categoryNode && industryNode
        ? industryNode.categories.find(
            (item) =>
              normalizeTemplateCategoryKey(item.name) === resolvedCategoryKey ||
              normalizeTemplateCategoryKey(item.slug) === resolvedCategoryKey,
          ) || null
        : null;
    const resolvedCategoryNode = categoryNode || fallbackCategoryNode;

    if (resolvedCategoryNode) {
      resolvedCategoryNode.templates.push(template);
      resolvedCategoryNode.template_count += 1;
      if (template.status === "published") {
        resolvedCategoryNode.published_count += 1;
      }
    }

    if (industryNode) {
      industryNode.template_count += 1;
      if (template.status === "published") {
        industryNode.published_count += 1;
      }
    }
  }

  const orderedIndustries = Array.from(industryMap.values())
    .map((industry) => ({
      ...industry,
      categories: [...industry.categories]
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name))
        .map((category) => ({
          ...category,
          templates: [...category.templates].sort((a, b) => a.name.localeCompare(b.name)),
        })),
    }))
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name));

  return { industries: orderedIndustries, supportsHierarchyTables: true };
}

export const listAdminTemplateLibrary = cache(async (): Promise<TemplateLibraryTree> => {
  if (!isSupabaseServerConfigured()) {
    return buildFallbackLibrary(templateFallbackCatalog.map(toFallbackTemplateRecord));
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return buildFallbackLibrary(templateFallbackCatalog.map(toFallbackTemplateRecord));
  }

  const [industryResult, categoryResult, templateResult] = await Promise.all([
    admin.from("template_industries").select("*").order("sort_order").order("name"),
    admin.from("template_categories").select("*").order("sort_order").order("name"),
    admin.from("templates").select("*").order("updated_at", { ascending: false }),
  ]);

  if (
    isMissingRelationError(industryResult.error?.message) ||
    isMissingRelationError(categoryResult.error?.message)
  ) {
    const records = ((templateResult.data as TemplateRecord[] | null) || []).map((record) => ({
      ...record,
      category_id: record.category_id || null,
      industry_id: record.industry_id || null,
    }));
    return buildFallbackLibrary(records);
  }

  if (industryResult.error || categoryResult.error || templateResult.error) {
    console.error(
      "Failed to load template library",
      industryResult.error?.message || categoryResult.error?.message || templateResult.error?.message,
    );
    return buildFallbackLibrary(templateFallbackCatalog.map(toFallbackTemplateRecord));
  }

  return buildTemplateLibraryTree(
    (industryResult.data || []) as TemplateIndustryRecord[],
    (categoryResult.data || []) as TemplateCategoryRecord[],
    ((templateResult.data || []) as TemplateRecord[]).map((record) => ({
      ...record,
      category_id: record.category_id || null,
      industry_id: record.industry_id || null,
    })),
  );
});

export const listPublishedTemplateLibrary = cache(async (): Promise<TemplateLibraryTree> => {
  if (!isSupabasePublicConfigured()) {
    return buildFallbackLibrary(templateFallbackCatalog.map(toFallbackTemplateRecord));
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return buildFallbackLibrary(templateFallbackCatalog.map(toFallbackTemplateRecord));
  }

  const [industryResult, categoryResult, templateResult] = await Promise.all([
    supabase.from("template_industries").select("*").eq("status", "active").order("sort_order").order("name"),
    supabase.from("template_categories").select("*").eq("status", "active").order("sort_order").order("name"),
    supabase.from("templates").select("*").eq("status", "published").order("is_featured", { ascending: false }).order("name"),
  ]);

  if (
    isMissingRelationError(industryResult.error?.message) ||
    isMissingRelationError(categoryResult.error?.message)
  ) {
    const records = ((templateResult.data as TemplateRecord[] | null) || []).map((record) => ({
      ...record,
      category_id: record.category_id || null,
      industry_id: record.industry_id || null,
    }));
    return buildFallbackLibrary(records);
  }

  if (industryResult.error || categoryResult.error || templateResult.error) {
    console.error(
      "Failed to load published template library",
      industryResult.error?.message || categoryResult.error?.message || templateResult.error?.message,
    );
    return buildFallbackLibrary(templateFallbackCatalog.map(toFallbackTemplateRecord));
  }

  return buildTemplateLibraryTree(
    (industryResult.data || []) as TemplateIndustryRecord[],
    (categoryResult.data || []) as TemplateCategoryRecord[],
    ((templateResult.data || []) as TemplateRecord[]).map((record) => ({
      ...record,
      category_id: record.category_id || null,
      industry_id: record.industry_id || null,
    })),
  );
});

export function flattenTemplateLibrary(industries: TemplateIndustryNode[]) {
  return industries.flatMap((industry) =>
    industry.categories.flatMap((category) =>
      category.templates.map((template) => ({
        template,
        category,
        industry,
      })),
    ),
  );
}
