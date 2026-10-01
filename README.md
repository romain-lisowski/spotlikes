# Spotlikes

Regroupe tes titres Spotify likés par année ou par genre, et crée une playlist privée pour chacun des groupes sélectionnés.

## Configuration Spotify (à faire une seule fois)

1. Crée une app sur le [dashboard développeur Spotify](https://developer.spotify.com/dashboard).
2. Note le **Client ID**.
3. Dans les paramètres de l'app, ajoute exactement cette Redirect URI : `http://127.0.0.1:5173/callback`.
   (Spotify n'autorise plus `localhost` en HTTP, il faut l'adresse de loopback explicite `127.0.0.1`.)
4. Copie `.env.example` vers `.env.local` (déjà fait dans ce dépôt, `.env.local` est ignoré par git) et renseigne :
   ```
   VITE_SPOTIFY_CLIENT_ID=<ton_client_id>
   ```

Aucun secret n'est nécessaire : l'authentification utilise OAuth Authorization Code with PKCE, directement depuis le front.

## Configuration Last.fm (pour le regroupement par genre)

Spotify restreint l'accès aux données de genre pour les apps en Development Mode (quota très bas). Le genre est donc récupéré via l'API publique de Last.fm (`artist.getTopTags`), par nom d'artiste.

1. Crée une clé API gratuite sur https://www.last.fm/api/account/create (juste un nom d'app à indiquer).
2. Ajoute-la dans `.env.local` :
   ```
   VITE_LASTFM_API_KEY=<ta_clé>
   ```

Sans cette clé, le mode "Par genre" ne fonctionnera pas ; "Par année" reste utilisable normalement.

Les genres récupérés sont mis en cache dans le `localStorage` du navigateur (par nom d'artiste), pour éviter de refaire un appel Last.fm à chaque session pour un artiste déjà interrogé.

## Installation

```sh
npm install
```

## Développement

```sh
npm run dev
```

Ouvre `http://127.0.0.1:5173` (et non `localhost`, pour matcher la Redirect URI déclarée côté Spotify), clique sur "Se connecter à Spotify", choisis un mode de regroupement (année ou genre), ajuste le nom des playlists et les titres à exclure si besoin, puis crée les playlists sélectionnées.

**Note** : l'access token n'est jamais persisté (ni disque, ni storage) — il vit uniquement en mémoire le temps de la session. Un rechargement de page nécessite de se reconnecter.

## Tests unitaires

```sh
npm run test:unit
```

## Vérifications qualité

```sh
npm run type-check
npm run lint
npm run format
```

## Build de production

```sh
npm run build
```
