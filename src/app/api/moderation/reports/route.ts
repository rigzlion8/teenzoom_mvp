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

    // Get all reports (in a real app, you'd want pagination)
    const reports = await prisma.moderationLog.findMany({
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

    // Transform reports to match frontend interface
    const transformedReports = reports.map(report => ({
      id: report.id,
      type: report.targetType,
      reason: report.reason || 'No reason provided',
      description: report.details ? JSON.stringify(report.details) : 'No description',
      status: 'pending', // Mock status for now
      reporter: {
        id: report.moderatorId,
        username: report.moderator.username,
        displayName: report.moderator.displayName
      },
      reportedContent: {
        id: report.targetId,
        content: `Content ID: ${report.targetId}`,
        author: {
          id: report.targetId,
          username: 'unknown',
          displayName: 'Unknown User'
        },
        createdAt: report.createdAt.toISOString()
      },
      createdAt: report.createdAt.toISOString()
    }))

    return NextResponse.json({ reports: transformedReports })
  } catch (error) {
    console.error('Error fetching moderation reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
