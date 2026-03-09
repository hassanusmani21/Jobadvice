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
