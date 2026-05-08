import { NextResponse } from "next/server"
import { updateLiveRates } from "@/app/actions/update-live-rates"

/**
 * Cron endpoint for daily gold/silver/platinum rate updates.
 *
 * Protected by CRON_SECRET — Vercel Cron sends this automatically
 * when configured in vercel.json.
 *
 * Schedule: 0 3 * * * (daily at 3:00 AM UTC / ~8:30 AM IST)
 *
 * Manual trigger (for testing):
 *   curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
 *        https://your-site.vercel.app/api/cron/update-gold-rates
 */
export async function GET(request: Request) {
  // Verify authorization
  const authHeader = request.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("[cron/update-gold-rates] Starting daily rate update…")

  const result = await updateLiveRates()

  if (result.success) {
    console.log("[cron/update-gold-rates] ✅ Update completed successfully")
    return NextResponse.json({ success: true, timestamp: new Date().toISOString() })
  } else {
    console.error("[cron/update-gold-rates] ❌ Update failed:", result.error)
    return NextResponse.json(
      { error: result.error, timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
