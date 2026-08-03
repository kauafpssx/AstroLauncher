import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format'
import type { VersionDTO, VersionType } from '@/types/version'

const TYPE_LABEL: Record<VersionType, string> = {
  release: 'Release',
  snapshot: 'Snapshot',
  old_beta: 'Beta',
  old_alpha: 'Alpha',
}

interface SelectedVersionCardProps {
  version: VersionDTO | null
}

export function SelectedVersionCard({ version }: SelectedVersionCardProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-sm font-medium">Versão Selecionada</h3>
      {version ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold">{version.id}</span>
            <Badge variant="outline">{TYPE_LABEL[version.type]}</Badge>
          </div>
          <span className="text-muted-foreground text-sm">
            Lançamento: {formatDate(version.releaseTime)}
          </span>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Nenhuma versão selecionada
        </p>
      )}
    </div>
  )
}
