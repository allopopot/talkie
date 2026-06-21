"use client"

import { Pacifico } from "next/font/google";
import { copyToClipboard } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import { Copy, X } from "lucide-react"
import { toast } from "sonner"
import QRCode from "qrcode"
import { useEffect, useState } from "react"
import { useAtomValue, useSetAtom } from "jotai"
import { usernameAtom } from "@/stores"
import ThemeToggle from "@/components/ThemeToggle"
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/app/Logo.svg"

const paficoFont = Pacifico({ weight: "400" })

export default function Connection({ peerId, onConnectClickHandler }: { peerId: string, onConnectClickHandler: Function }) {

    const [mPeerId, setMPeerId] = useState<string>("")
    const [autoPopulate, setAutoPopulate] = useState(false)
    const username = useAtomValue(usernameAtom)
    const setUsername = useSetAtom(usernameAtom)
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        var canvas = document.getElementById('qrcanvas')
        if (canvas) {
            QRCode.toCanvas(canvas, `${location.origin}/?peer=${peerId}`, function (error) {
                if (error) console.error(error)
            })
        }
    }, [peerId, autoPopulate])

    useEffect(() => {
        let pid = searchParams.get("peer")
        setMPeerId(pid ?? "")
        if (pid) {
            setAutoPopulate(true)
        }
    }, [])


    return (
        <div className="w-full h-dvh flex flex-col p-4 relative overflow-hidden">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <div className="flex flex-col items-center mb-4 shrink-0">
                <img src={Logo.src} alt="Talkie Logo" className="mb-2 w-auto h-20" />
                <p className="text-xs text-muted-foreground">Walkie-Talkie over WebRTC</p>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 -mx-4 px-4">
                <div className="max-w-md mx-auto space-y-3 pb-4">
                    <div className="rounded-2xl bg-card border border-border p-4 space-y-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="size-8 rounded-full bg-accent/15 flex items-center justify-center text-xs font-medium text-accent">
                                    {username?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Logged in as</p>
                                    <p className="text-sm font-medium">{username}</p>
                                </div>
                            </div>
                            <Button disabled={peerId === "Loading"} onClick={() => setUsername("")} size="icon-xs" variant="ghost"><X /></Button>
                        </div>

                        <Separator className="my-2" />

                        <div>
                            <p className="text-xs text-muted-foreground mb-1.5">Your Connection ID</p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 rounded-lg bg-muted px-3 py-2 text-sm font-mono text-foreground truncate">{peerId}</code>
                                <Button disabled={peerId === "Loading"} onClick={() => {
                                    copyToClipboard(peerId);
                                    toast("Connection ID copied")
                                }} size="icon-sm" variant="outline"><Copy /></Button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
                        <p className="text-xs text-muted-foreground">Connect to a peer</p>
                        <InputGroup>
                            <InputGroupInput disabled={peerId === "Loading"} value={mPeerId} onChange={(ev) => setMPeerId(ev.target.value)} placeholder="Paste connection ID" />
                        </InputGroup>
                        <Button disabled={peerId === "Loading"} variant="default" className="w-full" onClick={() => onConnectClickHandler(mPeerId)}>
                            Connect
                        </Button>
                        {
                            autoPopulate &&
                            <Button variant="destructive" className="w-full" onClick={() => {
                                setAutoPopulate(false)
                                setMPeerId("")
                                router.replace("/",)
                            }}>
                                Reset
                            </Button>
                        }
                    </div>

                    {
                        autoPopulate ? null : <>
                            <div className="rounded-2xl bg-card border border-border p-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">Share invite link</p>
                                    <Button disabled={peerId === "Loading"} size="sm" variant="outline" onClick={() => {
                                        copyToClipboard(`${location.origin}/?peer=${peerId}`);
                                        toast("Invite link copied")
                                    }}>
                                        <Copy /> Copy Link
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-card border border-border p-4 flex flex-col items-center">
                                <p className="text-xs text-muted-foreground mb-3">Scan QR code</p>
                                <div className="rounded-xl bg-white p-3">
                                    {peerId === "Loading" ? (
                                        <div className="size-28 flex items-center justify-center text-muted-foreground text-xs">Loading...</div>
                                    ) : null}
                                    <canvas className={peerId === "Loading" ? "hidden" : "size-28"} id="qrcanvas"></canvas>
                                </div>
                            </div>
                        </>
                    }
                </div>
            </div>
        </div>
    )
}