---
name: feedback-vercel-deploy
description: "Piège Vercel déploiement — rootDirectory null, déployer depuis frontend/, ne pas déployer depuis la racine"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 52dd96aa-badc-4607-83f8-5de46933687d
---

Toujours déployer le projet Next.js depuis `frontend/` avec `npx vercel --prod --yes`.

**Why:** Le monorepo a deux projets Vercel :
- `frontend` (Next.js) → lié via `frontend/.vercel/project.json`
- `riviera-secrete` (site statique) → lié via `.vercel/project.json` à la racine

Si on lance `vercel` depuis la racine du repo, Vercel pointe vers le projet statique, pas le Next.js.

**How to apply:**
- `rootDirectory` du projet `frontend` sur Vercel doit rester à `null` (auto-detect)
- Si on le met à `"frontend"`, les CLI deploys depuis `frontend/` échouent (cherche `frontend/frontend/`)
- Si on le met à `"frontend"` ET qu'on déploie depuis la racine, ça dépend de la git integration (pas toujours active)
- Solution la plus fiable : `cd frontend && npx vercel --prod --yes`

**Symptôme du problème** : build en 5-7 secondes, `Builds: [0ms]` dans `vercel inspect` → le build Next.js ne s'est pas exécuté, Vercel sert des fichiers statiques depuis la mauvaise racine.
