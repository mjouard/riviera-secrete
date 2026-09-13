#!/usr/bin/env python3
"""Contrôle les coordonnées de data/lieux.json et data/villes.json.

Le contrôle à l'œil sur une carte a laissé passer Èze à 8 km en pleine mer — dans les deux
fichiers à la fois, donc aussi bien sur la fiche du lieu que sur le marqueur de la commune —
plus trois lieux au-delà de 2,5 km (audit 2026-09-13). Deux contrôles automatisés les
détectent tous. À relancer après tout ajout ou déplacement.

    python3 scripts/verifie-coordonnees.py              # tout
    python3 scripts/verifie-coordonnees.py --hors-ligne  # seulement le contrôle 2
    python3 scripts/verifie-coordonnees.py eze-village   # un slug (lieu ou ville)

1. **Point en mer** (réseau) — Nominatim renvoie `addresstype: region` quand le point ne
   tombe dans aucune commune. C'est la signature exacte du bug Èze. 1 req/s imposée par
   leur politique d'usage, donc ~80 s pour un passage complet.
2. **Lieu trop loin de sa propre ville** (hors ligne, instantané) — on compare chaque lieu
   au `lat`/`lng` de la ville que son `villeSlug` désigne. C'est ce contrôle-là qui a
   révélé que la ville `eze` portait la même erreur que le lieu.

Ce qui a été essayé et **écarté** : géocoder le nom du lieu pour comparer les positions.
Les noms sont éditoriaux, pas administratifs, et le géocodeur part au hasard — « Rue
Obscure » renvoyait un village de l'Aude, « Sainte-Agnès » un lieu-dit du Finistère, « Pic
du Cap Roux » une rue de Fréjus. Cinq faux positifs sur quarante-trois, inexploitable.
Comparer le nom de commune renvoyé par l'OSM au champ `commune` échoue pour la même
raison : le site nomme des localités (Cap Martin, Juan-les-Pins, Golfe-Juan, Pont-du-Loup)
et des entités géographiques (Gorges du Loup, Massif de l'Estérel) là où l'OSM renvoie la
commune de rattachement.

Sortie 1 s'il reste un point suspect (utilisable en CI), 0 sinon.
"""
from __future__ import annotations  # le python3 du système est antérieur à 3.10

import json
import math
import pathlib
import sys
import time
import urllib.parse
import urllib.request

RACINE = pathlib.Path(__file__).resolve().parent.parent
UA = "riviera-secrete-verif-coordonnees/1.0 (https://github.com/mjouard/riviera-secrete)"

SEUIL_KM = 5.0

# Lieux légitimement éloignés du centre de leur commune : un sommet de massif, un hameau
# d'altitude, des gorges ou une plage de plusieurs kilomètres. Le contrôle « en mer » leur
# reste appliqué, seule la distance est tolérée.
ELOIGNES_LEGITIMES = {
    "gorges-du-loup-cascade-courmes",  # gorges de plusieurs km, rattachées à Tourrettes
    "peira-cava",  # hameau d'altitude de Lucéram
    "pic-cap-roux-esterel",  # sommet du massif, commune de rattachement côtière
    "plage-pampelonne",  # plage de 4,5 km, centre de Ramatuelle dans les terres
}


def reverse(lat: float, lng: float) -> dict:
    url = "https://nominatim.openstreetmap.org/reverse?" + urllib.parse.urlencode(
        {"lat": lat, "lon": lng, "format": "json", "zoom": 14}
    )
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)


def distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = math.radians
    h = (
        math.sin(r(lat2 - lat1) / 2) ** 2
        + math.cos(r(lat1)) * math.cos(r(lat2)) * math.sin(r(lng2 - lng1) / 2) ** 2
    )
    return 2 * 6371 * math.asin(math.sqrt(h))


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    hors_ligne = "--hors-ligne" in sys.argv

    lieux = json.loads((RACINE / "data" / "lieux.json").read_text(encoding="utf-8"))
    villes = json.loads((RACINE / "data" / "villes.json").read_text(encoding="utf-8"))
    if args:
        voulus = set(args)
        lieux = [l for l in lieux if l["slug"] in voulus]
        villes = [v for v in villes if v["slug"] in voulus]
        if not lieux and not villes:
            print(f"Aucun lieu ni ville ne correspond à {', '.join(voulus)}", file=sys.stderr)
            return 2

    par_slug = {v["slug"]: v for v in json.loads((RACINE / "data" / "villes.json").read_text(encoding="utf-8"))}
    suspects: list[str] = []

    # ── 2. Lieu trop loin de sa ville (hors ligne) ────────────────────────────
    print("── Distance de chaque lieu à sa commune ──")
    for lieu in lieux:
        ville = par_slug.get(lieu.get("villeSlug"))
        if ville is None:
            suspects.append(f"{lieu['slug']} — villeSlug « {lieu.get('villeSlug')} » introuvable")
            print(f"KO  {lieu['slug']:<38} villeSlug inconnu")
            continue
        d = distance_km(lieu["lat"], lieu["lng"], ville["lat"], ville["lng"])
        if d > SEUIL_KM and lieu["slug"] not in ELOIGNES_LEGITIMES:
            suspects.append(f"{lieu['slug']} ({lieu['lat']}, {lieu['lng']}) — {d:.1f} km de la ville {ville['slug']}")
            print(f"KO  {lieu['slug']:<38} {d:.1f} km de {ville['slug']}")
        elif d > SEUIL_KM:
            print(f"ok≈ {lieu['slug']:<38} {d:.1f} km (éloignement attendu)")

    # ── 1. Points en mer (réseau) ─────────────────────────────────────────────
    if not hors_ligne:
        print("\n── Points tombant hors de toute commune ──")
        points = [("lieu", l) for l in lieux] + [("ville", v) for v in villes]
        for i, (genre, item) in enumerate(points):
            if i:
                time.sleep(1.1)  # politique d'usage Nominatim
            try:
                rep = reverse(item["lat"], item["lng"])
            except Exception as e:  # réseau indisponible : signalé sans interrompre le lot
                print(f"?   {genre} {item['slug']:<33} erreur réseau : {e}")
                continue
            if rep.get("addresstype") == "region":
                suspects.append(f"{genre} {item['slug']} ({item['lat']}, {item['lng']}) — hors de toute commune, probablement en mer")
                print(f"KO  {genre} {item['slug']:<33} en mer")
        print(f"    {len(points)} point(s) contrôlé(s).")

    print()
    if not suspects:
        print(f"{len(lieux)} lieu(x) et {len(villes)} ville(s) : aucun écart.")
        return 0
    print(f"{len(suspects)} point(s) à revoir :")
    for s in suspects:
        print(f"  · {s}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
