"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { authFetch } from "@/lib/api";
import { DUREE_META, type DureeKey } from "@/lib/itineraire-logic";
import type { UserItineraire } from "@/lib/types";

export default function AddToItinButton({ lieuSlug }: { lieuSlug: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<UserItineraire[] | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onOutsideClick);
    return () => document.removeEventListener("click", onOutsideClick);
  }, []);

  async function toggle() {
    if (!session?.apiToken) {
      // Pas besoin de compte pour composer un itinéraire — seule la sauvegarde en exige un.
      router.push(`/creer-itineraire?add=${encodeURIComponent(lieuSlug)}`);
      return;
    }
    if (!open) {
      setAddedId(null);
      const res = await authFetch("/api/my-itineraires", session.apiToken).catch(() => null);
      setItems(res?.ok ? await res.json() : []);
    }
    setOpen((v) => !v);
  }

  async function addTo(itin: UserItineraire) {
    if (!session?.apiToken) return;
    const days = itin.days.length > 0 ? itin.days.map((d) => [...d]) : [[]];
    days[days.length - 1].push(lieuSlug);

    await authFetch(`/api/my-itineraires/${itin.id}`, session.apiToken, {
      method: "PUT",
      body: JSON.stringify({ nom: itin.nom, dureeKey: itin.dureeKey, days }),
    }).catch(() => null);

    setAddedId(itin.id);
    setItems((prev) => prev?.map((it) => (it.id === itin.id ? { ...it, days } : it)) ?? prev);
    setTimeout(() => setOpen(false), 1000);
  }

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        onClick={toggle}
        className="text-xs px-3 py-1.5 rounded-full border transition-colors hover:bg-white/5 cursor-pointer"
        style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
      >
        ➕ Ajouter à un itinéraire
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 w-72 rounded-xl overflow-hidden z-20 shadow-xl"
          style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
        >
          {items === null ? (
            <p className="text-xs p-4" style={{ color: "var(--text-muted)" }}>Chargement…</p>
          ) : items.length === 0 ? (
            <p className="text-xs p-4" style={{ color: "var(--text-muted)" }}>
              Aucun itinéraire sauvegardé.
              <br />
              <Link
                href={`/creer-itineraire?add=${encodeURIComponent(lieuSlug)}`}
                className="underline"
                style={{ color: "var(--azure)" }}
              >
                Créer un itinéraire →
              </Link>
            </p>
          ) : (
            <>
              <ul>
                {items.map((it) => {
                  const alreadyIn = it.days.some((d) => d.includes(lieuSlug));
                  const dureeLabel = DUREE_META[it.dureeKey as DureeKey]?.label ?? it.dureeKey;
                  return (
                    <li key={it.id} style={{ borderBottom: "1px solid var(--line)" }}>
                      <button
                        onClick={() => addTo(it)}
                        disabled={alreadyIn || addedId === it.id}
                        className="w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 transition-colors hover:bg-white/5 cursor-pointer disabled:cursor-default"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-medium line-clamp-1">{it.nom}</span>
                          <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
                            {dureeLabel}
                          </span>
                        </span>
                        {addedId === it.id ? (
                          <span className="text-xs flex-shrink-0" style={{ color: "var(--azure)" }}>✓ Ajouté !</span>
                        ) : alreadyIn ? (
                          <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>✓ Déjà présent</span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Link
                href={`/creer-itineraire?add=${encodeURIComponent(lieuSlug)}`}
                className="block text-xs px-4 py-2.5 text-center transition-colors hover:bg-white/5"
                style={{ color: "var(--azure)" }}
              >
                + Nouvel itinéraire
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
