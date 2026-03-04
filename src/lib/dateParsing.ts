const monthNameToNumber: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

type DateParsingOptions = {
  preferDayFirst?: boolean;
};

const normalizeYear = (value: number) => (value < 100 ? value + 2000 : value);

const toValidatedIsoDate = (year: number, month: number, day: number) => {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return "";
  }

  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return "";
  }

  return parsedDate.toISOString().split("T")[0];
};

const parseNumericDate = (
  firstPart: string,
  secondPart: string,
  thirdPart: string,
  preferDayFirst: boolean,
) => {
  const first = Number.parseInt(firstPart, 10);
  const second = Number.parseInt(secondPart, 10);
  const year = normalizeYear(Number.parseInt(thirdPart, 10));

  if (
    Number.isNaN(first) ||
    Number.isNaN(second) ||
    Number.isNaN(year)
  ) {
    return "";
  }

  if (first > 12 && second <= 12) {
    return toValidatedIsoDate(year, second, first);
  }

  if (second > 12 && first <= 12) {
    return toValidatedIsoDate(year, first, second);
  }

  if (preferDayFirst) {
    return toValidatedIsoDate(year, second, first);
  }

  return toValidatedIsoDate(year, first, second);
};

const parseTextMonthDate = (value: string) => {
  const dayFirstMatch = value.match(
    /^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s*,?\s*(\d{2,4})$/i,
  );
  if (dayFirstMatch) {
    const day = Number.parseInt(dayFirstMatch[1], 10);
    const month = monthNameToNumber[dayFirstMatch[2].toLowerCase()];
    const year = normalizeYear(Number.parseInt(dayFirstMatch[3], 10));

    return month ? toValidatedIsoDate(year, month, day) : "";
  }

  const monthFirstMatch = value.match(
    /^([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?[,]?\s+(\d{2,4})$/i,
  );
  if (!monthFirstMatch) {
    return "";
  }

  const month = monthNameToNumber[monthFirstMatch[1].toLowerCase()];
  const day = Number.parseInt(monthFirstMatch[2], 10);
  const year = normalizeYear(Number.parseInt(monthFirstMatch[3], 10));

  return month ? toValidatedIsoDate(year, month, day) : "";
};

export const toIsoDateString = (
  value: unknown,
  options: DateParsingOptions = {},
) => {
  if (typeof value !== "string") {
    return "";
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "";
  }

  const preferDayFirst = options.preferDayFirst !== false;
  const isoDateMatch = trimmedValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoDateMatch) {
    return toValidatedIsoDate(
      Number.parseInt(isoDateMatch[1], 10),
      Number.parseInt(isoDateMatch[2], 10),
      Number.parseInt(isoDateMatch[3], 10),
    );
  }

  const isoDateTimeMatch = trimmedValue.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)$/,
  );
  if (isoDateTimeMatch) {
    return toValidatedIsoDate(
      Number.parseInt(isoDateTimeMatch[1], 10),
      Number.parseInt(isoDateTimeMatch[2], 10),
      Number.parseInt(isoDateTimeMatch[3], 10),
    );
  }

  const yearFirstNumericMatch = trimmedValue.match(
    /^(\d{4})[\/.](\d{1,2})[\/.](\d{1,2})$/,
  );
  if (yearFirstNumericMatch) {
    return toValidatedIsoDate(
      Number.parseInt(yearFirstNumericMatch[1], 10),
      Number.parseInt(yearFirstNumericMatch[2], 10),
      Number.parseInt(yearFirstNumericMatch[3], 10),
    );
  }

  const numericDateMatch = trimmedValue.match(
    /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/,
  );
  if (numericDateMatch) {
    return parseNumericDate(
      numericDateMatch[1],
      numericDateMatch[2],
      numericDateMatch[3],
      preferDayFirst,
    );
  }

  return parseTextMonthDate(trimmedValue);
};

export const extractIsoDatesFromText = (
  value: string,
  options: DateParsingOptions = {},
) => {
  const matches = new Set<string>();
  const patterns = [
    /\b\d{4}-\d{1,2}-\d{1,2}(?:[T\s][^\s]+)?\b/g,
    /\b\d{4}\/\d{1,2}\/\d{1,2}\b/g,
    /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/g,
    /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+\d{2,4}\b/gi,
    /\b(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+\d{1,2}(?:st|nd|rd|th)?[,]?\s+\d{2,4}\b/gi,
  ];

  for (const pattern of patterns) {
    const matchesForPattern = value.match(pattern) || [];
    for (const rawMatch of matchesForPattern) {
      const normalizedDate = toIsoDateString(rawMatch, options);
      if (normalizedDate) {
        matches.add(normalizedDate);
      }
    }
  }

  return matches;
};
