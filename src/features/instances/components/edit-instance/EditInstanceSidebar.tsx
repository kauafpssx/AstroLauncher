import {
  Blocks,
  Boxes,
  FileText,
  Globe,
  Image,
  Layers,
  Puzzle,
  ScrollText,
  Server,
  Settings,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export type EditInstanceTab =
  | 'settings'
  | 'log'
  | 'mods'
  | 'resource-packs'
  | 'shader-packs'
  | 'notes'
  | 'worlds'
  | 'servers'
  | 'screenshots'
  | 'other-logs'

interface TabItem {
  id: EditInstanceTab
  label: string
  icon: LucideIcon
  available: boolean
}

const tabs: TabItem[] = [
  { id: 'settings', label: 'Configurações', icon: Settings, available: true },
  { id: 'log', label: 'Log', icon: ScrollText, available: true },
  { id: 'worlds', label: 'Mundos', icon: Globe, available: true },
  { id: 'notes', label: 'Notas', icon: FileText, available: true },
  { id: 'mods', label: 'Mods', icon: Puzzle, available: true },
  { id: 'resource-packs', label: 'Resource Packs', icon: Boxes, available: true },
  { id: 'shader-packs', label: 'Shader Packs', icon: Sparkles, available: true },
  { id: 'servers', label: 'Servers', icon: Server, available: true },
  { id: 'screenshots', label: 'Screenshots', icon: Image, available: true },
  { id: 'other-logs', label: 'Other Logs', icon: Layers, available: false },
]

interface EditInstanceSidebarProps {
  instanceName: string
  active: EditInstanceTab
  onChange: (tab: EditInstanceTab) => void
}

export function EditInstanceSidebar({ instanceName, active, onChange }: EditInstanceSidebarProps) {
  return (
    <aside className="flex w-56 shrink-0 flex-col gap-4 border-r p-4">
      <div className="flex items-center gap-2 px-1">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary/10">
          <Blocks className="size-4 text-primary" />
        </div>
        <span className="truncate font-semibold">{instanceName}</span>
      </div>

      <nav className="flex flex-col gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors',
              active === tab.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              !tab.available && 'opacity-50',
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
