"use client";

import { useMemo, useState, useTransition } from "react";
import type { Provider } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.68-.06-1.33-.17-1.95H12v3.69h5.39a4.62 4.62 0 0 1-2 3.03v2.52h3.24c1.9-1.75 2.97-4.32 2.97-7.29Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.63-2.44l-3.24-2.52c-.9.6-2.04.96-3.39.96-2.6 0-4.8-1.76-5.58-4.12H3.07v2.6A9.99 9.99 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.42 13.88A5.99 5.99 0 0 1 6.1 12c0-.65.11-1.28.32-1.88v-2.6H3.07A9.99 9.99 0 0 0 2 12c0 1.61.39 3.13 1.07 4.48l3.35-2.6Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.98c1.47 0 2.78.5 3.82 1.47l2.86-2.86C16.96 2.98 14.7 2 12 2 8.09 2 4.72 4.24 3.07 7.52l3.35 2.6C7.2 7.74 9.4 5.98 12 5.98Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M16.37 12.3c.03 3.24 2.84 4.32 2.87 4.33-.02.08-.44 1.52-1.45 3.02-.87 1.29-1.77 2.57-3.18 2.6-1.38.03-1.82-.82-3.4-.82-1.58 0-2.08.8-3.37.85-1.36.05-2.4-1.38-3.27-2.66-1.77-2.56-3.12-7.24-1.3-10.4.91-1.56 2.53-2.55 4.29-2.58 1.34-.03 2.61.9 3.43.9.82 0 2.36-1.12 3.98-.95.68.03 2.58.27 3.8 2.05-.1.06-2.27 1.32-2.24 3.66ZM14.74 3.67c.73-.89 1.22-2.12 1.09-3.35-1.06.04-2.34.7-3.1 1.58-.68.78-1.28 2.03-1.12 3.22 1.18.09 2.4-.6 3.13-1.45Z" />
    </svg>
  );
}

const providerConfig: Record<
  "google" | "apple",
  {
    label: string;
    icon: () => React.JSX.Element;
  }
> = {
  apple: { label: "Continue with Apple", icon: AppleIcon },
  google: { label: "Continue with Google", icon: GoogleIcon },
};

export function SocialAuthButtons({
  nextPath = "/dashboard",
}: {
  nextPath?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pendingProvider, setPendingProvider] = useState<Provider | null>(null);
  const [isPending, startTransition] = useTransition();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const providers: Array<Extract<Provider, "google" | "apple">> = ["google", "apple"];

  function handleOAuthSignIn(provider: Provider) {
    setError(null);
    setPendingProvider(provider);

    startTransition(async () => {
      if (!supabase) {
        setError("Supabase auth is not configured yet.");
        setPendingProvider(null);
        return;
      }

      const origin = window.location.origin;
      const redirectTo = new URL("/auth/callback", origin);
      redirectTo.searchParams.set("next", nextPath);

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectTo.toString(),
          scopes: provider === "google" ? "email profile" : undefined,
        },
      });

      if (authError) {
        setError(authError.message);
        setPendingProvider(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {providers.map((provider) => {
          const config = providerConfig[provider];
          const Icon = config.icon;
          const disabled = isPending && pendingProvider === provider;

          return (
            <Button
              key={provider}
              type="button"
              variant="outline"
              onClick={() => handleOAuthSignIn(provider)}
              disabled={disabled}
              className="h-12 justify-center rounded-[18px] border-[var(--line)] bg-white/90 text-[var(--ink)] hover:border-[rgba(109,94,248,0.24)] hover:bg-[rgba(109,94,248,0.04)]"
            >
              <Icon />
              {disabled ? `Connecting ${provider === "google" ? "Google" : "Apple"}...` : config.label}
            </Button>
          );
        })}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[var(--line)]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          <span className="bg-white px-3">Or continue with email</span>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
