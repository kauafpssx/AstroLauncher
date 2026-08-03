import { Download, Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { IdleAnimation, SkinViewer, WalkingAnimation } from 'skinview3d'

import { Button } from '@/components/ui/button'

interface SkinViewer3DProps {
  skinUrl: string
  model: string
  className?: string
  onDownload: () => void
  isDownloading?: boolean
}

export function SkinViewer3D({ skinUrl, model, className, onDownload, isDownloading }: SkinViewer3DProps) {
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

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    viewer.loadSkin(skinUrl, { model: model === 'slim' ? 'slim' : 'default' }).catch(() => {})
  }, [skinUrl, model])

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
      <div className="relative w-fit overflow-hidden rounded-lg bg-muted/40">
        <canvas ref={canvasRef} />
        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
          <Button type="button" variant="secondary" size="icon" className="size-7" onClick={toggleWalking} title={walking ? 'Pausar' : 'Andar'}>
            {walking ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </Button>
          <Button type="button" variant="secondary" size="icon" className="size-7" onClick={onDownload} disabled={isDownloading} title="Baixar skin">
            <Download className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
