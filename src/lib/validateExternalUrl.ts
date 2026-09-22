/**
 * Only http(s) URLs may ever be rendered as an outbound link. Guards
 * against javascript:/data: URI injection even though booking URLs are
 * already schema-validated upstream — this is the last line of defense
 * before something becomes a clickable href.
 */
export function isSafeExternalUrl(url: string | undefined): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
