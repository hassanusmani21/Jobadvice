import { NextResponse, type NextRequest } from "next/server";
import { getJobBySlug } from "@/lib/jobs";

export const dynamic = "force-dynamic";

type ApplyRouteContext = {
  params: {
    slug: string;
  };
};

const withTrackingParams = (urlString: string, slug: string) => {
  const url = new URL(urlString);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Unsupported apply URL protocol");
  }

  if (!url.searchParams.has("utm_source")) {
    url.searchParams.set("utm_source", "jobadvice");
  }

  if (!url.searchParams.has("utm_medium")) {
    url.searchParams.set("utm_medium", "referral");
  }

  if (!url.searchParams.has("utm_campaign")) {
    url.searchParams.set("utm_campaign", "job_listing");
  }

  if (!url.searchParams.has("utm_content")) {
    url.searchParams.set("utm_content", slug);
  }

  return url;
};

export async function GET(request: NextRequest, context: ApplyRouteContext) {
  const { slug } = context.params;
  const job = await getJobBySlug(slug);

  if (!job || !job.applyLink) {
    return NextResponse.redirect(new URL(`/jobs/${slug}`, request.url));
  }

  try {
    const destinationUrl = withTrackingParams(job.applyLink, slug);

    console.info(
      JSON.stringify({
        event: "job_apply_click",
        slug,
        destination: destinationUrl.toString(),
        timestamp: new Date().toISOString(),
      }),
    );

    return NextResponse.redirect(destinationUrl);
  } catch {
    return NextResponse.redirect(new URL(`/jobs/${slug}`, request.url));
  }
}
