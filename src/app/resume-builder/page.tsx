import type { Metadata } from "next";
import ResumeBuilderClient from "@/components/ResumeBuilderClient";

export const metadata: Metadata = {
  title: "ATS Resume Builder",
  description:
    "Build an ATS-friendly resume with multiple templates, live preview, keyword checks, and print-to-PDF export.",
  alternates: {
    canonical: "/resume-builder/",
  },
};

export default function ResumeBuilderPage() {
  return <ResumeBuilderClient />;
}
