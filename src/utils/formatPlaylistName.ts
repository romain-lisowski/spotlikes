const monthYearFormatter = new Intl.DateTimeFormat('fr-FR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

function monthKeyToDate(monthKey: string): Date {
  const [yearPart, monthPart] = monthKey.split('-')
  return new Date(Date.UTC(Number(yearPart), Number(monthPart) - 1, 1))
}

export function formatMonthLabel(monthKey: string): string {
  return monthYearFormatter.format(monthKeyToDate(monthKey))
}

export function formatPlaylistName(monthKey: string): string {
  return `Likes — ${formatMonthLabel(monthKey)}`
}
