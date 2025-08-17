import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { initializePayment } from "@/lib/paystack"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { amount, plan, metadata } = body

    if (!amount || !plan) {
      return NextResponse.json(
        { message: "Amount and plan are required" },
        { status: 400 }
      )
    }

    // Generate unique reference
    const reference = `TZ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Convert amount to kobo (Paystack uses kobo as smallest unit)
    const amountInKobo = Math.round(amount * 100)

    const paymentData = {
      amount: amountInKobo,
      email: session.user.email || '',
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/verify?reference=${reference}`,
      metadata: {
        userId: session.user.id,
        username: session.user.username,
        plan,
        ...metadata
      }
    }

    const result = await initializePayment(paymentData)

    return NextResponse.json({
      message: "Payment initialized successfully",
      authorization_url: result.authorization_url,
      reference: result.reference
    })

  } catch (error) {
    console.error('Payment initialization error:', error)
    return NextResponse.json(
      { message: "Payment initialization failed", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
