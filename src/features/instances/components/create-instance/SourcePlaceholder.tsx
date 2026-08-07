import { Blocks, FileArchive, Flame, PackageCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { Platform } from './PlatformSidebar'

const COPY: Record<
  Exclude<Platform, 'custom' | 'import'>,
  { icon: typeof Blocks; title: string; description: string; action: string }
> = {
  modrinth: {
    icon: Blocks,
    title: 'Integração com Modrinth em breve',
    description:
      'Quando disponível, você poderá buscar e instalar modpacks diretamente aqui. O mod loader é definido automaticamente pelo modpack escolhido.',
    action: 'Buscar modpacks',
  },
  curseforge: {
    icon: Flame,
    title: 'Integração com CurseForge em breve',
    description:
      'Quando disponível, você poderá buscar e instalar modpacks diretamente aqui. O mod loader é definido automaticamente pelo modpack escolhido.',
    action: 'Buscar modpacks',
  },
}

function ImportOptionCard({
  icon: Icon,
  title,
  description,
  action,
  onAction,
}: {
  icon: typeof Blocks
  title: string
  description: string
  action: string
  onAction: () => void
}) {
  return (
    <div className="border-border hover:border-primary/50 hover:bg-accent/30 flex w-64 flex-col items-center gap-3 rounded-xl border p-6 text-center transition-colors">
      <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
        <Icon className="size-6" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="text-muted-foreground text-sm">{description}</p>
      <Button variant="outline" className="mt-2 w-full" onClick={onAction}>
        {action}
      </Button>
    </div>
  )
}

interface SourcePlaceholderProps {
  platform: Exclude<Platform, 'custom'>
  onAction: () => void
  onImportAstropack?: () => void
}

export function SourcePlaceholder({
  platform,
  onAction,
  onImportAstropack,
}: SourcePlaceholderProps) {
  if (platform === 'import') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div className="text-center">
          <p className="text-lg font-medium">Importar instância</p>
          <p className="text-muted-foreground text-sm">
            Escolha de onde vem o pacote que você quer importar.
          </p>
        </div>
        <div className="flex flex-wrap items-stretch justify-center gap-4">
          <ImportOptionCard
            icon={PackageCheck}
            title="Pacote AstroLauncher"
            description="Importe um arquivo .astropack exportado por este launcher, com mods, mundos, configurações e mais."
            action="Selecionar .astropack"
            onAction={() => onImportAstropack?.()}
          />
          <ImportOptionCard
            icon={FileArchive}
            title="Modpack externo"
            description="Importe um arquivo .zip ou .mrpack para criar uma instância a partir de um modpack existente."
            action="Selecionar arquivo"
            onAction={onAction}
          />
        </div>
      </div>
    )
  }

  const { icon: Icon, title, description, action } = COPY[platform]

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
      <Icon className="text-muted-foreground size-10" />
      <p className="font-medium">{title}</p>
      <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
      <Button variant="outline" className="mt-2" onClick={onAction}>
        {action}
      </Button>
    </div>
  )
}
