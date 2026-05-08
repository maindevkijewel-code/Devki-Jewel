"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  Wand2,
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Zap,
  Eye,
  ImageIcon,
  ArrowRight,
} from "lucide-react"
import { toast } from "sonner"

type ProcessingStep = "idle" | "uploading" | "removing" | "optimizing" | "saving" | "completed" | "error"

const STEP_LABELS: Record<ProcessingStep, string> = {
  idle: "Ready",
  uploading: "Uploading Image...",
  removing: "AI Removing Background...",
  optimizing: "Optimizing For Try-On...",
  saving: "Saving Transparent PNG...",
  completed: "Completed Successfully ✨",
  error: "Processing Failed",
}

const STEP_ICONS: Record<ProcessingStep, React.ReactNode> = {
  idle: <Wand2 className="w-5 h-5" />,
  uploading: <Loader2 className="w-5 h-5 animate-spin" />,
  removing: <Sparkles className="w-5 h-5 animate-pulse" />,
  optimizing: <Zap className="w-5 h-5 animate-bounce" />,
  saving: <Loader2 className="w-5 h-5 animate-spin" />,
  completed: <CheckCircle2 className="w-5 h-5" />,
  error: <XCircle className="w-5 h-5" />,
}

interface AIBackgroundRemoverProps {
  imageUrls: string[]
  productId?: string
  onTransparentImageReady: (url: string) => void
  existingTransparentUrl?: string
  onTryOnAutoEnabled?: () => void
}

export default function AIBackgroundRemover({
  imageUrls,
  productId,
  onTransparentImageReady,
  existingTransparentUrl,
  onTryOnAutoEnabled,
}: AIBackgroundRemoverProps) {
  const [step, setStep] = useState<ProcessingStep>(existingTransparentUrl ? "completed" : "idle")
  const [transparentUrl, setTransparentUrl] = useState(existingTransparentUrl || "")
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isCompareMode, setIsCompareMode] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [progress, setProgress] = useState(0)
  const manualUploadRef = useRef<HTMLInputElement>(null)

  const simulateProgress = useCallback((targetStep: ProcessingStep, targetProgress: number, duration: number) => {
    const start = progress
    const diff = targetProgress - start
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const fraction = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - fraction, 3)
      setProgress(Math.round(start + diff * eased))

      if (fraction < 1) {
        requestAnimationFrame(animate)
      }
    }

    setStep(targetStep)
    requestAnimationFrame(animate)
  }, [progress])

  const handleAutoRemove = async () => {
    if (imageUrls.length === 0) {
      toast.error("Upload a product image first")
      return
    }

    const sourceImage = imageUrls[selectedImageIndex]
    setErrorMessage("")
    setProgress(0)

    try {
      // Step 1: Uploading
      simulateProgress("uploading", 20, 800)
      await new Promise((r) => setTimeout(r, 900))

      // Step 2: Removing background
      simulateProgress("removing", 60, 3000)

      const response = await fetch("/api/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: sourceImage,
          productId: productId || null,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Background removal failed")
      }

      // Step 3: Optimizing
      simulateProgress("optimizing", 85, 600)
      await new Promise((r) => setTimeout(r, 700))

      // Step 4: Saving
      simulateProgress("saving", 95, 400)
      await new Promise((r) => setTimeout(r, 500))

      // Step 5: Done
      setProgress(100)
      setStep("completed")
      setTransparentUrl(data.transparentUrl)
      onTransparentImageReady(data.transparentUrl)
      onTryOnAutoEnabled?.()

      toast.success("🎉 Background removed & Try-On ready!")
    } catch (error: any) {
      setStep("error")
      setProgress(0)
      setErrorMessage(error.message || "Something went wrong")
      toast.error(error.message || "Background removal failed")
    }
  }

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== "image/png") {
      toast.error("Please upload a PNG file for transparency")
      return
    }

    setStep("saving")
    setProgress(50)

    try {
      const fd = new FormData()
      fd.append("file", file)

      // Use the tryon upload action
      const { uploadTransparentImage } = await import("../actions/bg-removal")
      const res = await uploadTransparentImage(fd)

      if (res.success && res.url) {
        setTransparentUrl(res.url)
        setStep("completed")
        setProgress(100)
        onTransparentImageReady(res.url)
        toast.success("Transparent image uploaded successfully!")
      } else {
        throw new Error(res.error || "Upload failed")
      }
    } catch (error: any) {
      setStep("error")
      setProgress(0)
      setErrorMessage(error.message)
      toast.error(error.message)
    }

    if (manualUploadRef.current) manualUploadRef.current.value = ""
  }

  const handleRetry = () => {
    setStep("idle")
    setProgress(0)
    setErrorMessage("")
    setTransparentUrl("")
  }

  const isProcessing = ["uploading", "removing", "optimizing", "saving"].includes(step)
  const stepColors: Record<ProcessingStep, string> = {
    idle: "from-[#522D6D] to-[#7B4F9A]",
    uploading: "from-blue-500 to-blue-600",
    removing: "from-purple-500 to-pink-500",
    optimizing: "from-amber-500 to-orange-500",
    saving: "from-emerald-500 to-teal-500",
    completed: "from-emerald-500 to-green-500",
    error: "from-red-500 to-rose-500",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="border border-purple-200/50 rounded-2xl overflow-hidden bg-gradient-to-br from-[#522D6D]/[0.03] via-white to-purple-50/30"
    >
      {/* Header */}
      <div className="relative px-5 py-4 border-b border-purple-100/50">
        <div className="absolute inset-0 bg-gradient-to-r from-[#522D6D]/5 to-transparent" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#522D6D] to-[#7B4F9A] flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Sparkles className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                AI Background Removal
                <span className="text-[10px] font-medium text-white bg-gradient-to-r from-[#522D6D] to-[#7B4F9A] px-1.5 py-0.5 rounded-full">
                  AUTO
                </span>
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Powered by Remove.bg • Auto Try-On Integration</p>
            </div>
          </div>
          {transparentUrl && step === "completed" && (
            <button
              type="button"
              onClick={() => setIsCompareMode(!isCompareMode)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#522D6D] bg-[#522D6D]/5 rounded-lg hover:bg-[#522D6D]/10 transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              {isCompareMode ? "Hide Compare" : "Compare"}
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5">
        {/* Processing Progress Bar */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {STEP_ICONS[step]}
                  <span className="text-sm font-medium text-gray-700">{STEP_LABELS[step]}</span>
                </div>
                <span className="text-xs font-mono text-gray-500">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${stepColors[step]}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
              {/* Step indicators */}
              <div className="flex justify-between mt-3">
                {(["uploading", "removing", "optimizing", "saving"] as const).map((s, i) => {
                  const stepIndex = ["uploading", "removing", "optimizing", "saving"].indexOf(step)
                  const thisIndex = i
                  const isDone = thisIndex < stepIndex
                  const isCurrent = thisIndex === stepIndex
                  return (
                    <div key={s} className="flex items-center gap-1.5">
                      <div
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          isDone
                            ? "bg-green-400 scale-100"
                            : isCurrent
                            ? "bg-purple-500 scale-125 animate-pulse"
                            : "bg-gray-200"
                        }`}
                      />
                      <span
                        className={`text-[10px] ${
                          isDone ? "text-green-600 font-medium" : isCurrent ? "text-purple-600 font-medium" : "text-gray-400"
                        }`}
                      >
                        {s === "uploading" ? "Upload" : s === "removing" ? "Remove BG" : s === "optimizing" ? "Optimize" : "Save"}
                      </span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Source Image Selection */}
        {imageUrls.length > 0 && step === "idle" && (
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-600 mb-2 block">Select Source Image</label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {imageUrls.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImageIndex(i)}
                  className={`relative w-16 h-16 rounded-xl border-2 overflow-hidden flex-shrink-0 transition-all ${
                    selectedImageIndex === i
                      ? "border-[#522D6D] ring-2 ring-[#522D6D]/20 scale-105"
                      : "border-gray-200 hover:border-[#522D6D]/40"
                  }`}
                >
                  <Image src={url} alt="" fill className="object-cover" />
                  {selectedImageIndex === i && (
                    <div className="absolute inset-0 bg-[#522D6D]/10 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-[#522D6D]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Before/After Compare View */}
        <AnimatePresence>
          {isCompareMode && transparentUrl && imageUrls.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <div className="absolute top-2 left-2 z-10 text-[10px] font-semibold text-white bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    ORIGINAL
                  </div>
                  <div className="aspect-square relative">
                    <Image
                      src={imageUrls[selectedImageIndex]}
                      alt="Original"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-purple-200 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%3E%3Crect%20width%3D%228%22%20height%3D%228%22%20fill%3D%22%23f0f0f0%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%228%22%20width%3D%228%22%20height%3D%228%22%20fill%3D%22%23f0f0f0%22%2F%3E%3C%2Fsvg%3E')]">
                  <div className="absolute top-2 left-2 z-10 text-[10px] font-semibold text-white bg-gradient-to-r from-[#522D6D] to-[#7B4F9A] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI PROCESSED
                  </div>
                  <div className="aspect-square relative">
                    <Image
                      src={transparentUrl}
                      alt="Transparent"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completed State */}
        {step === "completed" && transparentUrl && !isCompareMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4"
          >
            <div className="relative rounded-xl overflow-hidden border border-green-200 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%3E%3Crect%20width%3D%228%22%20height%3D%228%22%20fill%3D%22%23f0f0f0%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%228%22%20width%3D%228%22%20height%3D%228%22%20fill%3D%22%23f0f0f0%22%2F%3E%3C%2Fsvg%3E')]">
              <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 text-[10px] font-semibold text-white bg-green-500 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                TRANSPARENT PNG
              </div>
              <div className="w-full h-32 relative">
                <Image
                  src={transparentUrl}
                  alt="Transparent"
                  fill
                  className="object-contain p-3"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 rounded-lg border border-green-100">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-green-700">Auto-linked to Virtual Try-On</p>
                <p className="text-[10px] text-green-600/70 truncate">{transparentUrl.split("/").pop()}</p>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="p-1.5 text-gray-400 hover:text-[#522D6D] transition-colors"
                title="Re-process"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {step === "error" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 p-3 bg-red-50 rounded-xl border border-red-100"
          >
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-red-700">Background Removal Failed</p>
                <p className="text-[10px] text-red-600/70 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Try Again
            </button>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* AI Remove Button */}
          <button
            type="button"
            onClick={handleAutoRemove}
            disabled={isProcessing || imageUrls.length === 0}
            className={`flex-1 relative overflow-hidden flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              isProcessing
                ? "bg-gray-400"
                : "bg-gradient-to-r from-[#522D6D] to-[#7B4F9A] hover:from-[#6B3D8A] hover:to-[#9265B5] shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : step === "completed" ? (
              <>
                <RotateCcw className="w-4 h-4" />
                Re-Process
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                AI Remove Background
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </>
            )}
            {/* Shimmer effect */}
            {!isProcessing && step !== "completed" && (
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            )}
          </button>

          {/* Manual Upload (fallback) */}
          <button
            type="button"
            onClick={() => manualUploadRef.current?.click()}
            disabled={isProcessing}
            className="px-3 py-3 rounded-xl text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:text-[#522D6D] hover:border-[#522D6D]/30 transition-all disabled:opacity-50"
            title="Upload transparent PNG manually"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            ref={manualUploadRef}
            type="file"
            accept="image/png"
            onChange={handleManualUpload}
            className="hidden"
          />
        </div>

        {/* Info text */}
        {step === "idle" && (
          <p className="text-[10px] text-gray-400 mt-2.5 text-center">
            AI will auto-remove background, generate transparent PNG, and link to Virtual Try-On
          </p>
        )}
      </div>

      {/* Inline shimmer animation keyframes */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </motion.div>
  )
}
