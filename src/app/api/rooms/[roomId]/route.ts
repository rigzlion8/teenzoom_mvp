import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId } = await params

    // Clean the roomId - remove "room_" prefix if present
    const cleanRoomId = roomId.startsWith('room_') ? roomId.substring(5) : roomId

    // Handle special "general" room case
    if (cleanRoomId === 'general') {
      // Check if general room exists, if not create it
      let generalRoom = await prisma.room.findFirst({
        where: { roomId: 'general' },
        include: {
          members: {
            select: {
              userId: true,
              role: true,
              joinedAt: true
            }
          },
          owner: {
            select: {
              id: true,
              username: true,
              displayName: true
            }
          }
        }
      })

      if (!generalRoom) {
        // Create general room if it doesn't exist
        const adminUser = await prisma.user.findFirst({
          where: { role: 'admin' }
        })

        if (!adminUser) {
          return NextResponse.json({ error: 'No admin user found to create general room' }, { status: 500 })
        }

        generalRoom = await prisma.room.create({
          data: {
            name: 'General Chat',
            description: 'Welcome to the main general chat room!',
            category: 'general',
            privacy: 'public',
            isActive: true,
            allowFileSharing: true,
            allowVideo: true,
            requireApproval: false,
            maxUsers: 1000,
            roomId: 'general',
            ownerId: adminUser.id,
            tags: ['general', 'chat', 'main'],
            createdAt: new Date(),
            updatedAt: new Date(),
            lastActivity: new Date()
          },
          include: {
            members: {
              select: {
                userId: true,
                role: true,
                joinedAt: true
              }
            },
            owner: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            }
          }
        })
      }

      // Return general room data
      const roomData = {
        id: generalRoom.id,
        name: generalRoom.name,
        description: generalRoom.description,
        category: generalRoom.category,
        privacy: generalRoom.privacy,
        memberCount: generalRoom.members.length,
        maxMembers: Number(generalRoom.maxUsers),
        isActive: generalRoom.isActive,
        tags: generalRoom.tags,
        createdAt: generalRoom.createdAt,
        lastActivity: generalRoom.lastActivity,
        owner: {
          id: generalRoom.owner.id,
          username: generalRoom.owner.username,
          displayName: generalRoom.owner.displayName
        },
        isMember: generalRoom.members.some(member => member.userId === session.user.id),
        isOwner: generalRoom.owner.id === session.user.id,
        allowFileSharing: generalRoom.allowFileSharing,
        allowVideo: generalRoom.allowVideo,
        requireApproval: generalRoom.requireApproval
      }

      return NextResponse.json({ room: roomData })
    }

    // Get room information for other rooms
    const room = await prisma.room.findUnique({
      where: { id: cleanRoomId },
      include: {
        members: {
          select: {
            userId: true,
            role: true,
            joinedAt: true
          }
        },
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Check if user has access to this room
    const isMember = room.members.some(member => member.userId === session.user.id)
    const isOwner = room.owner.id === session.user.id
    
    if (room.privacy === 'private' && !isMember && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Transform room data
    const roomData = {
      id: room.id,
      name: room.name,
      description: room.description,
      category: room.category,
      privacy: room.privacy,
      memberCount: room.members.length,
      maxMembers: Number(room.maxUsers),
      isActive: room.isActive,
      tags: room.tags,
      createdAt: room.createdAt,
      lastActivity: room.lastActivity,
      owner: {
        id: room.owner.id,
        username: room.owner.username,
        displayName: room.owner.displayName
      },
      isMember,
      isOwner,
      allowFileSharing: room.allowFileSharing,
      allowVideo: room.allowVideo,
      requireApproval: room.requireApproval
    }

    return NextResponse.json({ room: roomData })
  } catch (error) {
    console.error('Error fetching room:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
