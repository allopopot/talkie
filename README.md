# Talkie

A **Walkie-Talkie** over **WebRTC** — peer-to-peer push-to-talk audio communication in the browser.

Built with [Next.js](https://nextjs.org) (App Router), [PeerJS](https://peerjs.com), [shadcn/ui](https://ui.shadcn.com), and deployed on Cloudflare via [OpenNext](https://opennext.js.org).

## Features

- **Peer-to-peer audio** — direct WebRTC connections between browsers
- **Push-to-Talk (PTT)** — hold to speak, release to mute
- **Incoming/outgoing audio visualizers** — real-time waveform feedback
- **WebRTC stats panel** — connection state, RTT, jitter, packets, codec info
- **Username dialog** — set your display name
- **Dark/light theme** — toggle via next-themes
- **Mobile-friendly** — touch events for PTT button

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:8000](http://localhost:8000) to see the app.

### Peer Server (optional)

For local development, you can run a PeerJS signalling server:

```bash
npm run peerserver
```

By default, the app uses the public PeerJS Cloud server. Configure your own by editing the `peer` constructor in `app/page.tsx`.

## Scripts

| Script          | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start Next.js dev server on port 8000|
| `npm run build` | Build for production                 |
| `npm run start` | Start production server              |
| `npm run lint`  | Run ESLint                           |
| `npm run peerserver` | Start PeerJS server on port 9000 |
| `npm run deploy`| Build and deploy to Cloudflare       |

## Environment Variables

| Script          | Description                          |
| --------------- | ------------------------------------ |
| `NEXT_PUBLIC_PEER_SERVER_HOST`   | Set Peer Server Hostname|


## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Library:** shadcn/ui (Radix primitives)
- **State:** Jotai
- **WebRTC:** PeerJS
- **Theming:** next-themes
- **Deployment:** Cloudflare (via OpenNext)

## Deployment

```bash
npm run deploy
```

This builds the Next.js app with OpenNext and deploys it to Cloudflare.
