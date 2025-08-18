import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const unreadOnly = searchParams.get('unread') === 'true'

    // Build where clause
    const where: { userId: string; isRead?: boolean } = { userId: session.user.id }
    if (unreadOnly) {
      where.isRead = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { notificationId, action } = await request.json()

    if (!notificationId || !action) {
      return NextResponse.json({ error: 'Notification ID and action are required' }, { status: 400 })
    }

    if (action === 'mark-read') {
      await prisma.notification.update({
        where: { 
          id: notificationId,
          userId: session.user.id // Ensure user can only update their own notifications
        },
        data: { isRead: true }
      })
    } else if (action === 'mark-all-read') {
      await prisma.notification.updateMany({
        where: { 
          userId: session.user.id,
          isRead: false
        },
        data: { isRead: true }
      })
    }

    return NextResponse.json({ message: 'Notification updated successfully' })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
