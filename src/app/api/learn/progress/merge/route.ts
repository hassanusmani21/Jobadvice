import { mergeGuestLearnState } from "@/lib/learn/persistence";
import { requireApiUser } from "@/lib/auth/guards";
import { noStoreJson } from "@/lib/requestSecurity";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authResult = await requireApiUser(request);
  if (authResult.response) {
    return authResult.response;
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return noStoreJson(
      {
        success: false,
        error: "Invalid JSON body.",
      },
      { status: 400 },
    );
  }

  try {
    const mergeResult = await mergeGuestLearnState(
      authResult.session.user.id,
      payload as Parameters<typeof mergeGuestLearnState>[1],
    );

    return noStoreJson({
      success: true,
      ...mergeResult,
    });
  } catch (error) {
    console.error("[learn/progress/merge] Unable to merge guest learn state:", error);
    return noStoreJson(
      {
        success: false,
        error: "Unable to merge guest learning data.",
      },
      { status: 500 },
    );
  }
}
