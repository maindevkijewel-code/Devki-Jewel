"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  TrendingUp, TrendingDown, Minus, Plus, Trash2, Save, Loader2,
  RefreshCw, Calendar, ChevronDown, History
} from "lucide-react"
import { toast } from "sonner"
import {
  getAllMetalRates, getAllRateHistory, updateMetalRate,
  addRateHistoryEntry, deleteRateHistoryEntry,
  type MetalRate, type MetalRateHistory,
} from "../actions/metal-rates"

export default function LiveRatesAdminPage() {
  const [rates, setRates] = useState<MetalRate[]>([])
  const [history, setHistory] = useState<MetalRateHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingPrices, setEditingPrices] = useState<Record<string, string>>({})
  const [savingType, setSavingType] = useState<string | null>(null)

  // History form
  const [historyMetal, setHistoryMetal] = useState("Gold 22K")
  const [historyPrice, setHistoryPrice] = useState("")
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split("T")[0])
  const [isAddingHistory, setIsAddingHistory] = useState(false)

  // Filter
  const [historyFilter, setHistoryFilter] = useState("all")

  const loadData = useCallback(async () => {
    const [ratesData, historyData] = await Promise.all([
      getAllMetalRates(),
      getAllRateHistory(),
    ])
    setRates(ratesData)
    setHistory(historyData)
    const priceMap: Record<string, string> = {}
    ratesData.forEach(r => { priceMap[r.metal_type] = String(r.current_price) })
    setEditingPrices(priceMap)
    setIsLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleUpdateRate = async (metalType: string) => {
    const price = Number(editingPrices[metalType])
    if (!price || price <= 0) { toast.error("Enter a valid price"); return }
    setSavingType(metalType)
    const res = await updateMetalRate(metalType, price)
    setSavingType(null)
    if (res.success) { toast.success(`${metalType} rate updated`); loadData() }
    else toast.error(res.error || "Update failed")
  }

  const handleAddHistory = async () => {
    if (!historyPrice || Number(historyPrice) <= 0) { toast.error("Enter valid price"); return }
    if (!historyDate) { toast.error("Select a date"); return }
    setIsAddingHistory(true)
    const res = await addRateHistoryEntry(historyMetal, Number(historyPrice), historyDate)
    setIsAddingHistory(false)
    if (res.success) { toast.success("History entry added"); setHistoryPrice(""); loadData() }
    else toast.error(res.error || "Failed")
  }

  const handleDeleteHistory = async (id: string) => {
    const res = await deleteRateHistoryEntry(id)
    if (res.success) { toast.success("Entry deleted"); loadData() }
    else toast.error(res.error || "Failed")
  }

  const filteredHistory = historyFilter === "all"
    ? history
    : history.filter(h => h.metal_type === historyFilter)

  const ic = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#522D6D]/20 focus:border-[#522D6D]"

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#522D6D]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Live Rates</h1>
          <p className="text-sm text-gray-500 mt-1">Update daily metal prices for the storefront</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* ─── Current Rates Cards ─────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rates.map(rate => (
          <motion.div
            key={rate.metal_type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{rate.icon_emoji}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{rate.metal_type}</h3>
                  <p className="text-xs text-gray-400">per {rate.unit}</p>
                </div>
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                rate.price_change > 0 ? "bg-green-50 text-green-600" :
                rate.price_change < 0 ? "bg-red-50 text-red-600" :
                "bg-gray-50 text-gray-500"
              }`}>
                {rate.price_change > 0 ? <TrendingUp className="w-3 h-3" /> :
                 rate.price_change < 0 ? <TrendingDown className="w-3 h-3" /> :
                 <Minus className="w-3 h-3" />}
                {rate.percentage_change > 0 ? "+" : ""}{rate.percentage_change}%
              </div>
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">Current Price (₹)</label>
                <input
                  type="number"
                  value={editingPrices[rate.metal_type] || ""}
                  onChange={e => setEditingPrices(p => ({ ...p, [rate.metal_type]: e.target.value }))}
                  className={ic}
                />
              </div>
              <button
                onClick={() => handleUpdateRate(rate.metal_type)}
                disabled={savingType === rate.metal_type}
                className="h-[42px] px-5 bg-[#522D6D] text-white rounded-xl text-sm font-medium hover:bg-[#6B3D8A] disabled:opacity-60 flex items-center gap-2 shrink-0"
              >
                {savingType === rate.metal_type ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Update
              </button>
            </div>

            <p className="text-[11px] text-gray-400 mt-3">
              Last updated: {new Date(rate.updated_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ─── Add History Entry ────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#522D6D]" /> Add History Entry
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Metal Type</label>
            <select value={historyMetal} onChange={e => setHistoryMetal(e.target.value)} className={ic}>
              {rates.map(r => <option key={r.metal_type} value={r.metal_type}>{r.metal_type}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Price (₹)</label>
            <input type="number" value={historyPrice} onChange={e => setHistoryPrice(e.target.value)} placeholder="62500" className={ic} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Date</label>
            <input type="date" value={historyDate} onChange={e => setHistoryDate(e.target.value)} className={ic} />
          </div>
          <button
            onClick={handleAddHistory}
            disabled={isAddingHistory}
            className="h-[42px] px-5 bg-[#522D6D] text-white rounded-xl text-sm font-medium hover:bg-[#6B3D8A] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isAddingHistory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Entry
          </button>
        </div>
      </div>

      {/* ─── History Table ────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <History className="w-4 h-4 text-[#522D6D]" /> Rate History
          </h3>
          <select value={historyFilter} onChange={e => setHistoryFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#522D6D]/20">
            <option value="all">All Metals</option>
            {rates.map(r => <option key={r.metal_type} value={r.metal_type}>{r.metal_type}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="text-left py-3 px-5 font-medium text-gray-500">Metal</th>
                <th className="text-left py-3 px-5 font-medium text-gray-500">Date</th>
                <th className="text-left py-3 px-5 font-medium text-gray-500">Price</th>
                <th className="text-right py-3 px-5 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr><td colSpan={4} className="py-10 text-center text-gray-400">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No history entries yet
                </td></tr>
              ) : (
                filteredHistory.map(h => (
                  <tr key={h.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-5 font-medium text-gray-900">{h.metal_type}</td>
                    <td className="py-3 px-5 text-gray-600">{new Date(h.date).toLocaleDateString("en-IN", { dateStyle: "medium" })}</td>
                    <td className="py-3 px-5 font-medium">₹{Number(h.price).toLocaleString("en-IN")}</td>
                    <td className="py-3 px-5 text-right">
                      <button onClick={() => handleDeleteHistory(h.id)} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
