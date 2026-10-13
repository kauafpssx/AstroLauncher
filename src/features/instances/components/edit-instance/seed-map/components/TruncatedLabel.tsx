import { useLayoutEffect, useRef, useState } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
export function TruncatedLabel({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const spanRef = useRef<HTMLSpanElement>(null)
  const [isTruncated, setIsTruncated] = useState(false)
  useLayoutEffect(() => {
    const el = spanRef.current
    if (!el) return
    setIsTruncated(el.scrollWidth > el.clientWidth)
  }, [text])
  const span = (
    <span ref={spanRef} className={cn('min-w-0 flex-1 truncate', className)}>
      {text}
    </span>
  )
  if (!isTruncated) return span
  return (
    <Tooltip>
      <TooltipTrigger asChild>{span}</TooltipTrigger>
      <TooltipContent side="left">{text}</TooltipContent>
    </Tooltip>
  )
}
