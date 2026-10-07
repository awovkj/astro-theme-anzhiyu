/** Resolve local assets/routes without double-prefixing a deployment subpath.
 * Normalize browser-ignored control characters before checking URL schemes.
 */
export function withBase(path: string | null | undefined, base = "/"): string {
  const root = `/${base.replace(/^\/+|\/+$/g, "")}/`.replace(/^\/\/$/, "/");
  if (!path) return root;
  const value = path.trim().replace(/[\u0000-\u001f\u007f]/g, "");
  if (!value) return root;
  // Backslashes are normalized to slashes by browsers, not by our path rules.
  if (value.includes("\\")) return "#";
  if (/^(?:https?:|mailto:|tel:|ftp:|\/\/)/i.test(value) || value.startsWith("#")) return value;
  if (/^data:image\/(?:png|gif|jpe?g|webp|avif);base64,/i.test(value)) return value;
  if (/^[a-z][a-z\d+.-]*:/i.test(value)) return "#";
  if (value === root.slice(0, -1) || value.startsWith(root)) return value;
  return root + value.replace(/^\/+/, "");
}
