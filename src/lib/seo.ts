import type { Metadata } from "next";
import { siteLogoUrl, siteName, siteUrl } from "@/lib/site";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  type?: "website" | "article";
  image?: string;
  noIndex?: boolean;
  follow?: boolean;
};

export const absoluteUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${normalizedPath}`;
};

export const createPageMetadata = ({
  title,
  description,
  path,
  keywords = [],
  type = "website",
  image = siteLogoUrl,
  noIndex = false,
  follow = true,
}: PageMetadataInput): Metadata => {
  const canonicalPath = path.endsWith("/") ? path : `${path}/`;
  const canonicalUrl = absoluteUrl(canonicalPath);

  return {
    title,
    description,
    ...(keywords.length > 0 ? { keywords } : {}),
    alternates: {
      canonical: canonicalPath,
    },
    robots: {
      index: !noIndex,
      follow,
      googleBot: {
        index: !noIndex,
        follow,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName,
      type,
      images: [
        {
          url: image,
          alt: `${siteName} preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
};

export const noIndexFollowRobots = {
  index: false,
  follow: true,
  googleBot: {
    index: false,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
} satisfies Metadata["robots"];
