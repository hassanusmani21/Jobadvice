const encodedRemoteImagePrefix = "/api/image?url=";

const hasProtocol = (value: string) => /^https?:\/\//i.test(value);

export const toDisplayImageSrc = (value: string | undefined) => {
  const normalizedValue = typeof value === "string" ? value.trim() : "";
  if (!normalizedValue) {
    return "";
  }

  if (!hasProtocol(normalizedValue)) {
    return normalizedValue;
  }

  return `${encodedRemoteImagePrefix}${encodeURIComponent(normalizedValue)}`;
};

export const isLikelyUnstableImageHost = (value: string | undefined) => {
  const normalizedValue = typeof value === "string" ? value.trim() : "";
  if (!normalizedValue || !hasProtocol(normalizedValue)) {
    return false;
  }

  try {
    const hostname = new URL(normalizedValue).hostname.replace(/^www\./, "");
    return [
      "google.com",
      "images.google.com",
      "linkedin.com",
      "media.licdn.com",
      "licdn.com",
    ].includes(hostname);
  } catch {
    return false;
  }
};
