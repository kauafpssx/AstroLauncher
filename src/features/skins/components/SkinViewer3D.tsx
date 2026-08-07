import { Download, Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { IdleAnimation, SkinViewer, WalkingAnimation } from 'skinview3d'

import { Button } from '@/components/ui/button'
import { tooltipProps } from '@/lib/tooltip'
import type { SkinSource } from '@/types/skins'

import { SkinAPI } from '../services/skin.api'

interface SkinViewer3DProps {
  source: SkinSource
  skinUrl: string
  model: string
  className?: string
  onDownload: () => void
  isDownloading?: boolean
}

export function SkinViewer3D({
  source,
  skinUrl,
  model,
  className,
  onDownload,
  isDownloading,
}: SkinViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewerRef = useRef<SkinViewer | null>(null)
  const [walking, setWalking] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return
    const viewer = new SkinViewer({
      canvas: canvasRef.current,
      width: 220,
      height: 280,
      zoom: 0.7,
    })
    viewer.autoRotate = true
    viewer.autoRotateSpeed = 0.8
    viewer.animation = new IdleAnimation()
    viewerRef.current = viewer
    return () => viewer.dispose()
  }, [])

  // The box stretches to match the height of the player list next to it
  // (see SkinDetailDialog) instead of a fixed size, so the render resolution
  // has to track that actual box size or the model would end up cropped or
  // leave a gap underneath.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) viewerRef.current?.setSize(width, height)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    let cancelled = false
    const options: { model: 'slim' | 'default' } = {
      model: model === 'slim' ? 'slim' : 'default',
    }

    // mcstat.org sends no CORS headers, so the WebGL texture load fails
    // silently if fed the raw URL directly: fetch it server-side instead
    // and hand skinview3d a same-origin data URL.
    if (source !== 'playermc') {
      SkinAPI.fetchTextureBase64(skinUrl)
        .then((base64) => {
          if (cancelled) return
          return viewer.loadSkin(`data:image/png;base64,${base64}`, options)
        })
        .catch(() => {})
    } else {
      viewer.loadSkin(skinUrl, options).catch(() => {})
    }

    return () => {
      cancelled = true
    }
  }, [source, skinUrl, model])

  const toggleWalking = () => {
    const viewer = viewerRef.current
    if (!viewer) return
    const next = !walking
    setWalking(next)
    viewer.autoRotate = !next
    viewer.animation = next ? new WalkingAnimation() : new IdleAnimation()
  }

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="bg-muted/40 relative h-full w-56 shrink-0 overflow-hidden rounded-lg"
      >
        <canvas ref={canvasRef} className="size-full" />
        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-7"
            onClick={toggleWalking}
            {...tooltipProps(walking ? 'Pausar' : 'Andar')}
          >
            {walking ? (
              <Pause className="size-3.5" />
            ) : (
              <Play className="size-3.5" />
            )}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-7"
            onClick={onDownload}
            disabled={isDownloading}
            {...tooltipProps('Baixar skin')}
          >
            <Download className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
