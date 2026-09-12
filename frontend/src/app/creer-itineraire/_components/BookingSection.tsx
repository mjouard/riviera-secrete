import type { Lieu } from "@/lib/types";
import { imgUrl } from "@/lib/utils";
import { buildBookingActivites } from "@/lib/itineraire-logic";

export default function BookingSection({ days }: { days: Lieu[][] }) {
  const bookings = buildBookingActivites(days);
  if (!bookings.length) return null;

  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold mb-2">À réserver avant de partir</h2>
      <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
        Ces expériences demandent un peu d&apos;anticipation, surtout en haute saison.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {bookings.map(({ lieu, activite: act }, i) => (
          <div key={i} className="print-stop rounded-xl overflow-hidden" style={{ background: "var(--surface)" }}>
            <div className="no-print aspect-video overflow-hidden">
              <img src={imgUrl(act.image)} alt={act.alt} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="p-4">
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{lieu.nom}</p>
              <p className="font-semibold text-sm mb-1">{act.nom}</p>
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>⏱ {act.duree} · 💶 {act.prix}</p>
              <a href={act.url} target="_blank" rel="noopener noreferrer" className="no-print text-xs" style={{ color: "var(--azure)" }}>
                {act.linkText || "Réserver"} →
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
