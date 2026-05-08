"use client"

import { motion } from "framer-motion"
import { X, Loader2, Truck } from "lucide-react"
import { useState } from "react"
import { updateOrderStatus, updatePaymentStatus } from "../actions/orders"
import { toast } from "sonner"
import type { OrderStatus, PaymentStatus } from "@/lib/types/admin"

const STATUSES: OrderStatus[] = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"]
const PAY_STATUSES: PaymentStatus[] = ["unpaid", "paid", "refunded"]

interface OrderDetailModalProps {
  order: any
  onClose: () => void
  onUpdated: () => void
}

export default function OrderDetailModal({ order, onClose, onUpdated }: OrderDetailModalProps) {
  const [status, setStatus] = useState<OrderStatus>(order.status || "Pending")
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order.payment_status || "unpaid")
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || "")
  const [isSaving, setIsSaving] = useState(false)

  const items = order.products || order.items || []
  const address = order.delivery_address || (order.shipping_address
    ? `${order.shipping_address.address_line1 || ""}, ${order.shipping_address.city || ""} ${order.shipping_address.state || ""} - ${order.shipping_address.pincode || ""}`
    : "–")

  const handleSave = async () => {
    setIsSaving(true)
    const [r1, r2] = await Promise.all([
      updateOrderStatus(order.id, status, status === "Shipped" ? trackingNumber : undefined),
      updatePaymentStatus(order.id, paymentStatus),
    ])
    setIsSaving(false)
    if (r1.success && r2.success) {
      toast.success("Order updated!")
      onUpdated()
    } else {
      toast.error(r1.error || r2.error || "Update failed")
    }
  }

  const sc = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#522D6D]/20 focus:border-[#522D6D]"

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold">Order {order.order_number || order.id.slice(0, 8)}</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-6">
          {/* Customer Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Customer</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-400">Name:</span> <span className="font-medium text-gray-900">{order.customer_name || "–"}</span></div>
              <div><span className="text-gray-400">Email:</span> <span className="font-medium text-gray-900">{order.customer_email || "–"}</span></div>
              <div><span className="text-gray-400">Phone:</span> <span className="font-medium text-gray-900">{order.customer_phone || "–"}</span></div>
              <div className="col-span-2"><span className="text-gray-400">Address:</span> <span className="font-medium text-gray-900">{address}</span></div>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Items</h3>
            <div className="space-y-2">
              {items.length === 0 ? <p className="text-sm text-gray-400">No items data</p> : items.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{item.product_name || item.name || "Product"}</p>
                    <p className="text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">₹{Number(item.price || 0).toLocaleString("en-IN")}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 pt-3 border-t border-gray-100 font-semibold">
              <span>Total</span>
              <span className="text-[#522D6D]">₹{Number(order.total_amount || 0).toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Status Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Order Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as OrderStatus)} className={sc}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Status</label>
              <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value as PaymentStatus)} className={sc}>
                {PAY_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
          </div>

          {status === "Shipped" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2"><Truck className="w-4 h-4" /> Tracking Number</label>
              <input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Enter tracking number" className={sc} />
            </div>
          )}

          {/* Payment Info */}
          <div className="text-sm text-gray-500">
            <span>Payment: </span>
            <span className="font-medium text-gray-700">{order.payment_method || order.payment_id ? "Razorpay" : "–"}</span>
            {order.payment_id && <span className="ml-2 text-xs text-gray-400">({order.payment_id})</span>}
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="px-5 py-2.5 bg-[#522D6D] text-white rounded-xl text-sm font-medium hover:bg-[#6B3D8A] disabled:opacity-50 flex items-center gap-2">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}Save Changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
