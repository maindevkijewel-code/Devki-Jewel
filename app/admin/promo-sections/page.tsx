"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { motion, AnimatePresence, Reorder } from "framer-motion"
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Loader2,
  Upload, GripVertical, ArrowUpDown, Image as ImageIcon,
  Calendar, Link2, LayoutGrid,
} from "lucide-react"
import { toast } from "sonner"
import {
  getAllPromoSections, createPromoSection, updatePromoSection,
  deletePromoSection, togglePromoActive, reorderPromoSections,
  uploadPromoImage, type PromoSection,
} from "../actions/promo-sections"

const LAYOUTS = [
  { value: "full_width", label: "Full Width" },
  { value: "card_overlay", label: "Overlay Text" },
  { value: "two_column", label: "Image + Text" },
  { value: "split_dual", label: "Dual Split" },
]
const RATIOS = [
  { value: "50/50", label: "50 / 50" },
  { value: "60/40", label: "60 / 40" },
  { value: "40/60", label: "40 / 60" },
]
const ASPECTS = [
  { value: "21/8", label: "Wide (21:8)" },
  { value: "16/7", label: "Standard (16:7)" },
  { value: "16/9", label: "Video (16:9)" },
  { value: "4/3", label: "Compact (4:3)" },
]

function ImageUploader({ preview, setPreview, label, aspect = "16/7" }: {
  preview: string; setPreview: (u: string) => void; label: string; aspect?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const fd = new FormData(); fd.append("file", file)
    const res = await uploadPromoImage(fd, "desktop")
    setUploading(false)
    if (res.success && res.url) { setPreview(res.url); toast.success("Uploaded") }
    else toast.error(res.error || "Failed")
    e.target.value = ""
  }
  return (
    <div>
      <span className="block text-xs font-medium text-gray-600 mb-1.5">{label}</span>
      <div onClick={() => ref.current?.click()} className="relative rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-[#522D6D]/40 transition-colors overflow-hidden" style={{ aspectRatio: aspect }}>
        {preview ? (
          <>
            <Image src={preview} alt="" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Upload className="w-5 h-5 text-white" />
              <button type="button" onClick={(e) => { e.stopPropagation(); setPreview("") }} className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"><X className="w-3 h-3 text-white" /></button>
            </div>
          </>
        ) : uploading ? <Loader2 className="w-5 h-5 text-[#522D6D] animate-spin" /> : (
          <div className="text-center text-gray-400"><ImageIcon className="w-6 h-6 mx-auto mb-1" /><p className="text-[10px]">Upload</p></div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={upload} />
    </div>
  )
}

function SideFields({ prefix, section, ic }: { prefix: "" | "right_"; section: PromoSection | null; ic: string }) {
  const g = (f: string) => (section as any)?.[`${prefix}${f}`] || ""
  const lc = "block text-xs font-medium text-gray-600 mb-1"
  const side = prefix === "right_" ? "Right" : "Left"
  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
      <p className="text-xs font-semibold text-[#522D6D] uppercase tracking-wider">{side} Side Content</p>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={lc}>Title</label><input name={`${prefix}title`} defaultValue={g("title")} placeholder="Title" className={ic} /></div>
        <div><label className={lc}>Subtitle</label><input name={`${prefix}subtitle`} defaultValue={g("subtitle")} placeholder="Subtitle" className={ic} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={lc}>Button Text</label><input name={`${prefix}button_text`} defaultValue={g("button_text")} placeholder="Shop Now" className={ic} /></div>
        <div><label className={lc}>Button Link</label><input name={`${prefix}button_link`} defaultValue={g("button_link")} placeholder="/jewellery" className={ic} /></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className={lc}>Text Color</label><select name={`${prefix}text_color`} defaultValue={g("text_color") || "dark"} className={ic}><option value="dark">Dark</option><option value="light">Light</option></select></div>
        <div><label className={lc}>Alignment</label><select name={`${prefix}text_alignment`} defaultValue={g("text_alignment") || "left"} className={ic}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></div>
        <div><label className={lc}>Badge</label><input name={`${prefix}badge_text`} defaultValue={g("badge_text")} placeholder="New" className={ic} /></div>
      </div>
      <div><label className={lc}>Overlay (0-100)</label><input name={`${prefix}overlay_opacity`} type="number" min={0} max={100} defaultValue={(Number(g("overlay_opacity")) || 0) * 100} className={ic} /></div>
    </div>
  )
}

function SectionForm({ section, onClose, onSaved }: { section: PromoSection | null; onClose: () => void; onSaved: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [layout, setLayout] = useState(section?.layout_type || "full_width")
  const [isActive, setIsActive] = useState(section?.is_active ?? true)
  const [leftImg, setLeftImg] = useState(section?.desktop_image || "")
  const [leftMob, setLeftMob] = useState(section?.mobile_image || "")
  const [rightImg, setRightImg] = useState(section?.right_desktop_image || "")
  const [rightMob, setRightMob] = useState(section?.right_mobile_image || "")
  const isSplit = layout === "split_dual"
  const ic = "w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#522D6D]/20 focus:border-[#522D6D]"

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!leftImg) { toast.error("Left image is required"); return }
    if (isSplit && !rightImg) { toast.error("Right image is required for split layout"); return }
    setIsLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("desktop_image", leftImg); fd.set("mobile_image", leftMob || "")
    fd.set("right_desktop_image", rightImg || ""); fd.set("right_mobile_image", rightMob || "")
    fd.set("is_active", isActive ? "true" : "false"); fd.set("layout_type", layout)
    const res = section ? await updatePromoSection(section.id, fd) : await createPromoSection(fd)
    setIsLoading(false)
    if (res.success) { toast.success(section ? "Updated!" : "Created!"); onSaved() }
    else toast.error(res.error || "Failed")
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white rounded-2xl w-full max-w-3xl my-6 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold">{section ? "Edit" : "Add"} Promo Section</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Layout */}
          <div>
            <span className="block text-xs font-medium text-gray-600 mb-2">Layout Type</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LAYOUTS.map(l => (
                <button key={l.value} type="button" onClick={() => setLayout(l.value)} className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${layout === l.value ? "bg-[#522D6D] text-white border-[#522D6D]" : "bg-white text-gray-600 border-gray-200 hover:border-[#522D6D]/40"}`}>{l.label}</button>
              ))}
            </div>
          </div>

          {/* Split Ratio (only for split_dual) */}
          {isSplit && (
            <div>
              <span className="block text-xs font-medium text-gray-600 mb-2">Split Ratio</span>
              <div className="flex gap-2">
                {RATIOS.map(r => (<button key={r.value} type="button" onClick={() => {}} className="px-4 py-2 rounded-lg text-xs font-medium border border-gray-200 hover:border-[#522D6D]/40"><label><input type="radio" name="layout_ratio" value={r.value} defaultChecked={(section?.layout_ratio || "50/50") === r.value} className="mr-1.5 accent-[#522D6D]" />{r.label}</label></button>))}
              </div>
            </div>
          )}

          {/* Images */}
          <div className={`grid gap-4 ${isSplit ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
            <div className="space-y-3">
              <ImageUploader preview={leftImg} setPreview={setLeftImg} label={isSplit ? "Left Desktop Image *" : "Desktop Image *"} />
              <ImageUploader preview={leftMob} setPreview={setLeftMob} label={isSplit ? "Left Mobile Image" : "Mobile Image"} aspect="4/5" />
            </div>
            {isSplit && (
              <div className="space-y-3">
                <ImageUploader preview={rightImg} setPreview={setRightImg} label="Right Desktop Image *" />
                <ImageUploader preview={rightMob} setPreview={setRightMob} label="Right Mobile Image" aspect="4/5" />
              </div>
            )}
          </div>

          {/* Split Preview */}
          {isSplit && leftImg && rightImg && (
            <div>
              <span className="block text-xs font-medium text-gray-600 mb-2">Preview</span>
              <div className="grid grid-cols-2 gap-0 rounded-xl overflow-hidden border border-gray-100" style={{ aspectRatio: "21/8" }}>
                <div className="relative"><Image src={leftImg} alt="" fill className="object-cover" /></div>
                <div className="relative"><Image src={rightImg} alt="" fill className="object-cover" /></div>
              </div>
            </div>
          )}

          {/* Mobile Behavior */}
          {isSplit && (
            <div>
              <span className="block text-xs font-medium text-gray-600 mb-2">Mobile Behavior</span>
              <div className="flex gap-2">
                {[{ v: "stack", l: "Stack Vertically" }, { v: "scroll", l: "Horizontal Scroll" }].map(o => (
                  <label key={o.v} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-xs font-medium cursor-pointer hover:border-[#522D6D]/40">
                    <input type="radio" name="mobile_behavior" value={o.v} defaultChecked={(section?.mobile_behavior || "stack") === o.v} className="accent-[#522D6D]" />{o.l}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Content Fields */}
          {isSplit ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SideFields prefix="" section={section} ic={ic} />
              <SideFields prefix="right_" section={section} ic={ic} />
            </div>
          ) : (
            <SideFields prefix="" section={section} ic={ic} />
          )}

          {/* Common Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div><span className="block text-xs font-medium text-gray-600 mb-1">Aspect Ratio</span><select name="aspect_ratio" defaultValue={section?.aspect_ratio || "21/8"} className={ic}>{ASPECTS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}</select></div>
            <div><span className="block text-xs font-medium text-gray-600 mb-1">BG Color</span><input name="background_color" type="color" defaultValue={section?.background_color || "#FFFFFF"} className="w-full h-10 rounded-lg border border-gray-200 cursor-pointer" /></div>
            <div><span className="block text-xs font-medium text-gray-600 mb-1">Order</span><input name="display_order" type="number" defaultValue={section?.display_order ?? 0} className={ic} /></div>
            <div className="flex items-end pb-1">
              <button type="button" onClick={() => setIsActive(!isActive)} className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? "bg-[#522D6D]" : "bg-gray-200"}`}><span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-5" : ""}`} /></button>
              <span className="text-xs font-medium text-gray-600 ml-2">{isActive ? "Active" : "Hidden"}</span>
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-3">
            <div><span className="block text-xs font-medium text-gray-600 mb-1"><Calendar className="w-3 h-3 inline mr-1" />Start</span><input name="start_date" type="date" defaultValue={section?.start_date || ""} className={ic} /></div>
            <div><span className="block text-xs font-medium text-gray-600 mb-1"><Calendar className="w-3 h-3 inline mr-1" />End</span><input name="end_date" type="date" defaultValue={section?.end_date || ""} className={ic} /></div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isLoading} className="flex-1 py-2.5 bg-[#522D6D] text-white rounded-xl font-medium text-sm hover:bg-[#6B3D8A] disabled:opacity-60 flex items-center justify-center gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{section ? "Save" : "Create"}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function PromoSectionsAdminPage() {
  const [sections, setSections] = useState<PromoSection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<PromoSection | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [reordering, setReordering] = useState(false)

  const load = useCallback(async () => { const d = await getAllPromoSections(); setSections(d); setIsLoading(false) }, [])
  useEffect(() => { load() }, [load])

  const handleToggle = async (id: string, cur: boolean) => { const r = await togglePromoActive(id, !cur); if (r.success) { toast.success(!cur ? "Activated" : "Hidden"); load() } else toast.error(r.error || "Failed") }
  const handleDelete = async (id: string) => { setDeletingId(id); const r = await deletePromoSection(id); setDeletingId(null); if (r.success) { toast.success("Deleted"); load() } else toast.error(r.error || "Failed") }
  const handleReorder = async () => { setReordering(true); const r = await reorderPromoSections(sections.map(s => s.id)); setReordering(false); if (r.success) toast.success("Order saved!"); else toast.error(r.error || "Failed") }

  if (isLoading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-[#522D6D]" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Promo Sections</h1>
          <p className="text-sm text-gray-500 mt-1">Manage homepage banners · {sections.filter(s => s.is_active).length} active</p>
        </div>
        <div className="flex items-center gap-3">
          {sections.length > 1 && <button onClick={handleReorder} disabled={reordering} className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 disabled:opacity-60">{reordering ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpDown className="w-4 h-4" />}Save Order</button>}
          <button onClick={() => { setEditing(null); setShowForm(true) }} className="flex items-center gap-2 px-4 py-2.5 bg-[#522D6D] text-white rounded-xl text-sm font-medium hover:bg-[#6B3D8A] shadow-md shadow-[#522D6D]/20"><Plus className="w-4 h-4" /> Add Section</button>
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <LayoutGrid className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-500">No promo sections yet</h3>
          <p className="text-sm text-gray-400 mt-1 mb-5">Add promotional banners to your homepage</p>
          <button onClick={() => { setEditing(null); setShowForm(true) }} className="px-5 py-2.5 bg-[#522D6D] text-white rounded-xl text-sm font-medium hover:bg-[#6B3D8A]">Add First Section</button>
        </div>
      ) : (
        <Reorder.Group axis="y" values={sections} onReorder={setSections} className="space-y-3">
          {sections.map(section => (
            <Reorder.Item key={section.id} value={section}>
              <motion.div layout className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex items-stretch">
                  <div className="flex items-center px-3 text-gray-300 cursor-grab hover:text-gray-400 border-r border-gray-100 shrink-0"><GripVertical className="w-4 h-4" /></div>
                  <div className="relative w-32 sm:w-44 bg-gray-100 shrink-0 flex">
                    {section.layout_type === "split_dual" && section.right_desktop_image ? (
                      <><div className="relative w-1/2"><Image src={section.desktop_image} alt="" fill className="object-cover" /></div><div className="relative w-1/2 border-l border-white"><Image src={section.right_desktop_image} alt="" fill className="object-cover" /></div></>
                    ) : (
                      <div className="relative w-full"><Image src={section.desktop_image} alt={section.title || "Promo"} fill className="object-cover" /></div>
                    )}
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 text-white text-[10px] rounded font-medium z-10">#{section.display_order + 1}</div>
                  </div>
                  <div className="flex-1 px-4 py-3 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{section.title || <span className="text-gray-400 italic">Untitled</span>}</h3>
                        {section.subtitle && <p className="text-xs text-gray-400 mt-0.5 truncate">{section.subtitle}</p>}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{LAYOUTS.find(l => l.value === section.layout_type)?.label || section.layout_type}</span>
                          {section.layout_type === "split_dual" && <span className="text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{section.layout_ratio || "50/50"}</span>}
                          {section.badge_text && <span className="text-[11px] bg-[#522D6D]/10 text-[#522D6D] px-2 py-0.5 rounded">{section.badge_text}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => handleToggle(section.id, section.is_active)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${section.is_active ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-400"}`}>{section.is_active ? <><Eye className="w-3.5 h-3.5" /> Live</> : <><EyeOff className="w-3.5 h-3.5" /> Off</>}</button>
                        <button onClick={() => { setEditing(section); setShowForm(true) }} className="p-2 rounded-xl text-gray-400 hover:bg-blue-50 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => { if (confirm("Delete?")) handleDelete(section.id) }} disabled={deletingId === section.id} className="p-2 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50">{deletingId === section.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}
      <p className="text-xs text-gray-400 text-center">Drag to reorder, then "Save Order".</p>
      <AnimatePresence>{showForm && <SectionForm section={editing} onClose={() => { setShowForm(false); setEditing(null) }} onSaved={() => { setShowForm(false); setEditing(null); load() }} />}</AnimatePresence>
    </div>
  )
}
