import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MobileAdminApp from "./MobileAdminApp";
import { getAllowedAdminSession } from "@/lib/adminSession";
import { isAdminCollection, type AdminCollection } from "@/lib/adminMobile";

type AdminMobilePageProps = {
  searchParams?: {
    collection?: string | string[];
    slug?: string | string[];
  };
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mobile Admin",
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
  const session = await getAllowedAdminSession();

  if (!session) {
    redirect("/admin/login?callbackUrl=/admin-mobile");
  }

  const collectionValue = getSingleSearchParam(searchParams?.collection);
  const initialCollection: AdminCollection = isAdminCollection(collectionValue)
    ? collectionValue
    : "jobs";
  const initialSlug = getSingleSearchParam(searchParams?.slug).trim();

  return (
    <MobileAdminApp
      adminEmail={session.user?.email || ""}
      initialCollection={initialCollection}
      initialSlug={initialSlug}
    />
  );
}
