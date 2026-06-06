export type PhoneCountryOption = {
  code: string;
  label: string;
  dialCode: string;
};

export const PHONE_COUNTRY_OPTIONS: PhoneCountryOption[] = [
  { code: "US", label: "United States", dialCode: "+1" },
  { code: "CA", label: "Canada", dialCode: "+1" },
  { code: "GB", label: "United Kingdom", dialCode: "+44" },
  { code: "AU", label: "Australia", dialCode: "+61" },
  { code: "NZ", label: "New Zealand", dialCode: "+64" },
  { code: "IE", label: "Ireland", dialCode: "+353" },
  { code: "MX", label: "Mexico", dialCode: "+52" },
  { code: "BR", label: "Brazil", dialCode: "+55" },
  { code: "AR", label: "Argentina", dialCode: "+54" },
  { code: "CL", label: "Chile", dialCode: "+56" },
  { code: "CO", label: "Colombia", dialCode: "+57" },
  { code: "DE", label: "Germany", dialCode: "+49" },
  { code: "FR", label: "France", dialCode: "+33" },
  { code: "ES", label: "Spain", dialCode: "+34" },
  { code: "IT", label: "Italy", dialCode: "+39" },
  { code: "NL", label: "Netherlands", dialCode: "+31" },
  { code: "BE", label: "Belgium", dialCode: "+32" },
  { code: "SE", label: "Sweden", dialCode: "+46" },
  { code: "NO", label: "Norway", dialCode: "+47" },
  { code: "DK", label: "Denmark", dialCode: "+45" },
  { code: "FI", label: "Finland", dialCode: "+358" },
  { code: "CH", label: "Switzerland", dialCode: "+41" },
  { code: "AT", label: "Austria", dialCode: "+43" },
  { code: "PL", label: "Poland", dialCode: "+48" },
  { code: "PT", label: "Portugal", dialCode: "+351" },
  { code: "ZA", label: "South Africa", dialCode: "+27" },
  { code: "AE", label: "United Arab Emirates", dialCode: "+971" },
  { code: "SA", label: "Saudi Arabia", dialCode: "+966" },
  { code: "IN", label: "India", dialCode: "+91" },
  { code: "SG", label: "Singapore", dialCode: "+65" },
];

const phoneCountriesByLongestDialCode = [...PHONE_COUNTRY_OPTIONS].sort(
  (left, right) => right.dialCode.length - left.dialCode.length,
);

export function normalizeDialCode(value?: string | null) {
  const digits = (value || "").replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

export function sanitizePhoneLocalNumber(value?: string | null) {
  return (value || "").replace(/\D/g, "");
}

export function splitPhoneNumberForInput(rawPhone?: string | null, fallbackDialCode = "+1") {
  const normalizedFallback = normalizeDialCode(fallbackDialCode) || "+1";
  const raw = (rawPhone || "").trim();
  if (!raw) {
    return { countryCode: normalizedFallback, phoneNumber: "" };
  }

  const normalized = raw.replace(/[^\d+]/g, "");
  if (!normalized) {
    return { countryCode: normalizedFallback, phoneNumber: "" };
  }

  if (normalized.startsWith("+")) {
    const matchingCountry = phoneCountriesByLongestDialCode.find((country) => normalized.startsWith(country.dialCode));
    if (matchingCountry) {
      return {
        countryCode: matchingCountry.dialCode,
        phoneNumber: sanitizePhoneLocalNumber(normalized.slice(matchingCountry.dialCode.length)),
      };
    }

    return {
      countryCode: normalizedFallback,
      phoneNumber: sanitizePhoneLocalNumber(normalized.slice(1)),
    };
  }

  return {
    countryCode: normalizedFallback,
    phoneNumber: sanitizePhoneLocalNumber(normalized),
  };
}

export function buildInternationalPhoneNumber(countryCode?: string | null, localNumber?: string | null) {
  const normalizedCountryCode = normalizeDialCode(countryCode) || "+1";
  const digits = sanitizePhoneLocalNumber(localNumber);
  if (!digits) return "";

  if (normalizedCountryCode === "+1" && digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return `${normalizedCountryCode}${digits}`;
}

export function isValidInternationalPhoneNumber(phone: string) {
  return /^\+\d{10,15}$/.test(phone);
}
