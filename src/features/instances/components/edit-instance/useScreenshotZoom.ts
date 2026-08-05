import { useRef, useState } from 'react'

const MIN_SCALE = 1
const MAX_SCALE = 8

export { MIN_SCALE, MAX_SCALE }

export function useScreenshotZoom(dataUri: string) {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Reset zoom/pan during render when a different screenshot opens (the
  // linter forbids synchronous setState inside effects).
  const [prevDataUri, setPrevDataUri] = useState(dataUri)
  if (prevDataUri !== dataUri) {
    setPrevDataUri(dataUri)
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }

  const clampScale = (value: number) =>
    Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))

  const zoomBy = (delta: number) => {
    setScale((prev) => {
      const next = clampScale(prev + delta)
      if (next === MIN_SCALE) setOffset({ x: 0, y: 0 })
      return next
    })
  }

  const reset = () => {
    setScale(MIN_SCALE)
    setOffset({ x: 0, y: 0 })
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    zoomBy(e.deltaY < 0 ? 0.4 : -0.4)
  }

  const handleDoubleClick = () => {
    if (scale > MIN_SCALE) {
      setScale(MIN_SCALE)
      setOffset({ x: 0, y: 0 })
    } else {
      setScale(2.5)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= MIN_SCALE) return
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
    }
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setOffset({
      x: dragRef.current.originX + dx,
      y: dragRef.current.originY + dy,
    })
  }

  const stopDragging = () => {
    dragRef.current = null
    setIsDragging(false)
  }

  return {
    scale,
    offset,
    isDragging,
    zoomBy,
    reset,
    handleWheel,
    handleDoubleClick,
    handleMouseDown,
    handleMouseMove,
    stopDragging,
  }
}
