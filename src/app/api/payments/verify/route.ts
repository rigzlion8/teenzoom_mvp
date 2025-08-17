import { NextRequest, NextResponse } from "next/server"
import { verifyPayment } from "@/lib/paystack"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json(
        { message: "Reference is required" },
        { status: 400 }
      )
    }

    // Verify payment with Paystack
    const verification = await verifyPayment(reference)

    if (!verification.status || !verification.data) {
      return NextResponse.json(
        { message: "Payment verification failed" },
        { status: 400 }
      )
    }

    const { data } = verification

    // Check if payment was successful
    if (data.status !== 'success') {
      return NextResponse.json(
        { message: "Payment not successful", status: data.status },
        { status: 400 }
      )
    }

    // Extract user info from metadata
    const userId = data.metadata?.userId as string
    const plan = data.metadata?.plan as string
    const paymentType = data.metadata?.type as string

    if (!userId || !plan) {
      return NextResponse.json(
        { message: "Invalid payment metadata" },
        { status: 400 }
      )
    }

    // Update user based on plan and payment type
    const updateData: Record<string, unknown> = {
      updatedAt: new Date()
    }

    // Apply plan-specific benefits
    switch (plan) {
      case 'premium':
        updateData.vipLifetime = true
        updateData.coins = { increment: 500 }
        break
      case 'vip':
        updateData.vipLifetime = true
        updateData.coins = { increment: 300 }
        break
      case 'wallet_topup':
        // For wallet top-ups, add coins based on amount
        const topupAmount = data.metadata?.amount as number || 0
        const coinsToAdd = Math.floor(topupAmount / 10) // 1 coin per 10 NGN
        updateData.coins = { increment: coinsToAdd }
        break
      case 'coins':
        updateData.coins = { increment: 200 }
        break
      default:
        // Basic plan - add default coins
        updateData.coins = { increment: 100 }
        break
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    })

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        amount: data.amount / 100, // Convert from kobo to naira
        currency: 'NGN',
        paymentType: plan === 'wallet_topup' ? 'wallet_topup' : 'vip_purchase',
        status: 'successful',
        paystackRef: data.reference,
        senderId: userId,
        receiverId: userId, // Self-payment
        description: plan === 'wallet_topup' ? 'Wallet top-up' : `${plan} plan purchase`,
        metadata: {
          plan,
          type: paymentType,
          gateway: 'paystack'
        }
      }
    })

    // Send payment confirmation email
    try {
      const { sendPaymentConfirmationEmail } = await import('@/lib/resend')
      await sendPaymentConfirmationEmail({
        username: updatedUser.username,
        displayName: updatedUser.displayName,
        email: updatedUser.email || '',
        amount: data.amount / 100,
        currency: 'NGN',
        plan: plan === 'wallet_topup' ? 'Wallet Top-up' : plan,
        transactionId: payment.id,
        paymentDate: new Date().toLocaleDateString()
      })
    } catch (emailError) {
      console.error('Payment confirmation email error:', emailError)
      // Don't fail payment if email fails
    }

    return NextResponse.json({
      message: "Payment verified successfully",
      payment: {
        id: payment.id,
        amount: payment.amount,
        plan: plan,
        status: payment.status,
        reference: data.reference
      },
      user: {
        coins: updatedUser.coins,
        vipLifetime: updatedUser.vipLifetime
      }
    })

  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { message: "Payment verification failed", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
