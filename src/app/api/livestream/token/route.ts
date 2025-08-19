import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateHostToken, generateAudienceToken, validateChannelName } from '@/lib/agora'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { channelName, role, uid } = body

    console.log('Token generation request:', { channelName, role, uid, userId: session.user.id })

    // Validate required fields
    if (!channelName || !role || !uid) {
      console.error('Missing required fields:', { channelName, role, uid })
      return NextResponse.json(
        { error: 'Missing required fields: channelName, role, uid' },
        { status: 400 }
      )
    }

    // Validate channel name format
    if (!validateChannelName(channelName)) {
      console.error('Invalid channel name:', channelName)
      return NextResponse.json(
        { error: 'Invalid channel name format' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['host', 'audience'].includes(role)) {
      console.error('Invalid role:', role)
      return NextResponse.json(
        { error: 'Invalid role. Must be "host" or "audience"' },
        { status: 400 }
      )
    }

    // Generate appropriate token based on role
    let token: string
    try {
      if (role === 'host') {
        token = generateHostToken(channelName, uid)
      } else {
        token = generateAudienceToken(channelName, uid)
      }
      console.log('Token generated successfully for:', { channelName, role, uid })
    } catch (tokenError) {
      console.error('Token generation failed:', tokenError)
      return NextResponse.json(
        { error: 'Failed to generate token', details: tokenError instanceof Error ? tokenError.message : 'Unknown error' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      token,
      channelName,
      role,
      uid,
      expiresIn: 3600, // 1 hour
    })

  } catch (error) {
    console.error('Error generating Agora token:', error)
    return NextResponse.json(
      { error: 'Failed to generate token', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
