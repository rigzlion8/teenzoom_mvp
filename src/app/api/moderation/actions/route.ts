import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all moderation actions
    const actions = await prisma.moderationLog.findMany({
      where: {
        action: { in: ['warn', 'mute', 'kick', 'ban'] }
      },
      include: {
        moderator: {
          select: {
            username: true,
            displayName: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: 100
    })

    // Transform actions to match frontend interface
    const transformedActions = actions.map(action => ({
      id: action.id,
      type: action.action,
      target: {
        id: action.targetId,
        type: action.targetType,
        content: `Target: ${action.targetType} ${action.targetId}`
      },
      reason: action.reason || 'No reason provided',
      moderator: action.moderator.username,
      createdAt: action.createdAt.toISOString(),
      isActive: true // Mock active status for now
    }))

    return NextResponse.json({ actions: transformedActions })
  } catch (error) {
    console.error('Error fetching moderation actions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { targetId, targetType, action, reason, duration } = await request.json()

    if (!targetId || !targetType || !action || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create moderation log entry
    const moderationLog = await prisma.moderationLog.create({
      data: {
        action: action as 'warn' | 'mute' | 'kick' | 'ban',
        targetType: targetType as 'user' | 'message' | 'room' | 'video',
        targetId,
        moderatorId: session.user.id,
        reason,
        details: {
          duration,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json({
      message: 'Moderation action recorded successfully',
      action: moderationLog
    })
  } catch (error) {
    console.error('Error creating moderation action:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
