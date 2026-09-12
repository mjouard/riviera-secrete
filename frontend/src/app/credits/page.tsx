import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Crédits photo",
  description: "Crédits des photos sous licence Creative Commons utilisées sur Riviera Secrète.",
  robots: { index: false, follow: true },
};

interface Credit {
  titre: string;
  auteur: string;
  fileUrl: string;
  licenceLabel: string;
  licenceUrl: string;
}

const CREDITS: Credit[] = [
  { titre: "Sentier du littoral du Cap Ferrat", auteur: "Horizon06", fileUrl: "https://commons.wikimedia.org/wiki/File:20211209_122308_Le_sentier_du_littoral_%C3%A0_Saint-Jean-Cap-Ferrat.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Villa Kerylos", auteur: "Miniwark", fileUrl: "https://commons.wikimedia.org/wiki/File:Villa_K%C3%A9rylos,_Beaulieu-sur-Mer_P1030828.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Le sentier Le Corbusier", auteur: "Renek78", fileUrl: "https://commons.wikimedia.org/wiki/File:Le_Corbusier_track_around_Cap_Martin.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "La Colline du Château", auteur: "W. M. Connolley", fileUrl: "https://commons.wikimedia.org/wiki/File:Dscn0062-nice-port-castle-hill_crop_1200x600.jpg", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Le Cours Saleya et les ruelles du Vieux Nice", auteur: "dalbera", fileUrl: "https://commons.wikimedia.org/wiki/File:Cours_Saleya_-_Chapelle_de_la_Mis%C3%A9ricorde_-_Nice.jpeg", licenceLabel: "CC BY 2.0", licenceUrl: "https://creativecommons.org/licenses/by/2.0/deed.fr" },
  { titre: "Peillon, village suspendu", auteur: "MOSSOT", fileUrl: "https://commons.wikimedia.org/wiki/File:Peillon_-_Le_vieux_village_-02.JPG", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Peille, village de l'arrière-pays", auteur: "MOSSOT", fileUrl: "https://commons.wikimedia.org/wiki/File:Peille_-_Le_village_vu_de_la_chapelle_Saint-Roch.JPG", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Gourdon, le nid d'aigle", auteur: "Jochen Schmitt", fileUrl: "https://commons.wikimedia.org/wiki/File:Gourdon.jpg", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Les gorges du Loup et la cascade de Courmes", auteur: "Martin Kraft (photo.martinkraft.com)", fileUrl: "https://commons.wikimedia.org/wiki/File:MK54518_Cascade_de_Courmes.jpg", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Pont du Loup et son viaduc", auteur: "Julian Nyča", fileUrl: "https://commons.wikimedia.org/wiki/File:Pont_du_Loup.JPG", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Tourrettes-sur-Loup, la cité des violettes", auteur: "Jpchevreau", fileUrl: "https://commons.wikimedia.org/wiki/File:Vue_du_village_de_Tourrettes-sur-Loup_depuis_la_route_des_Queni%C3%A8res.JPG", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Saint-Paul-de-Vence", auteur: "Baptiste Roussel", fileUrl: "https://commons.wikimedia.org/wiki/File:St-Paul-de-Vence_(Lunon).jpg", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Le Haut-de-Cagnes", auteur: "Copyleft", fileUrl: "https://commons.wikimedia.org/wiki/File:2010_Chateau_Cagnes-sur-mer.JPG", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Le sentier du littoral du Cap d'Antibes", auteur: "fr.zil", fileUrl: "https://commons.wikimedia.org/wiki/File:Chemin_du_cap_d%27Antibes_1.jpg", licenceLabel: "CC BY-SA 2.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0/deed.fr" },
  { titre: "La pinède Gould", auteur: "Jwieski", fileUrl: "https://commons.wikimedia.org/wiki/File:Antibes,_Juan_Les_Pins.JPG", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Les îles de Lérins", auteur: "Christophe.Finot", fileUrl: "https://commons.wikimedia.org/wiki/File:Ste_Marguerite_-_Fort_royal_09.jpg", licenceLabel: "CC BY-SA 2.5", licenceUrl: "https://creativecommons.org/licenses/by-sa/2.5/deed.fr" },
  { titre: "Le Pic du Cap Roux", auteur: "Jeanne Menjoulet", fileUrl: "https://commons.wikimedia.org/wiki/File:Esterel,_sommet_du_Cap_du_Pic_Roux_(24505701445).jpg", licenceLabel: "CC BY 2.0", licenceUrl: "https://creativecommons.org/licenses/by/2.0/deed.fr" },
  { titre: "Les calanques de l'Estérel", auteur: "Céréales Killer", fileUrl: "https://commons.wikimedia.org/wiki/File:Corniche_d%E2%80%99or,_Esterel.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "La vieille ville de Grasse", auteur: "Lylambda", fileUrl: "https://commons.wikimedia.org/wiki/File:Vue_de_Grasse.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "La Citadelle de Saint-Tropez", auteur: "dronepicr", fileUrl: "https://commons.wikimedia.org/wiki/File:Aerial_view_of_the_Citadel_of_Saint-Tropez,_France_(52723266272).jpg", licenceLabel: "CC BY 2.0", licenceUrl: "https://creativecommons.org/licenses/by/2.0/deed.fr" },
  { titre: "Gassin, plus beau village de France", auteur: "l'Office de tourisme de Gassin", fileUrl: "https://commons.wikimedia.org/wiki/File:Panorama_au-dessus_de_la_table_d%27orientation_de_Gassin.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Entrée de la Rue Obscure (restaurant L'Aparté)", auteur: "Cguerrieri", fileUrl: "https://commons.wikimedia.org/wiki/File:L%27entr%C3%A9e_de_la_rue_Obscure.JPG", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Pointe Sainte-Hospice (baignade aux criques)", auteur: "Tangopaso", fileUrl: "https://commons.wikimedia.org/wiki/File:Pointe_Sainte-Hospice.jpg", licenceLabel: "Domaine public", licenceUrl: "https://creativecommons.org/publicdomain/mark/1.0/deed.fr" },
  { titre: "Anse des Fossettes (sentier sous-marin)", auteur: "Tangopaso", fileUrl: "https://commons.wikimedia.org/wiki/File:Anse_des_Fossettes_(St-Jean-Cap-Ferrat).jpg", licenceLabel: "Domaine public", licenceUrl: "https://creativecommons.org/publicdomain/mark/1.0/deed.fr" },
  { titre: "Plage de Passable (restaurant)", auteur: "Tangopaso", fileUrl: "https://commons.wikimedia.org/wiki/File:Plage_de_Passable.jpg", licenceLabel: "Domaine public", licenceUrl: "https://creativecommons.org/publicdomain/mark/1.0/deed.fr" },
  { titre: "Plage des Marinières (Villefranche-sur-Mer)", auteur: "Mx. Granger", fileUrl: "https://commons.wikimedia.org/wiki/File:Plage_des_Marini%C3%A8res.jpg", licenceLabel: "CC0 1.0", licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/deed.fr" },
];

export default function CreditsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <nav className="text-sm mb-8 flex gap-2" style={{ color: "var(--text-muted)" }}>
        <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
        <span>/</span>
        <span style={{ color: "var(--text)" }}>Crédits photo</span>
      </nav>

      <h1 className="text-3xl font-bold mb-4">Crédits photo</h1>
      <p className="mb-10" style={{ color: "var(--text-muted)" }}>
        Les 27 lieux ont tous une vraie photo — une partie personnelle, une partie sous
        licence Creative Commons trouvée sur Wikimedia Commons (crédits ci-dessous).
      </p>

      <h2 className="text-lg font-semibold mb-1">Photos sous licence Creative Commons</h2>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        Groupées par zone, comme le reste du site.
      </p>
      <ul>
        {CREDITS.map((c, i) => (
          <li
            key={i}
            className="py-3 text-sm"
            style={{
              color: "var(--text-muted)",
              borderTop: i > 0 ? "1px solid var(--line)" : "none",
            }}
          >
            <strong style={{ color: "var(--text)", fontWeight: 500 }}>{c.titre}</strong>
            {" — photo par "}
            {c.auteur}
            {", "}
            <a
              href={c.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--terracotta)" }}
            >
              via Wikimedia Commons
            </a>
            {", sous licence "}
            <a
              href={c.licenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--terracotta)" }}
            >
              {c.licenceLabel}
            </a>
            {"."}
          </li>
        ))}
      </ul>
    </div>
  );
}
