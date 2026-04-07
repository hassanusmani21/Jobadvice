import { getLearnProgressRecords, upsertLearnProgress } from "@/lib/learn/persistence";
import { requireApiUser } from "@/lib/auth/guards";
import { noStoreJson } from "@/lib/requestSecurity";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authResult = await requireApiUser(request);
  if (authResult.response) {
    return authResult.response;
  }

  try {
    const records = await getLearnProgressRecords(authResult.session.user.id);

    return noStoreJson({
      success: true,
      records,
    });
  } catch (error) {
    console.error("[learn/progress] Unable to load progress records:", error);
    return noStoreJson(
      {
        success: false,
        error: "Unable to load progress records.",
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
    const record = await upsertLearnProgress(
      authResult.session.user.id,
      payload as Parameters<typeof upsertLearnProgress>[1],
    );

    if (!record) {
      return noStoreJson(
        {
          success: false,
          error: "Invalid progress payload.",
        },
        { status: 400 },
      );
    }

    return noStoreJson({
      success: true,
      record,
    });
  } catch (error) {
    console.error("[learn/progress] Unable to save progress:", error);
    return noStoreJson(
      {
        success: false,
        error: "Unable to save progress.",
      },
      { status: 500 },
    );
  }
}
