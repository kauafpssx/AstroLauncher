import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface EntityAvatarProps {
  name: string
  iconUrl?: string | null
  className?: string
  fallbackClassName?: string
}

export function EntityAvatar({
  name,
  iconUrl,
  className,
  fallbackClassName,
}: EntityAvatarProps) {
  return (
    <Avatar className={cn('rounded-md after:rounded-md', className)}>
      <AvatarImage src={iconUrl ?? undefined} className="rounded-md" />
      {/* Radix always mounts the fallback first and swaps to the image only
          after its own load callback fires — for an already-cached image
          that still means one flash of initials before the image on every
          remount. `delayMs` withholds the fallback for a beat, so a
          cached/fast load never renders it at all. */}
      <AvatarFallback
        delayMs={200}
        className={cn('rounded-md', fallbackClassName)}
      >
        {name.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}
