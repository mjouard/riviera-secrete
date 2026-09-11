export function imgUrl(path: string): string {
  if (!path) return "";
  if (/^https?:\/\/|^data:/.test(path)) return path;
  return "/" + path.replace(/^(\.\.\/)+/, "");
}
