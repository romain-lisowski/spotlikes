# Spotlikes

Regroupe tes titres Spotify likés par mois et crée une playlist privée pour chacun des mois sélectionnés.

## Configuration Spotify (à faire une seule fois)

1. Crée une app sur le [dashboard développeur Spotify](https://developer.spotify.com/dashboard).
2. Note le **Client ID**.
3. Dans les paramètres de l'app, ajoute exactement cette Redirect URI : `http://localhost:5173/callback`.
4. Copie `.env.example` vers `.env.local` (déjà fait dans ce dépôt, `.env.local` est ignoré par git) et renseigne :
   ```
   VITE_SPOTIFY_CLIENT_ID=<ton_client_id>
   ```

Aucun secret n'est nécessaire : l'authentification utilise OAuth Authorization Code with PKCE, directement depuis le front.

## Installation

```sh
npm install
```

## Développement

```sh
npm run dev
```

Ouvre `http://localhost:5173`, clique sur "Se connecter à Spotify", regroupe tes titres likés par mois, sélectionne les mois voulus puis crée les playlists.

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
