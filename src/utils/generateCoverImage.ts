const GRADIENT_PALETTES: [string, string][] = [
  ['#1DB954', '#191414'],
  ['#1DB954', '#0d47a1'],
  ['#1ed760', '#4a148c'],
  ['#1DB954', '#b71c1c'],
  ['#1DB954', '#e65100'],
  ['#1DB954', '#006064'],
]

const CANVAS_SIZE = 640

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

export function paletteFor(seed: string): [string, string] {
  return GRADIENT_PALETTES[hashString(seed) % GRADIENT_PALETTES.length]!
}

export function wrapText(
  text: string,
  maxWidth: number,
  measureWidth: (text: string) => number,
): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (measureWidth(testLine) > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

export function generateCoverImageBase64(seed: string, title: string): string {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_SIZE
  canvas.height = CANVAS_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Impossible de générer une image de couverture (canvas indisponible)')
  }

  const [colorA, colorB] = paletteFor(seed)
  const gradient = ctx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  gradient.addColorStop(0, colorA)
  gradient.addColorStop(1, colorB)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

  ctx.fillStyle = 'white'
  ctx.font = 'bold 54px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const lines = wrapText(title.toUpperCase(), 520, (line) => ctx.measureText(line).width)
  const lineHeight = 64
  const startY = CANVAS_SIZE / 2 - ((lines.length - 1) * lineHeight) / 2
  for (const [index, line] of lines.entries()) {
    ctx.fillText(line, CANVAS_SIZE / 2, startY + index * lineHeight)
  }

  ctx.font = '600 22px sans-serif'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.fillText('SPOTLIKES', CANVAS_SIZE / 2, CANVAS_SIZE - 60)

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
  return dataUrl.replace(/^data:image\/jpeg;base64,/, '')
}
