export function resolvePublicReturnTo(
  value: string | null | undefined,
  fallback = "/"
): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return fallback;
  }

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  return trimmed;
}

export function appendPublicReturnTo(basePath: string, returnTo: string): string {
  if (!returnTo || returnTo === "/") {
    return basePath;
  }

  const separator = basePath.includes("?") ? "&" : "?";
  return `${basePath}${separator}returnTo=${encodeURIComponent(returnTo)}`;
}
