import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { initSocket } from '@/lib/socket-server'

// Initialize Socket.IO server
let io: ReturnType<typeof initSocket> | null = null

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

    // Initialize Socket.IO if not already done
    if (!io) {
      io = initSocket(3002)
      console.log('Socket.IO server initialized')
    }

    return NextResponse.json({
      message: 'Socket.IO endpoint ready',
      status: 'connected',
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
