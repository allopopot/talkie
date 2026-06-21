"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const installedHandler = () => setInstalled(true)

    window.addEventListener("beforeinstallprompt", handler)
    window.addEventListener("appinstalled", installedHandler)

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      window.removeEventListener("appinstalled", installedHandler)
    }
  }, [])

  if (installed || !deferredPrompt) return null

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={async () => {
        const promptEvent = deferredPrompt as any
        promptEvent.prompt()
        const result = await promptEvent.userChoice
        if (result.outcome === "accepted") setInstalled(true)
        setDeferredPrompt(null)
      }}
    >
      <Download className="size-4" />
    </Button>
  )
}
