export type CoverKind = 'genre' | 'year'

const GENRE_PALETTES: [string, string][] = [
  ['#1DB954', '#191414'],
  ['#1DB954', '#0d47a1'],
  ['#1ed760', '#4a148c'],
  ['#1DB954', '#b71c1c'],
  ['#1DB954', '#e65100'],
  ['#1DB954', '#006064'],
]

const YEAR_PALETTES: [string, string][] = [
  ['#0d47a1', '#000051'],
  ['#1565c0', '#0d1b2a'],
  ['#283593', '#000051'],
  ['#01579b', '#001233'],
]

const CANVAS_SIZE = 640

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

export function paletteFor(seed: string, kind: CoverKind): [string, string] {
  const palettes = kind === 'year' ? YEAR_PALETTES : GENRE_PALETTES
  return palettes[hashString(seed) % palettes.length]!
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

// Un disque vinyle pour les covers "par genre" — évoque la musique.
function drawVinylIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(cx, cy, 38, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, 26, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.beginPath()
  ctx.arc(cx, cy, 6, 0, Math.PI * 2)
  ctx.fill()
}

// Un calendrier pour les covers "par année" — évoque le temps qui passe.
function drawCalendarIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  const width = 84
  const height = 70
  const x = cx - width / 2
  const y = cy - height / 2

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.lineWidth = 4
  ctx.strokeRect(x, y, width, height)
  ctx.beginPath()
  ctx.moveTo(x, y + 20)
  ctx.lineTo(x + width, y + 20)
  ctx.stroke()

  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x + 18, y - 10)
  ctx.lineTo(x + 18, y + 10)
  ctx.moveTo(x + width - 18, y - 10)
  ctx.lineTo(x + width - 18, y + 10)
  ctx.stroke()
}

export function generateCoverImageBase64(seed: string, title: string, kind: CoverKind): string {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_SIZE
  canvas.height = CANVAS_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Impossible de générer une image de couverture (canvas indisponible)')
  }

  const [colorA, colorB] = paletteFor(seed, kind)
  const gradient = ctx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  gradient.addColorStop(0, colorA)
  gradient.addColorStop(1, colorB)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'white'

  if (kind === 'year') {
    drawCalendarIcon(ctx, CANVAS_SIZE / 2, 150)
    ctx.font = 'bold 150px sans-serif'
    ctx.fillText(title, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 40)
  } else {
    drawVinylIcon(ctx, CANVAS_SIZE / 2, 120)
    ctx.font = 'bold 54px sans-serif'
    const lines = wrapText(title.toUpperCase(), 520, (line) => ctx.measureText(line).width)
    const lineHeight = 64
    const startY = CANVAS_SIZE / 2 - ((lines.length - 1) * lineHeight) / 2 + 30
    for (const [index, line] of lines.entries()) {
      ctx.fillText(line, CANVAS_SIZE / 2, startY + index * lineHeight)
    }
  }

  ctx.font = '600 22px sans-serif'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.fillText('SPOTLIKES', CANVAS_SIZE / 2, CANVAS_SIZE - 60)

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
  return dataUrl.replace(/^data:image\/jpeg;base64,/, '')
}
