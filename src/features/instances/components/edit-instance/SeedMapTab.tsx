import { Map } from 'lucide-react'

import { EmptyState } from '@/components/common/EmptyState'
import { TabHeader } from '@/components/common/TabHeader'

export function SeedMapTab() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <TabHeader description="Mapa de biomas e estruturas do Overworld a partir da seed." />
      <EmptyState icon={Map} title="Em construção" className="min-h-[60vh]" />
    </div>
  )
}
