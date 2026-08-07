import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'
import type { SkinSummary } from '@/types/skins'

import { withThumbnailLimit } from '../lib/thumbnailQueue'
import { renderStaticThumbnail } from '../lib/thumbnailRenderer'
import { SkinAPI } from '../services/skin.api'

interface SkinCardProps {
  skin: SkinSummary
  matched?: boolean
  dimmed?: boolean
  onClick: () => void
}

function SkinThumbnail({ skin, alt }: { skin: SkinSummary; alt: string }) {
  const [renderUrl, setRenderUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    // Rendered locally with skinview3d (same engine as the detail modal's 3D
    // view) instead of a third-party render service: no network flakiness,
    // no bot-detection surprises. The texture is fetched through our own
    // backend into a data: URI first so the canvas read-back below never
    // taints on a cross-origin image.
    withThumbnailLimit(async () => {
      const textureBase64 = await SkinAPI.fetchTextureBase64(skin.skinUrl)
      return renderStaticThumbnail(
        `data:image/png;base64,${textureBase64}`,
        skin.model === 'slim' ? 'slim' : 'default',
      )
    })
      .then((url) => !cancelled && setRenderUrl(url))
      .catch((err) => {
        if (!cancelled) console.error('Falha ao renderizar thumbnail:', err)
      })
    return () => {
      cancelled = true
    }
  }, [skin.skinUrl, skin.model])

  if (!renderUrl) {
    return <div className="bg-muted/60 size-full animate-pulse rounded-md" />
  }

  return (
    <img
      src={renderUrl}
      alt={alt}
      className="h-full w-auto [image-rendering:pixelated]"
      loading="lazy"
    />
  )
}

export function SkinCard({ skin, matched, dimmed, onClick }: SkinCardProps) {
  const username = skin.firstSeenPlayer.username

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'hover:bg-accent hover:border-border relative flex w-full flex-col items-center gap-2 rounded-lg border border-transparent p-3 text-center transition-all duration-200',
        matched && 'border-primary/60 bg-primary/5',
        dimmed && 'opacity-35 grayscale hover:opacity-70 hover:grayscale-0',
      )}
    >
      {matched && (
        <span className="bg-primary text-primary-foreground absolute top-1 left-1 z-10 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
          Match
        </span>
      )}
      <div className="bg-muted/40 flex h-52 w-full items-center justify-center overflow-hidden rounded-md py-4">
        <SkinThumbnail skin={skin} alt={username} />
      </div>
      {username && (
        <span className="line-clamp-1 w-full text-sm font-medium break-words uppercase">
          {username}
        </span>
      )}
    </button>
  )
}
