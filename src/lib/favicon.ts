/** Favicon del dominio vía servicio público (sin storage propio). */
export function faviconFromUrl(pageUrl: string): string {
  try {
    const host = new URL(pageUrl).hostname;
    if (!host) return '';
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
  } catch {
    return '';
  }
}

/** Icono custom si existe; si no, favicon automático de la URL. */
export function resolveLinkIcon(
  iconUrl: string | null | undefined,
  pageUrl: string,
): string {
  const custom = iconUrl?.trim();
  if (custom) return custom;
  return faviconFromUrl(pageUrl);
}
