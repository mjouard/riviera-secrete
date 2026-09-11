const STATIC_BASE = "https://riviera-secrete.netlify.app/";

export function imgUrl(path: string): string {
  if (!path) return "";
  if (/^https?:\/\/|^data:/.test(path)) return path;
  return STATIC_BASE + path.replace(/^(\.\.\/)+/, "");
}
