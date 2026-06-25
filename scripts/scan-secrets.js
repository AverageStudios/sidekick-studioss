#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const ignoredDirs = new Set([
  ".git",
  ".next",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "playwright-report",
  "test-results",
]);
const binaryExts = new Set([
  ".avif",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".mp4",
  ".pdf",
  ".png",
  ".webp",
  ".zip",
]);

const rules = [
  { name: "Stripe live secret key", pattern: /\bsk_live_[A-Za-z0-9]{20,}\b/g },
  { name: "Stripe restricted key", pattern: /\brk_live_[A-Za-z0-9]{20,}\b/g },
  { name: "Supabase JWT/service-role-like token", pattern: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g },
  { name: "Meta/Facebook access token", pattern: /\bEA[A-Za-z0-9]{40,}\b/g },
  { name: "GitHub token", pattern: /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/g },
  { name: "OpenAI API key", pattern: /\bsk-proj-[A-Za-z0-9_-]{20,}\b|\bsk-[A-Za-z0-9]{32,}\b/g },
  { name: "Anthropic API key", pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g },
  { name: "Resend API key", pattern: /\bre_[A-Za-z0-9]{20,}\b/g },
  { name: "Private key block", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { name: "Database URL with credentials", pattern: /\b(postgres|postgresql|mysql):\/\/[^:\s]+:[^@\s]+@[^\s'"]+/gi },
  {
    name: "Likely assigned secret",
    pattern:
      /^[\t ]*[A-Z0-9_]*(?:SECRET|TOKEN|PRIVATE_KEY|SERVICE_ROLE|WEBHOOK_SECRET|CLIENT_SECRET|ACCESS_TOKEN|REFRESH_TOKEN|DATABASE_URL|REDIS_REST_TOKEN|RESEND_API_KEY|STRIPE_SECRET_KEY)[A-Z0-9_]*[\t ]*[:=][\t ]*["']?([^"',\s#]{12,})/gm,
  },
];

function redact(value) {
  if (!value) return "[redacted]";
  const normalized = String(value);
  if (normalized.length <= 8) return "****";
  return `${normalized.slice(0, 4)}****${normalized.slice(-4)}`;
}

function shouldSkipFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (binaryExts.has(ext)) return true;
  const base = path.basename(filePath);
  return base.endsWith(".tsbuildinfo") || base === "package-lock.json";
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) walk(path.join(dir, entry.name), files);
      continue;
    }
    const filePath = path.join(dir, entry.name);
    if (!shouldSkipFile(filePath)) files.push(filePath);
  }
  return files;
}

const findings = [];
for (const filePath of walk(root)) {
  let content = "";
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    continue;
  }
  if (content.includes("\u0000")) continue;

  const lines = content.split(/\r?\n/);
  for (const rule of rules) {
    rule.pattern.lastIndex = 0;
    let match;
    while ((match = rule.pattern.exec(content)) !== null) {
      const value = match[1] || match[0];
      if (!value || /^(changeme|example|placeholder|your_|xxx|test|demo)$/i.test(value)) continue;
      const line = content.slice(0, match.index).split(/\r?\n/).length;
      const lineText = lines[line - 1] || "";
      findings.push({
        file: path.relative(root, filePath),
        line,
        rule: rule.name,
        match: redact(value),
        context: lineText.replace(value, redact(value)).slice(0, 220),
      });
    }
  }
}

if (findings.length) {
  console.error(`Potential secrets found: ${findings.length}`);
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line} ${finding.rule} ${finding.match}`);
    console.error(`  ${finding.context}`);
  }
  process.exit(1);
}

console.log("No likely secrets found.");
