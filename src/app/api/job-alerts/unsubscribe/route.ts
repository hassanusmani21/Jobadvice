import { NextResponse } from "next/server";
import { unsubscribeJobAlertSubscription } from "@/lib/jobAlerts";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";
  const subscription = await unsubscribeJobAlertSubscription(token);
  const redirectUrl = new URL("/jobs/?alert=unsubscribed", url.origin);

  if (!subscription) {
    redirectUrl.searchParams.set("alert", "unsubscribe-missing");
  }

  return NextResponse.redirect(redirectUrl, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
