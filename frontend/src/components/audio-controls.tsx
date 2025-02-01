import { Button } from "@/components/ui/button"
import { Play, Pause, Square } from "lucide-react"

interface AudioControlsProps {
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
  onStop: () => void
}

export function AudioControls({ isPlaying, onPlay, onPause, onStop }: AudioControlsProps) {
  return (
    <div className="flex items-center space-x-2">
      {isPlaying ? (
        <Button variant="ghost" size="sm" onClick={onPause}>
          <Pause className="h-4 w-4" />
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={onPlay}>
          <Play className="h-4 w-4" />
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={onStop}>
        <Square className="h-4 w-4" />
      </Button>
    </div>
  )
}

