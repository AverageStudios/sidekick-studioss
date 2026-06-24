import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseImageHostname = supabaseUrl ? new URL(supabaseUrl).hostname : null;
const isDevelopment = process.env.NODE_ENV !== "production";

function readOrigin(value: string | undefined) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function buildContentSecurityPolicy() {
  const supabaseOrigin = readOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL) || "https://vgkrgqqspbjkwupqratd.supabase.co";
  const appOrigin = readOrigin(process.env.NEXT_PUBLIC_APP_URL) || "https://sidekickstudioss.com";

  const directives: Array<[string, string[]]> = [
    ["default-src", ["'self'"]],
    [
      "script-src",
      [
        "'self'",
        "'unsafe-inline'",
        ...(isDevelopment ? ["'unsafe-eval'"] : []),
      ],
    ],
    ["style-src", ["'self'", "'unsafe-inline'"]],
    ["img-src", ["'self'", "data:", "blob:", supabaseOrigin, "https://graph.facebook.com", "https://*.fbcdn.net", "https://lh3.googleusercontent.com"]],
    ["font-src", ["'self'", "data:"]],
    ["media-src", ["'self'", "blob:", "data:", supabaseOrigin]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'", supabaseOrigin]],
    ["frame-ancestors", ["'none'"]],
    [
      "connect-src",
      [
        "'self'",
        appOrigin,
        supabaseOrigin,
        supabaseOrigin.replace("https://", "wss://"),
        "https://www.facebook.com",
        "https://graph.facebook.com",
        "https://services.leadconnectorhq.com",
        "https://api.hubapi.com",
        "https://nominatim.openstreetmap.org",
        ...(isDevelopment ? ["http://localhost:*", "http://127.0.0.1:*", "ws://localhost:*", "ws://127.0.0.1:*"] : []),
      ],
    ],
    ["frame-src", ["'self'", "https://www.facebook.com", "https://*.facebook.com"]],
    ["worker-src", ["'self'", "blob:"]],
    ["manifest-src", ["'self'"]],
    ...(isDevelopment ? [] : ([["upgrade-insecure-requests", []]] as Array<[string, string[]]>)),
  ];

  return directives
    .map((directive) => {
      const [name, values] = directive;
      return `${name} ${(Array.isArray(values) ? values : []).join(" ")}`.trim();
    })
    .join("; ");
}

// Relaxed CSP scoped ONLY to the standalone marketing funnel at /funnel(.html).
// The funnel is a self-contained static page that loads the Tailwind Play CDN,
// Google Fonts, and (when you swap them in) a Calendly embed + video iframe.
// Keeping this separate means the rest of the app keeps its strict CSP.
function buildFunnelContentSecurityPolicy() {
  const directives: Array<[string, string[]]> = [
    ["default-src", ["'self'"]],
    [
      "script-src",
      [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'", // Tailwind Play CDN compiles styles in-browser
        "https://cdn.tailwindcss.com",
        "https://assets.calendly.com",
      ],
    ],
    ["style-src", ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://assets.calendly.com"]],
    ["font-src", ["'self'", "data:", "https://fonts.gstatic.com"]],
    ["img-src", ["'self'", "data:", "blob:", "https:"]],
    ["media-src", ["'self'", "blob:", "data:", "https:"]],
    [
      "frame-src",
      [
        "'self'",
        "https://calendly.com",
        "https://*.calendly.com",
        "https://www.youtube.com",
        "https://www.youtube-nocookie.com",
        "https://player.vimeo.com",
        "https://fast.wistia.net",
        "https://*.wistia.com",
      ],
    ],
    ["connect-src", ["'self'", "https://calendly.com", "https://*.calendly.com"]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
    ["frame-ancestors", ["'none'"]],
    ...(isDevelopment ? [] : ([["upgrade-insecure-requests", []]] as Array<[string, string[]]>)),
  ];

  return directives
    .map(([name, values]) => `${name} ${(Array.isArray(values) ? values : []).join(" ")}`.trim())
    .join("; ");
}

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: buildContentSecurityPolicy(),
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=(), interest-cohort=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-site",
  },
  ...(!isDevelopment
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        },
      ]
    : []),
];

// Same hardening headers as the rest of the app, but with the funnel-scoped CSP.
const funnelSecurityHeaders = securityHeaders.map((header) =>
  header.key === "Content-Security-Policy"
    ? { key: header.key, value: buildFunnelContentSecurityPolicy() }
    : header,
);

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: supabaseImageHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseImageHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  async headers() {
    return [
      // The standalone static VSL page (public/funnel.html, reachable at
      // /funnel.html) gets its own relaxed CSP for the Tailwind CDN, Google
      // Fonts, and embeds. The /funnel React page below keeps the strict app CSP.
      {
        source: "/funnel.html",
        headers: funnelSecurityHeaders,
      },
      // Everything else (including the /funnel React route) keeps the strict CSP.
      {
        source: "/((?!funnel\\.html).*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
