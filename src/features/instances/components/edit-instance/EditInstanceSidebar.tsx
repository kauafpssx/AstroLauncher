import {
  Boxes,
  FileCog,
  FileText,
  Globe,
  Image,
  Puzzle,
  ScrollText,
  Server,
  Settings,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { SidebarNav, type SidebarNavItem } from '@/components/common/SidebarNav'

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
}

export function EditInstanceSidebar({
  instanceName,
  active,
  onChange,
  onBack,
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
    />
  )
}
