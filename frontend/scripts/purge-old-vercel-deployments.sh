#!/usr/bin/env bash
# Supprime les déploiements Vercel du projet "frontend" en ne gardant que les N plus récents.
# Usage: ./scripts/purge-old-vercel-deployments.sh [nombre_a_garder]
set -uo pipefail

KEEP="${1:-5}"
PROJECT="frontend"

echo "Récupération de la liste des déploiements de \"$PROJECT\"..."

urls=()
cursor=""
page=0
while true; do
  page=$((page+1))
  if [ -z "$cursor" ]; then
    out=$(vercel ls "$PROJECT" 2>&1)
  else
    out=$(vercel ls "$PROJECT" --next "$cursor" 2>&1)
  fi

  page_urls=$(echo "$out" | grep -oE "https://[a-zA-Z0-9.-]+\.vercel\.app")
  page_urls=$(echo "$page_urls" | sort -u)
  n_page=0
  while IFS= read -r u; do
    if [ -n "$u" ]; then
      urls+=("$u")
      n_page=$((n_page+1))
    fi
  done <<< "$page_urls"

  echo "  page $page : +$n_page (total ${#urls[@]})"

  next=$(echo "$out" | grep -oE -- "--next [0-9]+" | tail -1 | awk '{print $2}')
  if [ -z "$next" ] || [ "$next" == "$cursor" ]; then
    echo "  -> fin de la pagination"
    break
  fi
  cursor="$next"
done

total=${#urls[@]}
echo "Total trouvé : $total déploiements (on garde les $KEEP plus récents)."

if [ "$total" -le "$KEEP" ]; then
  echo "Rien à supprimer."
  exit 0
fi

to_remove=("${urls[@]:$KEEP}")
echo "À supprimer : ${#to_remove[@]}"
echo

removed=0
failed=0
for url in "${to_remove[@]}"; do
  echo "Suppression de $url..."
  if vercel remove "$url" --safe --yes; then
    removed=$((removed+1))
  else
    echo "  -> échec pour $url, on continue"
    failed=$((failed+1))
  fi
done

echo
echo "Terminé. Supprimés: $removed, échecs: $failed."
