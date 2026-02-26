/** @type {import('next').NextConfig} */
const isStaticExport = process.env.NEXT_OUTPUT_EXPORT === "true";
const isDevelopment = process.env.NODE_ENV !== "production";
const scriptSrc = isDevelopment
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net https://identity.netlify.com"
  : "script-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net https://identity.netlify.com";
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://identity.netlify.com http://localhost:8081 http://127.0.0.1:8081",
  "frame-src https://accounts.google.com",
  "form-action 'self' https://accounts.google.com",
].join("; ");

const nextConfig = {
  output: isStaticExport ? "export" : undefined,
  poweredByHeader: false,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  async headers() {
    if (isStaticExport) {
      return [];
    }

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
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
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  async rewrites() {
    if (isStaticExport) {
      return [];
    }

    return [
      {
        source: "/admin",
        destination: "/admin/index.html",
      },
      {
        source: "/admin/",
        destination: "/admin/index.html",
      },
    ];
  },
};

export default nextConfig;
