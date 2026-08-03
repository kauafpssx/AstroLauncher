import { Lock } from 'lucide-react'

import { cn } from '@/lib/utils'

export type LoaderId =
  'vanilla' | 'fabric' | 'quilt' | 'forge' | 'neoforge' | 'liteloader'

const LOADERS: {
  id: LoaderId
  name: string
  description: string
  available: boolean
  iconSrc?: string
}[] = [
  {
    id: 'vanilla',
    name: 'Nenhum',
    description: 'Minecraft vanilla',
    available: true,
    iconSrc: '/picker/blocks/grass_block_side.png',
  },
  {
    id: 'fabric',
    name: 'Fabric',
    description: 'Modding leve',
    available: true,
    iconSrc: '/providers/fabricmc.svg',
  },
  {
    id: 'quilt',
    name: 'Quilt',
    description: 'Feito pela comunidade',
    available: true,
    iconSrc: '/providers/quiltmc.svg',
  },
  {
    id: 'forge',
    name: 'Forge',
    description: 'Plataforma de mods clássica',
    available: true,
    iconSrc: '/providers/forge.png',
  },
  {
    id: 'neoforge',
    name: 'NeoForge',
    description: 'Plataforma de mods moderna',
    available: true,
    iconSrc: '/providers/neoforged.svg',
  },
  {
    id: 'liteloader',
    name: 'LiteLoader',
    description: 'Mod loader legado',
    available: true,
    iconSrc: '/providers/liteloader.png',
  },
]

interface LoaderSelectionCardProps {
  selected: LoaderId | null
  onSelect: (loader: LoaderId) => void
  disabled?: boolean
}

export function LoaderSelectionCard({
  selected,
  onSelect,
  disabled,
}: LoaderSelectionCardProps) {
  return (
    <div className="flex flex-col gap-1.5 border-t pt-4">
      <h3 className="text-sm font-medium">Mod Loader</h3>
      <div className="flex flex-wrap gap-3">
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
                active
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40',
                isDisabled &&
                  !active &&
                  'hover:border-border cursor-not-allowed opacity-40',
                isDisabled && active && 'cursor-default',
              )}
            >
              {loader.iconSrc && (
                <div className="bg-muted flex size-11 shrink-0 items-center justify-center rounded-md">
                  <img
                    src={loader.iconSrc}
                    alt=""
                    className="size-9 rounded-md object-contain [image-rendering:pixelated]"
                  />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{loader.name}</p>
                <p className="text-muted-foreground text-xs">
                  {loader.description}
                </p>
              </div>
              <span
                className={cn(
                  'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2',
                  active ? 'border-primary' : 'border-muted-foreground',
                )}
              >
                {active && <span className="bg-primary size-2 rounded-full" />}
              </span>
            </button>
          )
        })}
      </div>
      {disabled && (
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Lock className="size-3" />
          Não é possível alterar o mod loader de uma instância existente. Crie
          uma nova instância para usar outro loader.
        </p>
      )}
    </div>
  )
}
