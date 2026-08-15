import {
  Boxes,
  Download,
  FileCog,
  FileText,
  FolderOpen,
  Globe,
  Image,
  Map,
  Play,
  Puzzle,
  ScrollText,
  Server,
  Settings,
  Sparkles,
  Square,
  Trash2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { SidebarNav, type SidebarNavItem } from '@/components/common/SidebarNav'
import { Button } from '@/components/ui/button'

export type EditInstanceTab =
  | 'settings'
  | 'log'
  | 'mods'
  | 'resource-packs'
  | 'shader-packs'
  | 'notes'
  | 'worlds'
  | 'seed-map'
  | 'servers'
  | 'screenshots'
  | 'config-editor'

interface TabItem {
  id: EditInstanceTab
  label: string
  icon: LucideIcon
  available: boolean
}

const tabs: TabItem[] = [
  { id: 'settings', label: 'Configurações', icon: Settings, available: true },
  { id: 'log', label: 'Log', icon: ScrollText, available: true },
  {
    id: 'config-editor',
    label: 'Editor de Config',
    icon: FileCog,
    available: true,
  },
  { id: 'worlds', label: 'Mundos', icon: Globe, available: true },
  { id: 'seed-map', label: 'Mapa de Seed', icon: Map, available: false },
  { id: 'notes', label: 'Notas', icon: FileText, available: true },
  { id: 'mods', label: 'Mods', icon: Puzzle, available: true },
  {
    id: 'resource-packs',
    label: 'Resource Packs',
    icon: Boxes,
    available: true,
  },
  {
    id: 'shader-packs',
    label: 'Shader Packs',
    icon: Sparkles,
    available: true,
  },
  { id: 'servers', label: 'Servers', icon: Server, available: true },
  { id: 'screenshots', label: 'Screenshots', icon: Image, available: true },
]

interface EditInstanceSidebarProps {
  instanceName: string
  active: EditInstanceTab
  onChange: (tab: EditInstanceTab) => void
  onBack: () => void
  isRunning: boolean
  onLaunch: () => void
  onStop: () => void
  onOpenFolder: () => void
  onExport: () => void
  onDelete: () => void
}

export function EditInstanceSidebar({
  instanceName,
  active,
  onChange,
  onBack,
  isRunning,
  onLaunch,
  onStop,
  onOpenFolder,
  onExport,
  onDelete,
}: EditInstanceSidebarProps) {
  return (
    <SidebarNav<EditInstanceTab>
      title={instanceName}
      onBack={onBack}
      active={active}
      onChange={onChange}
      items={tabs.map(
        ({ available, ...tab }): SidebarNavItem<EditInstanceTab> => ({
          ...tab,
          disabled: !available,
        }),
      )}
      footer={
        <div className="mt-auto flex flex-col gap-1 border-t pt-3">
          <Button
            variant={isRunning ? 'destructive' : 'default'}
            onClick={isRunning ? onStop : onLaunch}
          >
            {isRunning ? <Square /> : <Play />}
            {isRunning ? 'Encerrar' : 'Iniciar'}
          </Button>
          <Button
            variant="ghost"
            className="justify-start"
            onClick={onOpenFolder}
          >
            <FolderOpen /> Abrir Pasta
          </Button>
          <Button variant="ghost" className="justify-start" onClick={onExport}>
            <Download /> Exportar
          </Button>
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive justify-start"
            onClick={onDelete}
          >
            <Trash2 /> Excluir
          </Button>
        </div>
      }
    />
  )
}
