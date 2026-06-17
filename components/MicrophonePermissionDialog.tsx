import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Mic, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

export default function MicrophonePermissionDialog() {

    const [ax, setAx] = useState(false)

    useEffect(() => {
        navigator.permissions.query({ name: 'microphone' }).then(permission => {
            permission.onchange = () => {
                toggleDialogState(permission.state)
            };
            toggleDialogState(permission.state)
        })
    }, [])

    function toggleDialogState(permissionState: PermissionState) {
        if (permissionState === "denied") {
            setAx(true)
        } else if (permissionState === "prompt") {
            setAx(false)
        } else if (permissionState === "granted") {
            setAx(false)
        }
    }

    return (
        <Dialog open={ax}>
            <DialogContent showCloseButton={false} className="sm:max-w-sm">
                <DialogHeader className="items-center text-center gap-2 pt-2">
                    <div className="size-10 rounded-2xl bg-destructive/20 flex items-center justify-center ring-1 ring-destructive/20">
                        <Mic className="size-5 text-destructive" />
                    </div>
                    <div>
                        <DialogTitle>Microphone Required</DialogTitle>
                        <DialogDescription className="text-balance">
                            Talkie needs microphone access to transmit audio to your peers. Please enable it in your browser settings.
                        </DialogDescription>
                    </div>
                </DialogHeader>
                <Button onClick={() => location.reload()} className="w-full gap-2">
                    <RefreshCw className="size-4" />
                    Refresh Page
                </Button>
            </DialogContent>
        </Dialog>
    )
}