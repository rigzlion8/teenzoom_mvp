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
    const category = searchParams.get('category') || 'trending'
    const search = searchParams.get('search')

    // Build where clause - only search by title and description since RoomVideo doesn't have category/tags
    const where: {
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' }
        description?: { contains: string; mode: 'insensitive' }
      }>
    } = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get videos with room information
    const videos = await prisma.roomVideo.findMany({
      where,
      include: {
        room: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: 50
    })

    // Transform videos to match the frontend interface
    const transformedVideos = videos.map(video => ({
      id: video.id,
      title: video.title,
      description: video.description || '',
      thumbnailUrl: video.thumbnailUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0xNjAgOTBDMTYwIDg5LjQ0NzcgMTU5LjU1MiA4OSAxNTkgODlDMTU4LjQ0OCA4OSAxNTggODkuNDQ3NyAxNTggOTBDMTU4IDkwLjU1MjMgMTU4LjQ0OCA5MSAxNTkgOTFDMTU5LjU1MiA5MSAxNjAgOTAuNTUyMyAxNjAgOTBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K', // Fallback to SVG placeholder if no thumbnail
      videoUrl: video.videoUrl,
      duration: video.duration || 0,
      views: Math.floor(Math.random() * 1000), // Mock data for now
      likes: Math.floor(Math.random() * 100), // Mock data for now
      comments: Math.floor(Math.random() * 50), // Mock data for now
      author: {
        id: video.uploadedBy,
        username: 'user', // Mock data for now
        displayName: 'User' // Mock data for now
      },
      tags: [], // Mock data for now
      category: category, // Keep this for frontend compatibility
      createdAt: video.createdAt,
      isLiked: false // Mock data for now
    }))

    return NextResponse.json({ videos: transformedVideos })
  } catch (error) {
    console.error('Error fetching videos:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
