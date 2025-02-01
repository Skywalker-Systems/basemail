import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
    Bold,
    ChevronDown,
    Image,
    Italic,
    Link,
    List,
    ListOrdered,
    Paperclip,
    Smile,
    Strikethrough,
    TextIcon,
    TextQuote,
    Underline,
} from "lucide-react"

interface ToolbarButtonProps {
    icon: React.ReactNode
    label: string
    onClick?: () => void
    active?: boolean
}

function ToolbarButton({ icon, label, onClick, active }: ToolbarButtonProps) {
    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn(
                "h-8 w-8 hover:bg-muted",
                active && "bg-muted text-primary"
            )}
            onClick={onClick}
            title={label}
        >
            {icon}
        </Button>
    )
}

export function ComposeToolbar() {
    return (
        <div className="flex items-center gap-0.5 p-1 border-b bg-muted/50">
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1">
                        <TextIcon className="h-4 w-4" />
                        Normal text
                        <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1">
                    <div className="grid gap-1">
                        {["Normal text", "Heading 1", "Heading 2", "Heading 3"].map((style) => (
                            <Button
                                key={style}
                                variant="ghost"
                                className="justify-start px-2 text-sm"
                            >
                                {style}
                            </Button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            <div className="h-4 w-px bg-border mx-1" />

            <ToolbarButton icon={<Bold className="h-4 w-4" />} label="Bold" />
            <ToolbarButton icon={<Italic className="h-4 w-4" />} label="Italic" />
            <ToolbarButton icon={<Underline className="h-4 w-4" />} label="Underline" />
            <ToolbarButton
                icon={<Strikethrough className="h-4 w-4" />}
                label="Strikethrough"
            />

            <div className="h-4 w-px bg-border mx-1" />

            <ToolbarButton icon={<List className="h-4 w-4" />} label="Bullet list" />
            <ToolbarButton
                icon={<ListOrdered className="h-4 w-4" />}
                label="Numbered list"
            />
            <ToolbarButton
                icon={<TextQuote className="h-4 w-4" />}
                label="Block quote"
            />

            <div className="h-4 w-px bg-border mx-1" />

            <ToolbarButton icon={<Link className="h-4 w-4" />} label="Insert link" />
            <ToolbarButton
                icon={<Image className="h-4 w-4" />}
                label="Insert image"
            />
            <ToolbarButton
                icon={<Paperclip className="h-4 w-4" />}
                label="Attach file"
            />
            <ToolbarButton
                icon={<Smile className="h-4 w-4" />}
                label="Insert emoji"
            />

            <div className="flex-1" />

            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="More options"
            >
                <ChevronDown className="h-4 w-4" />
            </Button>
        </div>
    )
}
