import { getLearnDraftRecords, upsertLearnDraft } from "@/lib/learn/persistence";
import { requireApiUser } from "@/lib/auth/guards";
import { noStoreJson } from "@/lib/requestSecurity";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authResult = await requireApiUser(request);
  if (authResult.response) {
    return authResult.response;
  }

  try {
    const records = await getLearnDraftRecords(authResult.session.user.id);

    return noStoreJson({
      success: true,
      records,
    });
  } catch (error) {
    console.error("[learn/drafts] Unable to load drafts:", error);
    return noStoreJson(
      {
        success: false,
        error: "Unable to load drafts.",
      },
      { status: 500 },
    );
  }
}

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
    const record = await upsertLearnDraft(
      authResult.session.user.id,
      payload as Parameters<typeof upsertLearnDraft>[1],
    );

    if (!record) {
      return noStoreJson(
        {
          success: false,
          error: "Invalid draft payload.",
        },
        { status: 400 },
      );
    }

    return noStoreJson({
      success: true,
      record,
    });
  } catch (error) {
    console.error("[learn/drafts] Unable to save draft:", error);
    return noStoreJson(
      {
        success: false,
        error: "Unable to save draft.",
      },
      { status: 500 },
    );
  }
}
