
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, Pause, X } from "lucide-react"

interface FloatingAudioPlayerProps {
  audioUrl: string | null
  onClose: () => void
}

export function FloatingAudioPlayer({ audioUrl, onClose }: FloatingAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (audioUrl) {
      audioRef.current = new Audio(audioUrl)
      audioRef.current.addEventListener("ended", () => setIsPlaying(false))
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.removeEventListener("ended", () => setIsPlaying(false))
      }
    }
  }, [audioUrl])

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  if (!audioUrl) return null

  return (
    <Card className="absolute top-0 right-0 flex items-center space-x-4 p-4 z-50 bg-pink-500">
      <Button variant="ghost" size="icon" onClick={togglePlayPause}>
        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
      </Button>
      <span className="text-sm font-medium">Playing AI Summary</span>
      <Button variant="ghost" size="icon" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
    </Card>
  )
}

