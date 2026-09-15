#!/usr/bin/env bash
# Applique la migration EF AddLot3Champs à la base de prod, puis recopie tags/communeSlug/
# surPlace/lienType/partenaire depuis data/lieux.json sur les 43 lieux + 208 activités déjà
# synchronisés (SyncNewContentAsync n'insère que du nouveau contenu, jamais de champ sur une
# ligne existante — voir refresh-lieu-fields/refresh-activite dans DatabaseSeeder.cs).
#
# Chaîne de connexion récupérée via le CLI Railway et jamais affichée, même pattern que
# scripts/sync-coordonnees.sh.
#
#   ./scripts/sync-lot3-champs.sh
#
# Prérequis : `railway login` fait, .NET 10 dans le PATH.
set -euo pipefail

cd "$(dirname "$0")/.."

command -v railway >/dev/null || { echo "railway CLI introuvable." >&2; exit 1; }

url=$(railway variables --service Postgres --kv 2>/dev/null | sed -n 's/^DATABASE_PUBLIC_URL=//p')
if [[ -z "$url" ]]; then
  echo "DATABASE_PUBLIC_URL introuvable sur le service Postgres." >&2
  echo "Vérifier : railway link --project fearless-happiness --environment production" >&2
  exit 1
fi

CONN=$(python3 - "$url" <<'PY'
import sys, urllib.parse as u
p = u.urlparse(sys.argv[1])
print(f"Host={p.hostname};Port={p.port or 5432};Database={p.path.lstrip('/')};"
      f"Username={u.unquote(p.username or '')};Password={u.unquote(p.password or '')};SSL Mode=Require;Trust Server Certificate=true")
PY
)
echo "Connexion récupérée depuis Railway (hôte $(python3 -c "import urllib.parse,sys;print(urllib.parse.urlparse(sys.argv[1]).hostname)" "$url"))."
echo

# ── 1. Migration ──────────────────────────────────────────────────────────────
echo "→ Application de la migration AddLot3Champs"
export ConnectionStrings__DefaultConnection="$CONN"
export Jwt__Secret="design-time-only-unused-for-real-auth-32-characters-min"
(cd backend/RivieraSecrete.Infrastructure && dotnet ef database update --startup-project ../RivieraSecrete.Api)
echo

# ── 2. Backfill des lignes déjà en base ───────────────────────────────────────
export SYNC_CONNECTION_STRING="$CONN"
cd backend

mapfile -t SLUGS < <(python3 -c "
import json
for l in json.load(open('../data/lieux.json')): print(l['slug'])
")
echo "→ ${#SLUGS[@]} lieux à rafraîchir"
for slug in "${SLUGS[@]}"; do
  echo "  lieu  $slug"
  dotnet run --project RivieraSecrete.Tools -- refresh-lieu-fields "$slug"
done

mapfile -t ACTIVITES < <(python3 -c "
import json
for l in json.load(open('../data/lieux.json')):
    for a in l.get('activites', []):
        print(f\"{l['slug']}|{a['id']}\")
")
echo "→ ${#ACTIVITES[@]} activités à rafraîchir"
for paire in "${ACTIVITES[@]}"; do
  slug="${paire%%|*}"
  id="${paire##*|}"
  echo "  activité  $slug / $id"
  dotnet run --project RivieraSecrete.Tools -- refresh-activite "$slug" "$id"
done

echo
echo "Terminé."
