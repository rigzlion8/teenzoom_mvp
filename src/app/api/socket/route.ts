import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Return socket connection info
    return NextResponse.json({
      message: 'Socket.IO endpoint ready',
      socketUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
    })
  } catch (error) {
    console.error('Socket route error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
