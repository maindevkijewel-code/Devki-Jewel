/**
 * Generates default transparent-background jewellery images on a canvas.
 * Returns a data-URL that can be used directly as an <img> src.
 * These are lightweight (<15KB) and load instantly — no network request needed.
 */

const cache = new Map<string, string>()

export function generateDefaultTryOnImage(category: string): string {
  const key = category?.toLowerCase() || "necklace"

  if (cache.has(key)) return cache.get(key)!

  const canvas = document.createElement("canvas")
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext("2d")!

  if (key.includes("earring")) {
    drawEarring(ctx, 512, 512)
  } else if (key.includes("ring")) {
    drawRing(ctx, 512, 512)
  } else {
    // Default: necklace / choker / chain
    drawNecklace(ctx, 512, 512)
  }

  const dataUrl = canvas.toDataURL("image/png")
  cache.set(key, dataUrl)
  return dataUrl
}

// ─── Necklace: elegant draped chain with pendant ────────────────────────
function drawNecklace(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2
  const goldGrad = ctx.createLinearGradient(0, 0, w, h)
  goldGrad.addColorStop(0, "#E8C872")
  goldGrad.addColorStop(0.3, "#F5DEB3")
  goldGrad.addColorStop(0.5, "#DAA520")
  goldGrad.addColorStop(0.7, "#F5DEB3")
  goldGrad.addColorStop(1, "#C5973A")

  // Main chain — bezier drape
  ctx.beginPath()
  ctx.moveTo(w * 0.08, h * 0.05)
  ctx.bezierCurveTo(w * 0.12, h * 0.45, w * 0.38, h * 0.72, cx, h * 0.82)
  ctx.bezierCurveTo(w * 0.62, h * 0.72, w * 0.88, h * 0.45, w * 0.92, h * 0.05)
  ctx.strokeStyle = goldGrad
  ctx.lineWidth = 4
  ctx.lineCap = "round"
  ctx.stroke()

  // Inner chain (double-line effect)
  ctx.beginPath()
  ctx.moveTo(w * 0.1, h * 0.05)
  ctx.bezierCurveTo(w * 0.14, h * 0.43, w * 0.39, h * 0.68, cx, h * 0.77)
  ctx.bezierCurveTo(w * 0.61, h * 0.68, w * 0.86, h * 0.43, w * 0.9, h * 0.05)
  ctx.strokeStyle = goldGrad
  ctx.lineWidth = 2.5
  ctx.stroke()

  // Pendant — teardrop
  const py = h * 0.82
  ctx.beginPath()
  ctx.moveTo(cx, py)
  ctx.bezierCurveTo(cx - 18, py + 10, cx - 22, py + 35, cx, py + 50)
  ctx.bezierCurveTo(cx + 22, py + 35, cx + 18, py + 10, cx, py)
  ctx.fillStyle = goldGrad
  ctx.fill()

  // Inner gem highlight
  ctx.beginPath()
  ctx.arc(cx, py + 28, 8, 0, Math.PI * 2)
  ctx.fillStyle = "rgba(255,255,255,0.45)"
  ctx.fill()

  // Chain link dots
  const steps = 18
  for (let i = 1; i < steps; i++) {
    const t = i / steps
    // Approximate position on the bezier
    const x = bezierPoint(w * 0.08, w * 0.12, w * 0.38, cx, t)
    const y = bezierPoint(h * 0.05, h * 0.45, h * 0.72, h * 0.82, t)
    ctx.beginPath()
    ctx.arc(x, y, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = "#DAA520"
    ctx.fill()
  }
  // Right side dots
  for (let i = 1; i < steps; i++) {
    const t = i / steps
    const x = bezierPoint(cx, w * 0.62, w * 0.88, w * 0.92, t)
    const y = bezierPoint(h * 0.82, h * 0.72, h * 0.45, h * 0.05, t)
    ctx.beginPath()
    ctx.arc(x, y, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = "#DAA520"
    ctx.fill()
  }
}

// ─── Earring: drop earring with gem ─────────────────────────────────────
function drawEarring(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2
  const goldGrad = ctx.createLinearGradient(cx - 40, 0, cx + 40, h)
  goldGrad.addColorStop(0, "#E8C872")
  goldGrad.addColorStop(0.5, "#DAA520")
  goldGrad.addColorStop(1, "#C5973A")

  // Hook
  ctx.beginPath()
  ctx.arc(cx, h * 0.15, 18, Math.PI * 0.8, Math.PI * 2.2)
  ctx.strokeStyle = goldGrad
  ctx.lineWidth = 3.5
  ctx.lineCap = "round"
  ctx.stroke()

  // Connector line
  ctx.beginPath()
  ctx.moveTo(cx, h * 0.15 + 18)
  ctx.lineTo(cx, h * 0.42)
  ctx.strokeStyle = goldGrad
  ctx.lineWidth = 2.5
  ctx.stroke()

  // Top decorative circle
  ctx.beginPath()
  ctx.arc(cx, h * 0.42, 12, 0, Math.PI * 2)
  ctx.fillStyle = goldGrad
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx, h * 0.42, 6, 0, Math.PI * 2)
  ctx.fillStyle = "rgba(255,255,255,0.4)"
  ctx.fill()

  // Drop link
  ctx.beginPath()
  ctx.moveTo(cx, h * 0.42 + 12)
  ctx.lineTo(cx, h * 0.55)
  ctx.strokeStyle = goldGrad
  ctx.lineWidth = 2
  ctx.stroke()

  // Main teardrop gem
  ctx.beginPath()
  ctx.moveTo(cx, h * 0.55)
  ctx.bezierCurveTo(cx - 30, h * 0.6, cx - 35, h * 0.75, cx, h * 0.88)
  ctx.bezierCurveTo(cx + 35, h * 0.75, cx + 30, h * 0.6, cx, h * 0.55)
  ctx.fillStyle = goldGrad
  ctx.fill()

  // Inner highlight
  ctx.beginPath()
  ctx.moveTo(cx, h * 0.6)
  ctx.bezierCurveTo(cx - 15, h * 0.64, cx - 18, h * 0.73, cx, h * 0.82)
  ctx.bezierCurveTo(cx + 18, h * 0.73, cx + 15, h * 0.64, cx, h * 0.6)
  ctx.fillStyle = "rgba(255,255,255,0.25)"
  ctx.fill()
}

// ─── Ring: solitaire band ───────────────────────────────────────────────
function drawRing(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2
  const cy = h / 2
  const goldGrad = ctx.createLinearGradient(cx - 80, cy - 80, cx + 80, cy + 80)
  goldGrad.addColorStop(0, "#E8C872")
  goldGrad.addColorStop(0.4, "#F5DEB3")
  goldGrad.addColorStop(0.6, "#DAA520")
  goldGrad.addColorStop(1, "#C5973A")

  // Outer band
  ctx.beginPath()
  ctx.ellipse(cx, cy + 20, 80, 90, 0, 0, Math.PI * 2)
  ctx.strokeStyle = goldGrad
  ctx.lineWidth = 14
  ctx.stroke()

  // Inner highlight
  ctx.beginPath()
  ctx.ellipse(cx, cy + 20, 72, 82, 0, 0, Math.PI * 2)
  ctx.strokeStyle = "rgba(255,255,255,0.15)"
  ctx.lineWidth = 4
  ctx.stroke()

  // Setting/prong at top
  ctx.beginPath()
  ctx.arc(cx, cy - 68, 16, 0, Math.PI * 2)
  ctx.fillStyle = goldGrad
  ctx.fill()

  // Diamond
  ctx.beginPath()
  ctx.arc(cx, cy - 68, 10, 0, Math.PI * 2)
  ctx.fillStyle = "rgba(255,255,255,0.7)"
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx - 3, cy - 72, 3, 0, Math.PI * 2)
  ctx.fillStyle = "rgba(255,255,255,0.9)"
  ctx.fill()
}

// ─── Helpers ────────────────────────────────────────────────────────────
function bezierPoint(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
}
