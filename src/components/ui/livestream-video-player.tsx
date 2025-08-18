import { useEffect, useRef } from 'react'
import { ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng'

interface LivestreamVideoPlayerProps {
  videoTrack?: ICameraVideoTrack | null
  audioTrack?: IMicrophoneAudioTrack | null
  className?: string
  style?: React.CSSProperties
}

export const LivestreamVideoPlayer = ({ 
  videoTrack, 
  audioTrack, 
  className = '', 
  style = {} 
}: LivestreamVideoPlayerProps) => {
  const videoRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (videoTrack && videoRef.current) {
      videoTrack.play(videoRef.current)
    }
  }, [videoTrack])

  useEffect(() => {
    if (audioTrack) {
      audioTrack.play()
    }
  }, [audioTrack])

  return (
    <div className={`relative ${className}`} style={style}>
      {/* Video container */}
      <div 
        ref={videoRef} 
        className="w-full h-full bg-gray-900 rounded-lg overflow-hidden"
      />
      
      {/* Audio container (hidden) */}
      <div 
        ref={audioRef} 
        className="hidden"
      />
    </div>
  )
}

export default LivestreamVideoPlayer
