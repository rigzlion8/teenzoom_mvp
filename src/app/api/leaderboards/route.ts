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

    // Get all users with their stats
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        level: true,
        xp: true,
        coins: true,
        createdAt: true
      },
      orderBy: [
        { level: 'desc' },
        { xp: 'desc' }
      ]
    })

    // Calculate scores for different categories
    const leaderboards: Record<string, Array<{
      id: string
      username: string
      displayName: string
      rank: number
      score: number
      level: number
      xp: number
      coins: number
      achievements: number
      stats: {
        messagesSent: number
        videosShared: number
        friendsCount: number
        daysActive: number
      }
    }>> = {}

    // Overall leaderboard (based on level + XP + coins)
    leaderboards.overall = users.map((user, index) => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      rank: index + 1,
      score: user.level * 1000 + user.xp + user.coins,
      level: user.level,
      xp: user.xp,
      coins: user.coins,
      achievements: Math.floor(user.level / 5), // Mock achievements
      stats: {
        messagesSent: Math.floor(Math.random() * 1000), // Mock data
        videosShared: Math.floor(Math.random() * 100), // Mock data
        friendsCount: Math.floor(Math.random() * 50), // Mock data
        daysActive: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      }
    }))

    // XP leaderboard
    leaderboards.xp = users
      .map((user, index) => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        rank: index + 1,
        score: user.xp,
        level: user.level,
        xp: user.xp,
        coins: user.coins,
        achievements: Math.floor(user.level / 5),
        stats: {
          messagesSent: Math.floor(Math.random() * 1000),
          videosShared: Math.floor(Math.random() * 100),
          friendsCount: Math.floor(Math.random() * 50),
          daysActive: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        }
      }))
      .sort((a, b) => b.score - a.score)
      .map((user, index) => ({ ...user, rank: index + 1 }))

    // Coins leaderboard
    leaderboards.coins = users
      .map((user, index) => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        rank: index + 1,
        score: user.coins,
        level: user.level,
        xp: user.xp,
        coins: user.coins,
        achievements: Math.floor(user.level / 5),
        stats: {
          messagesSent: Math.floor(Math.random() * 1000),
          videosShared: Math.floor(Math.random() * 100),
          friendsCount: Math.floor(Math.random() * 50),
          daysActive: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        }
      }))
      .sort((a, b) => b.score - a.score)
      .map((user, index) => ({ ...user, rank: index + 1 }))

    // Social leaderboard (mock data for now)
    leaderboards.social = users
      .map((user, index) => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        rank: index + 1,
        score: Math.floor(Math.random() * 100),
        level: user.level,
        xp: user.xp,
        coins: user.coins,
        achievements: Math.floor(user.level / 5),
        stats: {
          messagesSent: Math.floor(Math.random() * 1000),
          videosShared: Math.floor(Math.random() * 100),
          friendsCount: Math.floor(Math.random() * 50),
          daysActive: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        }
      }))
      .sort((a, b) => b.score - a.score)
      .map((user, index) => ({ ...user, rank: index + 1 }))

    // Content leaderboard (mock data for now)
    leaderboards.content = users
      .map((user, index) => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        rank: index + 1,
        score: Math.floor(Math.random() * 50),
        level: user.level,
        xp: user.xp,
        coins: user.coins,
        achievements: Math.floor(user.level / 5),
        stats: {
          messagesSent: Math.floor(Math.random() * 1000),
          videosShared: Math.floor(Math.random() * 100),
          friendsCount: Math.floor(Math.random() * 50),
          daysActive: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        }
      }))
      .sort((a, b) => b.score - a.score)
      .map((user, index) => ({ ...user, rank: index + 1 }))

    // Activity leaderboard (based on days since creation)
    leaderboards.activity = users
      .map((user, index) => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        rank: index + 1,
        score: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
        level: user.level,
        xp: user.xp,
        coins: user.coins,
        achievements: Math.floor(user.level / 5),
        stats: {
          messagesSent: Math.floor(Math.random() * 1000),
          videosShared: Math.floor(Math.random() * 100),
          friendsCount: Math.floor(Math.random() * 50),
          daysActive: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        }
      }))
      .sort((a, b) => b.score - a.score)
      .map((user, index) => ({ ...user, rank: index + 1 }))

    return NextResponse.json({ leaderboards })
  } catch (error) {
    console.error('Error fetching leaderboards:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
