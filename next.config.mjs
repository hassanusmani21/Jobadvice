/** @type {import('next').NextConfig} */
const isStaticExport = process.env.NEXT_OUTPUT_EXPORT === "true";
const isDevelopment = process.env.NODE_ENV !== "production";
const resolveDeploymentId = () => {
  const rawValue =
    process.env.DEPLOY_ID ||
    process.env.BUILD_ID ||
    process.env.COMMIT_REF ||
    "";

  const sanitizedValue = rawValue.replace(/[^A-Za-z0-9_-]/g, "");
  return sanitizedValue || undefined;
};

const deploymentId = !isDevelopment ? resolveDeploymentId() : undefined;

if (!isDevelopment && !isStaticExport && !deploymentId) {
  console.warn(
    "[next.config] No deployment ID detected. Deploy-skew protection will be weaker for this build.",
  );
}

const connectSrc = [
  "'self'",
  "https://identity.netlify.com",
  "https://api.github.com",
  "https://github.com",
  ...(isDevelopment
    ? ["http://localhost:8081", "http://127.0.0.1:8081"]
    : []),
].join(" ");
const scriptSrc = isDevelopment
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net https://identity.netlify.com"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net https://identity.netlify.com";
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  `connect-src ${connectSrc}`,
  "frame-src https://accounts.google.com",
  "form-action 'self' https://accounts.google.com",
  "manifest-src 'self'",
  "media-src 'self'",
  "worker-src 'self' blob:",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
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
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "off",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "unsafe-none",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
  {
    key: "Origin-Agent-Cluster",
    value: "?1",
  },
  ...(!isDevelopment
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];
const noStoreHeaders = [
  {
    key: "Cache-Control",
    value: "no-store, no-cache, must-revalidate, max-age=0",
  },
];

const publicNoStoreSources = [
  "/",
  "/about",
  "/blog",
  "/blog/:path*",
  "/contact",
  "/jobs",
  "/jobs/:path*",
  "/login",
  "/privacy-policy",
];

const nextConfig = {
  output: isStaticExport ? "export" : undefined,
  ...(deploymentId ? { deploymentId } : {}),
  poweredByHeader: false,
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "trainings.internshala.com",
      },
    ],
  },
  async redirects() {
    if (isStaticExport) {
      return [];
    }

    return [
      {
        source: "/blog/title",
        destination: "/blog/tcs-nqt-2026-preparation-strategy-for-freshers/",
        permanent: true,
      },
      {
        source: "/blog/title/",
        destination: "/blog/tcs-nqt-2026-preparation-strategy-for-freshers/",
        permanent: true,
      },
      {
        source: "/jobs/ai-developer-intern",
        destination: "/jobs/intern-machine-learning-gen-ai/",
        permanent: true,
      },
      {
        source: "/jobs/ai-developer-intern/",
        destination: "/jobs/intern-machine-learning-gen-ai/",
        permanent: true,
      },
    ];
  },
  async headers() {
    if (isStaticExport) {
      return [];
    }

    return [
      ...publicNoStoreSources.map((source) => ({
        source,
        headers: noStoreHeaders,
      })),
      {
        source: "/admin",
        headers: [...noStoreHeaders],
      },
      {
        source: "/admin/:path*",
        headers: [...noStoreHeaders],
      },
      {
        source: "/api/admin/:path*",
        headers: noStoreHeaders,
      },
      {
        source: "/api/auth/:path*",
        headers: noStoreHeaders,
      },
      {
        source: "/api/decap/:path*",
        headers: noStoreHeaders,
      },
      {
        source: "/(.*)",
        headers: securityHeaders,
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
