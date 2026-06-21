export const CHECKOUT_AUTH_INTENT = "checkout";

export function isCheckoutAuthIntent(value: string | null | undefined) {
  return value === CHECKOUT_AUTH_INTENT;
}

export function getSafeAuthNextValue(value: string | null | undefined) {
  if (isCheckoutAuthIntent(value)) {
    return CHECKOUT_AUTH_INTENT;
  }

  if (typeof value === "string" && value.startsWith("/")) {
    return value;
  }

  return "/dashboard";
}

export function resolvePostAuthDestination(value: string | null | undefined) {
  if (isCheckoutAuthIntent(value)) {
    return "/pricing?startTrial=1";
  }

  return getSafeAuthNextValue(value);
}
