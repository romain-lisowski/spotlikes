import { UNKNOWN_GENRE, formatGenreLabel, MERGED_KEY_PREFIX } from './groupByGenre'

export function formatQuarterLabel(quarterKey: string): string {
  const [yearPart, quarterPart] = quarterKey.split('-Q')
  return `T${quarterPart} ${yearPart}`
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

function pick<T>(items: T[], seed: string): T {
  return items[hashString(seed) % items.length]!
}

const GENRE_ADJECTIVES = [
  'Dirty',
  'Electric',
  'Mellow',
  'Golden',
  'Midnight',
  'Velvet',
  'Wild',
  'Hazy',
  'Neon',
  'Smooth',
  'Raw',
  'Dreamy',
  'Sunset',
  'Feral',
  'Silver',
  'Crimson',
  'Frozen',
  'Blazing',
  'Lush',
  'Faded',
  'Amber',
  'Cosmic',
  'Restless',
  'Quiet',
  'Loud',
  'Vivid',
  'Rusty',
  'Warm',
  'Static',
  'Analog',
  'Nostalgic',
  'Fearless',
  'Tender',
  'Gritty',
  'Bold',
  'Bright',
  'Distant',
  'Endless',
  'Secret',
  'Reckless',
]

const QUARTER_KEY_PATTERN = /^\d{4}-Q[1-4]$/

function genreNameFor(genreKey: string): string {
  if (genreKey === UNKNOWN_GENRE) return 'Mystery Mix'
  return `${pick(GENRE_ADJECTIVES, genreKey)} ${formatGenreLabel(genreKey)}`
}

// Les playlists par trimestre gardent le nom brut ("T1 2022") ; seules les
// playlists par genre reçoivent un nom généré, plus accrocheur.
export function formatPlaylistName(group: { key: string }): string {
  if (QUARTER_KEY_PATTERN.test(group.key)) {
    return formatQuarterLabel(group.key)
  }
  const key = group.key.startsWith(MERGED_KEY_PREFIX)
    ? group.key.slice(MERGED_KEY_PREFIX.length)
    : group.key
  return genreNameFor(key)
}
