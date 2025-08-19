import { RtcTokenBuilder } from 'agora-token'

export interface AgoraConfig {
  appId: string
  appCertificate: string
}

export interface StreamConfig {
  uid: string
  channelName: string
  role: 'host' | 'audience'
  token?: string
}

// RtcRole values from agora-token package
export const RtcRole = {
  PUBLISHER: 1,
  SUBSCRIBER: 2,
} as const

export type RtcRoleType = typeof RtcRole[keyof typeof RtcRole]

// Agora configuration - you'll need to add these to your .env file
export const getAgoraConfig = (): AgoraConfig => {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID
  const appCertificate = process.env.AGORA_APP_CERTIFICATE

  if (!appId || !appCertificate) {
    throw new Error('Agora configuration missing. Please check your environment variables.')
  }

  return { appId, appCertificate }
}

// Generate RTC token for secure connections
export const generateRTCToken = (
  channelName: string,
  uid: string | number,
  role: RtcRoleType = RtcRole.PUBLISHER,
  tokenExpire: number = 3600,
  privilegeExpire: number = 0
): string => {
  const config = getAgoraConfig()
  
  // Convert uid to number if it's a string
  const numericUid = typeof uid === 'string' ? parseInt(uid, 10) : uid
  
  return RtcTokenBuilder.buildTokenWithUid(
    config.appId,
    config.appCertificate,
    channelName,
    numericUid,
    role,
    tokenExpire,
    privilegeExpire
  )
}

// Generate token for streamers (hosts)
export const generateHostToken = (channelName: string, uid: string): string => {
  return generateRTCToken(channelName, uid, RtcRole.PUBLISHER)
}

// Generate token for viewers (audience)
export const generateAudienceToken = (channelName: string, uid: string): string => {
  return generateRTCToken(channelName, uid, RtcRole.SUBSCRIBER)
}

// Validate channel name (room ID)
export const validateChannelName = (channelName: string): boolean => {
  // Channel names must be 1-64 characters, alphanumeric and underscore only
  const channelRegex = /^[a-zA-Z0-9_]{1,64}$/
  return channelRegex.test(channelName)
}

// Get default Agora client configuration
export const getDefaultClientConfig = () => ({
  mode: 'rtc' as const,
  codec: 'vp8' as const,
  role: 'audience' as const,
})

// Stream quality presets
export const streamQualityPresets = {
  low: {
    width: 640,
    height: 480,
    frameRate: 15,
    bitrate: 500,
  },
  medium: {
    width: 1280,
    height: 720,
    frameRate: 30,
    bitrate: 1500,
  },
  high: {
    width: 1920,
    height: 1080,
    frameRate: 30,
    bitrate: 3000,
  },
}
