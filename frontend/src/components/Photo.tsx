import { imgUrl } from "@/lib/utils";
import { LARGEURS_WEBP, LARGEUR_MOBILE } from "@/lib/images-variantes";

/**
 * Photo du site, servie en WebP avec repli JPEG.
 *
 * Remplace les `<img>` directs : les WebP pèsent environ moitié moins que les JPEG d'origine,
 * et une fiche lieu chargeait jusqu'à 2,3 Mo d'images — sur un site qui recense justement les
 * endroits mal couverts en réseau.
 *
 * Les variantes sont **pré-générées** par `scripts/images.mjs` plutôt que produites à la volée
 * par `next/image` : la transformation d'images de Vercel se facture à l'usage, et le projet
 * est sur le plan gratuit. Servir un fichier statique de plus ne coûte rien.
 *
 * Le `srcset` mobile n'est proposé que pour les chemins listés dans le manifeste. Un candidat
 * `srcset` manquant n'est **pas** rattrapé par le `<img>` de repli — il casse l'image — et
 * 133 photos sont trop petites pour avoir une variante. On ne devine donc pas, on consulte.
 *
 * Un chemin distant, un `data:` ou un format non-JPEG retombe sur un `<img>` simple : rien à
 * optimiser, et surtout aucune variante à promettre.
 */
export default function Photo({
  src,
  alt,
  className,
  style,
  sizes,
  priority = false,
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  /** Indice de largeur d'affichage, pour que le navigateur choisisse la bonne variante. */
  sizes?: string;
  /** `true` pour une image au-dessus de la ligne de flottaison (hero) : chargement immédiat. */
  priority?: boolean;
  width?: number;
  height?: number;
}) {
  const url = imgUrl(src);
  const optimisable = url.startsWith("/assets/images/") && /\.jpe?g$/i.test(url);

  const img = (
    <img
      src={url}
      alt={alt}
      className={className}
      style={style}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
    />
  );

  if (!optimisable) return img;

  const base = url.replace(/\.jpe?g$/i, "");
  const largeur = LARGEURS_WEBP.get(url);
  // Pas de WebP connu pour ce chemin : on sert le JPEG plutôt que de pointer un fichier
  // qui n'existe peut-être pas. Arrive pour une photo ajoutée sans relancer le script.
  if (largeur === undefined) return img;

  // Le descripteur doit annoncer la largeur **réelle** du fichier. Annoncer 1200w pour une
  // image de 960 px ferait croire au navigateur qu'il dispose d'une définition qu'il n'aura
  // pas, et lui ferait écarter à tort la variante mobile.
  const aVarianteMobile = largeur > LARGEUR_MOBILE * 1.3;
  const srcSet = aVarianteMobile
    ? `${base}-${LARGEUR_MOBILE}w.webp ${LARGEUR_MOBILE}w, ${base}.webp ${largeur}w`
    : `${base}.webp`;

  return (
    <picture>
      <source type="image/webp" srcSet={srcSet} sizes={aVarianteMobile ? sizes : undefined} />
      {img}
    </picture>
  );
}
