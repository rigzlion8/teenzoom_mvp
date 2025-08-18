import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const filter = searchParams.get('filter') || 'all' // all, my-videos, friends, public

    // Build where clause - only search by title and description since RoomVideo doesn't have category/tags
    const where: Prisma.RoomVideoWhereInput = {}

    // Apply search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Apply privacy and ownership filters
    if (filter === 'my-videos') {
      where.uploadedBy = session.user.id
    } else if (filter === 'friends') {
      // Get user's friends
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { userId: session.user.id, status: 'accepted' },
            { friendId: session.user.id, status: 'accepted' }
          ]
        }
      })
      
      const friendIds = friendships.map(f => 
        f.userId === session.user.id ? f.friendId : f.userId
      )
      
      // Show public videos + friends' videos + user's own videos
      where.OR = [
        { privacy: 'public' },
        { privacy: 'friends_only', uploadedBy: { in: friendIds } },
        { uploadedBy: session.user.id }
      ]
    } else {
      // Default: show public videos + user's own videos + friends' videos (if friends_only)
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { userId: session.user.id, status: 'accepted' },
            { friendId: session.user.id, status: 'accepted' }
          ]
        }
      })
      
      const friendIds = friendships.map(f => 
        f.userId === session.user.id ? f.friendId : f.userId
      )
      
      // Show public videos + friends' videos + user's own videos
      where.OR = [
        { privacy: 'public' },
        { privacy: 'friends_only', uploadedBy: { in: friendIds } },
        { uploadedBy: session.user.id }
      ]
    }

    // Get videos with author information
    const videos = await prisma.roomVideo.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    })

    // Transform videos to include privacy info and format data
    const transformedVideos = videos.map(video => ({
      id: video.id,
      title: video.title,
      description: video.description,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0xNjAgOTBDMTYwIDg5LjQ0NzcgMTU5LjU1MiA4OSAxNTkgODlDMTU4LjQ0OCA4OSAxNTggODkuNDQ3NyAxNTggOTBDMTU4IDkwLjU1MjMgMTU4LjQ0OCA5MSAxNTkgOTFDMTU5LjU1MiA5MSAxNjAgOTAuNTUyMyAxNjAgOTBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K', // Fallback to SVG placeholder
      duration: video.duration,
      privacy: video.privacy,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
      author: {
        id: video.author.id,
        username: video.author.username,
        displayName: video.author.displayName
      },
      isOwner: video.uploadedBy === session.user.id
    }))

    return NextResponse.json({ videos: transformedVideos })
  } catch (error) {
    console.error('Error fetching videos:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
