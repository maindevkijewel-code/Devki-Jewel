"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, X, Send, Loader2, CheckCircle2 } from "lucide-react"
import { getInquiries, replyToInquiry } from "../actions/inquiries"
import { toast } from "sonner"

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null)
  const [reply, setReply] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all")

  const load = useCallback(async () => {
    const data = await getInquiries()
    setInquiries(data)
    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleReply = async () => {
    if (!reply.trim() || !selectedInquiry) return
    setIsSending(true)
    const res = await replyToInquiry(selectedInquiry.id, reply)
    setIsSending(false)
    if (res.success) {
      toast.success("Reply sent & marked as resolved")
      setSelectedInquiry(null)
      setReply("")
      load()
    } else toast.error(res.error || "Failed to send reply")
  }

  const filtered = inquiries.filter(inq => {
    if (filter === "open") return !inq.is_resolved
    if (filter === "resolved") return inq.is_resolved
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Inquiries</h1>
        <p className="text-sm text-gray-500 mt-1">Customer messages and contact form submissions</p>
      </div>

      <div className="flex gap-2">
        {(["all", "open", "resolved"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${filter === f ? "bg-[#522D6D] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Subject</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Message</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">{Array.from({ length: 6 }).map((_, j) => <td key={j} className="py-3 px-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />No inquiries found
                </td></tr>
              ) : (
                filtered.map(inq => (
                  <tr key={inq.id} onClick={() => { setSelectedInquiry(inq); setReply(inq.admin_reply || "") }} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer">
                    <td className="py-3 px-4 text-gray-500 text-xs whitespace-nowrap">{new Date(inq.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{inq.name}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{inq.email}</td>
                    <td className="py-3 px-4 text-gray-600">{inq.subject || "–"}</td>
                    <td className="py-3 px-4 text-gray-500 max-w-[200px] truncate">{inq.message}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${inq.is_resolved ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {inq.is_resolved && <CheckCircle2 className="w-3 h-3" />}
                        {inq.is_resolved ? "Resolved" : "Open"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reply Modal */}
      <AnimatePresence>
        {selectedInquiry && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedInquiry(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Inquiry from {selectedInquiry.name}</h2>
                <button onClick={() => setSelectedInquiry(null)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-sm"><span className="text-gray-400">Email:</span> <span className="font-medium">{selectedInquiry.email}</span></div>
                {selectedInquiry.subject && <div className="text-sm"><span className="text-gray-400">Subject:</span> <span className="font-medium">{selectedInquiry.subject}</span></div>}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Message</h3>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded-xl p-4 whitespace-pre-wrap">{selectedInquiry.message}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Admin Reply</label>
                  <textarea value={reply} onChange={e => setReply(e.target.value)} rows={4} placeholder="Type your reply…" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#522D6D]/20 focus:border-[#522D6D] resize-none" />
                </div>
              </div>
              <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 flex justify-end gap-3">
                <button onClick={() => setSelectedInquiry(null)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={handleReply} disabled={isSending || !reply.trim()} className="px-5 py-2.5 bg-[#522D6D] text-white rounded-xl text-sm font-medium hover:bg-[#6B3D8A] disabled:opacity-50 flex items-center gap-2">
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Reply & Resolve
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
