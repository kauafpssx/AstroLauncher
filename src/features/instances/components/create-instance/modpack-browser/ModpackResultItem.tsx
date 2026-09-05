import { Download } from 'lucide-react'
import { motion } from 'framer-motion'
import { EntityAvatar } from '@/components/common/EntityAvatar'
import { Badge } from '@/components/ui/badge'
import { LAYOUT_SPRING_TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { ModSearchResult } from '@/types/mods'
import { LOADER_ICON, LOADER_LABEL } from './modpack-browser-constants'
interface ModpackResultItemProps {
  result: ModSearchResult
  isSelected: boolean
  isInstalling: boolean
  onSelect: () => void
}
export function ModpackResultItem({
  result,
  isSelected,
  isInstalling,
  onSelect,
}: ModpackResultItemProps) {
  return (
    <motion.div layout transition={LAYOUT_SPRING_TRANSITION}>
      <button
        type="button"
        disabled={isInstalling}
        onClick={onSelect}
        className={cn(
          'group hover:bg-accent flex w-full min-w-0 items-center gap-3 rounded-lg p-2 text-left transition-colors',
          isSelected && 'bg-primary/10',
          isInstalling && 'cursor-not-allowed opacity-50 hover:bg-transparent',
        )}
      >
        <EntityAvatar
          name={result.name}
          iconUrl={result.iconUrl}
          className="size-10"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-medium">{result.name}</p>
            {result.loader && (
              <Badge variant="outline" className="shrink-0">
                {LOADER_ICON[result.loader] && (
                  <img
                    src={LOADER_ICON[result.loader]}
                    alt=""
                    className="size-3"
                  />
                )}
                {LOADER_LABEL[result.loader] ?? result.loader}
              </Badge>
            )}
            {result.gameVersion && (
              <Badge
                variant="secondary"
                className={cn(
                  'shrink-0',
                  !isInstalling &&
                    'group-hover:bg-primary group-hover:text-primary-foreground',
                  isSelected && 'bg-primary text-primary-foreground',
                )}
              >
                {result.gameVersion}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground truncate text-xs">
            {result.description}
          </p>
        </div>
        <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
          <Download className="size-3" />
          {result.downloads.toLocaleString()}
        </span>
      </button>
    </motion.div>
  )
}
