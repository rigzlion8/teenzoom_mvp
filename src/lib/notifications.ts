import { prisma } from './prisma'
import { 
  sendFriendRequestEmail, 
  sendFriendAcceptedEmail, 
  sendRoomInvitationEmail
} from './resend'

export interface NotificationData {
  friendId?: string
  roomId?: string
  videoId?: string
  amount?: number
  currency?: string
  [key: string]: string | number | boolean | null | undefined
}

export async function createNotification(
  userId: string,
  type: 'friend_request' | 'friend_accepted' | 'friend_rejected' | 'room_invitation' | 'video_upload' | 'room_created' | 'payment_success' | 'system_alert',
  title: string,
  message: string,
  data?: NotificationData
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || null
      }
    })

    console.log(`Notification created: ${type} for user ${userId}`)
    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

export async function sendFriendRequestNotifications(
  senderId: string,
  receiverId: string
) {
  try {
    // Get user details
    const [sender, receiver] = await Promise.all([
      prisma.user.findUnique({ where: { id: senderId } }),
      prisma.user.findUnique({ where: { id: receiverId } })
    ])

    if (!sender || !receiver) {
      throw new Error('User not found')
    }

    // Create in-app notification
    await createNotification(
      receiverId,
      'friend_request',
      'New Friend Request',
      `${sender.displayName} (@${sender.username}) sent you a friend request`,
      { friendId: senderId }
    )

    // Send email notification
    if (receiver.email) {
      await sendFriendRequestEmail({
        username: receiver.username,
        displayName: receiver.displayName,
        email: receiver.email,
        friendUsername: sender.username,
        friendDisplayName: sender.displayName
      })
    }

    console.log(`Friend request notifications sent to ${receiver.username}`)
  } catch (error) {
    console.error('Error sending friend request notifications:', error)
    throw error
  }
}

export async function sendFriendResponseNotifications(
  requesterId: string,
  responderId: string,
  accepted: boolean
) {
  try {
    // Get user details
    const [requester, responder] = await Promise.all([
      prisma.user.findUnique({ where: { id: requesterId } }),
      prisma.user.findUnique({ where: { id: responderId } })
    ])

    if (!requester || !responder) {
      throw new Error('User not found')
    }

    const notificationType = accepted ? 'friend_accepted' : 'friend_rejected'
    const title = accepted ? 'Friend Request Accepted' : 'Friend Request Declined'
    const message = accepted 
      ? `${responder.displayName} (@${responder.username}) accepted your friend request`
      : `${responder.displayName} (@${responder.username}) declined your friend request`

    // Create in-app notification
    await createNotification(
      requesterId,
      notificationType,
      title,
      message,
      { friendId: responderId }
    )

    // Send email notification
    if (requester.email) {
      if (accepted) {
        await sendFriendAcceptedEmail({
          username: requester.username,
          displayName: requester.displayName,
          email: requester.email,
          friendUsername: responder.username,
          friendDisplayName: responder.displayName
        })
      }
      // Note: sendFriendRejectedEmail doesn't exist, so we skip email for rejections
    }

    console.log(`Friend response notifications sent to ${requester.username}`)
  } catch (error) {
    console.error('Error sending friend response notifications:', error)
    throw error
  }
}

export async function sendVideoUploadNotification(
  videoId: string,
  uploaderId: string,
  roomId: string
) {
  try {
    // Get video and minimal room/uploader details to avoid nullable field issues
    const [video, room, uploader] = await Promise.all([
      prisma.roomVideo.findUnique({ where: { id: videoId } }),
      prisma.room.findUnique({ where: { id: roomId }, select: { id: true, name: true } }),
      prisma.user.findUnique({ where: { id: uploaderId }, select: { id: true, displayName: true } })
    ])

    if (!video || !room || !uploader) {
      throw new Error('Video, room, or uploader not found')
    }

    const roomMembers = await prisma.roomMember.findMany({
      where: { roomId, userId: { not: uploaderId } },
      select: { userId: true, user: { select: { email: true, displayName: true } } }
    })

    for (const member of roomMembers) {
      await createNotification(
        member.userId,
        'video_upload',
        'New Video in Room',
        `${uploader.displayName} uploaded "${video.title}" in ${room.name}`,
        { videoId, roomId, uploaderId }
      )
      // Email sending for video uploads is optional/disabled for now
    }

    console.log(`Video upload notifications sent to ${roomMembers.length} room members`)
  } catch (error) {
    console.error('Error sending video upload notifications:', error)
    throw error
  }
}

export async function sendRoomInvitationNotification(
  inviterId: string,
  inviteeId: string,
  roomId: string
) {
  try {
    // Get user and room details - select only safe fields to avoid lastActivity null issues
    const [inviter, invitee, room] = await Promise.all([
      prisma.user.findUnique({ where: { id: inviterId } }),
      prisma.user.findUnique({ where: { id: inviteeId } }),
      prisma.room.findUnique({ 
        where: { id: roomId }, 
        select: { id: true, name: true, description: true, roomId: true }
      })
    ])

    if (!inviter || !invitee || !room) {
      throw new Error('User or room not found')
    }

    // Create in-app notification
    await createNotification(
      inviteeId,
      'room_invitation',
      'Room Invitation',
      `${inviter.displayName} invited you to join ${room.name}`,
      { roomId, inviterId }
    )

    // Send email notification
    if (invitee.email) {
      await sendRoomInvitationEmail({
        username: invitee.username,
        displayName: invitee.displayName,
        email: invitee.email,
        roomName: room.name,
        roomDescription: room.description || '',
        inviterUsername: inviter.username,
        inviterDisplayName: inviter.displayName,
        roomUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/room/${room.roomId}`
      })
    }

    console.log(`Room invitation notification sent to ${invitee.username}`)
  } catch (error) {
    console.error('Error sending room invitation notification:', error)
    throw error
  }
}
