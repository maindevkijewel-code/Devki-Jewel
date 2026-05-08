import crypto from 'crypto'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, _mock } = await req.json()

    // Handle our local mock flow
    if (_mock || !process.env.RAZORPAY_KEY_SECRET) {
      console.warn("Bypassing actual Razorpay signature verification due to mock flow/missing secret.")
      return NextResponse.json({ success: true, message: 'Mock payment verified successfully' }, { status: 200 })
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex')

    const isAuthentic = expectedSignature === razorpay_signature

    if (isAuthentic) {
      return NextResponse.json({ success: true, message: 'Payment verified successfully' }, { status: 200 })
    } else {
      return NextResponse.json({ success: false, message: 'Invalid payment signature' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Razorpay Verify Error:', error)
    return NextResponse.json({ success: false, message: 'Server error during verification' }, { status: 500 })
  }
}
