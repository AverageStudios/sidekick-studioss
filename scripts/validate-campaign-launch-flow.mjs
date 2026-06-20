import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";

import ts from "typescript";
import { createClient } from "@supabase/supabase-js";

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const nodeRequire = createRequire(import.meta.url);
const moduleCache = new Map();

function resolveLocalSpecifier(specifier, parentFile) {
  if (specifier.startsWith("@/")) {
    return path.resolve(projectRoot, `${specifier.slice(2)}.ts`);
  }

  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const base = path.resolve(path.dirname(parentFile), specifier);
    const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, "index.ts")];
    return candidates.find((candidate) => fs.existsSync(candidate)) || null;
  }

  return null;
}

function loadTsModule(modulePath) {
  const resolvedPath = path.resolve(modulePath);
  if (moduleCache.has(resolvedPath)) {
    return moduleCache.get(resolvedPath).exports;
  }

  const source = fs.readFileSync(resolvedPath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: resolvedPath,
  }).outputText;

  const compiledModule = { exports: {} };
  moduleCache.set(resolvedPath, compiledModule);

  const localRequire = (specifier) => {
    if (specifier === "server-only") {
      return {};
    }

    const localPath = resolveLocalSpecifier(specifier, resolvedPath);
    if (localPath) {
      return loadTsModule(localPath);
    }

    return nodeRequire(specifier);
  };

  const wrapped = `(function (exports, require, module, __filename, __dirname) { ${transpiled}\n})`;
  const script = new vm.Script(wrapped, { filename: resolvedPath });
  const fn = script.runInThisContext();
  fn(compiledModule.exports, localRequire, compiledModule, resolvedPath, path.dirname(resolvedPath));

  return compiledModule.exports;
}

const { templateFallbackCatalog } = loadTsModule(path.join(projectRoot, "data/templates.ts"));
const {
  createInitialCampaignLaunchState,
  getTemplateSetupValuesFromLaunchState,
  validateWizardStep,
} = loadTsModule(path.join(projectRoot, "lib/campaign-launch.ts"));
const { hydrateTemplateRecord } = loadTsModule(path.join(projectRoot, "data/templates.ts"));
const { crmProviderMetadataList, getVisibleCrmProviderMetadataList } = loadTsModule(
  path.join(projectRoot, "lib/crm-providers.ts"),
);
const { createCampaignBlueprint } = loadTsModule(path.join(projectRoot, "lib/template-engine.ts"));

const mockBusinessProfile = {
  id: "profile-test",
  user_id: "user-test",
  workspace_id: "workspace-test",
  business_name: "SideKick Test Auto Spa",
  website: "https://sidekickstudioss.com",
  industry: "Car Detailing",
  privacy_policy_url: "https://sidekickstudioss.com/privacy",
  location: "Tampa, FL",
  phone: "+1 555-010-2026",
  email: "test+launch@sidekickstudioss.com",
  description: "Launch validation profile",
  logo_url: "https://sidekickstudioss.com/logo.png",
  brand_color: "#6D5EF8",
  default_cta: "Get my quote",
};

const expectedVisibleProviders = ["pipedrive", "zoho", "monday", "keap", "close"];
const disallowedVisibleProviders = ["gohighlevel", "hubspot", "freshsales", "salesforce"];
const fallbackTemplateLookup = new Map(templateFallbackCatalog.map((template) => [template.slug, template]));

function ensureNonEmptyString(value, label) {
  assert.equal(typeof value, "string", `${label} must be a string`);
  assert.ok(value.trim().length > 0, `${label} must not be empty`);
}

function validateTemplate(template) {
  ensureNonEmptyString(template.id, `${template.name} id`);
  ensureNonEmptyString(template.slug, `${template.name} slug`);
  ensureNonEmptyString(template.name, `${template.name} name`);
  ensureNonEmptyString(template.description, `${template.name} description`);
  ensureNonEmptyString(template.category, `${template.name} category`);
  ensureNonEmptyString(template.industry, `${template.name} industry`);
  ensureNonEmptyString(template.offerType, `${template.name} offer type`);
  ensureNonEmptyString(template.previewImage, `${template.name} preview image`);

  assert.ok(Array.isArray(template.supportedAdTypes), `${template.name} supportedAdTypes must be an array`);
  assert.ok(template.supportedAdTypes.length > 0, `${template.name} must support at least one ad type`);
  assert.ok(
    template.supportedAdTypes.includes(template.defaultAdType),
    `${template.name} default ad type must be included in supported ad types`,
  );

  ensureNonEmptyString(template.adCopy.primary, `${template.name} adCopy.primary`);
  assert.ok(template.adCopy.headlines.length > 0, `${template.name} needs at least one headline`);
  assert.ok(template.adCopy.descriptions.length > 0, `${template.name} needs at least one description`);
  ensureNonEmptyString(template.adCopy.targeting, `${template.name} adCopy.targeting`);
  ensureNonEmptyString(template.adCopy.budget, `${template.name} adCopy.budget`);
  assert.ok(template.adCopy.creativeGuidance.length > 0, `${template.name} needs creative guidance`);

  ensureNonEmptyString(template.funnel.heroHeadline, `${template.name} funnel.heroHeadline`);
  ensureNonEmptyString(template.funnel.heroSubheadline, `${template.name} funnel.heroSubheadline`);
  ensureNonEmptyString(template.funnel.offerLabel, `${template.name} funnel.offerLabel`);
  ensureNonEmptyString(template.funnel.finalCta, `${template.name} funnel.finalCta`);
  assert.ok(Array.isArray(template.funnel.whyChooseUs), `${template.name} funnel.whyChooseUs must be an array`);
  assert.ok(template.funnel.whyChooseUs.length > 0, `${template.name} funnel.whyChooseUs must not be empty`);

  const launchState = createInitialCampaignLaunchState({
    template,
    businessProfile: mockBusinessProfile,
  });
  const setupValues = getTemplateSetupValuesFromLaunchState(template, launchState, mockBusinessProfile);
  const blueprint = createCampaignBlueprint(template, setupValues, {
    logoUrl: mockBusinessProfile.logo_url,
    beforeImageUrls: [],
    afterImageUrls: [],
  });

  ensureNonEmptyString(blueprint.campaignName, `${template.name} blueprint campaignName`);
  ensureNonEmptyString(blueprint.adCopy.primary, `${template.name} blueprint primary`);
  assert.ok(blueprint.adCopy.headlines.length > 0, `${template.name} blueprint needs at least one headline`);
  assert.ok(blueprint.adCopy.descriptions.length > 0, `${template.name} blueprint needs at least one description`);
  ensureNonEmptyString(blueprint.funnelConfig.headline, `${template.name} blueprint funnel headline`);
  ensureNonEmptyString(blueprint.funnelConfig.subheadline, `${template.name} blueprint funnel subheadline`);
  ensureNonEmptyString(blueprint.funnelConfig.ctaText, `${template.name} blueprint CTA`);

  assert.equal(
    validateWizardStep({
      stepId: "industry",
      state: launchState,
      template,
      businessProfile: mockBusinessProfile,
    }).isValid,
    true,
    `${template.name} should pass industry validation`,
  );
  assert.equal(
    validateWizardStep({
      stepId: "template",
      state: launchState,
      template,
      businessProfile: mockBusinessProfile,
    }).isValid,
    true,
    `${template.name} should pass template validation`,
  );
  assert.equal(
    validateWizardStep({
      stepId: "ad-type",
      state: launchState,
      template,
      businessProfile: mockBusinessProfile,
    }).isValid,
    true,
    `${template.name} should pass ad-type validation`,
  );

  return {
    slug: template.slug,
    name: template.name,
    category: template.category,
    defaultAdType: template.defaultAdType,
    supportedAdTypes: template.supportedAdTypes,
    previewImage: template.previewImage,
  };
}

function validateProviderVisibility() {
  const visibleProviders = getVisibleCrmProviderMetadataList().map((provider) => provider.key);
  assert.deepEqual(
    visibleProviders,
    expectedVisibleProviders,
    `Visible CRM providers should be ${expectedVisibleProviders.join(", ")}`,
  );

  for (const provider of disallowedVisibleProviders) {
    assert.ok(!visibleProviders.includes(provider), `${provider} must stay hidden from the launch CRM picker`);
  }

  for (const provider of expectedVisibleProviders) {
    assert.ok(crmProviderMetadataList.some((item) => item.key === provider), `${provider} metadata must exist`);
  }
}

function validateNegativeCases() {
  const emptyState = createInitialCampaignLaunchState({
    template: null,
    businessProfile: mockBusinessProfile,
  });

  assert.equal(
    validateWizardStep({
      stepId: "industry",
      state: emptyState,
      template: null,
      businessProfile: mockBusinessProfile,
    }).isValid,
    false,
    "Empty launch state should fail industry validation",
  );

  assert.equal(
    validateWizardStep({
      stepId: "template",
      state: {
        ...emptyState,
        selection: {
          ...emptyState.selection,
          industry: "Car Detailing",
        },
      },
      template: null,
      businessProfile: mockBusinessProfile,
    }).isValid,
    false,
    "Missing template should fail template validation",
  );
}

function assertNoDuplicateDisplayNames(templates, sourceLabel) {
  const namesToSlugs = new Map();

  for (const template of templates) {
    const existing = namesToSlugs.get(template.name) || [];
    existing.push(template.slug);
    namesToSlugs.set(template.name, existing);
  }

  const duplicates = Array.from(namesToSlugs.entries()).filter(([, slugs]) => slugs.length > 1);
  assert.equal(
    duplicates.length,
    0,
    `${sourceLabel} contains duplicate display names: ${duplicates
      .map(([name, slugs]) => `${name} (${slugs.join(", ")})`)
      .join("; ")}`,
  );
}

async function loadPublishedSupabaseTemplates() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return {
      available: false,
      reason: "missing_env",
      rows: [],
      hydrated: [],
    };
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("status", "published")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Supabase template audit failed: ${error.message}`);
  }

  const rows = data || [];
  const hydrated = rows.map((row) => hydrateTemplateRecord(row));
  return {
    available: true,
    reason: null,
    rows,
    hydrated,
  };
}

function collectLiveTemplateWarnings(rows, hydratedTemplates) {
  const warnings = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const template = hydratedTemplates[index];
    const config = row.config_json || {};
    const creative = config.creative || {};
    const templateConfig = config.template || {};
    const creativeAssets = config.creativeAssets || {};
    const matchingFallback = fallbackTemplateLookup.get(template.slug) || null;

    if (!matchingFallback) {
      warnings.push({
        slug: template.slug,
        level: "info",
        code: "not_in_fallback_catalog",
        message: `${template.name} is a live-only Supabase template and does not exist in the fallback catalog.`,
      });
    }

    if (!Array.isArray(creativeAssets.imageUrls) || creativeAssets.imageUrls.length === 0) {
      const placeholderPrimaryImage =
        typeof creativeAssets.primaryImageUrl === "string" &&
        creativeAssets.primaryImageUrl.includes("PASTE_PUBLIC_IMAGE_URL_HERE");
      if (placeholderPrimaryImage && (!template.previewImage || !String(template.previewImage).trim())) {
        warnings.push({
          slug: template.slug,
          level: "warning",
          code: "creative_image_placeholder_without_preview",
          message: `${template.name} still has a placeholder creative primary image URL and no preview image fallback.`,
        });
      }
    }

    if (typeof creative.adType !== "string" && typeof templateConfig.recommendedAdType !== "string") {
      warnings.push({
        slug: template.slug,
        level: "warning",
        code: "missing_explicit_ad_type",
        message: `${template.name} relies on hydration defaults because config_json does not declare an explicit ad type.`,
      });
    }

    if (!Array.isArray(config.placeholders) || config.placeholders.length === 0) {
      warnings.push({
        slug: template.slug,
        level: "warning",
        code: "missing_placeholders",
        message: `${template.name} does not define placeholder metadata in config_json.`,
      });
    }

  }

  return warnings;
}

async function main() {
  assert.ok(templateFallbackCatalog.length > 0, "Template catalog must not be empty");

  const fallbackResults = [];
  for (const template of templateFallbackCatalog) {
    fallbackResults.push(validateTemplate(template));
  }

  validateProviderVisibility();
  validateNegativeCases();
  const liveSupabase = await loadPublishedSupabaseTemplates();
  const liveResults = [];
  let liveWarnings = [];

  if (liveSupabase.available) {
    assertNoDuplicateDisplayNames(liveSupabase.hydrated, "Published Supabase templates");
    for (const template of liveSupabase.hydrated) {
      liveResults.push(validateTemplate(template));
    }
    liveWarnings = collectLiveTemplateWarnings(liveSupabase.rows, liveSupabase.hydrated);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        fallbackAuditedTemplates: fallbackResults.map((template) => template.name),
        liveSupabaseAudit: liveSupabase.available
          ? {
              count: liveResults.length,
              templates: liveResults,
              warnings: liveWarnings,
            }
          : {
              count: 0,
              skipped: true,
              reason: liveSupabase.reason,
            },
        visibleCrmProviders: getVisibleCrmProviderMetadataList().map((provider) => provider.key),
      },
      null,
      2,
    ),
  );
}

await main();
