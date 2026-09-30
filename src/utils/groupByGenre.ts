import type { LikedTrack, TrackGroup } from '@/types/spotify'

export const UNKNOWN_GENRE = 'Genre inconnu'

// En dessous de ce nombre de titres, un groupe est considéré "petit" : non
// sélectionné par défaut, et fusionnable avec d'autres petits groupes proches.
export const SMALL_GROUP_TRACK_THRESHOLD = 20

// Préfixe distinctif pour les clés de groupes fusionnés, afin de ne jamais
// entrer en collision avec un vrai tag Last.fm (toujours lettres/espaces après
// normalisation).
export const MERGED_KEY_PREFIX = 'merged:'

// Tags décrivant une nationalité/un pays plutôt qu'un style musical en soi
// (ex: "french", "italian"). Vérifié par mot entier, pas en sous-chaîne, pour
// éviter les faux positifs (ex: ne matche pas "uk garage").
const NATIONALITY_WORDS = [
  'french',
  'italian',
  'italy',
  'german',
  'germany',
  'spanish',
  'spain',
  'british',
  'english',
  'american',
  'brazilian',
  'brazil',
  'japanese',
  'korean',
  'chinese',
  'russian',
  'dutch',
  'swedish',
  'norwegian',
  'danish',
  'finnish',
  'polish',
  'irish',
  'scottish',
  'welsh',
  'australian',
  'canadian',
  'mexican',
  'indian',
  'african',
  'greek',
  'turkish',
  'portuguese',
  'belgian',
  'swiss',
  'austrian',
  'icelandic',
  'argentine',
  'colombian',
  'cuban',
]

// Fusionne les variantes d'écriture d'un même tag ("Hip-Hop", "HipHop", "hip hop")
// vers une seule forme canonique, utilisée à la fois comme clé de regroupement et
// comme base d'affichage.
export function normalizeGenreKey(genre: string): string {
  return genre
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function formatGenreLabel(genre: string): string {
  return genre.replace(/\b\w/g, (char) => char.toUpperCase())
}

export function primaryGenreOf(track: LikedTrack): string {
  return track.genres[0] ?? UNKNOWN_GENRE
}

export function isNationalityGenre(genreKey: string): boolean {
  return NATIONALITY_WORDS.some((word) => new RegExp(`\\b${word}\\b`).test(genreKey))
}

// Heuristique mécanique (pas de jugement de ma part) : deux tags qui se
// terminent par le même mot ("indie pop" / "dream pop" / "chamber pop") sont
// considérés proches. Last.fm n'a pas de vraie donnée de similarité utilisable
// (tag.getSimilar renvoie systématiquement vide).
export function lastWordOf(genreKey: string): string {
  const words = genreKey.trim().split(' ')
  return words[words.length - 1]!
}

export function genreKeyOf(groupKey: string): string {
  return groupKey.startsWith(MERGED_KEY_PREFIX)
    ? groupKey.slice(MERGED_KEY_PREFIX.length)
    : groupKey
}

function sortByGenre(a: TrackGroup, b: TrackGroup): number {
  if (a.key === UNKNOWN_GENRE) return 1
  if (b.key === UNKNOWN_GENRE) return -1
  return b.tracks.length - a.tracks.length || a.key.localeCompare(b.key)
}

// Regroupe les groupes dont clusterKeyOf renvoie la même valeur (null = garder
// tel quel, jamais fusionné). Un cluster d'un seul membre reste inchangé.
export function mergeSmallGroups<T extends TrackGroup>(
  groups: T[],
  clusterKeyOf: (group: T) => string | null,
  buildMerged: (clusterKey: string, members: T[]) => TrackGroup,
): TrackGroup[] {
  const untouched: TrackGroup[] = []
  const clusters = new Map<string, T[]>()

  for (const group of groups) {
    const clusterKey = clusterKeyOf(group)
    if (clusterKey === null) {
      untouched.push(group)
      continue
    }
    const cluster = clusters.get(clusterKey)
    if (cluster) {
      cluster.push(group)
    } else {
      clusters.set(clusterKey, [group])
    }
  }

  const merged: TrackGroup[] = []
  for (const [clusterKey, members] of clusters) {
    merged.push(members.length === 1 ? members[0]! : buildMerged(clusterKey, members))
  }

  return [...untouched, ...merged]
}

export function groupByGenre(tracks: LikedTrack[]): TrackGroup[] {
  const tracksByGenre = new Map<string, LikedTrack[]>()

  for (const track of tracks) {
    const genre = primaryGenreOf(track)
    const genreTracks = tracksByGenre.get(genre)
    if (genreTracks) {
      genreTracks.push(track)
    } else {
      tracksByGenre.set(genre, [track])
    }
  }

  const groups = Array.from(tracksByGenre.entries()).map(([key, genreTracks]) => ({
    key,
    label: key === UNKNOWN_GENRE ? key : formatGenreLabel(key),
    tracks: genreTracks,
  }))

  const merged = mergeSmallGroups(
    groups,
    (group) => {
      if (group.key === UNKNOWN_GENRE || group.tracks.length >= SMALL_GROUP_TRACK_THRESHOLD) {
        return null
      }
      return lastWordOf(group.key)
    },
    (word, members) => ({
      key: `${MERGED_KEY_PREFIX}${word}`,
      label: `${formatGenreLabel(word)} (mix)`,
      tracks: members.flatMap((member) => member.tracks),
    }),
  )

  return merged.sort(sortByGenre)
}
