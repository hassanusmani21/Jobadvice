import type { Metadata } from "next";
import AdminLogoutClient from "./AdminLogoutClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Logout",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLogoutPage() {
  return <AdminLogoutClient />;
}
