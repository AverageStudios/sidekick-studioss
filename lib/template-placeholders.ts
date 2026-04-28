import { TemplatePlaceholderField, TemplateSeed } from "@/types";

const PLACEHOLDER_PATTERN = /\{\{\s*([^{}]+?)\s*\}\}/g;

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

export function replacePlaceholdersInString(input: string, placeholderValues: Record<string, string>) {
  PLACEHOLDER_PATTERN.lastIndex = 0;
  return input.replace(PLACEHOLDER_PATTERN, (_, rawKey: string) => {
    const key = rawKey.trim();
    return placeholderValues[key] ?? "";
  });
}

