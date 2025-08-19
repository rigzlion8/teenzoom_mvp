import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('gtrsupra20252026', 10)
  
  const admin = await prisma.user.upsert({
    where: { username: 'Crosslow7' },
    update: {},
    create: {
      username: 'Crosslow7',
      displayName: 'Admin',
      email: 'admin@teenzoom.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      coins: 50000,
      vipLifetime: true,
      xp: 1000,
      level: 10,
      isOnline: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSeen: new Date()
    }
  })

  console.log('✅ Admin user created:', admin.username)

  // Create general room
  const generalRoom = await prisma.room.upsert({
    where: { roomId: 'general' },
    update: {},
    create: {
      roomId: 'general',
      name: 'General',
      description: 'Welcome to TeenZoom! This is the main chat room.',
      privacy: 'public',
      category: 'general',
      maxUsers: 100,
      ownerId: admin.id,
      allowFileSharing: true,
      allowVideo: true,
      isActive: true,
      requireApproval: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivity: new Date()
    }
  })

  console.log('✅ General room created:', generalRoom.name)

  // Add admin to general room
  await prisma.roomMember.upsert({
    where: {
      userId_roomId: {
        userId: admin.id,
        roomId: generalRoom.id
      }
    },
    update: {},
    create: {
      userId: admin.id,
      roomId: generalRoom.id,
      role: 'admin',
      isActive: true,
      joinedAt: new Date()
    }
  })

  console.log('✅ Admin added to general room')

  // Create welcome message
  await prisma.message.create({
    data: {
      content: 'Welcome to TeenZoom v2.0! 🎉',
      userId: admin.id,
      roomId: generalRoom.id,
      messageType: 'text',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  console.log('✅ Welcome message created')

  console.log('🎉 Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
