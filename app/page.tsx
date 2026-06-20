"use client"

import { useCallback, useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import type { DataConnection, MediaConnection } from "peerjs";
import Connection from "@/components/Connection";
import AudioVisualizer from "@/components/AudioVisualizer";
import { toast } from "sonner"
import { useAtomValue } from "jotai";
import { usernameAtom } from "@/stores";
import UsernameDialog from "@/components/UsernameDialog";
import MicrophonePermissionDialog from "@/components/MicrophonePermissionDialog";
import { Button } from "@/components/ui/button";
import { PhoneIncoming, PhoneOutgoing, X } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function Main() {
    const peer = useRef(new Peer({
        host: process.env?.NEXT_PUBLIC_PEER_SERVER_HOST || "0.peerjs.com",
        path: "/",
        secure: true,
    }))
    const conn = useRef<DataConnection>(undefined)
    const [peerId, setPeerId] = useState("Loading")
    const [remotePeerId, setRemotePeerId] = useState("")
    const [peerConnected, setPeerConnected] = useState(false)
    const username = useAtomValue(usernameAtom)
    const [peerUsername, setPeerUsername] = useState("")
    const audioSpeakerRef = useRef<HTMLAudioElement>(null)
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
    const microphoneAudioTrack = useRef<MediaStream>(null)
    const [isPTT, setIsPTT] = useState<boolean>(false)
    const [isRecievingAudio, setIsRecievingAudio] = useState<boolean>(false)
    const medConnRef = useRef<MediaConnection>(null)

    interface WebRTCStats {
        connectionState: string
        iceState: string
        currentRoundTripTime: string
        packetsReceived: number
        packetsSent: number
        packetsLost: number
        jitter: string
        codec: string
    }
    const [stats, setStats] = useState<WebRTCStats | null>(null)

    useEffect(() => {
        peer.current.on("open", (id) => {
            setPeerId(id)
        })
        peer.current.on("connection", (ev) => {
            conn.current = ev
            initDataConnnection()
        })
        peer.current.on("call", (medConn) => {
            medConnRef.current = medConn
            navigator.mediaDevices.getUserMedia({ audio: true }).then(mStream => {
                microphoneAudioTrack.current = mStream
                mStream.getAudioTracks().forEach(track => { track.enabled = false })
                medConn.answer(mStream)
                medConn.on("stream", (remStream) => {
                    if (audioSpeakerRef.current) {
                        audioSpeakerRef.current.srcObject = remStream
                        setRemoteStream(remStream)
                    }
                })
            }).catch(error => {
                conn.current?.send({ error: "Peer Microphone: No hardware / Insufficient Permissions" })
                conn.current?.close()
            })
        })
    }, [peer.current])

    useEffect(() => {
        if (peerConnected) {
            sendData({ username })
            navigator.vibrate([200, 100, 200, 50, 300]);
        }
    }, [peerConnected])

    useEffect(() => {
        if (!peerConnected) return

        const interval = setInterval(async () => {
            const pcData = conn.current?.peerConnection
            const pcMedia = medConnRef.current?.peerConnection

            const pcs = [pcData, pcMedia].filter(Boolean) as RTCPeerConnection[]
            if (pcs.length === 0) return

            const newStats: WebRTCStats = {
                connectionState: "N/A",
                iceState: "N/A",
                currentRoundTripTime: "N/A",
                packetsReceived: 0,
                packetsSent: 0,
                packetsLost: 0,
                jitter: "N/A",
                codec: "N/A",
            }

            for (const pc of pcs) {
                try {
                    const report = await pc.getStats()
                    report.forEach(stat => {
                        if (stat.type === "connection") {
                            newStats.connectionState = stat.state
                        }
                        if (stat.type === "candidate-pair" && stat.state === "succeeded") {
                            newStats.currentRoundTripTime = stat.currentRoundTripTime != null
                                ? `${(stat.currentRoundTripTime * 1000).toFixed(0)} ms`
                                : "N/A"
                        }
                        if (stat.type === "inbound-rtp" && stat.kind === "audio") {
                            newStats.packetsReceived = stat.packetsReceived ?? 0
                            newStats.packetsLost = stat.packetsLost ?? 0
                            newStats.jitter = stat.jitter != null
                                ? `${(stat.jitter * 1000).toFixed(1)} ms`
                                : "N/A"
                        }
                        if (stat.type === "outbound-rtp" && stat.kind === "audio") {
                            newStats.packetsSent = stat.packetsSent ?? 0
                        }
                        if (stat.type === "codec" && stat.mimeType?.startsWith("audio/")) {
                            newStats.codec = stat.mimeType
                        }
                        if (stat.type === "transport") {
                            if (pc.iceConnectionState) {
                                newStats.iceState = pc.iceConnectionState
                            }
                        }
                    })
                } catch { }
            }

            setStats(newStats)
        }, 1000)

        return () => {
            clearInterval(interval)
            setStats(null)
        }
    }, [peerConnected])

    function onConnectClickHandler(OpeerId = "") {
        conn.current = peer.current.connect(OpeerId)
        initDataConnnection()
    }

    function initDataConnnection() {
        conn.current?.on("open", () => {
            toast("Connection Opened", {})
            setPeerConnected(true)
            setRemotePeerId(conn.current?.peer ?? "")

            navigator.mediaDevices.getUserMedia({ audio: true }).then(mStream => {
                const medConn = peer.current.call(conn.current?.peer ?? "", mStream)
                medConnRef.current = medConn
                microphoneAudioTrack.current = mStream
                mStream.getAudioTracks().forEach(track => (track.enabled = false))
                medConn.on("stream", (remStream) => {
                    if (audioSpeakerRef.current) {
                        audioSpeakerRef.current.srcObject = remStream
                        setRemoteStream(remStream)
                    }
                })
            }).catch(error => {
                conn.current?.send({ error: "Peer Microphone: No hardware / Insufficient Permissions" })
                conn.current?.close()
            })
        })
        conn.current?.on("data", (ev: any) => {
            if (ev?.username) {
                setPeerUsername(ev?.username)
            }
            if (ev?.error) {
                toast.error(ev.error)
            }
            if (ev?.type === "signal-ptt") {
                if (ev?.state) playBeep()
                setIsRecievingAudio(ev?.state)
            }
        })
        conn.current?.on("close", () => {
            setPeerConnected(false)
            toast("Connection Closed", {})
        })
    }

    const playBeep = useCallback(() => {
        try {
            const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
            const freqs = [523.25, 659.25, 783.99]
            const now = audioCtx.currentTime
            freqs.forEach((freq, i) => {
                const osc = audioCtx.createOscillator()
                const gain = audioCtx.createGain()
                osc.connect(gain)
                gain.connect(audioCtx.destination)
                osc.type = "sine"
                osc.frequency.setValueAtTime(freq, now + i * 0.1)
                gain.gain.setValueAtTime(0.3, now + i * 0.1)
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.12)
                osc.start(now + i * 0.1)
                osc.stop(now + i * 0.1 + 0.12)
            })
            setTimeout(() => audioCtx.close(), 600)
        } catch { }
    }, [])

    function sendData(data: any) {
        conn.current?.send(data)
    }

    function togglePTT(state: boolean = false) {
        setIsPTT(state)
        conn.current?.send({
            type: "signal-ptt",
            state: state
        })
        microphoneAudioTrack.current?.getAudioTracks().forEach(track => { track.enabled = state })
    }

    return (
        <>
            {!peerConnected &&
                <Connection peerId={peerId} onConnectClickHandler={onConnectClickHandler}></Connection>
            }
            {
                peerConnected &&
                <div className="h-dvh grid grid-rows-[max-content_1fr_max-content] gap-4 bg-background overflow-hidden">

                    <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card/50">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-accent/15 flex items-center justify-center text-xs font-medium text-accent">
                                {username?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div>
                                <p className="text-sm font-medium leading-none">{peerUsername}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 font-mono">{remotePeerId}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className={["size-1.5 rounded-full animate-pulse", (stats?.iceState === "connected" ? "bg-emerald-500" : "bg-red-500")].join(" ")} />
                                {stats?.iceState ?? "N/A"}
                            </span>
                        </div>
                    </div>


                    <div className="overflow-auto flex flex-col gap-4">
                        <div className="px-4">
                            <div className="rounded-2xl bg-card border border-border overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                                    <div className="flex items-center gap-2">
                                        <div className={`size-2 rounded-full ${isRecievingAudio ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30"}`} />
                                        <span className="text-xs font-medium text-muted-foreground">Incoming Audio</span>
                                    </div>
                                    <PhoneIncoming className={`size-3.5 ${isRecievingAudio ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                                </div>
                                <div className="p-4">
                                    <AudioVisualizer stream={remoteStream} />
                                    <audio ref={audioSpeakerRef} id="speaker" autoPlay={true} className="hidden" />
                                </div>
                            </div>
                        </div>

                        <div className="px-4">
                            <div className="rounded-2xl bg-card border border-border overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                                    <div className="flex items-center gap-2">
                                        <div className={`size-2 rounded-full ${isPTT ? "bg-accent animate-pulse" : "bg-muted-foreground/30"}`} />
                                        <span className="text-xs font-medium text-muted-foreground">Outgoing Audio</span>
                                    </div>
                                    <PhoneOutgoing className={`size-3.5 ${isPTT ? "text-accent" : "text-muted-foreground/40"}`} />
                                </div>
                                <div className="p-4">
                                    <AudioVisualizer stream={microphoneAudioTrack.current} />
                                </div>
                            </div>
                        </div>

                        <div className="px-4">
                            <div className="rounded-2xl bg-card border border-border p-4">
                                <p className="text-xs font-medium text-muted-foreground mb-3">WebRTC Stats</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Connection</span>
                                        <span className="font-mono font-medium">{stats?.connectionState ?? "N/A"}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">ICE</span>
                                        <span className="font-mono font-medium">{stats?.iceState ?? "N/A"}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">RTT</span>
                                        <span className="font-mono font-medium">{stats?.currentRoundTripTime ?? "N/A"}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Jitter</span>
                                        <span className="font-mono font-medium">{stats?.jitter ?? "N/A"}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Codec</span>
                                        <span className="font-mono font-medium">{stats?.codec ?? "N/A"}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Sent</span>
                                        <span className="font-mono font-medium">{stats?.packetsSent ?? 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Received</span>
                                        <span className="font-mono font-medium">{stats?.packetsReceived ?? 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Lost</span>
                                        <span className="font-mono font-medium">{stats?.packetsLost ?? 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex item-center gap-3 px-4 py-3 border-t border-border bg-card/50">
                        <Button onTouchStart={() => { togglePTT(true) }} onTouchEnd={() => { togglePTT(false) }} onMouseUp={() => { togglePTT(false) }} onMouseDown={() => { togglePTT(true) }}
                            className="flex-1 h-10" variant={isPTT ? "secondary" : "default"} size="lg">
                            {isPTT ? "Channel Open" : "Push to Talk"}
                        </Button>
                        <Button className="h-full" variant="destructive" size="lg" onClick={() => conn.current?.close()}>
                            Disconnect
                        </Button>
                    </div>

                </div>
            }
            <UsernameDialog />
            <MicrophonePermissionDialog />
        </>
    );
}
