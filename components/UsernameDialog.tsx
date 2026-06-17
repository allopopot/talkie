import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usernameAtom } from "@/stores";
import { useAtomValue, useSetAtom } from "jotai";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Radio } from "lucide-react";
import { useState } from "react";
import { Pacifico } from "next/font/google";
import Logo from "@/app/Logo.svg"

const paficoFont = Pacifico({ weight: "400" })

export default function UsernameDialog() {
    const username = useAtomValue(usernameAtom)
    const setUsername = useSetAtom(usernameAtom)

    const [ax, setAx] = useState("")

    return (
        <Dialog open={username === ""}>
            <DialogContent showCloseButton={false} className="sm:max-w-sm">
                <DialogHeader className="items-center text-center gap-2 pt-2">
                    <img src={Logo.src} alt="Talkie Logo" className="mb-3 h-20 w-auto" />
                    <div>
                        <DialogTitle className="mb-2">Welcome to Talkie</DialogTitle>
                        <DialogDescription className="text-balance">
                            Choose a display name to get started
                        </DialogDescription>
                    </div>
                </DialogHeader>
                <Input onChange={(ev) => setAx(ev.currentTarget.value)}
                    placeholder="Enter your name"
                    className="text-sm text-center"
                    onKeyDown={(ev) => { if (ev.key === "Enter" && ax.trim()) setUsername(ax.trim()) }}
                />
                <Button onClick={() => setUsername(ax.trim())} disabled={!ax.trim()} className="w-full">
                    Continue
                </Button>
            </DialogContent>
        </Dialog>
    )
}