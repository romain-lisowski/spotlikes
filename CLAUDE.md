# CLAUDE.md

## Stack
- Vue 3 (Composition API, `<script setup>`) + TypeScript
- Pinia pour la gestion d'état
- Vite comme build tool
- Vitest pour les tests unitaires
- ESLint + eslint-plugin-vue + Prettier
- Pas de Vue Router (un seul écran)
- Pas de PWA (outil web classique, pas d'usage mobile visé)
- Pas de backend séparé — appel direct à l'API Spotify depuis le front (flow OAuth Authorization Code with PKCE, pas de secret exposé)

## Principes à respecter
- Simplicité avant tout : pas de sur-ingénierie, pas de code pour des besoins futurs hypothétiques
- Chaque fonction de logique métier doit avoir un test associé
- Un composant = une responsabilité
- Pas de gestion d'erreurs complexe à ce stade — gérer uniquement les cas évidents (token expiré, échec réseau, échec de création de playlist)
- Toujours proposer un plan avant de modifier plusieurs fichiers d'un coup
- Préférer un code lisible et explicite à un code compact ou "malin"
- Utiliser les conventions officielles Vue (style guide Vue 3, Composition API avec `<script setup>`)

## Ce qui est explicitement hors scope pour l'instant
- Regroupement par genre (prévu pour un jalon 1, pas maintenant)
- Persistance du token (refresh token, stockage local)
- Gestion de plusieurs comptes Spotify
- Édition d'une playlist déjà créée
- Pagination au-delà d'une boucle simple sur `/me/tracks`

## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout — `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
