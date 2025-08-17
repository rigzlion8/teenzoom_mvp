import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { initSocket } from '@/lib/socket-server'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Initialize Socket.IO server
    const io = initSocket()
    
    if (!io) {
      return NextResponse.json({ error: 'Failed to initialize Socket.IO server' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Socket.IO server initialized successfully',
      socketUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
    })
  } catch (error) {
    console.error('Socket.IO initialization error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
