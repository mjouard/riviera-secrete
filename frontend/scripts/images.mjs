#!/usr/bin/env node
/**
 * Normalise et allège les photos du site.
 *
 *   cd frontend && node scripts/images.mjs verifie    # rapport, n'écrit rien
 *   cd frontend && node scripts/images.mjs optimise   # redimensionne les trop grandes + génère les WebP
 *
 * Deux problèmes distincts, découverts en mesurant (2026-09-14) :
 *
 *   1. **Trop grandes** — des vignettes d'activité stockées en 4000×2667 pour 4,3 Mo, que le
 *      navigateur réduisait à 300 px de large. Pur gâchis de bande passante, sans la moindre
 *      contrepartie visuelle. Corrigé ici : on ré-encode à la dimension cible.
 *   2. **Trop petites** — 133 fichiers en dessous de leur emplacement, jusqu'à des 200×200
 *      affichés sur 960 px. Affichées en `object-cover`, donc pas déformées mais **floues**.
 *      Aucun script ne peut les réparer : il faut re-sourcer la photo. `verifie` les liste,
 *      `optimise` n'y touche pas — agrandir ne ferait qu'alourdir une image déjà molle.
 *
 * Les WebP sont **pré-générés** plutôt que produits à la volée par `next/image` : la
 * transformation d'images de Vercel est facturée à l'usage et le projet est sur le plan
 * gratuit, dont les quotas de déploiement ont déjà été atteints. Un fichier statique de plus
 * ne coûte rien à servir.
 *
 * Les `.jpg` d'origine sont conservés : ils restent le repli de `<picture>` pour les rares
 * navigateurs sans WebP, et la source si les cibles changent un jour.
 */
import { readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Le script vit sous `frontend/` et non à la racine comme `scripts/verifie-coordonnees.py` :
// il importe `sharp`, que Node résout depuis le `node_modules` du projet frontend.
const RACINE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMAGES = path.join(RACINE, "public/assets/images");

/** Dimensions cibles par rôle, déduites du préfixe du nom de fichier. */
const CIBLES = {
  hero: { largeur: 1200, hauteur: 800 },
  thumb: { largeur: 500, hauteur: 375 },
  act: { largeur: 960, hauteur: 640 },
};

/** Au-delà, on considère l'image comme surdimensionnée et on la ré-encode. */
const TOLERANCE_HAUTE = 1.3;
/** En deçà, l'image est trop petite pour son emplacement — signalée, jamais modifiée. */
const TOLERANCE_BASSE = 0.9;

const QUALITE_JPEG = 82;
const QUALITE_WEBP = 78;
/** Une seconde largeur, pour le `srcset` mobile des images affichées en grand. */
const LARGEUR_MOBILE = 640;

function cible(fichier) {
  const role = path.basename(fichier).split(/[-.]/)[0];
  return CIBLES[role] ?? CIBLES.act;
}

async function lister(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await lister(p)));
    else if (/\.jpe?g$/i.test(e.name)) out.push(p);
  }
  return out.sort();
}

function ko(octets) {
  return Math.round(octets / 1024);
}

async function main() {
  const mode = process.argv[2];
  if (!["verifie", "optimise"].includes(mode)) {
    console.error("Usage: cd frontend && node scripts/images.mjs <verifie|optimise>");
    process.exit(2);
  }
  const ecrire = mode === "optimise";

  const fichiers = await lister(IMAGES);
  const tropPetites = [];
  /** Chemin public -> largeur réelle du WebP pleine taille. Voir ecrireManifeste. */
  const largeurs = new Map();
  let nbReduites = 0, nbWebp = 0, avant = 0, apres = 0;

  for (const f of fichiers) {
    const rel = path.relative(IMAGES, f);
    const { largeur, hauteur } = cible(f);
    const tailleAvant = (await stat(f)).size;
    avant += tailleAvant;

    const meta = await sharp(f).metadata();
    const w = meta.width ?? 0;

    if (w < largeur * TOLERANCE_BASSE) {
      tropPetites.push({ rel, actuel: `${w}×${meta.height}`, cible: `${largeur}×${hauteur}` });
    } else if (w > largeur * TOLERANCE_HAUTE) {
      if (ecrire) {
        // `toBuffer` puis écriture : sharp ne sait pas lire et écrire le même fichier.
        const buf = await sharp(f)
          .resize(largeur, hauteur, { fit: "cover", position: "centre" })
          .jpeg({ quality: QUALITE_JPEG, mozjpeg: true })
          .toBuffer();
        await sharp(buf).toFile(f);
      }
      nbReduites++;
    }

    if (ecrire) {
      const base = f.replace(/\.jpe?g$/i, "");
      const source = sharp(f);
      const metaFinale = await source.metadata();
      await sharp(f).webp({ quality: QUALITE_WEBP }).toFile(`${base}.webp`);
      nbWebp++;
      const cheminPublic = "/" + path.relative(path.join(RACINE, "public"), f).split(path.sep).join("/");
      largeurs.set(cheminPublic, metaFinale.width ?? 0);
      // Variante mobile uniquement si l'original est nettement plus large : en dessous, le
      // second fichier pèserait presque autant que le premier pour rien.
      if ((metaFinale.width ?? 0) > LARGEUR_MOBILE * 1.3) {
        await sharp(f).resize({ width: LARGEUR_MOBILE }).webp({ quality: QUALITE_WEBP }).toFile(`${base}-${LARGEUR_MOBILE}w.webp`);
        nbWebp++;
      }
    }

    apres += (await stat(f)).size;
  }

  if (ecrire) await ecrireManifeste(largeurs);

  console.log(`${fichiers.length} JPEG examinés dans public/assets/images`);
  console.log(`  surdimensionnés : ${nbReduites}${ecrire ? " (ré-encodés)" : ""}`);
  console.log(`  sous-dimensionnés : ${tropPetites.length} (non modifiés — re-sourçage nécessaire)`);
  if (ecrire) {
    console.log(`  WebP générés : ${nbWebp}`);
    console.log(`  JPEG : ${ko(avant)} Ko → ${ko(apres)} Ko`);
  }

  if (tropPetites.length) {
    console.log("\nTrop petites pour leur emplacement :");
    for (const t of tropPetites) console.log(`  ${t.rel.padEnd(52)} ${t.actuel.padEnd(12)} cible ${t.cible}`);
  }

  // Sortie 1 s'il reste un écart, pour pouvoir brancher `verifie` sur une CI un jour.
  process.exit(mode === "verifie" && (tropPetites.length || nbReduites) ? 1 : 0);
}

/**
 * Le composant `Photo` doit connaître la largeur **réelle** de chaque WebP.
 *
 * Un descripteur `srcset` qui ment sur la largeur fausse le choix du navigateur : annoncer
 * `1200w` pour un fichier de 960 px lui fait croire qu'il dispose d'une définition qu'il
 * n'aura pas. Et il doit aussi savoir si `x-640w.webp` existe avant de le mettre dans un
 * `srcset` : un candidat manquant n'est pas rattrapé par le `<img>` de repli, il casse
 * l'image. La règle n'est pas devinable au rendu — elle dépend de la largeur réelle du
 * fichier, et 133 photos sont plus petites que leur emplacement. D'où cette liste, générée
 * en même temps que les fichiers qu'elle décrit, donc toujours d'accord avec eux.
 */
async function ecrireManifeste(largeurs) {
  const dest = path.join(RACINE, "src/lib/images-variantes.ts");
  const lignes = [...largeurs.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([chemin, w]) => `  [${JSON.stringify(chemin)}, ${w}],`);
  const contenu = `// Généré par scripts/images.mjs — ne pas éditer à la main.
// Largeur réelle, en pixels, du WebP pleine taille de chaque photo.
export const LARGEUR_MOBILE = ${LARGEUR_MOBILE};

export const LARGEURS_WEBP: ReadonlyMap<string, number> = new Map([
${lignes.join("\n")}
]);
`;
  await writeFile(dest, contenu, "utf8");
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
