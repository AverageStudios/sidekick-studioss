const controlCharacterPattern = /[\u0000-\u001F\u007F]/;

function decodePathCandidate(value: string) {
  let decoded = value;
  for (let index = 0; index < 2; index += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
}

function isUnsafeRelativePath(value: string) {
  const decoded = decodePathCandidate(value);
  return (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    controlCharacterPattern.test(value) ||
    decoded.startsWith("//") ||
    decoded.includes("\\") ||
    controlCharacterPattern.test(decoded)
  );
}

export function getSafeRelativePath(value: unknown, fallback = "/dashboard") {
  if (typeof value !== "string") return fallback;

  const trimmed = value.trim();
  if (isUnsafeRelativePath(trimmed)) return fallback;

  return trimmed;
}
