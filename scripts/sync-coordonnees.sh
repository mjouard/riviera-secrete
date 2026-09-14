#!/usr/bin/env bash
# Synchronise en base les coordonnées corrigées le 2026-09-14 (commit 6f1a201).
#
# Pourquoi un script : `refresh-lieu-fields` ne prend qu'un slug à la fois, il en faut 7,
# et la chaîne de connexion doit être convertie depuis l'URL Railway. Le script la récupère
# lui-même via le CLI Railway et ne l'affiche jamais — rien à copier-coller à la main.
#
#   ./scripts/sync-coordonnees.sh            # applique
#   ./scripts/sync-coordonnees.sh --verifie  # relit la prod et compare, sans rien écrire
#
# Prérequis : `railway login` fait, .NET 10 dans le PATH. À relancer après toute rotation
# du mot de passe Postgres — le script lit la valeur courante à chaque exécution.
set -euo pipefail

cd "$(dirname "$0")/.."

LIEUX=(eze-village sentier-corbusier-cap-martin saorge-village pic-cap-roux-esterel iles-de-lerins)
VILLES=(eze cannes)
API="https://api-production-19623.up.railway.app"

# ── Vérification seule : relit l'API de prod et compare au JSON local ─────────
if [[ "${1:-}" == "--verifie" ]]; then
  echo "Comparaison prod ↔ data/*.json"
  ecarts=0
  for slug in "${LIEUX[@]}"; do
    res=$(curl -sf "$API/api/lieux/$slug") || { echo "  ?  $slug — API injoignable"; continue; }
    if ! python3 - "$slug" "$res" <<'PY'
import json, sys
slug, res = sys.argv[1], json.loads(sys.argv[2])
local = next(x for x in json.load(open("data/lieux.json", encoding="utf-8")) if x["slug"] == slug)
ok = abs(res["lat"] - local["lat"]) < 1e-6 and abs(res["lng"] - local["lng"]) < 1e-6
print(f"  {'ok ' if ok else 'KO '} {slug:<32} prod {res['lat']},{res['lng']}" + ("" if ok else f"  ≠ local {local['lat']},{local['lng']}"))
sys.exit(0 if ok else 1)
PY
    then ecarts=$((ecarts + 1)); fi
  done
  for slug in "${VILLES[@]}"; do
    res=$(curl -sf "$API/api/villes/$slug") || { echo "  ?  ville $slug — API injoignable"; continue; }
    if ! python3 - "$slug" "$res" <<'PY'
import json, sys
slug, res = sys.argv[1], json.loads(sys.argv[2])
local = next(x for x in json.load(open("data/villes.json", encoding="utf-8")) if x["slug"] == slug)
ok = abs(res["lat"] - local["lat"]) < 1e-6 and abs(res["lng"] - local["lng"]) < 1e-6
print(f"  {'ok ' if ok else 'KO '} ville {slug:<26} prod {res['lat']},{res['lng']}" + ("" if ok else f"  ≠ local {local['lat']},{local['lng']}"))
sys.exit(0 if ok else 1)
PY
    then ecarts=$((ecarts + 1)); fi
  done
  echo
  [[ $ecarts -eq 0 ]] && echo "Prod à jour." || echo "$ecarts point(s) pas encore synchronisé(s) — relancer sans --verifie."
  exit 0
fi

# ── Chaîne de connexion, récupérée sans jamais l'afficher ────────────────────
command -v railway >/dev/null || { echo "railway CLI introuvable." >&2; exit 1; }

url=$(railway variables --service Postgres --kv 2>/dev/null | sed -n 's/^DATABASE_PUBLIC_URL=//p')
if [[ -z "$url" ]]; then
  echo "DATABASE_PUBLIC_URL introuvable sur le service Postgres." >&2
  echo "Vérifier : railway link --project fearless-happiness --environment production" >&2
  exit 1
fi

# postgres://user:pass@host:port/db  ->  Host=…;Port=…;Database=…;Username=…;Password=…
SYNC_CONNECTION_STRING=$(python3 - "$url" <<'PY'
import sys, urllib.parse as u
p = u.urlparse(sys.argv[1])
print(f"Host={p.hostname};Port={p.port or 5432};Database={p.path.lstrip('/')};"
      f"Username={u.unquote(p.username or '')};Password={u.unquote(p.password or '')};SSL Mode=Require;Trust Server Certificate=true")
PY
)
export SYNC_CONNECTION_STRING
echo "Connexion récupérée depuis Railway (hôte $(python3 -c "import urllib.parse,sys;print(urllib.parse.urlparse(sys.argv[1]).hostname)" "$url"))."
echo

cd backend
for slug in "${LIEUX[@]}"; do
  echo "→ lieu  $slug"
  dotnet run --project RivieraSecrete.Tools -- refresh-lieu-fields "$slug"
done
for slug in "${VILLES[@]}"; do
  echo "→ ville $slug"
  dotnet run --project RivieraSecrete.Tools -- refresh-ville-fields "$slug"
done

echo
echo "Terminé. Vérifier avec : ./scripts/sync-coordonnees.sh --verifie"
