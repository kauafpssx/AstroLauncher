import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface EntityAvatarProps {
  name: string
  iconUrl?: string | null
  className?: string
  fallbackClassName?: string
}

export function EntityAvatar({ name, iconUrl, className, fallbackClassName }: EntityAvatarProps) {
  return (
    <Avatar className={cn('rounded-md after:rounded-md', className)}>
      <AvatarImage src={iconUrl ?? undefined} className="rounded-md" />
      <AvatarFallback className={cn('rounded-md', fallbackClassName)}>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
    </Avatar>
  )
}
