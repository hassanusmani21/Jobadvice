import { NextResponse } from "next/server";
import {
  buildJobAlertSuccessMessage,
  JobAlertConfigurationError,
  JobAlertValidationError,
  createJobAlertSubscription,
  sendJobAlertWelcomeEmail,
} from "@/lib/jobAlerts";
import type { JobAlertFilters } from "@/lib/jobFilters";

export const dynamic = "force-dynamic";

type JobAlertsRouteBody = {
  email?: string;
  filters?: Partial<JobAlertFilters>;
  name?: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as JobAlertsRouteBody;
    const result = await createJobAlertSubscription(
      typeof payload.email === "string" ? payload.email : "",
      payload.filters || {},
      typeof payload.name === "string" ? payload.name : "",
    );
    let welcomeEmailSent = false;

    if (result.status !== "already_subscribed") {
      try {
        await sendJobAlertWelcomeEmail(result.subscription);
        welcomeEmailSent = true;
      } catch (error) {
        console.error("[job-alerts] Welcome email send failed", error);
      }
    }

    return NextResponse.json(
      {
        message:
          buildJobAlertSuccessMessage(result) +
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
