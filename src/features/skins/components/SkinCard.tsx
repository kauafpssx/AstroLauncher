import { cn } from '@/lib/utils'
import type { SkinSummary } from '@/types/skins'

interface SkinCardProps {
  skin: SkinSummary
  matched?: boolean
  dimmed?: boolean
  onClick: () => void
}

/** vzge.me renders a skin texture (by its hash) as an isometric body pose. */
function renderUrl(hash: string) {
  return `https://vzge.me/full/200/${hash}?wide`
}

export function SkinCard({ skin, matched, dimmed, onClick }: SkinCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex w-full flex-col items-center gap-2 rounded-lg border border-transparent p-3 text-center transition-all duration-200 hover:bg-accent hover:border-border',
        matched && 'border-primary/60 bg-primary/5',
        dimmed && 'opacity-35 grayscale hover:opacity-70 hover:grayscale-0',
      )}
    >
      {matched && (
        <span className="absolute top-1 left-1 z-10 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground uppercase">
          Match
        </span>
      )}
      <div className="flex h-52 w-full items-center justify-center overflow-hidden rounded-md bg-muted/40 py-4">
        <img
          src={renderUrl(skin.hash)}
          alt={skin.firstSeenPlayer.username}
          className="h-full w-auto [image-rendering:pixelated]"
          loading="lazy"
        />
      </div>
      <span className="line-clamp-1 w-full text-sm font-medium break-words uppercase">{skin.firstSeenPlayer.username}</span>
    </button>
  )
}
