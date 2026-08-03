import { Download, PackagePlus } from 'lucide-react'

import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'

interface EmptyInstancesProps {
  onCreate: () => void
  onImport: () => void
}

export function EmptyInstances({ onCreate, onImport }: EmptyInstancesProps) {
  return (
    <EmptyState
      icon={PackagePlus}
      title="Nenhuma instância ainda"
      description="Crie sua primeira instância ou importe um arquivo .astropack"
      className="h-full"
      iconClassName="size-12"
      action={
        <div className="flex gap-2">
          <Button onClick={onCreate}>Criar instância</Button>
          <Button variant="outline" onClick={onImport}>
            <Download /> Importar .astropack
          </Button>
        </div>
      }
    />
  )
}
