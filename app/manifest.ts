import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Talkie',
        short_name: 'Talkie',
        description: 'Walkie-Talkie over WebRTC',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#cc7455',
        orientation: "portrait",
        icons: [
            {
                src: '/app-icon/512x512-app-icon.png',
                type: 'image/png',
                sizes: "512x512",
                purpose: "any"
            }
        ],
    }
}