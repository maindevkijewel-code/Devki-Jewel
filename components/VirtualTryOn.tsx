"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X, Camera, Upload, Download, ShoppingBag, RotateCcw,
  Loader2, AlertCircle, ZoomIn, ZoomOut, Sparkles, Diamond,
} from "lucide-react"
import { useCartStore } from "@/store/cartStore"
import { useIsMobile } from "@/hooks/use-mobile"
import { toast } from "sonner"

// ─── NO top-level import of face-api.js ─────────────────────────────────────
// face-api.js is loaded ONLY at runtime via dynamic import() inside useEffect.
// This prevents Webpack from bundling Node-only deps (fs, encoding, node-fetch)
// into the server build, which would crash Vercel deployment.

interface VirtualTryOnProps {
  isOpen: boolean
  onClose: () => void
  productImageUrl: string
  productName: string
  productCategory: string
  product: any
}

type TabMode = "camera" | "upload"

export default function VirtualTryOn({
  isOpen, onClose, productImageUrl, productName, productCategory, product,
}: VirtualTryOnProps) {
  const isMobile = useIsMobile()
  const addToCart = useCartStore((s) => s.addToCart)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const faceapiRef = useRef<any>(null)
  const jewelleryImgRef = useRef<HTMLImageElement | null>(null)
  const animFrameRef = useRef<number>(0)

  const [tab, setTab] = useState<TabMode>("camera")
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState("")
  const [hasResult, setHasResult] = useState(false)
  const [noFace, setNoFace] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)

  const [manualOffset, setManualOffset] = useState({ x: 0, y: 0 })
  const [manualScale, setManualScale] = useState(1)
  const touchStartRef = useRef<{ x: number; y: number; dist: number }>({ x: 0, y: 0, dist: 0 })

  const jewelleryType = productCategory?.toLowerCase().includes("earring")
    ? "earring"
    : productCategory?.toLowerCase().includes("necklace") || productCategory?.toLowerCase().includes("choker")
      ? "necklace" : "other"

  // ── 1. Load face-api.js models (client-only, dynamic import) ──────────────
  useEffect(() => {
    if (!isOpen) return
    if (typeof window === "undefined") return // SSR guard
    let cancelled = false

    async function loadModels() {
      try {
        setLoadProgress(10)

        // Dynamic import — face-api.js is NEVER in the server bundle
        const faceapi = await import("face-api.js")
        if (cancelled) return
        faceapiRef.current = faceapi
        setLoadProgress(30)

        await faceapi.nets.tinyFaceDetector.loadFromUri("/models")
        if (cancelled) return
        setLoadProgress(65)

        await faceapi.nets.faceLandmark68Net.loadFromUri("/models")
        if (cancelled) return
        setLoadProgress(100)

        setTimeout(() => { if (!cancelled) setModelsLoaded(true) }, 300)
      } catch (err) {
        console.error("Failed to load face-api models:", err)
        if (!cancelled) toast.error("Failed to load face detection models")
      }
    }

    loadModels()
    return () => { cancelled = true }
  }, [isOpen])

  // ── 2. Load jewellery overlay image ───────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !productImageUrl || typeof window === "undefined") return
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => { jewelleryImgRef.current = img }
    img.onerror = () => toast.error("Failed to load try-on image")
    img.src = productImageUrl
  }, [isOpen, productImageUrl])

  // ── 3. Cleanup when modal closes ──────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      stopCamera()
      setHasResult(false)
      setNoFace(false)
      setManualOffset({ x: 0, y: 0 })
      setManualScale(1)
      setModelsLoaded(false)
      setLoadProgress(0)
      setCameraError("")
    }
  }, [isOpen])

  // ── Camera helpers ────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraActive(false)
  }, [])

  const startCamera = useCallback(async () => {
    setCameraError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraActive(true)
        setHasResult(false)
        setNoFace(false)
      }
    } catch (err: any) {
      const msg = err?.name === "NotAllowedError"
        ? "Camera access is needed for live try-on. Please allow camera permissions in your browser settings, or use the Upload Selfie tab."
        : "Could not access camera. Please use the Upload Selfie tab instead."
      setCameraError(msg)
    }
  }, [])

  // ── 4. Auto-start camera when ready ───────────────────────────────────────
  useEffect(() => {
    if (isOpen && tab === "camera" && modelsLoaded && !hasResult) startCamera()
    return () => { if (tab === "camera") stopCamera() }
  }, [isOpen, tab, modelsLoaded, hasResult, startCamera, stopCamera])

  // ── Face detection + jewellery overlay drawing ────────────────────────────
  const detectAndDraw = useCallback(async (source: HTMLVideoElement | HTMLImageElement) => {
    const faceapi = faceapiRef.current
    const canvas = canvasRef.current
    const jewImg = jewelleryImgRef.current
    if (!faceapi || !canvas || !jewImg) return

    const isVideo = source instanceof HTMLVideoElement
    const sw = isVideo ? source.videoWidth : source.naturalWidth || source.width
    const sh = isVideo ? source.videoHeight : source.naturalHeight || source.height
    if (!sw || !sh) return

    canvas.width = sw
    canvas.height = sh
    const ctx = canvas.getContext("2d")!

    // Draw source (mirror for selfie camera)
    ctx.save()
    if (isVideo) { ctx.scale(-1, 1); ctx.drawImage(source, -sw, 0, sw, sh) }
    else { ctx.drawImage(source, 0, 0, sw, sh) }
    ctx.restore()

    // Detect face
    const detection = await faceapi
      .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
      .withFaceLandmarks()

    if (!detection) {
      setNoFace(true)
      setIsDetecting(false)
      return
    }

    setNoFace(false)
    const landmarks = detection.landmarks
    const jaw = landmarks.getJawOutline()

    if (jewelleryType === "earring") {
      const leftEar = jaw[0]
      const rightEar = jaw[16]
      const faceWidth = Math.abs(rightEar.x - leftEar.x)
      const earSize = faceWidth * 0.25 * manualScale
      const angle = Math.atan2(rightEar.y - leftEar.y, rightEar.x - leftEar.x) * 0.3

      for (const ear of [leftEar, rightEar]) {
        const ex = ear.x + manualOffset.x
        const ey = ear.y + (faceWidth * 0.08) + manualOffset.y
        ctx.save()
        ctx.translate(ex, ey)
        ctx.rotate(angle)
        ctx.drawImage(jewImg, -earSize / 2, 0, earSize, earSize * (jewImg.height / jewImg.width))
        ctx.restore()
      }
    } else {
      const left = jaw[3]
      const right = jaw[13]
      const cx = (left.x + right.x) / 2 + manualOffset.x
      const faceHeight = detection.detection.box.height
      const cy = (left.y + right.y) / 2 + faceHeight * 0.35 + manualOffset.y
      const faceWidth = Math.abs(right.x - left.x)
      const neckWidth = faceWidth * 1.1 * manualScale
      const angle = Math.atan2(right.y - left.y, right.x - left.x)

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(angle)
      ctx.drawImage(jewImg, -neckWidth / 2, -neckWidth * (jewImg.height / jewImg.width) * 0.3, neckWidth, neckWidth * (jewImg.height / jewImg.width))
      ctx.restore()
    }

    setHasResult(true)
    setIsDetecting(false)
  }, [jewelleryType, manualOffset, manualScale])

  // ── 5. Live camera detection loop ─────────────────────────────────────────
  useEffect(() => {
    if (!cameraActive || !modelsLoaded || hasResult) return
    let running = true
    let lastTime = 0
    const interval = 120

    const loop = (time: number) => {
      if (!running) return
      if (time - lastTime > interval && videoRef.current && videoRef.current.readyState >= 2) {
        lastTime = time
        detectAndDraw(videoRef.current)
      }
      animFrameRef.current = requestAnimationFrame(loop)
    }
    animFrameRef.current = requestAnimationFrame(loop)
    return () => { running = false; cancelAnimationFrame(animFrameRef.current) }
  }, [cameraActive, modelsLoaded, hasResult, detectAndDraw])

  // ── 6. Re-draw when manual adjustments change ─────────────────────────────
  useEffect(() => {
    if (!hasResult) return
    if (videoRef.current && tab === "camera") {
      detectAndDraw(videoRef.current)
    }
  }, [manualOffset, manualScale, hasResult, tab, detectAndDraw])

  // ── Action handlers ───────────────────────────────────────────────────────
  const captureFrame = useCallback(() => {
    if (!videoRef.current) return
    setIsDetecting(true)
    stopCamera()
    detectAndDraw(videoRef.current)
  }, [stopCamera, detectAndDraw])

  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload a JPG or PNG"); return }
    const reader = new FileReader()
    reader.onload = () => {
      const img = new window.Image()
      img.onload = () => {
        setIsDetecting(true)
        detectAndDraw(img)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }, [detectAndDraw])

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const out = document.createElement("canvas")
    out.width = canvas.width; out.height = canvas.height
    const octx = out.getContext("2d")!
    octx.drawImage(canvas, 0, 0)
    octx.save()
    octx.font = `${Math.max(12, Math.round(canvas.width * 0.028))}px sans-serif`
    octx.fillStyle = "rgba(255,255,255,0.55)"
    octx.textAlign = "right"
    octx.fillText("Devki Jewels Try-On", canvas.width - 12, canvas.height - 12)
    octx.restore()
    out.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url
      a.download = `tryon-${productName.replace(/\s+/g, "-").toLowerCase()}.png`
      a.click(); URL.revokeObjectURL(url)
    }, "image/png")
  }, [productName])

  const handleAddToCart = useCallback(() => {
    if (product) { addToCart(product); toast.success("Added to cart!") }
  }, [product, addToCart])

  const handleReset = useCallback(() => {
    setHasResult(false); setNoFace(false)
    setManualOffset({ x: 0, y: 0 }); setManualScale(1)
    if (tab === "camera") startCamera()
  }, [tab, startCamera])

  // ── Touch handlers for pinch/drag ─────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0 }
    } else if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      touchStartRef.current.dist = Math.hypot(dx, dy)
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - touchStartRef.current.x
      const dy = e.touches[0].clientY - touchStartRef.current.y
      setManualOffset((p) => ({ x: p.x + dx * 2, y: p.y + dy * 2 }))
      touchStartRef.current.x = e.touches[0].clientX
      touchStartRef.current.y = e.touches[0].clientY
    } else if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      const dist = Math.hypot(dx, dy)
      if (touchStartRef.current.dist > 0) {
        setManualScale((p) => Math.max(0.3, Math.min(3, p * (dist / touchStartRef.current.dist))))
      }
      touchStartRef.current.dist = dist
    }
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className={`bg-white relative flex flex-col overflow-hidden ${isMobile ? "w-full h-full" : "w-full max-w-2xl h-[90vh] rounded-2xl shadow-2xl"}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0 bg-white">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Virtual Try-On</h2>
              <p className="text-xs text-gray-500 truncate max-w-[200px]">{productName}</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors" aria-label="Close">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Loading Screen */}
          {!modelsLoaded && (
            <div className="flex-1 flex items-center justify-center bg-[#FDFBF9]">
              <div className="text-center space-y-5 px-8">
                <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }} transition={{ repeat: Infinity, duration: 1.8 }}>
                  <Diamond className="w-14 h-14 text-[#B76E79] mx-auto" />
                </motion.div>
                <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden mx-auto">
                  <motion.div className="h-full bg-[#B76E79] rounded-full" animate={{ width: `${loadProgress}%` }} transition={{ duration: 0.3 }} />
                </div>
                <p className="text-sm text-gray-500">Loading Magic… {loadProgress}%</p>
              </div>
            </div>
          )}

          {/* Main UI after models loaded */}
          {modelsLoaded && (
            <>
              {/* Tabs */}
              <div className="flex border-b border-gray-100 shrink-0">
                {(["camera", "upload"] as TabMode[]).map((t) => (
                  <button key={t} onClick={() => { setTab(t); setHasResult(false); setNoFace(false); setManualOffset({ x: 0, y: 0 }); setManualScale(1) }}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors min-h-[44px] ${tab === t ? "text-[#B76E79] border-b-2 border-[#B76E79]" : "text-gray-500 hover:text-gray-700"}`}>
                    {t === "camera" ? <Camera className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                    {t === "camera" ? "Live Camera" : "Upload Selfie"}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden relative bg-gray-950 flex items-center justify-center">
                {/* Video */}
                {tab === "camera" && !hasResult && (
                  <video ref={videoRef} playsInline muted autoPlay className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                )}

                {/* Canvas */}
                <canvas ref={canvasRef}
                  className={`${!hasResult && tab === "camera" ? "absolute inset-0 w-full h-full opacity-0 pointer-events-none" : "w-full h-full object-contain"}`}
                  onTouchStart={hasResult ? handleTouchStart : undefined}
                  onTouchMove={hasResult ? handleTouchMove : undefined}
                  style={{ touchAction: "none" }}
                />

                {/* Camera error */}
                {cameraError && tab === "camera" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-950 p-8">
                    <div className="text-center max-w-xs">
                      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                      <p className="text-white text-sm mb-4 leading-relaxed">{cameraError}</p>
                      <div className="flex gap-2 justify-center">
                        <button onClick={startCamera} className="px-4 py-2.5 bg-[#B76E79] text-white rounded-xl text-sm min-h-[44px]">Retry</button>
                        <button onClick={() => { setTab("upload"); setCameraError("") }} className="px-4 py-2.5 bg-white/10 text-white rounded-xl text-sm border border-white/20 min-h-[44px]">Upload Instead</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload area */}
                {tab === "upload" && !hasResult && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 p-8">
                    <label className="cursor-pointer w-full max-w-sm">
                      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center hover:border-[#B76E79] transition-colors">
                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-700 mb-1">Tap to upload a selfie</p>
                        <p className="text-xs text-gray-500">JPG or PNG, max 5MB</p>
                      </div>
                      <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }} />
                    </label>
                  </div>
                )}

                {/* Detecting */}
                {isDetecting && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3 shadow-xl">
                      <Loader2 className="w-8 h-8 animate-spin text-[#B76E79]" />
                      <p className="text-sm font-medium text-gray-700">Detecting face…</p>
                    </div>
                  </div>
                )}

                {/* No face */}
                {noFace && !isDetecting && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-xl text-sm max-w-[90%] text-center">
                    No face detected. Please try a clearer, well-lit photo.
                  </div>
                )}

                {/* Touch hint */}
                {hasResult && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1.5 rounded-full text-[11px]">
                    Drag to move • Pinch to resize
                  </div>
                )}
              </div>

              {/* Bottom controls */}
              <div className="shrink-0 bg-white border-t border-gray-100 px-4 py-4 space-y-3">
                {tab === "camera" && cameraActive && !hasResult && (
                  <div className="flex items-center justify-center">
                    <button onClick={captureFrame} className="w-16 h-16 rounded-full bg-[#B76E79] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform" aria-label="Capture">
                      <Camera className="w-7 h-7" />
                    </button>
                  </div>
                )}

                {hasResult && !isMobile && (
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => setManualScale((p) => Math.max(0.3, p - 0.1))} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"><ZoomOut className="w-4 h-4" /></button>
                    <span className="text-xs text-gray-500 w-12 text-center">{Math.round(manualScale * 100)}%</span>
                    <button onClick={() => setManualScale((p) => Math.min(3, p + 0.1))} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"><ZoomIn className="w-4 h-4" /></button>
                  </div>
                )}

                {hasResult && (
                  <div className="flex gap-2">
                    <button onClick={handleAddToCart} className="flex-1 bg-[#522D6D] text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform min-h-[48px]">
                      <ShoppingBag className="w-4 h-4" /> Add to Cart
                    </button>
                    <button onClick={handleDownload} className="w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50" aria-label="Download"><Download className="w-5 h-5 text-gray-600" /></button>
                    <button onClick={handleReset} className="w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50" aria-label="Try Another"><RotateCcw className="w-5 h-5 text-gray-600" /></button>
                  </div>
                )}

                <p className="text-[10px] text-gray-400 text-center">AI-generated preview — actual product may vary slightly.</p>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
