import { ComposeToolbar } from "@/components/compose-toolbar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail } from "lucide-react"
import { useState } from "react"

function ComposeButton() {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
                <Mail className="h-4 w-4" />
                Compose
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[700px] p-0">
                    <DialogTitle className="sr-only">Compose new email</DialogTitle>
                    <div className="flex flex-col h-[600px]">
                        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-t-lg">
                            <h2 className="text-sm font-medium">New Message</h2>
                        </div>

                        <div className="flex flex-col flex-1 p-4">
                            <div className="space-y-4 mb-4">
                                <div className="flex items-center border-b">
                                    <Input
                                        type="text"
                                        placeholder="Recipients"
                                        className="border-0 focus-visible:ring-0 px-0"
                                    />
                                </div>
                                <div className="flex items-center border-b">
                                    <Input
                                        type="text"
                                        placeholder="Subject"
                                        className="border-0 focus-visible:ring-0 px-0"
                                    />
                                </div>
                            </div>

                            <div className="flex-1">
                                <ComposeToolbar />
                                <Textarea
                                    placeholder="Write your message here..."
                                    className="h-full resize-none border-0 focus-visible:ring-0"
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t">
                            <div className="flex gap-2">
                                <Button>Send</Button>
                                <Button variant="ghost" onClick={() => setOpen(false)}>
                                    Discard
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default ComposeButton