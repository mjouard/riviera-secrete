const HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** Décode les entités HTML restées littérales dans les données (ex. "&amp;" venu du site statique). Ne touche jamais document/DOM — utilisable côté serveur. */
export function decodeEntities(str: string): string {
  if (!str || !str.includes("&")) return str;
  return str.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity[0] === "#") {
      const code =
        entity[1] === "x" || entity[1] === "X"
          ? parseInt(entity.slice(2), 16)
          : parseInt(entity.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    return HTML_ENTITIES[entity] ?? match;
  });
}

export function imgUrl(path: string): string {
  if (!path) return "";
  if (/^https?:\/\/|^data:/.test(path)) return path;
  return "/" + path.replace(/^(\.\.\/)+/, "");
}

export function buildMapLinks(lat: number, lng: number, nom: string) {
  const coords = `${lat},${lng}`;
  return [
    { label: "Google Maps", icon: "🗺️", url: `https://www.google.com/maps/search/?api=1&query=${coords}` },
    { label: "Waze",        icon: "🚗", url: `https://waze.com/ul?ll=${coords}&navigate=yes` },
    { label: "Plans",       icon: "📍", url: `https://maps.apple.com/?ll=${coords}&q=${encodeURIComponent(nom)}` },
  ];
}

export function buildGoogleMapsRouteUrl(stops: Array<{ lat: number; lng: number }>): string {
  if (stops.length === 0) return "#";
  const coords = stops.map((s) => `${s.lat},${s.lng}`);
  const origin = coords[0];
  const destination = coords[coords.length - 1];
  const waypoints = coords.slice(1, -1);
  const params = new URLSearchParams({ api: "1", origin, destination });
  if (waypoints.length) params.set("waypoints", waypoints.join("|"));
  return `https://www.google.com/maps/dir/?${params}`;
}
