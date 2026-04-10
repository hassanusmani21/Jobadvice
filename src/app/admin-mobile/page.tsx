import type { Metadata } from "next";
import { redirect } from "next/navigation";

type AdminMobilePageProps = {
  searchParams?: {
    collection?: string | string[];
    slug?: string | string[];
  };
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
  },
};

const getSingleSearchParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] || "" : value || "";

export default async function AdminMobilePage({
  searchParams,
}: AdminMobilePageProps) {
  const params = new URLSearchParams();
  const collectionValue = getSingleSearchParam(searchParams?.collection).trim();
  const slugValue = getSingleSearchParam(searchParams?.slug).trim();

  if (collectionValue) {
    params.set("collection", collectionValue);
  }

  if (slugValue) {
    params.set("slug", slugValue);
  }

  const query = params.toString();
  redirect(query ? `/admin?${query}` : "/admin");
}
