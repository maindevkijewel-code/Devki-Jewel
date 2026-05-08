import Razorpay from 'razorpay'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { amount, currency = 'INR', receipt = 'receipt' } = await req.json()

    // Mock bypass if Razorpay keys are omitted for local testing
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.warn("Missing Razorpay Keys in .env.local - using MOCK payment flow for local dev.")
      return NextResponse.json({
        id: `mock_order_${Math.random().toString(36).substring(7)}`,
        amount: amount * 100,
        currency,
        receipt,
        status: 'created',
        _mock: true
      })
    }

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency,
      receipt: `${receipt}_${Math.random().toString(36).substring(7)}`,
    }

    const order = await razorpay.orders.create(options)
    return NextResponse.json(order)
  } catch (error: any) {
    console.error('Razorpay Create Order Error:', error)
    return NextResponse.json(
      { error: 'Error creating razorpay order', details: error.message },
      { status: 500 }
    )
  }
}
