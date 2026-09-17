"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { DUREE_META, type DureeKey } from "@/lib/itineraire-logic";
import { ecrireSelectionPersistee, lireSelectionPersistee } from "@/lib/brouillon-itineraire";
import type { UserItineraire } from "@/lib/types";
import { Toast } from "@/components/ui/Toast";

export default function AddToItinButton({
  lieuSlug,
  nom,
  variant = "pill",
}: {
  lieuSlug: string;
  /** Nom affiché du lieu, pour le message du toast "ajouté sur place" (visiteur sans compte). */
  nom: string;
  /** "square" — carré 52×52 icône seule, pour la barre d'action fixe mobile (Lot 4a) : le
   * menu s'ouvre alors vers le haut et ancré à droite, pas vers le bas comme la version pilule
   * (le bouton est collé au bas de l'écran, un menu ouvert vers le bas sortirait du viewport). */
  variant?: "pill" | "square";
}) {
  const t = useTranslations("lieuActions");
  const tDuree = useTranslations("dureeLabels");
  const { data: session } = useSession();
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<UserItineraire[] | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [toastCount, setToastCount] = useState<number | null>(null);

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onOutsideClick);
    return () => document.removeEventListener("click", onOutsideClick);
  }, []);

  async function toggle() {
    if (!session) {
      // Sans compte, pas de liste d'itinéraires à choisir (→ un seul geste possible :
      // accumuler dans le brouillon de session) — ajoute sur place et le dit par toast,
      // plutôt que de naviguer immédiatement vers /composer (refonte UI Lot 4a, "reste la
      // forme"). Même relais que /creer-itineraire et /composer eux-mêmes
      // (lib/brouillon-itineraire.ts), pour que ce clic et un futur passage par le
      // composeur voient la même sélection.
      const actuel = lireSelectionPersistee();
      const fusion = actuel.includes(lieuSlug) ? actuel : [...actuel, lieuSlug];
      ecrireSelectionPersistee(fusion);
      setToastCount(fusion.length);
      return;
    }
    if (!open) {
      setAddedId(null);
      const res = await fetch("/api/proxy/my-itineraires").catch(() => null);
      setItems(res?.ok ? await res.json() : []);
    }
    setOpen((v) => !v);
  }

  async function addTo(itin: UserItineraire) {
    if (!session) return;
    const days = itin.days.length > 0 ? itin.days.map((d) => [...d]) : [[]];
    days[days.length - 1].push(lieuSlug);

    await fetch(`/api/proxy/my-itineraires/${itin.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: itin.nom, dureeKey: itin.dureeKey, days }),
    }).catch(() => null);

    setAddedId(itin.id);
    setItems((prev) => prev?.map((it) => (it.id === itin.id ? { ...it, days } : it)) ?? prev);
    setTimeout(() => setOpen(false), 1000);
  }

  function voirItineraire() {
    const slugs = lireSelectionPersistee();
    router.push(slugs.length > 0 ? `/composer?lieux=${slugs.map(encodeURIComponent).join(",")}` : "/composer");
  }

  return (
    <>
    <div ref={wrapRef} className="relative inline-block">
      {variant === "square" ? (
        <button
          onClick={toggle}
          title={t("ajouterAUnItineraire")}
          className="focus-ring-aube w-[52px] h-[52px] flex-shrink-0 flex items-center justify-center text-lg rounded-lg border transition-colors hover:bg-white/5 cursor-pointer"
          style={{ borderColor: "var(--line)", color: "var(--brume)", background: "var(--nuit-haute)" }}
        >
          <span aria-hidden="true">➕</span>
        </button>
      ) : (
        <button
          onClick={toggle}
          className="focus-ring-aube inline-flex items-center h-11 text-body px-4 rounded-full border transition-colors hover:bg-white/5 cursor-pointer"
          style={{ borderColor: "var(--line)", color: "var(--brume)" }}
        >
          {t("ajouterAUnItineraire")}
        </button>
      )}

      {open && (
        <div
          className={
            variant === "square"
              ? "absolute right-0 bottom-full mb-2 w-72 rounded-xl overflow-hidden z-20 shadow-xl"
              : "absolute left-0 top-full mt-2 w-72 rounded-xl overflow-hidden z-20 shadow-xl"
          }
          style={{ background: "var(--nuit-haute)", border: "1px solid var(--line)" }}
        >
          {items === null ? (
            <p className="text-meta p-4" style={{ color: "var(--brume)" }}>{t("chargement")}</p>
          ) : items.length === 0 ? (
            <p className="text-meta p-4" style={{ color: "var(--brume)" }}>
              {t("aucunItineraireSauvegarde")}
              <br />
              <Link
                href={`/creer-itineraire?add=${encodeURIComponent(lieuSlug)}`}
                className="underline"
                style={{ color: "var(--aube)" }}
              >
                {t("creerUnItineraire")}
              </Link>
            </p>
          ) : (
            <>
              <ul>
                {items.map((it) => {
                  const alreadyIn = it.days.some((d) => d.includes(lieuSlug));
                  const dureeLabel = it.dureeKey in DUREE_META ? tDuree(it.dureeKey as DureeKey) : it.dureeKey;
                  return (
                    <li key={it.id} style={{ borderBottom: "1px solid var(--line)" }}>
                      <button
                        onClick={() => addTo(it)}
                        disabled={alreadyIn || addedId === it.id}
                        className="w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 transition-colors hover:bg-white/5 cursor-pointer disabled:cursor-default"
                      >
                        <span className="min-w-0">
                          <span className="block text-body font-medium line-clamp-1" style={{ color: "var(--calcaire)" }}>{it.nom}</span>
                          <span className="block text-meta" style={{ color: "var(--brume)" }}>
                            {dureeLabel}
                          </span>
                        </span>
                        {addedId === it.id ? (
                          <span className="text-meta flex-shrink-0" style={{ color: "var(--aube)" }}>{t("ajoute")}</span>
                        ) : alreadyIn ? (
                          <span className="text-meta flex-shrink-0" style={{ color: "var(--brume)" }}>{t("dejaPresent")}</span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Link
                href={`/creer-itineraire?add=${encodeURIComponent(lieuSlug)}`}
                className="block text-meta px-4 py-2.5 text-center transition-colors hover:bg-white/5"
                style={{ color: "var(--aube)" }}
              >
                {t("nouvelItineraire")}
              </Link>
            </>
          )}
        </div>
      )}
    </div>
    {toastCount !== null && (
      <Toast
        message={t("ajouteAuBrouillon", { nom, count: toastCount })}
        variant="undo"
        undoLabel={t("voirMonItineraire")}
        onUndo={voirItineraire}
        onDismiss={() => setToastCount(null)}
        raised
      />
    )}
    </>
  );
}
