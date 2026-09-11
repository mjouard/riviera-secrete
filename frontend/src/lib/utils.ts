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
