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
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
