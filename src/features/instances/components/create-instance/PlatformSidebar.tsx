import { Lightbulb, SlidersHorizontal, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { SidebarNav } from '@/components/common/SidebarNav'
import type { SidebarNavItem } from '@/components/common/SidebarNav'
import { useModpackInstallStore } from '@/stores/modpack-install.store'

export type Platform = 'custom' | 'import' | 'modrinth' | 'curseforge'

const sources: SidebarNavItem<Platform>[] = [
  { id: 'custom', label: 'Customizado', icon: SlidersHorizontal },
  { id: 'import', label: 'Importar', icon: Upload },
  { id: 'modrinth', label: 'Modrinth', iconSrc: '/providers/modrinth.svg' },
  {
    id: 'curseforge',
    label: 'CurseForge',
    iconSrc: '/providers/curseforge.png',
  },
]

interface PlatformSidebarProps {
  platform: Platform
  onChange: (platform: Platform) => void
}

export function PlatformSidebar({ platform, onChange }: PlatformSidebarProps) {
  const navigate = useNavigate()
  const isInstalling = useModpackInstallStore((s) => s.isInstalling)

  return (
    <SidebarNav
      title="Nova Instância"
      items={sources}
      active={platform}
      onChange={onChange}
      onBack={() => navigate('/')}
      disabled={isInstalling}
      className="w-60"
      footer={
        <div
          className="relative mt-auto flex min-h-80 flex-col overflow-hidden rounded-lg bg-cover bg-center p-3"
          style={{ backgroundImage: "url('/images/tips.png')" }}
        >
          <div className="from-background/90 via-background/50 absolute inset-0 bg-gradient-to-b to-transparent" />
          <div className="text-primary relative flex items-center gap-1.5 text-sm font-medium">
            <Lightbulb className="size-4" />
            Dica
          </div>
          <p className="text-foreground/90 relative mt-1 text-xs">
            {platform === 'custom'
              ? 'Selecione uma versão e um mod loader para começar a criar sua instância.'
              : 'Ao escolher um modpack, o loader é definido automaticamente por ele.'}
          </p>
        </div>
      }
    />
  )
}
