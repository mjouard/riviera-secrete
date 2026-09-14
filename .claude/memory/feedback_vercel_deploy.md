---
name: feedback-vercel-deploy
description: "Piège Vercel déploiement — rootDirectory null, déployer depuis frontend/, ne pas déployer depuis la racine"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 52dd96aa-badc-4607-83f8-5de46933687d
---

Toujours déployer le projet Next.js depuis `frontend/` avec `npx vercel --prod --yes`.

**Why:** Le repo a historiquement deux projets Vercel :
- `frontend` (Next.js) → lié via `frontend/.vercel/project.json`
- `riviera-secrete` (site statique, code supprimé le 2026-09-12) → était lié via
  `.vercel/project.json` à la racine

Le code du site statique n'existe plus dans ce repo, mais si le projet Vercel
`riviera-secrete` reste connecté (git integration ou lien local), lancer `vercel` depuis la
racine du repo risque toujours de résoudre vers ce mauvais projet plutôt que `frontend` —
règle inchangée : toujours déployer depuis `frontend/`.

**How to apply:**
- `rootDirectory` du projet `frontend` sur Vercel doit rester à `null` (auto-detect)
- Si on le met à `"frontend"`, les CLI deploys depuis `frontend/` échouent (cherche `frontend/frontend/`)
- Si on le met à `"frontend"` ET qu'on déploie depuis la racine, ça dépend de la git integration (pas toujours active)
- Solution la plus fiable : `cd frontend && npx vercel --prod --yes`

**Symptôme du problème** : build en 5-7 secondes, `Builds: [0ms]` dans `vercel inspect` → le build Next.js ne s'est pas exécuté, Vercel sert des fichiers statiques depuis la mauvaise racine.

**GitHub integration désactivée (2026-09-11)** : la git integration du projet `frontend` sur Vercel a été déconnectée (`vercel git disconnect`) car chaque `git push` déclenchait un redéploiement depuis la racine du repo (site statique, 0ms), écrasant le vrai build Next.js. **Ne pas reconnecter la GitHub integration** sur ce projet — déployer uniquement via CLI depuis `frontend/`.

**Piège récurrent découvert le 2026-09-12** : à cause de ça, un `git push` (même avec plusieurs
commits successifs touchant `frontend/public/`, ex. nouvelles photos d'activités) **ne met
jamais le site en prod tout seul** — il faut explicitement relancer `cd frontend && npx vercel
--prod --yes` après coup. Repéré parce que 9 commits de suite (nouvelles activités + photos
Wikimedia par lieu) ont été poussés sur `main` sans redéployer le frontend, laissant les
nouvelles images en 404 sur le site live pendant toute une session — jusqu'à ce que
l'utilisateur remarque une image manquante en prod. **Reflexe à prendre : redéployer le
frontend après toute série de commits touchant `frontend/`, pas seulement après une sync DB.**

**Projet `riviera-secrete` supprimé le 2026-09-14.** Il traînait encore côté Vercel malgré la
suppression de son code en 2026-09-12 : orphelin, renvoyait 404, mais accumulait quand même des
déploiements (au moins 20 visibles via `vercel ls`, probablement plus — la CLI ne montre que les
20 derniers) — chacun embarquant sa propre copie de `frontend/public/assets/images/`, qui est
volumineux. Repéré en creusant une alerte Vercel « 75 % du quota de stockage utilisé » : deux
projets actifs pour le même site, doublant le stockage consommé, et aucun n'était jamais purgé
(Vercel ne supprime pas automatiquement les vieux déploiements Ready sur ce plan). Le vrai
site en prod a toujours été `frontend` (confirmé via `curl` : `frontend-two-plum-92.vercel.app`
sert du contenu réel, `riviera-secrete.vercel.app` était en 404) — cette ambiguïté disparaît
maintenant que le doublon est supprimé, mais le réflexe reste : après un ménage de ce genre,
penser aussi à purger les vieux déploiements de `frontend` lui-même (`vercel remove <url>
--safe --yes` un par un, ou depuis le dashboard) plutôt que de les laisser s'accumuler
indéfiniment — c'est reparti en boucle silencieusement une fois, ça peut recommencer.

**Note d'outillage** : `vercel project remove`/`vercel remove` (suppression de projet ou de
déploiement) est bloqué par le classifieur auto-mode de Claude Code, même avec l'accord explicite
de l'utilisateur en amont — action jugée irréversible. Idem pour un simple `vercel ls <projet>`
juste après, apparemment par prudence contextuelle. Dans ce cas, donner à l'utilisateur la
commande exacte à lancer lui-même plutôt que d'insister.
