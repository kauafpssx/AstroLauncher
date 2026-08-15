import { useEffect, useState } from 'react'

import { SkinAPI } from '@/features/skins/services/skin.api'
import { tooltipProps } from '@/lib/tooltip'
import { cn } from '@/lib/utils'
import type { SkinSummary } from '@/types/skins'

import { cropHeadToBase64Png } from './skin-head-crop'

interface SkinHeadThumbnailProps {
  skin: SkinSummary
  matched?: boolean
  dimmed?: boolean
  onPick: (base64Png: string) => void
}

/** Fetches a skin's full texture, crops just the head out of it client-side,
 * and shows that as a pickable square — the search results only carry the
 * full-body texture URL, there's no head-only endpoint. */
export function SkinHeadThumbnail({
  skin,
  matched,
  dimmed,
  onPick,
}: SkinHeadThumbnailProps) {
  const [headSrc, setHeadSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    SkinAPI.fetchTextureBase64(skin.skinUrl)
      .then((base64) => cropHeadToBase64Png(`data:image/png;base64,${base64}`))
      .then((cropped) => {
        if (!cancelled) setHeadSrc(cropped)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [skin.skinUrl])

  return (
    <button
      type="button"
      disabled={!headSrc}
      onClick={() => headSrc && onPick(headSrc)}
      {...tooltipProps(skin.firstSeenPlayer.username)}
      className={cn(
        'hover:bg-accent relative flex items-center justify-center rounded-md p-1.5 transition-all duration-200 disabled:opacity-40',
        matched && 'bg-primary/5 ring-primary/60 ring-1',
        dimmed && 'opacity-35 grayscale hover:opacity-70 hover:grayscale-0',
      )}
    >
      <div className="bg-muted size-10 overflow-hidden rounded-sm">
        {headSrc && (
          <img
            src={`data:image/png;base64,${headSrc}`}
            alt={skin.firstSeenPlayer.username}
            className="size-full"
          />
        )}
      </div>
    </button>
  )
}
