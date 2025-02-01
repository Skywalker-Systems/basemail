import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AISummaryBannerProps {
  onSummarize: () => void
}

export function AISummaryBanner({ onSummarize }: AISummaryBannerProps) {
  return (
    <div className="bg-blue-100 text-blue-900 px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <p className="text-sm font-medium">New: Use AI to summarize your emails and save time!</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="text-xs bg-blue-200 hover:bg-blue-300 text-blue-900"
          onClick={onSummarize}
        >
          Try AI Summary
        </Button>
      </div>
    </div>
  )
}

