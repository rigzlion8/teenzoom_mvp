# TeenZoom Livestream Setup Guide

This guide will help you set up and configure the livestream functionality using Agora.io in your TeenZoom MVP.

## 🚀 Quick Start

### 1. Get Agora.io Credentials

1. Go to [Agora Console](https://console.agora.io/)
2. Create a new project or use an existing one
3. Get your **App ID** and **App Certificate**
4. Note: The App Certificate is sensitive - keep it secure!

### 2. Environment Variables

Add these to your `.env` file:

```bash
# Agora.io Livestream Configuration
NEXT_PUBLIC_AGORA_APP_ID="your_agora_app_id_here"
AGORA_APP_CERTIFICATE="your_agora_app_certificate_here"
```

**Important**: 
- `NEXT_PUBLIC_AGORA_APP_ID` is public and safe to expose
- `AGORA_APP_CERTIFICATE` is private and should never be exposed to the client

### 3. Install Dependencies

```bash
npm install agora-rtc-react agora-rtc-sdk-ng agora-token
```

## 🏗️ Architecture Overview

### Components Created

1. **`useLivestream` Hook** (`src/hooks/use-livestream.ts`)
   - Manages Agora.io client lifecycle
   - Handles stream start/stop
   - Manages viewer connections
   - Integrates with existing Socket.IO infrastructure

2. **Livestream Video Player Component** (`src/components/ui/livestream-video-player.tsx`)
   - Displays video/audio streams
   - Handles track playback

3. **Livestream Controls** (`src/components/ui/livestream-controls.tsx`)
   - Start/stop stream buttons
   - Video/audio toggle controls
   - Viewer count display

4. **API Endpoint** (`src/app/api/livestream/token/route.ts`)
   - Generates secure RTC tokens
   - Validates user permissions

5. **Agora Utilities** (`src/lib/agora.ts`)
   - Token generation
   - Configuration management
   - Stream quality presets

### Socket.IO Integration

The livestream system extends your existing Socket.IO infrastructure with new events:

- `livestream_started` - When someone starts streaming
- `livestream_ended` - When a stream ends
- `viewer_joined` - When someone joins as a viewer
- `viewer_left` - When someone leaves as a viewer

## 📱 Usage Examples

### Basic Livestream Hook Usage

```tsx
import { useLivestream } from '@/hooks/use-livestream'

function MyComponent() {
  const {
    isLive,
    isStreaming,
    viewerCount,
    startStream,
    stopStream,
    toggleVideo,
    toggleAudio
  } = useLivestream('room-123')

  return (
    <div>
      {!isStreaming ? (
        <button onClick={startStream}>Start Stream</button>
      ) : (
        <button onClick={stopStream}>Stop Stream</button>
      )}
      
      {isStreaming && (
        <>
          <button onClick={toggleVideo}>Toggle Video</button>
          <button onClick={toggleAudio}>Toggle Audio</button>
        </>
      )}
      
      <p>Viewers: {viewerCount}</p>
    </div>
  )
}
```

### Livestream Video Player Usage

```tsx
import { LivestreamVideoPlayer } from '@/components/ui/livestream-video-player'

function StreamViewer({ localTracks, remoteUsers }) {
  return (
    <div>
      {/* Local video (streamer view) */}
      <LivestreamVideoPlayer 
        videoTrack={localTracks.video}
        audioTrack={localTracks.audio}
        className="w-full h-64"
      />
      
      {/* Remote videos (viewer view) */}
      {remoteUsers.map(user => (
        <LivestreamVideoPlayer
          key={user.uid}
          videoTrack={user.videoTrack}
          audioTrack={user.audioTrack}
          className="w-32 h-24"
        />
      ))}
    </div>
  )
}
```

### Livestream Controls Usage

```tsx
import { LivestreamControls } from '@/components/ui/livestream-controls'

function StreamControls({ 
  isStreaming, 
  isLive, 
  viewerCount,
  onStartStream,
  onStopStream,
  onToggleVideo,
  onToggleAudio 
}) {
  return (
    <LivestreamControls
      isStreaming={isStreaming}
      isLive={isLive}
      viewerCount={viewerCount}
      onStartStream={onStartStream}
      onStopStream={onStopStream}
      onToggleVideo={onToggleVideo}
      onToggleAudio={onToggleAudio}
    />
  )
}
```

## 🔧 Configuration Options

### Stream Quality Presets

The system includes predefined quality settings:

```typescript
import { streamQualityPresets } from '@/lib/agora'

// Available presets:
// - low: 640x480, 15fps, 500kbps
// - medium: 1280x720, 30fps, 1500kbps  
// - high: 1920x1080, 30fps, 3000kbps
```

### Custom Quality Settings

```typescript
const customQuality = {
  width: 1280,
  height: 720,
  frameRate: 30,
  bitrate: 2000
}
```

## 🛡️ Security Features

### Token-Based Authentication

- RTC tokens expire after 1 hour by default
- Tokens are generated server-side only
- User authentication required for token generation
- Role-based access (host vs audience)

### Channel Validation

- Channel names must be 1-64 characters
- Alphanumeric and underscore characters only
- Prevents malicious channel creation

## 📊 Monitoring & Analytics

### Built-in Metrics

- Viewer count tracking
- Stream duration monitoring
- Connection quality indicators
- Error logging and reporting

### Custom Analytics

You can extend the system to track:

```typescript
// Example: Custom metrics
const streamMetrics = {
  peakViewers: Math.max(...viewerCounts),
  averageViewers: viewerCounts.reduce((a, b) => a + b, 0) / viewerCounts.length,
  streamDuration: Date.now() - streamStartTime,
  qualityChanges: qualityChangeCount
}
```

## 🚨 Troubleshooting

### Common Issues

1. **"Agora configuration missing"**
   - Check your `.env` file has the required variables
   - Ensure `AGORA_APP_CERTIFICATE` is set (not just the public ID)

2. **"Failed to get token"**
   - Verify your Agora App Certificate is correct
   - Check the API endpoint is accessible
   - Ensure user authentication is working

3. **Video not displaying**
   - Check browser permissions for camera/microphone
   - Verify Agora client is properly initialized
   - Check console for error messages

4. **High latency**
   - Consider using Agora's global edge servers
   - Adjust stream quality settings
   - Check network connectivity

### Debug Mode

Enable detailed logging:

```typescript
// In your component
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Agora client state:', agoraClient)
    console.log('Local tracks:', localTracks)
    console.log('Remote users:', remoteUsers)
  }
}, [agoraClient, localTracks, remoteUsers])
```

## 🔄 Updates & Maintenance

### Regular Tasks

1. **Token Rotation**: Consider implementing automatic token refresh
2. **Quality Monitoring**: Track stream quality metrics
3. **Error Tracking**: Monitor and log connection issues
4. **Performance**: Optimize based on usage patterns

### Scaling Considerations

- **Multiple Streamers**: The system supports multiple concurrent streamers
- **Room Limits**: Consider implementing viewer limits per room
- **CDN Integration**: For global distribution, consider Agora's CDN features

## 📚 Additional Resources

- [Agora.io Documentation](https://docs.agora.io/)
- [WebRTC Best Practices](https://webrtc.github.io/webrtc/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

## 🆘 Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your Agora.io credentials
3. Test with the Agora.io sample apps
4. Check network connectivity and firewall settings
5. Review the troubleshooting section above

---

**Happy Streaming! 🎥✨**
