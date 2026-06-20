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

function loadLocalEnv() {
  const envPath = path.join(projectRoot, ".env.local");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const source = fs.readFileSync(envPath, "utf8");
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function resolveLocalSpecifier(specifier, parentFile) {
  if (specifier.startsWith("@/")) {
    const base = path.resolve(projectRoot, specifier.slice(2));
    const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, "index.ts")];
    return candidates.find((candidate) => fs.existsSync(candidate)) || null;
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

loadLocalEnv();

const { getDashboardSnapshot } = loadTsModule(path.join(projectRoot, "lib/data.ts"));
const { getCampaignLifecycleState } = loadTsModule(path.join(projectRoot, "lib/campaign-management.ts"));

function createSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  assert.ok(url, "NEXT_PUBLIC_SUPABASE_URL is required for live validation.");
  assert.ok(key, "SUPABASE_SERVICE_ROLE_KEY is required for live validation.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function validateLiveSnapshot() {
  const supabase = createSupabase();
  const { data: recentPublished, error } = await supabase
    .from("campaigns")
    .select("id, user_id, workspace_id, name, status, updated_at")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  assert.ifError(error);
  assert.ok(recentPublished, "Expected at least one published campaign for live validation.");

  const snapshot = await getDashboardSnapshot(recentPublished.user_id, { allowDemo: false });

  assert.equal(snapshot.loadError, null, `Dashboard snapshot should load without error, got: ${snapshot.loadError}`);
  assert.ok(
    snapshot.campaigns.some((campaign) => campaign.id === recentPublished.id),
    "Recently published campaign should be included in dashboard snapshot campaigns.",
  );

  const lifecycle = getCampaignLifecycleState({
    status: recentPublished.status,
    external_publish_status: null,
    archived_at: null,
    meta_effective_status: null,
    meta_configured_status: null,
  });

  assert.notEqual(lifecycle, "draft", "Published campaign must not resolve to draft lifecycle.");

  return {
    recentPublishedId: recentPublished.id.slice(0, 8),
    workspaceMatch: snapshot.campaigns.some((campaign) => campaign.workspace_id === recentPublished.workspace_id),
    campaignsCount: snapshot.campaigns.length,
  };
}

function validateLifecycleRules() {
  assert.equal(
    getCampaignLifecycleState({
      status: "draft",
      external_publish_status: null,
      archived_at: null,
      meta_effective_status: null,
      meta_configured_status: null,
    }),
    "draft",
  );

  assert.equal(
    getCampaignLifecycleState({
      status: "published",
      external_publish_status: "ACTIVE",
      archived_at: null,
      meta_effective_status: null,
      meta_configured_status: null,
    }),
    "active",
  );

  assert.equal(
    getCampaignLifecycleState({
      status: "published",
      external_publish_status: "PAUSED",
      archived_at: null,
      meta_effective_status: null,
      meta_configured_status: null,
    }),
    "paused",
  );

  assert.equal(
    getCampaignLifecycleState({
      status: "archived",
      external_publish_status: null,
      archived_at: "2026-06-20T00:00:00.000Z",
      meta_effective_status: null,
      meta_configured_status: null,
    }),
    "archived",
  );
}

async function main() {
  validateLifecycleRules();
  const live = await validateLiveSnapshot();

  console.log(
    JSON.stringify(
      {
        ok: true,
        live,
      },
      null,
      2,
    ),
  );
}

await main();
