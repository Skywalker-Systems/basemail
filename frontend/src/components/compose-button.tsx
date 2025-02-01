import { ComposeToolbar } from "@/components/compose-toolbar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Mail } from "lucide-react"
import { useState } from "react"
import { sendEmail } from "./actions"

function ComposeButton() {
    const [open, setOpen] = useState(false)
    const { toast } = useToast()
    const [to, setTo] = useState("")
    const [subject, setSubject] = useState("")
    const [body, setBody] = useState("")

    const handleSendEmail = () => {
        if (!to) {
            toast({
                title: "Error",
                description: "Please specify at least one recipient",
                variant: "destructive",
            })
            return
        }

        sendEmail({
            to,
            subject,
            body,
        })

        toast({
            title: "Email sent",
            description: "Your message has been sent successfully.",
        })
        setOpen(false)

        // Reset form
        setTo("")
        setSubject("")
        setBody("")
    }

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
                                        value={to}
                                        onChange={(e) => setTo(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center border-b">
                                    <Input
                                        type="text"
                                        placeholder="Subject"
                                        className="border-0 focus-visible:ring-0 px-0"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex-1">
                                <ComposeToolbar />
                                <Textarea
                                    placeholder="Write your message here..."
                                    className="h-full resize-none border-0 focus-visible:ring-0"
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t">
                            <div className="flex gap-2">
                                <Button onClick={handleSendEmail}>Send</Button>
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