"use server"

import { createAdminClient } from "@/lib/supabase-server"

export async function getInquiries() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("getInquiries error:", error)
    return []
  }

  return data || []
}

export async function replyToInquiry(inquiryId: string, reply: string) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from("inquiries")
    .update({
      admin_reply: reply,
      is_resolved: true,
    })
    .eq("id", inquiryId)

  if (error) {
    console.error("replyToInquiry error:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
