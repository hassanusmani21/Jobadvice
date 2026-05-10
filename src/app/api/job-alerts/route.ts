import { NextResponse } from "next/server";
import {
  buildJobAlertSuccessMessage,
  JobAlertConfigurationError,
  JobAlertValidationError,
  createJobAlertSubscription,
  markJobAlertWelcomeEmailSent,
  sendJobAlertWelcomeEmail,
} from "@/lib/jobAlerts";
import type { JobAlertFilters } from "@/lib/jobFilters";
import { isJobSegmentSlug } from "@/lib/jobSegments";

export const dynamic = "force-dynamic";

type JobAlertsRouteBody = {
  email?: string;
  filters?: Partial<JobAlertFilters>;
  jobTitles?: string[];
  skills?: string[];
  category?: string;
  name?: string;
  timeZone?: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as JobAlertsRouteBody;
    const filters =
      payload.filters ||
      ({
        jobTitles: Array.isArray(payload.jobTitles) ? payload.jobTitles : [],
        skills: Array.isArray(payload.skills) ? payload.skills : [],
        segments:
          typeof payload.category === "string" && isJobSegmentSlug(payload.category)
            ? [payload.category]
            : [],
      } satisfies Partial<JobAlertFilters>);
    const result = await createJobAlertSubscription(
      typeof payload.email === "string" ? payload.email : "",
      filters,
      typeof payload.name === "string" ? payload.name : "",
      typeof payload.timeZone === "string" ? payload.timeZone : "",
    );
    const shouldSendWelcomeEmail =
      result.status !== "already_subscribed" || result.subscription.welcomeEmailSentAt === null;
    let nextSubscription = result.subscription;
    let welcomeEmailSent = false;

    if (shouldSendWelcomeEmail) {
      try {
        const emailResult = await sendJobAlertWelcomeEmail(nextSubscription);
        nextSubscription = await markJobAlertWelcomeEmailSent(nextSubscription);
        welcomeEmailSent = true;
        if (emailResult.id) {
          console.info("[job-alerts] Welcome email queued", {
            emailId: emailResult.id,
            subscription: nextSubscription.signature,
          });
        }
      } catch (error) {
        console.error("[job-alerts] Welcome email send failed", error);

        return NextResponse.json(
          {
            message:
              "We saved your alert, but couldn't send the confirmation email right now. Please try again in a moment.",
            status: result.status,
          },
          {
            status: 502,
          },
        );
      }
    }

    return NextResponse.json(
      {
        message:
          buildJobAlertSuccessMessage({
            ...result,
            subscription: nextSubscription,
          }) +
          (welcomeEmailSent ? " Check your inbox for the welcome email." : ""),
        status: result.status,
      },
      {
        status: result.status === "created" ? 201 : 200,
      },
    );
  } catch (error) {
    if (error instanceof JobAlertValidationError) {
      return NextResponse.json(
        {
          message: error.message,
        },
        {
          status: 400,
        },
      );
    }

    console.error("[job-alerts] Failed to create alert", error);

    if (error instanceof JobAlertConfigurationError) {
      return NextResponse.json(
        {
          message: "Job alerts are temporarily unavailable. Please try again shortly.",
        },
        {
          status: 503,
        },
      );
    }

    return NextResponse.json(
      {
        message: "Unable to create the alert right now. Please try again shortly.",
      },
      {
        status: 500,
      },
    );
  }
}
