import { Download, PackagePlus } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface EmptyInstancesProps {
  onCreate: () => void
  onImport: () => void
}

export function EmptyInstances({ onCreate, onImport }: EmptyInstancesProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <PackagePlus className="size-12 text-muted-foreground" />
      <div>
        <p className="font-medium">Nenhuma instância ainda</p>
        <p className="text-sm text-muted-foreground">Crie sua primeira instância ou importe um arquivo .astropack</p>
      </div>
      <div className="flex gap-2">
        <Button onClick={onCreate}>Criar instância</Button>
        <Button variant="outline" onClick={onImport}>
          <Download /> Importar .astropack
        </Button>
      </div>
    </div>
  )
}
