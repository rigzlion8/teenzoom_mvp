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
    const { amount } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { message: "Valid amount is required" },
        { status: 400 }
      )
    }

    // Validate amount range (e.g., 100 NGN to 100,000 NGN)
    if (amount < 100 || amount > 100000) {
      return NextResponse.json(
        { message: "Amount must be between ₦100 and ₦100,000" },
        { status: 400 }
      )
    }

    // Generate unique reference
    const reference = `TZ_WT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
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
        plan: 'wallet_topup',
        amount: amount,
        type: 'wallet_topup'
      }
    }

    const result = await initializePayment(paymentData)

    return NextResponse.json({
      message: "Wallet top-up initiated successfully",
      authorization_url: result.authorization_url,
      reference: result.reference,
      amount: amount,
      currency: 'NGN'
    })

  } catch (error) {
    console.error('Wallet top-up error:', error)
    return NextResponse.json(
      { message: "Wallet top-up failed", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
