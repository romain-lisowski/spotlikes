import type { LikedTrack, TrackGroup } from '@/types/spotify'

export const UNKNOWN_GENRE = 'Genre inconnu'
export const FALLBACK_FAMILY = 'Autres'
export const SMALL_FAMILY_TRACK_THRESHOLD = 20

export function normalizeGenreKey(genre: string): string {
  return genre
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Tags "indie" traités à part : le style réel derrière varie trop (indie
// pop/rock/folk vs indie electronic/dance) pour un simple mot-clé générique.
const INDIE_ELECTRO_KEYWORDS = ['electronic', 'electro', 'dance', 'techno', 'house', 'edm', 'synth']

// Grandes familles de genres. Ordre important : les mots-clés les plus
// spécifiques sont vérifiés avant les plus génériques.
const GENRE_FAMILIES: { family: string; keywords: string[] }[] = [
  { family: 'Hip-Hop', keywords: ['hip hop', 'rap', 'trap', 'grime', 'drill'] },
  { family: 'Punk', keywords: ['punk'] },
  { family: 'Metal', keywords: ['metal', 'hardcore', 'grindcore', 'deathcore'] },
  {
    family: 'Electro',
    keywords: [
      'techno',
      'electronic',
      'electro',
      'drum and bass',
      'dnb',
      'jungle',
      'house',
      'dubstep',
      'uk garage',
      'garage',
      'psytrance',
      'trance',
      'edm',
      'idm',
      'synthwave',
    ],
  },
  {
    family: 'Chill',
    keywords: ['ambient', 'downtempo', 'chillwave', 'chillout', 'chill', 'trip hop', 'lounge'],
  },
  { family: 'Rock', keywords: ['rock', 'grunge', 'alternative', 'emo', 'folk'] },
  { family: 'Disco', keywords: ['disco'] },
  { family: 'Soul', keywords: ['soul', 'funk', 'r&b', 'rnb', 'motown'] },
  { family: 'Blues', keywords: ['blues'] },
  { family: 'Jazz', keywords: ['jazz'] },
  { family: 'Classique', keywords: ['classical', 'orchestra', 'opera', 'baroque'] },
  { family: 'Country', keywords: ['country', 'bluegrass', 'americana', 'singer-songwriter'] },
  { family: 'Latin', keywords: ['latin', 'reggaeton', 'salsa', 'bachata', 'cumbia'] },
  { family: 'Reggae', keywords: ['reggae', 'ska', 'dancehall'] },
  { family: 'Pop', keywords: ['pop', 'k-pop', 'kpop'] },
  {
    family: 'World',
    keywords: ['world', 'afrobeat', 'afrobeats', 'amapiano', 'bollywood', 'bhangra', 'soca', 'highlife'],
  },
]

// Familles qui rejoignent une famille précise (plutôt que le fourre-tout
// "Autres") quand elles n'atteignent pas le seuil.
const MERGE_TARGET_BY_FAMILY: Record<string, string> = {
  Punk: 'Rock',
}

export function mapGenreToFamily(genre: string): string {
  const normalized = normalizeGenreKey(genre)

  if (normalized.includes('indie')) {
    return INDIE_ELECTRO_KEYWORDS.some((k) => normalized.includes(k)) ? 'Electro' : 'Rock'
  }

  const match = GENRE_FAMILIES.find(({ keywords }) => keywords.some((k) => normalized.includes(k)))
  return match?.family ?? FALLBACK_FAMILY
}

export function primaryGenreOf(track: LikedTrack): string {
  const rawGenre = track.genres[0]
  return rawGenre ? mapGenreToFamily(rawGenre) : UNKNOWN_GENRE
}

function sortByGenre(a: TrackGroup, b: TrackGroup): number {
  if (a.key === UNKNOWN_GENRE) return 1
  if (b.key === UNKNOWN_GENRE) return -1
  return b.tracks.length - a.tracks.length || a.key.localeCompare(b.key)
}

function mergeInto(
  tracksByFamily: Map<string, LikedTrack[]>,
  fromFamily: string,
  toFamily: string,
): void {
  const fromTracks = tracksByFamily.get(fromFamily)
  if (!fromTracks) return

  const toTracks = tracksByFamily.get(toFamily)
  if (toTracks) {
    toTracks.push(...fromTracks)
  } else {
    tracksByFamily.set(toFamily, fromTracks)
  }
  tracksByFamily.delete(fromFamily)
}

// Une famille trop petite est fusionnée avec une autre plutôt que de rester
// une catégorie isolée : d'abord vers sa famille dédiée si elle en a une
// (ex. Punk -> Rock), sinon vers le fourre-tout "Autres".
function mergeSmallFamilies(tracksByFamily: Map<string, LikedTrack[]>): void {
  for (const family of Object.keys(MERGE_TARGET_BY_FAMILY)) {
    const tracks = tracksByFamily.get(family)
    if (tracks && tracks.length < SMALL_FAMILY_TRACK_THRESHOLD) {
      mergeInto(tracksByFamily, family, MERGE_TARGET_BY_FAMILY[family]!)
    }
  }

  for (const [family, tracks] of tracksByFamily) {
    if (family === UNKNOWN_GENRE || family === FALLBACK_FAMILY) continue
    if (tracks.length < SMALL_FAMILY_TRACK_THRESHOLD) {
      mergeInto(tracksByFamily, family, FALLBACK_FAMILY)
    }
  }
}

export function groupByGenre(tracks: LikedTrack[]): TrackGroup[] {
  const tracksByFamily = new Map<string, LikedTrack[]>()

  for (const track of tracks) {
    const family = primaryGenreOf(track)
    const familyTracks = tracksByFamily.get(family)
    if (familyTracks) {
      familyTracks.push(track)
    } else {
      tracksByFamily.set(family, [track])
    }
  }

  mergeSmallFamilies(tracksByFamily)

  return Array.from(tracksByFamily.entries())
    .map(([key, familyTracks]) => ({ key, label: key, tracks: familyTracks }))
    .sort(sortByGenre)
}
