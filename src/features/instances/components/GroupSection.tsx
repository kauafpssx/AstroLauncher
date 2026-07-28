import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type { InstanceDTO } from '@/types/instance'

import { InstanceCard } from './InstanceCard'

interface GroupSectionProps {
  title: string
  instances: InstanceDTO[]
  selectedId: string | null
  runningId: string | null
  onSelect: (id: string) => void
  onLaunch: (id: string) => void
  onStop: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onExport: (id: string) => void
}

export function GroupSection({
  title,
  instances,
  selectedId,
  runningId,
  onSelect,
  onLaunch,
  onStop,
  onEdit,
  onDelete,
  onExport,
}: GroupSectionProps) {
  const [open, setOpen] = useState(true)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-1.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ChevronDown className={cn('size-4 transition-transform', !open && '-rotate-90')} />
        {title}
        <span className="text-xs text-muted-foreground">({instances.length})</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-wrap gap-3 py-2">
        {instances.map((instance) => (
          <InstanceCard
            key={instance.id}
            instance={instance}
            selected={instance.id === selectedId}
            isRunning={instance.id === runningId}
            onSelect={onSelect}
            onLaunch={onLaunch}
            onStop={onStop}
            onEdit={onEdit}
            onDelete={onDelete}
            onExport={onExport}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}
