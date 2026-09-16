"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Link, useRouter } from "@/i18n/navigation";
import type { Lieu } from "@/lib/types";
import { loc, redirectToConnexion } from "@/lib/utils";
import { api, authFetch } from "@/lib/api";
import { oublierEditToken, useEditToken } from "@/lib/itineraire-compose-tokens";
import { formatDuree, parseVisitMinutes, encodeJours, type DureeKey } from "@/lib/itineraire-logic";
import { BADGE_DEFS_BY_SLUG } from "@/lib/home-data";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import ProgrammeSection from "@/app/[locale]/creer-itineraire/_components/ProgrammeSection";
import BookingSection from "@/app/[locale]/creer-itineraire/_components/BookingSection";
import MapItinWrapper from "@/components/MapItinWrapper";
import Photo from "@/components/Photo";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://frontend-two-plum-92.vercel.app";
const SITE_DISPLAY_URL = SITE_URL.replace(/^https?:\/\//, "");

/**
 * Vue d'un itinéraire composé (`/i/[id]`, ROADMAP.md § 4d). En lecture seule par défaut — ce
 * visiteur n'est pas forcément celui qui l'a composé (voir `EstAutoriseSurItineraireCompose`
 * côté backend) — mais bascule en mode Modifier sur place si ce navigateur a créé le lien
 * (`useEditToken`). Pas de glisser-déposer ici (seulement ▲/▼ + Retirer) : le spec ne demande
 * que ça pour cet écran, `ResultsView.tsx` (creer-itineraire/composer) garde le sien.
 */
export default function ItineraireComposeView({
  id,
  nom,
  dureeKey,
  days,
  createdAt,
}: {
  id: string;
  nom: string;
  dureeKey: DureeKey;
  days: Lieu[][];
  createdAt: string;
}) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("creerItineraire");
  const tItin = useTranslations("itineraireCompose");
  const tDuree = useTranslations("dureeLabels");
  const { data: session } = useSession();
  const [lienCopie, setLienCopie] = useState(false);
  const [garde, setGarde] = useState(false);
  const [gardeEnCours, setGardeEnCours] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [workingDays, setWorkingDays] = useState<Lieu[][]>(days);
  const [removedStop, setRemovedStop] = useState<{ dayIndex: number; stopIndex: number; lieu: Lieu } | null>(null);
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);

  // L'EditToken n'est jamais renvoyé par le GET public (voir lib/types.ts) — seul ce
  // navigateur, s'il a créé ce lien, l'a en localStorage (Lot 4d, "brancher la création").
  // C'est ce qui décide d'afficher "Supprimer" et de basculer "Modifier" en édition sur
  // place plutôt qu'un renvoi vers /creer-itineraire.
  const editToken = useEditToken(id);

  /** Même logique que `moveStop` dans creer-itineraire/page.tsx : échange dans le jour, ou
   * bascule vers le jour adjacent en butée de liste. */
  function deplacerEtape(dayIndex: number, stopIndex: number, direction: -1 | 1) {
    setWorkingDays((prev) => {
      const next = prev.map((d) => [...d]);
      const cible = stopIndex + direction;
      if (cible >= 0 && cible < next[dayIndex].length) {
        [next[dayIndex][stopIndex], next[dayIndex][cible]] = [next[dayIndex][cible], next[dayIndex][stopIndex]];
      } else if (direction === -1 && dayIndex > 0) {
        const [item] = next[dayIndex].splice(stopIndex, 1);
        next[dayIndex - 1].push(item);
      } else if (direction === 1 && dayIndex < next.length - 1) {
        const [item] = next[dayIndex].splice(stopIndex, 1);
        next[dayIndex + 1].unshift(item);
      } else return prev;
      return next;
    });
  }

  /** Toast "Annuler" 7s après retrait (→ 02 § 10), pas de suppression silencieuse. */
  function retirerEtape(dayIndex: number, stopIndex: number) {
    setWorkingDays((prev) => {
      const next = prev.map((d) => [...d]);
      const [lieu] = next[dayIndex].splice(stopIndex, 1);
      setRemovedStop({ dayIndex, stopIndex, lieu });
      return next;
    });
  }

  function annulerRetrait() {
    if (!removedStop) return;
    const { dayIndex, stopIndex, lieu } = removedStop;
    setWorkingDays((prev) => {
      const next = prev.map((d) => [...d]);
      next[dayIndex].splice(stopIndex, 0, lieu);
      return next;
    });
    setRemovedStop(null);
  }

  function annulerEdition() {
    setWorkingDays(days);
    setRemovedStop(null);
    setEditMode(false);
  }

  /** PATCH sur l'itinéraire composé lui-même (possible depuis que l'EditToken est disponible
   * côté client, voir "brancher la création"). Pas de modale de nommage à rouvrir (→ EC-04) :
   * l'itinéraire a déjà un nom, ce bouton ne fait que mettre à jour `Jours`. */
  async function sauvegarderModifications() {
    if (!editToken) return;
    setEnregistrementEnCours(true);
    try {
      await api.itinerairesComposes.update(
        id,
        { nom, dureeKey, jours: workingDays.map((jour) => jour.map((l) => l.slug)) },
        editToken
      );
      setRemovedStop(null);
      setEditMode(false);
    } catch {
      // Le backend est peut-être injoignable — on reste en mode édition, rien n'est perdu
      // localement, le bouton "Enregistrer" reste disponible pour retenter.
    } finally {
      setEnregistrementEnCours(false);
    }
  }

  async function confirmerSuppression() {
    if (!editToken) return;
    setSuppressionEnCours(true);
    try {
      await api.itinerairesComposes.remove(id, editToken);
      oublierEditToken(id);
      router.push("/composer");
    } catch {
      // Le backend est peut-être injoignable — on referme quand même la modale, le bouton
      // "Supprimer" reste disponible pour retenter plutôt que de rester coincé ouvert.
      setSuppressionEnCours(false);
      setShowDeleteModal(false);
    }
  }

  const nbLieux = workingDays.flat().length;
  const meta = `${workingDays.length} ${workingDays.length > 1 ? t("jours") : t("jour")} · ${nbLieux} ${nbLieux > 1 ? t("lieuxSuffix") : t("lieu")}`;
  const date = new Date(createdAt).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const mapStops = workingDays.flat().map((l) => ({ lat: l.lat, lng: l.lng, nom: l.nom }));

  /** Copie l'URL courante (celle de ce lien partagé) — même mécanique que le partage de
   * ResultsView, mais rien à encoder ici : l'itinéraire vit déjà côté serveur sous cet id. */
  async function partager() {
    const lien = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: nom, url: lien });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(lien);
      setLienCopie(true);
      setTimeout(() => setLienCopie(false), 2000);
    } catch {
      // silent — rien de mieux à proposer si le presse-papiers est refusé
    }
  }

  /**
   * "Garder" = copier cet itinéraire dans le carnet du compte connecté (POST
   * /api/my-itineraires, déjà protégé par JWT) — pas un PATCH sur l'itinéraire composé
   * lui-même : ce visiteur n'en est pas forcément le créateur (voir la doc du composant),
   * et ce lien /i/{id} doit continuer de fonctionner pour tout le monde après coup.
   */
  async function garder() {
    if (!session?.apiToken) { redirectToConnexion(); return; }
    setGardeEnCours(true);
    try {
      await authFetch("/api/my-itineraires", session.apiToken, {
        method: "POST",
        body: JSON.stringify({ nom, dureeKey, days: workingDays.map((jour) => jour.map((l) => l.slug)) }),
      });
      setGarde(true);
    } finally {
      setGardeEnCours(false);
    }
  }

  /** "Modifier" rouvre l'itinéraire dans l'éditeur existant (/creer-itineraire?jours=…), au
   * lieu de PATCH ce /i/{id} en place — cet écran n'a nulle part où récupérer l'EditToken du
   * créateur (rien ne le pose encore en local côté client), donc la seule modification sûre
   * est d'en repartir dans le composeur, où "Sauvegarder" range le résultat dans son propre
   * carnet plutôt que d'écraser le lien partagé. */
  const lienModifier = `/creer-itineraire?jours=${encodeURIComponent(encodeJours(days))}&duree=${dureeKey}&nom=${encodeURIComponent(nom)}`;

  return (
    <div>
      <div className="print-header">
        <p className="print-header-url">{SITE_DISPLAY_URL}</p>
        <h1>{nom}</h1>
        <p className="print-header-meta">{meta}</p>
      </div>

      <div className="no-print flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">{nom}</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {meta} · {tDuree(dureeKey)}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {tItin("creeLe", { date })}
          </p>
          {/* URL de partage affichée dans l'en-tête (ROADMAP.md § 4d) — pas décoratif : signale
              que ce lien existe, se partage, survit au F5. */}
          <p className="text-xs mt-1 font-mono" style={{ color: "var(--text-muted)" }}>
            {tItin("lienPartage", { id })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {editMode ? (
            <>
              <Button type="button" variant="discret" onClick={annulerEdition}>
                {t("annuler")}
              </Button>
              <button
                onClick={() => void sauvegarderModifications()}
                disabled={enregistrementEnCours}
                className="text-sm px-3 py-2 rounded-lg font-semibold disabled:opacity-60 cursor-pointer disabled:cursor-default"
                style={{ background: "var(--azure)", color: "#0c1116" }}
              >
                {enregistrementEnCours ? tItin("enregistrementEnCours") : tItin("enregistrerModifications")}
              </button>
            </>
          ) : (
            <>
              {/* "Modifier" bascule en édition sur place si ce navigateur a l'EditToken,
                  sinon renvoie vers l'éditeur existant (visiteur sans lien vers ce lien-ci). */}
              {editToken ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="text-sm px-3 py-2 rounded-lg border transition-colors hover:bg-white/5 cursor-pointer"
                  style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
                >
                  {t("modifier")}
                </button>
              ) : (
                <Link href={lienModifier} className="text-sm px-3 py-2 rounded-lg border transition-colors hover:bg-white/5" style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}>
                  {t("modifier")}
                </Link>
              )}
              <button onClick={() => window.print()} className="text-sm px-3 py-2 rounded-lg border transition-colors hover:bg-white/5" style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}>
                {t("exporterPdf")}
              </button>
              <button
                onClick={partager}
                title={t("partagerTitre")}
                className="text-sm px-3 py-2 rounded-lg border transition-colors hover:bg-white/5 cursor-pointer"
                style={{ borderColor: "var(--line)", color: lienCopie ? "var(--azure)" : "var(--text-muted)" }}
              >
                {lienCopie ? t("lienCopie") : t("partagerLien")}
              </button>
              <button
                onClick={() => void garder()}
                disabled={gardeEnCours || garde}
                className="text-sm px-3 py-2 rounded-lg font-semibold disabled:opacity-60"
                style={{ background: "var(--azure)", color: "#0c1116" }}
              >
                {garde ? tItin("garde") : gardeEnCours ? tItin("gardeEnCours") : tItin("garder")}
              </button>
              {/* "Supprimer" — visible seulement pour le navigateur qui a créé ce lien (EditToken
                  en localStorage, voir plus haut). Un autre visiteur avec le même lien /i/{id}
                  n'a aucun moyen de le supprimer, par conception. */}
              {editToken && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="text-sm px-3 py-2 rounded-lg border transition-colors hover:bg-white/5 cursor-pointer"
                  style={{ borderColor: "#B84040", color: "#E07A7A" }}
                >
                  {tItin("supprimer")}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {removedStop && (
        <Toast
          message={tItin("stopRetire", { nom: loc(locale, removedStop.lieu.nomEn, removedStop.lieu.nom) })}
          variant="undo"
          undoLabel={t("annuler")}
          onUndo={annulerRetrait}
          onDismiss={() => setRemovedStop(null)}
        />
      )}

      {/* Modale de suppression — <dialog> natif (Modal.tsx, Lot 1) plutôt que
          window.confirm() (→ EC-03). Bouton destructif à droite, "Annuler" par défaut
          (autoFocus) : Entrée/activation clavier annule plutôt que supprime. */}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} titleId="supprimer-modal-titre">
        <h2 id="supprimer-modal-titre" className="text-card-title mb-2" style={{ color: "var(--calcaire)" }}>
          {tItin("supprimerTitre")}
        </h2>
        <p className="text-body mb-6" style={{ color: "var(--brume)" }}>
          {tItin("supprimerExplication")}
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="discret" autoFocus onClick={() => setShowDeleteModal(false)}>
            {t("annuler")}
          </Button>
          <button
            type="button"
            onClick={() => void confirmerSuppression()}
            disabled={suppressionEnCours}
            className="focus-ring-aube h-11 px-4 rounded-full text-body font-semibold disabled:opacity-60 disabled:cursor-default cursor-pointer"
            style={{ background: "#B84040", color: "var(--calcaire)" }}
          >
            {suppressionEnCours ? tItin("suppressionEnCours") : tItin("supprimer")}
          </button>
        </div>
      </Modal>

      {garde && (
        <div className="no-print mb-6 rounded-xl p-4 text-sm flex items-center gap-3" style={{ background: "rgba(79,195,201,0.1)", color: "var(--azure)" }}>
          {tItin("itineraireGarde")} <Link href="/carnet?onglet=itineraires" className="underline">{t("voirMesItineraires")}</Link>
        </div>
      )}

      {/* Day columns */}
      <div className="print-days grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-10">
        {workingDays.map((day, dayIndex) => (
          <div key={dayIndex} className="print-day rounded-xl p-4" style={{ background: "var(--surface)" }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--azure)" }}>
              {t("jourN", { n: dayIndex + 1 })}{" "}
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                — {day.length} {day.length > 1 ? t("lieuxSuffix") : t("lieu")}
              </span>
            </h3>
            <div className="space-y-2">
              {day.map((lieu, stopIndex) => {
                const dureeLabel = formatDuree(parseVisitMinutes(lieu));
                const estPremier = dayIndex === 0 && stopIndex === 0;
                const estDernier = dayIndex === workingDays.length - 1 && stopIndex === day.length - 1;
                return (
                  <div
                    key={lieu.slug}
                    className="rounded-lg flex gap-3 p-2"
                    style={{ background: "var(--surface-hover)" }}
                  >
                    <div className="no-print w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                      <Photo src={lieu.thumbImage} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/lieux/${lieu.slug}`} target="_blank" className="text-sm font-semibold hover:underline line-clamp-1">
                        {loc(locale, lieu.nomEn, lieu.nom)}
                      </Link>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{lieu.commune}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>⏱ {dureeLabel}</p>
                      {lieu.badges.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {lieu.badges.map((badgeId) => {
                            const def = BADGE_DEFS_BY_SLUG[badgeId];
                            return def ? (
                              <span key={badgeId} className="text-xs" style={{ color: "var(--text-muted)" }}>{def.emoji}</span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                    {/* Contrôles d'édition — 44×44 minimum (→ MO-01, "actuellement 20×20" chez
                        ResultsView.tsx, non touché ici : partagé avec d'autres pages). ▲/▼
                        groupées, "Retirer" séparé (à droite plutôt que juste à côté des
                        flèches) pour ne pas confondre un déplacement et un retrait. */}
                    {editMode && (
                      <div className="no-print flex-shrink-0 flex items-center gap-2">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => deplacerEtape(dayIndex, stopIndex, -1)}
                            disabled={estPremier}
                            aria-label={t("monter")}
                            className="focus-ring-aube w-11 h-11 flex items-center justify-center rounded-lg border transition-colors hover:bg-white/5 disabled:opacity-30 disabled:cursor-default cursor-pointer"
                            style={{ borderColor: "var(--line)", color: "var(--brume)" }}
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => deplacerEtape(dayIndex, stopIndex, 1)}
                            disabled={estDernier}
                            aria-label={t("descendre")}
                            className="focus-ring-aube w-11 h-11 flex items-center justify-center rounded-lg border transition-colors hover:bg-white/5 disabled:opacity-30 disabled:cursor-default cursor-pointer"
                            style={{ borderColor: "var(--line)", color: "var(--brume)" }}
                          >
                            ▼
                          </button>
                        </div>
                        <button
                          onClick={() => retirerEtape(dayIndex, stopIndex)}
                          aria-label={t("retirer")}
                          title={t("retirer")}
                          className="focus-ring-aube w-11 h-11 flex items-center justify-center rounded-lg border transition-colors hover:bg-white/5 cursor-pointer"
                          style={{ borderColor: "#B84040", color: "#E07A7A" }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {day.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>—</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Composition desktop (≥1024px, refonte UI Lot 4d, dernière brique) : carte collante à
          gauche (1fr, tracé --aube pointillé 10/8, pastilles 26px), programme à droite
          (596px fixe). `ProgrammeSection.tsx` lui-même (sa propre grille interne "60px 1fr"
          par ligne) reste inchangé ici — composant partagé avec /creer-itineraire et
          /composer, sa restylisation est hors périmètre de cette brique. Le profil
          d'altitude en cartouche du spec n'est **pas fait** : aucun champ `altitude` sur
          `Lieu` (même constat que la légende d'altitude exclue d'Explorer au Lot 4b) —
          l'inventer serait mentir sur des données qui n'existent pas. */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-[1fr_596px] lg:gap-8">
        {mapStops.length > 0 && (
          <div className="mb-10 lg:mb-0 lg:sticky lg:top-[92px] lg:self-start lg:h-[calc(100vh-140px)]">
            <MapItinWrapper
              stops={mapStops}
              lineColor="var(--aube)"
              dashArray="10 8"
              pinSize={26}
              height="100%"
            />
          </div>
        )}
        <div className="min-w-0">
          <ProgrammeSection days={workingDays} dureeKey={dureeKey} />
        </div>
      </div>

      {/* Version imprimée : la carte n'a pas sa place sur papier, mais le programme doit
          rester présent — le `no-print` du bloc ci-dessus (`.no-print`/`.print-only`,
          convention déjà établie ailleurs dans ce fichier) le masquerait sinon entièrement à
          l'impression, une régression par rapport au rendu d'avant cette brique. */}
      <div className="print-only">
        <ProgrammeSection days={workingDays} dureeKey={dureeKey} />
      </div>

      {/* Booking */}
      <BookingSection days={workingDays} />
    </div>
  );
}
