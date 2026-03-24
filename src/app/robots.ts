import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/admin/*",
          "/admin-mobile",
          "/admin-mobile/",
          "/admin-mobile/*",
          "/login",
          "/api/admin/*",
          "/api/apply/*",
          "/api/image",
          "/api/auth/*",
          "/api/decap/*",
        ],
      },
    ],
    host: siteUrl,
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
