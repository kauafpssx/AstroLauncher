import { EntityAvatar } from '@/components/common/EntityAvatar'
import { Badge } from '@/components/ui/badge'
import type { ModSearchResult } from '@/types/mods'

const LOADER_ICON: Record<string, string> = {
  fabric: '/providers/fabricmc.svg',
  quilt: '/providers/quiltmc.svg',
  forge: '/providers/forge.png',
  neoforge: '/providers/neoforged.svg',
}

const LOADER_LABEL: Record<string, string> = {
  fabric: 'Fabric',
  quilt: 'Quilt',
  forge: 'Forge',
  neoforge: 'NeoForge',
}

interface ModpackDetailHeaderProps {
  result: ModSearchResult
}

export function ModpackDetailHeader({ result }: ModpackDetailHeaderProps) {
  return (
    <div className="flex items-start gap-3">
      <EntityAvatar
        name={result.name}
        iconUrl={result.iconUrl}
        className="size-20 shrink-0"
      />
      <div className="min-w-0">
        <h3 className="truncate text-lg font-semibold">{result.name}</h3>
        {(result.loader || result.gameVersion) && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
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
              <Badge variant="secondary" className="shrink-0">
                {result.gameVersion}
              </Badge>
            )}
          </div>
        )}
        <p className="text-muted-foreground mt-1 text-sm">
          por {result.author || 'desconhecido'}
        </p>
      </div>
    </div>
  )
}
