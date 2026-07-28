import { Blocks, Flame, SlidersHorizontal, Upload } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export type Platform = 'custom' | 'import' | 'modrinth' | 'curseforge'

interface SourceItem {
  id: Platform
  label: string
  icon: LucideIcon
}

const sources: SourceItem[] = [
  { id: 'custom', label: 'Customizado', icon: SlidersHorizontal },
  { id: 'import', label: 'Importar', icon: Upload },
  { id: 'modrinth', label: 'Modrinth', icon: Blocks },
  { id: 'curseforge', label: 'CurseForge', icon: Flame },
]

interface PlatformSidebarProps {
  platform: Platform
  onChange: (platform: Platform) => void
}

export function PlatformSidebar({ platform, onChange }: PlatformSidebarProps) {
  return (
    <aside className="flex w-60 shrink-0 flex-col gap-4 border-r p-4">
      <div className="flex items-center gap-2 px-1">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary/10">
          <Blocks className="size-4 text-primary" />
        </div>
        <span className="font-semibold">Nova Instância</span>
      </div>

      <nav className="flex flex-col gap-1">
        {sources.map((source) => {
          const active = platform === source.id
          return (
            <button
              key={source.id}
              type="button"
              onClick={() => onChange(source.id)}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <source.icon className="size-4" />
              {source.label}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">Dica</p>
        <p>
          {platform === 'custom'
            ? 'Selecione uma versão e um mod loader para começar a criar sua instância.'
            : 'Ao escolher um modpack, o loader é definido automaticamente por ele.'}
        </p>
      </div>
    </aside>
  )
}
