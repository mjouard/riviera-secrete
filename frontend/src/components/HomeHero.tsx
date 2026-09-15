import Photo from "@/components/Photo";

/**
 * Refonte UI Lot 4e — une seule image au lieu du crossfade de 8 (spec § "Performance" :
 * le héros multi-images était le plus gros poste de poids/requêtes de l'accueil). `priority`
 * pour un chargement immédiat (au-dessus de la ligne de flottaison).
 */
export default function HomeHero() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <Photo
        src="/assets/images/accueil/hero-1.jpg"
        alt=""
        sizes="100vw"
        priority
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
}
