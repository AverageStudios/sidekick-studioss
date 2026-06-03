import { TemplatePlaceholderField, TemplateSeed } from "@/types";

const PLACEHOLDER_PATTERN = /\{\{\s*([^{}]+?)\s*\}\}/g;
const PLACEHOLDER_ALIAS_MAP: Record<string, string[]> = {
  price: ["offerPrice", "regularPrice", "monthlyRate", "joinFee"],
  amount: ["offerPrice", "regularPrice", "monthlyRate", "joinFee"],
  offerprice: ["offerPrice", "price", "monthlyRate", "joinFee"],
  regularprice: ["regularPrice", "offerPrice", "price", "joinFee"],
  monthlyrate: ["monthlyRate", "offerPrice", "price"],
  joinfee: ["joinFee", "regularPrice", "offerPrice", "price"],
  city: ["city", "location"],
  location: ["city", "location"],
  business: ["businessName"],
  businessname: ["businessName"],
  business_name: ["businessName"],
  service: ["serviceName", "service_name", "offerName", "offer_name"],
  servicename: ["serviceName", "service_name", "offerName", "offer_name"],
  service_name: ["serviceName", "service_name", "offerName", "offer_name"],
  offername: ["offerName", "offer_name", "serviceName", "service_name"],
  offer_name: ["offerName", "offer_name", "serviceName", "service_name"],
  cta: ["ctaText"],
  ctatext: ["ctaText"],
};

function normalizePlaceholderLookupKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isFilledPlaceholderValue(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function humanizePlaceholderKey(key: string) {
  const cleaned = key.trim().replace(/[-_]+/g, " ");
  if (!cleaned) return "Placeholder";
  return cleaned
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function collectPlaceholderKeys(value: unknown, keys: string[], seen = new Set<unknown>()) {
  if (value == null || seen.has(value)) return;
  if (typeof value === "string") {
    let match: RegExpExecArray | null;
    PLACEHOLDER_PATTERN.lastIndex = 0;
    while ((match = PLACEHOLDER_PATTERN.exec(value))) {
      const key = match[1]?.trim();
      if (key) keys.push(key);
    }
    return;
  }

  if (Array.isArray(value)) {
    seen.add(value);
    for (const item of value) collectPlaceholderKeys(item, keys, seen);
    return;
  }

  if (typeof value === "object") {
    seen.add(value);
    for (const item of Object.values(value as Record<string, unknown>)) {
      collectPlaceholderKeys(item, keys, seen);
    }
  }
}

export function extractTemplatePlaceholderFields(template: TemplateSeed): TemplatePlaceholderField[] {
  const keys: string[] = [];
  collectPlaceholderKeys(template, keys);

  const fields = new Map<string, TemplatePlaceholderField>();
  for (const key of keys) {
    if (!fields.has(key)) {
      fields.set(key, {
        id: key,
        label: humanizePlaceholderKey(key),
        placeholder: `Enter ${humanizePlaceholderKey(key).toLowerCase()}`,
        required: true,
      });
    }
  }

  for (const field of template.placeholderFields || []) {
    if (!fields.has(field.id)) {
      fields.set(field.id, {
        ...field,
        required: true,
        label: field.label || humanizePlaceholderKey(field.id),
        placeholder: field.placeholder || `Enter ${humanizePlaceholderKey(field.id).toLowerCase()}`,
      });
    }
  }

  return [...fields.values()];
}

export function buildPlaceholderValueMap(placeholderValues: Record<string, string> = {}) {
  return Object.fromEntries(
    Object.entries(placeholderValues).map(([key, value]) => [key, value ?? ""]),
  );
}

export function buildResolvedPlaceholderMap(
  placeholderValues: Record<string, string> = {},
  fallbackValues: Record<string, string> = {},
) {
  const mergedValues = { ...fallbackValues, ...placeholderValues };
  const resolvedValues = Object.fromEntries(
    Object.entries(mergedValues)
      .filter(([, value]) => isFilledPlaceholderValue(value))
      .map(([key, value]) => [key, value.trim()]),
  ) as Record<string, string>;

  const normalizedEntries = Object.entries(resolvedValues).map(([key, value]) => [
    normalizePlaceholderLookupKey(key),
    value,
  ] as const);

  for (const [alias, sources] of Object.entries(PLACEHOLDER_ALIAS_MAP)) {
    if (isFilledPlaceholderValue(resolvedValues[alias])) {
      continue;
    }

    const directSource = sources.find((source) => isFilledPlaceholderValue(resolvedValues[source]));
    if (directSource) {
      resolvedValues[alias] = resolvedValues[directSource];
      continue;
    }

    const normalizedSource = sources
      .map((source) => normalizePlaceholderLookupKey(source))
      .find((normalizedSourceKey) =>
        normalizedEntries.some(([candidateKey, candidateValue]) => candidateKey === normalizedSourceKey && isFilledPlaceholderValue(candidateValue)),
      );

    if (!normalizedSource) {
      continue;
    }

    const normalizedMatch = normalizedEntries.find(([candidateKey]) => candidateKey === normalizedSource);
    if (normalizedMatch) {
      resolvedValues[alias] = normalizedMatch[1];
    }
  }

  return resolvedValues;
}

export function replacePlaceholdersInString(input: string, placeholderValues: Record<string, string>) {
  const resolvedValues = buildResolvedPlaceholderMap(placeholderValues);
  PLACEHOLDER_PATTERN.lastIndex = 0;
  return input.replace(PLACEHOLDER_PATTERN, (_, rawKey: string) => {
    const key = rawKey.trim();
    const directValue = resolvedValues[key];
    if (directValue != null && String(directValue).trim()) {
      return String(directValue);
    }

    const normalizedKey = normalizePlaceholderLookupKey(key);
    const normalizedMatch = Object.entries(resolvedValues).find(([candidateKey, candidateValue]) => {
      if (candidateValue == null || !String(candidateValue).trim()) return false;
      const candidateNormalized = normalizePlaceholderLookupKey(candidateKey);
      return candidateNormalized === normalizedKey;
    });

    if (normalizedMatch) {
      return String(normalizedMatch[1]);
    }

    return "";
  });
}
