import { filterAdminJobRecordsByDate, getAdminJobRecords } from "@/lib/adminJobs";
import { requireAdminApiRequest } from "@/lib/adminSession";
import { noStoreJson } from "@/lib/requestSecurity";

const isValidIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const toIsoDateString = (dateValue: Date) => dateValue.toISOString().split("T")[0];

const resolveRelativeDateRange = (days: number) => {
  const normalizedDays = Math.max(1, Math.min(days, 365));
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - (normalizedDays - 1));

  return {
    fromDate: toIsoDateString(startDate),
    toDate: toIsoDateString(endDate),
  };
};

export async function GET(request: Request) {
  const authError = await requireAdminApiRequest(request);
  if (authError) {
    return authError;
  }

  const requestUrl = new URL(request.url);
  const fromDateParam = String(requestUrl.searchParams.get("from") || "").trim();
  const toDateParam = String(requestUrl.searchParams.get("to") || "").trim();
  const daysParam = Number.parseInt(
    String(requestUrl.searchParams.get("days") || "").trim(),
    10,
  );

  const records = await getAdminJobRecords();

  let fromDate = fromDateParam;
  let toDate = toDateParam;

  if ((!fromDate || !toDate) && Number.isFinite(daysParam) && daysParam > 0) {
    const relativeRange = resolveRelativeDateRange(daysParam);
    fromDate = relativeRange.fromDate;
    toDate = relativeRange.toDate;
  }

  if (!fromDate && !toDate) {
    return noStoreJson({
      success: true,
      total: records.length,
      records,
    });
  }

  if (!isValidIsoDate(fromDate) || !isValidIsoDate(toDate)) {
    return noStoreJson(
      {
        success: false,
        error: "Invalid date range. Use YYYY-MM-DD for both from and to.",
      },
      { status: 400 },
    );
  }

  const filteredRecords = filterAdminJobRecordsByDate(records, fromDate, toDate);

  return noStoreJson({
    success: true,
    fromDate,
    toDate,
    total: filteredRecords.length,
    records: filteredRecords,
  });
}
