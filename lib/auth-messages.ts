export function formatAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid email")) {
    return "Enter a valid email address.";
  }

  if (normalized.includes("expected string to have >=6 characters")) {
    return "Use a password with at least 6 characters.";
  }

  if (normalized.includes("expected string")) {
    return "Enter your email and password to continue.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "That email and password combination didn’t match an account.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }

  if (normalized.includes("user already registered")) {
    return "That email is already in use. Try signing in instead.";
  }

  if (normalized.includes("password should be at least")) {
    return "Use a password with at least 6 characters.";
  }

  if (normalized.includes("signup is disabled")) {
    return "Account creation is currently unavailable.";
  }

  return message;
}

export const authSuccessMessages = {
  signedOut: "You’ve been signed out.",
  confirmed: "Email confirmed. You can sign in now.",
} as const;
