import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Socket.IO is now integrated on the same port as the main app
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    return NextResponse.json({ 
      message: 'Socket.IO server is integrated and ready',
      socketUrl: appUrl,
      note: 'Socket.IO runs on the same port as the main app'
    })
  } catch (error) {
    console.error('Socket.IO route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
