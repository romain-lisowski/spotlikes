import { UNKNOWN_GENRE, formatGenreLabel } from './groupByGenre'

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

// Deux picks indépendants (via des sels différents) sur un même pool de mots
// multiplient les combinaisons possibles et réduisent fortement les répétitions.
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

const SEASON_BY_QUARTER: Record<string, string> = {
  '1': 'Winter',
  '2': 'Spring',
  '3': 'Summer',
  '4': 'Fall',
}

const QUARTER_NOUNS = [
  'Mixtape',
  'Rewind',
  'Sessions',
  'Tape',
  'Flashback',
  'Rotation',
  'Archive',
  'Waves',
]

const QUARTER_KEY_PATTERN = /^\d{4}-Q[1-4]$/

function quarterNameFor(quarterKey: string): string {
  const [year, quarterPart] = quarterKey.split('-Q')
  const season = SEASON_BY_QUARTER[quarterPart!] ?? 'Year'
  const noun = pick(QUARTER_NOUNS, `${quarterKey}-noun`)
  return `${season} ${noun} ${year}`
}

function genreNameFor(genreKey: string): string {
  if (genreKey === UNKNOWN_GENRE) return 'Mystery Mix'
  return `${pick(GENRE_ADJECTIVES, genreKey)} ${formatGenreLabel(genreKey)}`
}

export function formatPlaylistName(group: { key: string }): string {
  if (group.key.includes('|')) {
    const [genreKey, quarterKey] = group.key.split('|')
    return `${genreNameFor(genreKey!)} — ${quarterNameFor(quarterKey!)}`
  }
  if (QUARTER_KEY_PATTERN.test(group.key)) {
    return quarterNameFor(group.key)
  }
  return genreNameFor(group.key)
}
