import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Personal Livestream API Called ===')
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))
    console.log('Request method:', request.method)
    console.log('Request URL:', request.url)
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error('No session or user ID found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated:', session.user.id)
    
    let body
    try {
      body = await request.json()
      console.log('Request body parsed successfully:', body)
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json({ 
        error: 'Invalid JSON in request body',
        details: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      }, { status: 400 })
    }

    const { privacy, title, description } = body

    console.log('Extracted fields:', { 
      userId: session.user.id, 
      privacy, 
      title, 
      description,
      bodyKeys: Object.keys(body)
    })

    if (!privacy || !['public', 'friends-only'].includes(privacy)) {
      console.error('Invalid privacy setting:', privacy)
      return NextResponse.json({ 
        error: 'Invalid privacy setting', 
        received: privacy,
        validOptions: ['public', 'friends-only']
      }, { status: 400 })
    }

    // Check if user is already live
    const existingStream = await prisma.personalLivestream.findFirst({
      where: {
        streamerId: session.user.id,
        isLive: true
      }
    })

    if (existingStream) {
      console.error('User already streaming:', session.user.id)
      return NextResponse.json({ error: 'You are already live streaming' }, { status: 400 })
    }

    console.log('Creating new personal livestream...')
    
    // Create new personal livestream
    const livestream = await prisma.personalLivestream.create({
      data: {
        streamerId: session.user.id,
        title: title || `${session.user.displayName || session.user.username}'s Stream`,
        description: description || '',
        privacy,
        isLive: true,
        startedAt: new Date()
      },
      include: {
        streamer: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    })

    console.log('Personal livestream created successfully:', livestream.id)
    return NextResponse.json({ livestream })
  } catch (error) {
    console.error('Error starting personal livestream:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()

    if (action === 'stop') {
      // Stop the user's livestream
          const livestream = await prisma.personalLivestream.updateMany({
      where: {
        streamerId: session.user.id,
        isLive: true
      },
      data: {
        isLive: false,
        endedAt: new Date()
      }
    })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error stopping personal livestream:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'discover' | 'friends' | 'me' | null

    if (type === 'discover') {
      // Get all public livestreams
      const livestreams = await prisma.personalLivestream.findMany({
        where: {
          isLive: true,
          privacy: 'public'
        },
        include: {
          streamer: {
            select: {
              id: true,
              username: true,
              displayName: true
            }
          }
        },
        orderBy: {
          startedAt: 'desc'
        }
      })

      return NextResponse.json({ livestreams })
    } else if (type === 'friends' || !type) {
      // Get friends' livestreams (both public and friends-only)
      const userFriendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { userId: session.user.id, status: 'accepted' },
            { friendId: session.user.id, status: 'accepted' }
          ]
        },
        select: {
          userId: true,
          friendId: true
        }
      })

      const friendIds = userFriendships.map(f => 
        f.userId === session.user.id ? f.friendId : f.userId
      )

      const livestreams = await prisma.personalLivestream.findMany({
        where: {
          streamerId: { in: friendIds },
          isLive: true
        },
        include: {
          streamer: {
            select: {
              id: true,
              username: true,
              displayName: true
            }
          }
        },
        orderBy: {
          startedAt: 'desc'
        }
      })

      return NextResponse.json({ livestreams })
    } else if (type === 'me') {
      const livestreams = await prisma.personalLivestream.findMany({
        where: {
          streamerId: session.user.id,
          isLive: true
        },
        include: {
          streamer: {
            select: {
              id: true,
              username: true,
              displayName: true
            }
          }
        },
        orderBy: {
          startedAt: 'desc'
        }
      })

      return NextResponse.json({ livestreams })
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching personal livestreams:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
