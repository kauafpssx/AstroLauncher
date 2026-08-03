import { Blocks, Flame, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { Platform } from './PlatformSidebar'

const COPY: Record<Exclude<Platform, 'custom'>, { icon: typeof Blocks; title: string; description: string; action: string }> = {
  import: {
    icon: Upload,
    title: 'Importar instância',
    description: 'Importe um arquivo .zip ou .mrpack para criar uma instância a partir de um modpack existente.',
    action: 'Selecionar arquivo',
  },
  modrinth: {
    icon: Blocks,
    title: 'Integração com Modrinth em breve',
    description:
      'Quando disponível, você poderá buscar e instalar modpacks diretamente aqui — o mod loader é definido automaticamente pelo modpack escolhido.',
    action: 'Buscar modpacks',
  },
  curseforge: {
    icon: Flame,
    title: 'Integração com CurseForge em breve',
    description:
      'Quando disponível, você poderá buscar e instalar modpacks diretamente aqui — o mod loader é definido automaticamente pelo modpack escolhido.',
    action: 'Buscar modpacks',
  },
}

interface SourcePlaceholderProps {
  platform: Exclude<Platform, 'custom'>
  onAction: () => void
}

export function SourcePlaceholder({ platform, onAction }: SourcePlaceholderProps) {
  const { icon: Icon, title, description, action } = COPY[platform]

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
      <Icon className="size-10 text-muted-foreground" />
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      <Button variant="outline" className="mt-2" onClick={onAction}>
        {action}
      </Button>
    </div>
  )
}
