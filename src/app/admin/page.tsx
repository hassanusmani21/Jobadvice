import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminMobileThemeLock from "../admin-mobile/AdminMobileThemeLock";
import MobileAdminApp from "../admin-mobile/MobileAdminApp";
import { isAdminContentWriteConfigured } from "@/lib/adminContentStore";
import { getAllowedAdminSession } from "@/lib/adminSession";
import { isAdminCollection, type AdminCollection } from "@/lib/adminMobile";

type AdminPageProps = {
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

const adminShellStyles = `
  body:has([data-admin-mobile-root]) {
    background:
      radial-gradient(circle at top left, rgba(13, 148, 136, 0.18), transparent 28rem),
      linear-gradient(180deg, #eef4f2 0%, #f7f8fb 42%, #eef2f7 100%);
  }

  body:has([data-admin-mobile-root]) .route-progress-indicator,
  body:has([data-admin-mobile-root]) .site-grid > header,
  body:has([data-admin-mobile-root]) .site-grid > footer,
  body:has([data-admin-mobile-root]) .site-grid > .site-glow {
    display: none !important;
  }

  body:has([data-admin-mobile-root]) .site-grid {
    min-height: 100dvh;
  }

  body:has([data-admin-mobile-root]) .site-grid > main {
    width: 100%;
    max-width: none;
    padding: 0;
    margin: 0;
  }
`;

const getSingleSearchParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] || "" : value || "";

const buildAdminCallbackUrl = (collection: string, slug: string) => {
  const params = new URLSearchParams();

  if (isAdminCollection(collection)) {
    params.set("collection", collection);
  }

  if (slug) {
    params.set("slug", slug);
  }

  const query = params.toString();
  return query ? `/admin?${query}` : "/admin";
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const collectionValue = getSingleSearchParam(searchParams?.collection);
  const initialCollection: AdminCollection = isAdminCollection(collectionValue)
    ? collectionValue
    : "jobs";
  const initialSlug = getSingleSearchParam(searchParams?.slug).trim();
  const session = await getAllowedAdminSession();

  if (!session) {
    redirect(
      `/admin/login?callbackUrl=${encodeURIComponent(
        buildAdminCallbackUrl(collectionValue, initialSlug),
      )}`,
    );
  }

  return (
    <>
      <AdminMobileThemeLock />
      <style dangerouslySetInnerHTML={{ __html: adminShellStyles }} />
      <MobileAdminApp
        adminEmail={session.user?.email || ""}
        initialCollection={initialCollection}
        initialSlug={initialSlug}
        mobilePublishingReady={isAdminContentWriteConfigured()}
        adminBasePath="/admin"
      />
    </>
  );
}
