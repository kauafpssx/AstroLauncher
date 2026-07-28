import type { InstanceDTO } from '@/types/instance'

import { EmptyInstances } from './EmptyInstances'
import { GroupSection } from './GroupSection'

interface InstanceGridProps {
  instances: InstanceDTO[]
  selectedId: string | null
  runningId: string | null
  onSelect: (id: string) => void
  onLaunch: (id: string) => void
  onStop: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onExport: (id: string) => void
  onImport: () => void
  onCreate: () => void
}

export function InstanceGrid({
  instances,
  selectedId,
  runningId,
  onSelect,
  onLaunch,
  onStop,
  onEdit,
  onDelete,
  onExport,
  onImport,
  onCreate,
}: InstanceGridProps) {
  if (instances.length === 0) {
    return <EmptyInstances onCreate={onCreate} onImport={onImport} />
  }

  return (
    <div className="flex flex-col px-4">
      <GroupSection
        title="Todas as Instâncias"
        instances={instances}
        selectedId={selectedId}
        runningId={runningId}
        onSelect={onSelect}
        onLaunch={onLaunch}
        onStop={onStop}
        onEdit={onEdit}
        onDelete={onDelete}
        onExport={onExport}
      />
    </div>
  )
}
