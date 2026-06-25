import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.flutterwave.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.flutterwave.com",
      "font-src 'self' data: https://fonts.gstatic.com https://*.flutterwave.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.flutterwave.com",
      "frame-src 'self' https://*.flutterwave.com",
      "frame-ancestors 'self' https://*.flutterwave.com",
      "worker-src 'self' blob:",
      "child-src 'self' blob: https://*.flutterwave.com",
      "form-action 'self' https://*.flutterwave.com",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcrypt"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
