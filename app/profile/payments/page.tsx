"use client"

import { CreditCard, Shield } from "lucide-react"

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Payment Methods</h2>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl mb-6">
          <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Your payment data is secure</p>
            <p className="text-xs text-blue-700 mt-0.5">
              For security, full card details are never stored. All payments are processed securely through Razorpay.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Accepted Payment Methods</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: "Credit / Debit Card", desc: "Visa, Mastercard, RuPay", icon: "💳" },
              { name: "UPI", desc: "GPay, PhonePe, Paytm", icon: "📱" },
              { name: "Net Banking", desc: "All major banks", icon: "🏦" },
              { name: "EMI", desc: "No-cost EMI available", icon: "📅" },
            ].map((method) => (
              <div key={method.name} className="p-4 bg-gray-50 rounded-xl text-center">
                <span className="text-2xl">{method.icon}</span>
                <p className="text-sm font-medium text-gray-900 mt-2">{method.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{method.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Saved UPI IDs</h3>
          <div className="text-center py-8">
            <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No saved payment methods</p>
            <p className="text-xs text-gray-400 mt-1">Payment methods will appear here after your first purchase</p>
          </div>
        </div>
      </div>
    </div>
  )
}
