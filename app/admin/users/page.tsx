"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Search, X, ShoppingCart } from "lucide-react"
import { getUsers, updateUserRole, toggleUserBlocked, getUserOrders } from "../actions/users"
import { toast } from "sonner"
import type { UserRole } from "@/lib/types/admin"

const ROLES: UserRole[] = ["customer", "staff", "super_admin"]

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [userOrders, setUserOrders] = useState<any[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)

  const load = useCallback(async () => {
    const data = await getUsers()
    setUsers(data)
    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleRoleChange = async (userId: string, role: UserRole) => {
    const res = await updateUserRole(userId, role)
    if (res.success) { toast.success("Role updated"); load() }
    else toast.error(res.error || "Failed")
  }

  const handleToggleBlocked = async (userId: string, blocked: boolean) => {
    const res = await toggleUserBlocked(userId, blocked)
    if (res.success) { toast.success(blocked ? "User blocked" : "User unblocked"); load() }
    else toast.error(res.error || "Failed")
  }

  const openUserDetail = async (user: any) => {
    setSelectedUser(user)
    setIsLoadingOrders(true)
    const orders = await getUserOrders(user.id)
    setUserOrders(orders)
    setIsLoadingOrders(false)
  }

  const filtered = users.filter(u =>
    (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-1">{users.length} registered users</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…" className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#522D6D]/20 focus:border-[#522D6D]" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Role</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Blocked</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Orders</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Joined</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">{Array.from({ length: 6 }).map((_, j) => <td key={j} className="py-3 px-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />No users found
                </td></tr>
              ) : (
                filtered.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer" onClick={() => openUserDetail(u)}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#522D6D]/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-[#522D6D]">{(u.full_name || u.email || "?")[0].toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-gray-900">{u.full_name || "–"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{u.email || "–"}</td>
                    <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                      <select value={u.role || "customer"} onChange={e => handleRoleChange(u.id, e.target.value as UserRole)} className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#522D6D] capitalize">
                        {ROLES.map(r => <option key={r} value={r} className="capitalize">{r.replace("_", " ")}</option>)}
                      </select>
                    </td>
                    <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={u.is_blocked || false} onChange={e => handleToggleBlocked(u.id, e.target.checked)} />
                        <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500" />
                      </label>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{u.order_count || 0}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#522D6D]/10 flex items-center justify-center">
                    <span className="font-semibold text-[#522D6D]">{(selectedUser.full_name || selectedUser.email || "?")[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">{selectedUser.full_name || "User"}</h2>
                    <p className="text-xs text-gray-500">{selectedUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Order History</h3>
                {isLoadingOrders ? (
                  <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
                ) : userOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userOrders.map(o => (
                      <div key={o.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{o.order_number || o.id.slice(0, 8)}</p>
                          <p className="text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString("en-IN")}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{Number(o.total_amount || 0).toLocaleString("en-IN")}</p>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${o.status === "Delivered" ? "bg-emerald-100 text-emerald-700" : o.status === "Cancelled" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{o.status || "Pending"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
