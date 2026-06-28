import { getSafeRelativePath } from "@/lib/safe-redirect";

export const CHECKOUT_AUTH_INTENT = "checkout";

export function isCheckoutAuthIntent(value: string | null | undefined) {
  return value === CHECKOUT_AUTH_INTENT;
}

export function getSafeAuthNextValue(value: string | null | undefined) {
  if (isCheckoutAuthIntent(value)) {
    return CHECKOUT_AUTH_INTENT;
  }

  return getSafeRelativePath(value, "/dashboard");
}

export function resolvePostAuthDestination(value: string | null | undefined) {
  if (isCheckoutAuthIntent(value)) {
    return "/dashboard";
  }

  return getSafeAuthNextValue(value);
}
