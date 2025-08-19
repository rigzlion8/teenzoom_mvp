import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    return NextResponse.json({ 
      message: 'POST test endpoint working',
      receivedBody: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to parse body',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 })
  }
}
