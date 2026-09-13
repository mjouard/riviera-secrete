import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";

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
  { titre: "Baie des Fourmis (baignade, Villa Kerylos)", auteur: "Ianholton", fileUrl: "https://commons.wikimedia.org/wiki/File:Baie_des_Fourmis,_Beaulieu-sur-Mer.jpg", licenceLabel: "CC BY 3.0", licenceUrl: "https://creativecommons.org/licenses/by/3.0/deed.fr" },
  { titre: "Port de Beaulieu-sur-Mer (restaurant African Queen)", auteur: "Florian Pépellin", fileUrl: "https://commons.wikimedia.org/wiki/File:Port_de_Beaulieu-sur-Mer.JPG", licenceLabel: "Domaine public", licenceUrl: "https://creativecommons.org/publicdomain/mark/1.0/deed.fr" },
  { titre: "Èze vue depuis la Grande Corniche (circuits VTT)", auteur: "Jimi magic", fileUrl: "https://commons.wikimedia.org/wiki/File:Eze_viewed_from_Grand_Corniche.JPG", licenceLabel: "Domaine public", licenceUrl: "https://creativecommons.org/publicdomain/mark/1.0/deed.fr" },
  { titre: "Ruelle d'Èze (restaurant Taverne d'Antan)", auteur: "Abxbay", fileUrl: "https://commons.wikimedia.org/wiki/File:EZE_ruelle_2.JPG", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Trophée d'Auguste vu du Mont Bataille (randonnée)", auteur: "Lourem", fileUrl: "https://commons.wikimedia.org/wiki/File:Tour_d%27Auguste_%C3%A0_la_Turbie_vue_du_mont_Bataille.jpg", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Rue de La Turbie (restaurant Les Santons)", auteur: "avu-edm", fileUrl: "https://commons.wikimedia.org/wiki/File:La_Turbie_-_panoramio_(4).jpg", licenceLabel: "CC BY 3.0", licenceUrl: "https://creativecommons.org/licenses/by/3.0/deed.fr" },
  { titre: "Vallon du Cassan (randonnée du Mounard)", auteur: "Abxbay", fileUrl: "https://commons.wikimedia.org/wiki/File:Vallon_du_cassan_P1060538.jpg", licenceLabel: "CC0 1.0", licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/deed.fr" },
  { titre: "Viaduc de Cassan (VTT)", auteur: "Olivier Cleynen", fileUrl: "https://commons.wikimedia.org/wiki/File:Viaduc_de_Cassan,_Tourrettes-sur-Loup.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Vue depuis une auberge du vieux village (restaurant)", auteur: "Art Anderson", fileUrl: "https://commons.wikimedia.org/wiki/File:View_of_Tourrettes_from_Auberge_window_-_panoramio.jpg", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Crique de l'Île Sainte-Marguerite (baignade)", auteur: "CandiMa", fileUrl: "https://commons.wikimedia.org/wiki/File:Spiaggia_%C3%AEle_Sainte-Marguerite.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Musée subaquatique de Cannes (snorkeling)", auteur: "Jennifer Roording", fileUrl: "https://commons.wikimedia.org/wiki/File:Jason_deCaires_Taylor_Cannes_Underwater_Museum.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Vignoble de l'abbaye de Lérins (restaurant La Tonnelle)", auteur: "Tangopaso", fileUrl: "https://commons.wikimedia.org/wiki/File:Vignoble_de_l%27abbaye_de_L%C3%A9rins.jpg", licenceLabel: "Domaine public", licenceUrl: "https://creativecommons.org/publicdomain/mark/1.0/deed.fr" },
  { titre: "Chemin du Paradis, entre Gourdon et Bar-sur-Loup", auteur: "Gilbert Bochenek", fileUrl: "https://commons.wikimedia.org/wiki/File:Gourdon-Chemin_du_Paradis-PACA-gb.jpg", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Restaurant Au Vieux Four, Gourdon", auteur: "Abxbay", fileUrl: "https://commons.wikimedia.org/wiki/File:Gourdon_(Alpes-Maritimes)_09.jpg", licenceLabel: "CC0 1.0", licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/deed.fr" },
  { titre: "Plage du Buse (baignade, Roquebrune-Cap-Martin)", auteur: "Renek78", fileUrl: "https://commons.wikimedia.org/wiki/File:Plage_du_Buse,_Roquebrune-Cap-Martin_in_July_2020.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Place du vieux village (restaurant La Grotte et l'Olivier)", auteur: "Leon petrosyan", fileUrl: "https://commons.wikimedia.org/wiki/File:In_the_center_of_Roquebrune.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Plage des Ponchettes (Nice)", auteur: "Zairon", fileUrl: "https://commons.wikimedia.org/wiki/File:Nice_Plage_des_Ponchettes_1.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Escalier Rossetti (montée vers la Colline du Château)", auteur: "Reinhold Möller", fileUrl: "https://commons.wikimedia.org/wiki/File:Nizza-Rue_Rossetti_(Nice)-4070886.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Peille vu depuis la route de La Turbie (VTT)", auteur: "Copyleft", fileUrl: "https://commons.wikimedia.org/wiki/File:2013_Peille_(vue_depuis_la_route_de_La_Turbie-Monaco).JPG", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Place du Mont-Agel, Peille (restaurant Cauvin Chez Nana)", auteur: "MOSSOT", fileUrl: "https://commons.wikimedia.org/wiki/File:Peille_-_Place_du_Mont-Agel_(ancienne_place_Lascaris)_-01.JPG", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Canyon du Loup (VTT)", auteur: "Harald Hetzner", fileUrl: "https://commons.wikimedia.org/wiki/File:Gorges_du_Loup,_canyon_of_the_river_Loup_in_France.jpg", licenceLabel: "CC0 1.0", licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/deed.fr" },
  { titre: "Cascade du Saut du Loup (restaurant)", auteur: "Ballista", fileUrl: "https://commons.wikimedia.org/wiki/File:Le_Saut_du_Loup.JPG", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Plage de la Garoupe (Cap d'Antibes)", auteur: "Abxbay", fileUrl: "https://commons.wikimedia.org/wiki/File:Plage_de_la_garoupe_01.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Baie des Milliardaires (snorkeling, Cap d'Antibes)", auteur: "Spike", fileUrl: "https://commons.wikimedia.org/wiki/File:Antibes_Baie_des_Milliardaires_01.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Calanque au Trayas (baignade)", auteur: "Gavan Connolly", fileUrl: "https://commons.wikimedia.org/wiki/File:Le_Trayas_at_For%C3%AAt_Domaniale_de_l%27Est%C3%A9rel,_Commune_de_Saint_Raphael.jpg", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Port de Théoule-sur-Mer (restaurant La Maréa)", auteur: "Txllxt TxllxT", fileUrl: "https://commons.wikimedia.org/wiki/File:Th%C3%A9oule-sur-Mer_-_Quai_%C3%89douard_Blondy_-_View_NNE_on_Harbour.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Parc de la Brague, Biot (randonnée)", auteur: "Денисище", fileUrl: "https://commons.wikimedia.org/wiki/File:Parc_departamentale_de_la_Brague,_Biot_-_panoramio_(1).jpg", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Parc de la Brague, Biot (VTT)", auteur: "Денисище", fileUrl: "https://commons.wikimedia.org/wiki/File:Parc_departamentale_de_la_Brague,_Biot_-_panoramio.jpg", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Plage des Graniers vue de la Citadelle (randonnée)", auteur: "DimiTalen", fileUrl: "https://commons.wikimedia.org/wiki/File:View_of_Plage_des_Graniers_from_the_Citadelle,_Saint-Tropez,_2004.jpg", licenceLabel: "CC0 1.0", licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/deed.fr" },
  { titre: "Ruelle de Saint-Tropez (restaurant Le Goustado Tropézien)", auteur: "Gzen92", fileUrl: "https://commons.wikimedia.org/wiki/File:Rue_(Saint-Tropez)_(4).jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Ruelle du Rocher de Monaco (restaurant U Cavagnëtu)", auteur: "Rundvald", fileUrl: "https://commons.wikimedia.org/wiki/File:Monaco-Ville-ruelle.jpg", licenceLabel: "Domaine public", licenceUrl: "https://creativecommons.org/publicdomain/mark/1.0/deed.fr" },
  { titre: "Socca dans le Vieux-Nice (Chez Théresa)", auteur: "Myrabella", fileUrl: "https://commons.wikimedia.org/wiki/File:Socca_a_Nice.jpg", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Plateau de Coursegoules-Bramafan (VTT)", auteur: "Julien", fileUrl: "https://commons.wikimedia.org/wiki/File:Fall_Landscape_(128978853).jpeg", licenceLabel: "CC BY 3.0", licenceUrl: "https://creativecommons.org/licenses/by/3.0/deed.fr" },
  { titre: "Rue du Casse-Cou, Saint-Paul-de-Vence (restaurant Café Timothé)", auteur: "Jebulon", fileUrl: "https://commons.wikimedia.org/wiki/File:Saint-Paul_de_Vence,_rue_du_casse-cou.JPG", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Place du Château, Haut-de-Cagnes (restaurant Le Village)", auteur: "Abxbay", fileUrl: "https://commons.wikimedia.org/wiki/File:Hauts_de_cagnes_pl_du_chateau.JPG", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Jardin Pauline, Juan-les-Pins (restaurant Le Bistrot)", auteur: "Abxbay", fileUrl: "https://commons.wikimedia.org/wiki/File:Jardin_pauline_1.jpg", licenceLabel: "CC0 1.0", licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/deed.fr" },
  { titre: "Place de la Foux, Grasse (restaurant Le Petit Caboulot)", auteur: "Abxbay", fileUrl: "https://commons.wikimedia.org/wiki/File:Place_de_la_foux_grasse_04.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Sentiers forestiers de Gassin (VTT)", auteur: "Office de tourisme de Gassin", fileUrl: "https://commons.wikimedia.org/wiki/File:Panneaux_d%27orientation_sur_les_boucles_de_l%E2%80%99Arlatane_%C3%A0_Gassin.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "L'Androuno, Gassin (restaurant Au Vieux Gassin)", auteur: "Office de tourisme de Gassin", fileUrl: "https://commons.wikimedia.org/wiki/File:L%27Androuno_%C3%A0_Gassin,_dite_%22la_plus_petite_rue_du_monde%22.jpg", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Le Vieux Menton et ses jardins (cimetière du Vieux-Château)", auteur: "Jorge Franganillo", fileUrl: "https://commons.wikimedia.org/wiki/File:Menton_-_Cimeti%C3%A8re_du_Vieux_Ch%C3%A2teau.jpg", licenceLabel: "CC BY 4.0", licenceUrl: "https://creativecommons.org/licenses/by/4.0/deed.fr" },
  { titre: "Jardin Serre de la Madone, Menton", auteur: "Daderot", fileUrl: "https://commons.wikimedia.org/wiki/File:Jardin_Serre_de_la_Madone_-_DSC04172.JPG", licenceLabel: "Domaine public", licenceUrl: "https://creativecommons.org/publicdomain/mark/1.0/deed.fr" },
  { titre: "Jardin Val Rahmeh, Menton", auteur: "Gossipguy", fileUrl: "https://commons.wikimedia.org/wiki/File:Val_Rahmeh1.jpg", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Ruelles de la vieille ville de Menton", auteur: "Vinbaron", fileUrl: "https://commons.wikimedia.org/wiki/File:Menton_vieille_ville.JPG", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Le bastion depuis le phare du vieux port, Menton", auteur: "ROCHAT PATRICE", fileUrl: "https://commons.wikimedia.org/wiki/File:Le_bastion_depuis_le_phare_du_vieux_port.jpg", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Falicon, village perché", auteur: "Jpchevreau", fileUrl: "https://commons.wikimedia.org/wiki/File:Vue_du_village_de_Falicon_depuis_la_route_de_l%E2%80%99Aire_Saint-Michel.JPG", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "La pyramide de Falicon et le mont Chauve", auteur: "Jpchevreau", fileUrl: "https://commons.wikimedia.org/wiki/File:La_pyramide_de_Falicon_et_le_mont_Chauve_en_arri%C3%A8re-plan.JPG", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Le Parc du Mont Boron (Fort du Mont Alban)", auteur: "FrancoisMignard", fileUrl: "https://commons.wikimedia.org/wiki/File:Mt-Alban-Face-Est-sunrise.JPG", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Cap de Nice (Coco Beach / Le Plongeoir)", auteur: "Amicon", fileUrl: "https://commons.wikimedia.org/wiki/File:Cap_de_Nice.jpg", licenceLabel: "CC BY 2.0", licenceUrl: "https://creativecommons.org/licenses/by/2.0/deed.fr" },
  { titre: "Le Vieux Mougins", auteur: "Olivier Cleynen", fileUrl: "https://commons.wikimedia.org/wiki/File:Mougins_01.jpg", licenceLabel: "CC BY 4.0", licenceUrl: "https://creativecommons.org/licenses/by/4.0/deed.fr" },
  { titre: "Étang de Fontmerle, Mougins", auteur: "Prouzet", fileUrl: "https://commons.wikimedia.org/wiki/File:Mougins_Etang_de_Fontmerle.jpg", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Chapelle Notre-Dame-de-Vie, Mougins", auteur: "Berdea", fileUrl: "https://commons.wikimedia.org/wiki/File:Chapelle_Notre-Dame-de-Vie_de_Mougins_-_Vue_d%27ensemble_4.jpg", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Le Vieux Vallauris, cité de la céramique", auteur: "François de Dijon", fileUrl: "https://commons.wikimedia.org/wiki/File:Ch%C3%A2teau_de_Vallauris_01.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Colonne du débarquement de Napoléon, Golfe-Juan", auteur: "Aimelaime", fileUrl: "https://commons.wikimedia.org/wiki/File:Statue_napoleon_Golfe_Juan.jpg", licenceLabel: "Domaine public", licenceUrl: "https://creativecommons.org/publicdomain/mark/1.0/deed.fr" },
  { titre: "Plage de Golfe-Juan, vue sur le cap d'Antibes", auteur: "Txllxt TxllxT", fileUrl: "https://commons.wikimedia.org/wiki/File:Golfe_Juan_-_Avenue_des_Fr%C3%A8res_Roustan_-_View_SE.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Vieux port de Golfe-Juan", auteur: "Robert Guarino", fileUrl: "https://commons.wikimedia.org/wiki/File:Port_de_Golfe-Juan.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Plage du Soleil, Golfe-Juan", auteur: "Florian Pépellin", fileUrl: "https://commons.wikimedia.org/wiki/File:Plage_de_Golfe-Juan_en_%C3%A9t%C3%A9_(ao%C3%BBt_2006).JPG", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Plage de Pampelonne, secteur sud", auteur: "Thérèse Gaigé", fileUrl: "https://commons.wikimedia.org/wiki/File:Plage_de_Pampelonne_(Ramatuelle,_83)_-_01.jpg", licenceLabel: "CC0 1.0", licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/deed.fr" },
  { titre: "Crique de l'Escalet, Ramatuelle", auteur: "Lucas Mevius", fileUrl: "https://commons.wikimedia.org/wiki/File:Plage_de_l%27Escalet_-_panoramio_-_Lucas_Mevius_(1).jpg", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Phare du cap Camarat, Ramatuelle", auteur: "Wusel007", fileUrl: "https://commons.wikimedia.org/wiki/File:Phare_de_Camarat.jpg", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Vue depuis Peïra-Cava sur le Mercantour", auteur: "AttentatAlbertCamus", fileUrl: "https://commons.wikimedia.org/wiki/File:Vue_peira.jpg", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Vue sur le Mercantour depuis une terrasse de Peïra-Cava", auteur: "Chiavarino", fileUrl: "https://commons.wikimedia.org/wiki/File:Vue_sur_le_Mercantour.jpg", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Porte Saint-François, Falicon", auteur: "MOSSOT", fileUrl: "https://commons.wikimedia.org/wiki/File:Falicon_-_Porte_Saint-Fran%C3%A7ois_-01.JPG", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Oppidum des Encourdoules, Vallauris", auteur: "Patrick Rouzet", fileUrl: "https://commons.wikimedia.org/wiki/File:Oppidum_des_Encourdoules_-_site_archeologique.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Musée du Patrimoine, Grimaud", auteur: "Grimaud Tourisme", fileUrl: "https://commons.wikimedia.org/wiki/File:Mus%C3%A9e_du_Patrimoine_Grimaud.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Église Notre-Dame-des-Neiges, Sainte-Agnès", auteur: "Espirat", fileUrl: "https://commons.wikimedia.org/wiki/File:Fa%C3%A7ade_de_l%27%C3%A9glise_Notre-Dame-des-Neiges.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Chapelle Saint-Sébastien, Coaraze", auteur: "Zairon", fileUrl: "https://commons.wikimedia.org/wiki/File:Coaraze_Chapelle_Saint-S%C3%A9bastien_Ext%C3%A9rieure_1.jpg", licenceLabel: "CC BY 4.0", licenceUrl: "https://creativecommons.org/licenses/by/4.0/deed.fr" },
  { titre: "Cathédrale Saint-Michel, Sospel", auteur: "Tangopaso", fileUrl: "https://commons.wikimedia.org/wiki/File:Facade_of_the_cathedral_of_Sospel.jpg", licenceLabel: "Domaine public", licenceUrl: "https://creativecommons.org/publicdomain/mark/1.0/deed.fr" },
  { titre: "Tour Lascaris, Gorbio", auteur: "MOSSOT", fileUrl: "https://commons.wikimedia.org/wiki/File:Gorbio-Tour_Lascaris.JPG", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Rempart et tour à mâchicoulis, Lucéram", auteur: "Nicolas CIRILLO", fileUrl: "https://commons.wikimedia.org/wiki/File:Rempart_de_Luc%C3%A9ram.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Église de la Madone del Poggio, Saorge", auteur: "MOSSOT", fileUrl: "https://commons.wikimedia.org/wiki/File:Saorge_-_%C3%89glise_de_la_Madone_del_Poggio_-01.JPG", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Le Vieux Village de Grimaud", auteur: "Grimaud Tourisme", fileUrl: "https://commons.wikimedia.org/wiki/File:Village_m%C3%A9di%C3%A9val_et_proven%C3%A7al_de_Grimaud.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Moulin Saint-Roch de Grimaud", auteur: "Grimaud Tourisme", fileUrl: "https://commons.wikimedia.org/wiki/File:Moulin_Saint-Roch_de_Grimaud.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Le Vieux Village de Ramatuelle", auteur: "Uwe Worm", fileUrl: "https://commons.wikimedia.org/wiki/File:%C3%9Cber_den_D%C3%A4chern_von_Ramatuelle_03.JPG", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Moulin de Paillas à Ramatuelle", auteur: "Bonvol", fileUrl: "https://commons.wikimedia.org/wiki/File:FR_Ramatuelle_Moulin_de_Paillas_1.jpg", licenceLabel: "CC BY 3.0", licenceUrl: "https://creativecommons.org/licenses/by/3.0/deed.fr" },
  { titre: "Intérieur de l'église de Ramatuelle", auteur: "Dorianb", fileUrl: "https://commons.wikimedia.org/wiki/File:Int%C3%A9rieur_de_l%27%C3%A9glise_de_Ramatuelle.JPG", licenceLabel: "CC BY-SA 2.5", licenceUrl: "https://creativecommons.org/licenses/by-sa/2.5/deed.fr" },
  { titre: "Cap Taillat", auteur: "avu-edm", fileUrl: "https://commons.wikimedia.org/wiki/File:Cap_Taillat_-_panoramio_(1).jpg", licenceLabel: "CC BY 3.0", licenceUrl: "https://creativecommons.org/licenses/by/3.0/deed.fr" },
  { titre: "Sainte-Agnès, le village du littoral le plus haut d'Europe", auteur: "Espirat", fileUrl: "https://commons.wikimedia.org/wiki/File:Sainte_Agn%C3%A8s_vu_depuis_les_ruines_du_ch%C3%A2teau.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Entrée de l'ouvrage Maginot de Sainte-Agnès", auteur: "Espirat", fileUrl: "https://commons.wikimedia.org/wiki/File:Entr%C3%A9e_de_l%27ouvrage_Maginot_souterrain_de_Sainte_Agn%C3%A8s.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Jardin médiéval de Sainte-Agnès", auteur: "René Dinkel", fileUrl: "https://commons.wikimedia.org/wiki/File:06-Sainte-Agn%C3%A8s_Jardin_m%C3%A9di%C3%A9val_3.JPG", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Donjon et muraille de l'ancien château de Sainte-Agnès", auteur: "Espirat", fileUrl: "https://commons.wikimedia.org/wiki/File:Donjon_et_muraille_Nord_de_l%27ancien_ch%C3%A2teau.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Coaraze, le village aux cadrans solaires", auteur: "Jpchevreau", fileUrl: "https://commons.wikimedia.org/wiki/File:Vue_automnale_du_village_de_Coaraze_depuis_le_chemin_du_Calempaou.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "La Chapelle Bleue de Coaraze", auteur: "Augustin Fabre", fileUrl: "https://commons.wikimedia.org/wiki/File:Chapelle_bleue_de_Coaraze.jpg", licenceLabel: "CC BY 4.0", licenceUrl: "https://creativecommons.org/licenses/by/4.0/deed.fr" },
  { titre: "Nef de l'église Saint-Jean-Baptiste de Coaraze", auteur: "MOSSOT", fileUrl: "https://commons.wikimedia.org/wiki/File:Coaraze_-_%C3%89glise_Saint-Jean-Baptiste_-_Int%C3%A9rieur_-01.JPG", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "La Vieille Ville de Sospel (Pont Vieux)", auteur: "Promeneuse7", fileUrl: "https://commons.wikimedia.org/wiki/File:SOSPEL_Le_Pont_Vieux_(5).JPG", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Ouvrage de Saint-Roch, Sospel (ligne Maginot)", auteur: "Aude Lazaro ArcheOn", fileUrl: "https://commons.wikimedia.org/wiki/File:Ouvrage_de_Saint-Roch,_Sospel.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Gorbio, village médiéval au-dessus de Menton", auteur: "Gilbert Bochenek", fileUrl: "https://commons.wikimedia.org/wiki/File:Gorbio-France-2012-gb.jpg", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "L'orme tricentenaire de Gorbio", auteur: "Tangopaso", fileUrl: "https://commons.wikimedia.org/wiki/File:Orme_de_Gorbio.jpg", licenceLabel: "Domaine public", licenceUrl: "https://creativecommons.org/publicdomain/mark/1.0/deed.fr" },
  { titre: "Église Saint-Barthélemy de Gorbio", auteur: "Ecclésiaste-1.2", fileUrl: "https://commons.wikimedia.org/wiki/File:Eglise_Saint-Barth%C3%A9lemy.jpg", licenceLabel: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" },
  { titre: "Lucéram, village médiéval du Paillon", auteur: "Jpmgir", fileUrl: "https://commons.wikimedia.org/wiki/File:Luceram.JPG", licenceLabel: "Domaine public", licenceUrl: "https://creativecommons.org/publicdomain/mark/1.0/deed.fr" },
  { titre: "Retable de Sainte-Marguerite par Louis Bréa, église de Lucéram", auteur: "Franzrycou (photo) — œuvre de Ludovico Brea, XVe siècle, domaine public", fileUrl: "https://commons.wikimedia.org/wiki/File:Louis_Brea_-_Retable_de_Sainte-Marguerite,_Luceram,_Alpes-Maritimes,_fin_XVe_si%C3%A8cle.jpg", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Petite crèche de Noël à Lucéram", auteur: "Hermes from mars", fileUrl: "https://commons.wikimedia.org/wiki/File:Petite_cr%C3%AAche.jpg", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Saorge, village-amphithéâtre des gorges de la Roya", auteur: "Patrick Rouzet", fileUrl: "https://commons.wikimedia.org/wiki/File:Saorge_vue_generale.jpg", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Fresque du réfectoire, monastère franciscain de Saorge (XVIIe siècle)", auteur: "Franzrycou", fileUrl: "https://commons.wikimedia.org/wiki/File:Saorge,_monast%C3%A8re_franciscain,_r%C3%A9fectoire,_fresques_17e_si%C3%A8cle_(1).jpg", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
  { titre: "Clocher lombard de l'église Saint-Sauveur, Saorge", auteur: "rene boulay", fileUrl: "https://commons.wikimedia.org/wiki/File:La_Roya_Saorge_Eglise_Saint-Sauveur_Clocher_-_panoramio.jpg", licenceLabel: "CC BY-SA 3.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr" },
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
        La plupart des lieux ont une vraie photo — une partie personnelle, une partie sous
        licence Creative Commons trouvée sur Wikimedia Commons (crédits ci-dessous). Les
        lieux ajoutés le plus récemment sont en cours de traitement et affichent
        temporairement une image de substitution.
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
