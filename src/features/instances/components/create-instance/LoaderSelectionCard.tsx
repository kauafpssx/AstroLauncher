import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type LoaderId = 'vanilla' | 'fabric' | 'quilt' | 'forge' | 'neoforge' | 'liteloader'

const LOADERS: { id: LoaderId; name: string; description: string; available: boolean }[] = [
  { id: 'vanilla', name: 'Nenhum', description: 'Vanilla Minecraft', available: true },
  { id: 'fabric', name: 'Fabric', description: 'Lightweight modding', available: true },
  { id: 'quilt', name: 'Quilt', description: 'Community-driven', available: true },
  { id: 'forge', name: 'Forge', description: 'Classic modding platform', available: false },
  { id: 'neoforge', name: 'NeoForge', description: 'Modern modding platform', available: false },
  { id: 'liteloader', name: 'LiteLoader', description: 'Legacy mod loader', available: false },
]

interface LoaderSelectionCardProps {
  selected: LoaderId | null
  onSelect: (loader: LoaderId) => void
  disabled?: boolean
}

export function LoaderSelectionCard({ selected, onSelect, disabled }: LoaderSelectionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mod Loader</CardTitle>
        <CardDescription>Escolha o mod loader que deseja usar nessa instância.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        {LOADERS.map((loader) => {
          const active = selected === loader.id
          const isDisabled = disabled || !loader.available
          return (
            <button
              key={loader.id}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect(loader.id)}
              className={cn(
                'flex min-w-40 flex-1 items-start gap-2.5 rounded-lg border-2 p-3.5 text-left transition-colors',
                active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
                isDisabled && 'cursor-not-allowed opacity-40 hover:border-border',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2',
                  active ? 'border-primary' : 'border-muted-foreground',
                )}
              >
                {active && <span className="size-2 rounded-full bg-primary" />}
              </span>
              <div>
                <p className="text-sm font-medium">{loader.name}</p>
                <p className="text-xs text-muted-foreground">{loader.description}</p>
              </div>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}
