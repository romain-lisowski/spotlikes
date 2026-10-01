import { UNKNOWN_GENRE, FALLBACK_FAMILY } from './groupByGenre'
import { YEAR_KEY_PATTERN } from './groupByYear'

// Un mot par famille de genre, choisi pour évoquer le style. Aucun mot n'est
// réutilisé d'une famille à l'autre.
const THEMATIC_WORD_BY_FAMILY: Record<string, string> = {
  'Hip-Hop': 'Rhythmic',
  Metal: 'Crushing',
  Punk: 'Reckless',
  Electro: 'Pulsing',
  Chill: 'Hazy',
  Rock: 'Amplified',
  Disco: 'Glittering',
  Soul: 'Groovy',
  Blues: 'Gritty',
  Jazz: 'Smoky',
  Classique: 'Timeless',
  Country: 'Rustic',
  Latin: 'Fiery',
  Reggae: 'Sunny',
  Pop: 'Catchy',
  World: 'Global',
  [FALLBACK_FAMILY]: 'Mixed',
}

function genreNameFor(family: string): string {
  if (family === UNKNOWN_GENRE) return 'Mystery Mix'
  const word = THEMATIC_WORD_BY_FAMILY[family] ?? THEMATIC_WORD_BY_FAMILY[FALLBACK_FAMILY]
  return `${word} ${family}`
}

// Les playlists par année gardent le nom brut ("2026") ; seules les playlists
// par genre reçoivent un nom généré, en lien avec la famille musicale.
export function formatPlaylistName(group: { key: string }): string {
  if (YEAR_KEY_PATTERN.test(group.key)) {
    return group.key
  }
  return genreNameFor(group.key)
}
