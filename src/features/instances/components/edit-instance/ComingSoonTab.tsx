import type { LucideIcon } from 'lucide-react'

interface ComingSoonTabProps {
  icon: LucideIcon
  title: string
  description: string
}

export function ComingSoonTab({ icon: Icon, title, description }: ComingSoonTabProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <Icon className="size-10 text-muted-foreground" />
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
