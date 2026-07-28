import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-primary">Versão Selecionada</CardTitle>
      </CardHeader>
      <CardContent>
        {version ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-2xl font-semibold">{version.id}</span>
            <span className="text-sm text-muted-foreground">
              Lançamento: {new Date(version.releaseTime).toLocaleDateString('pt-BR')}
            </span>
            <Badge variant="outline" className="mt-1 w-fit">
              {TYPE_LABEL[version.type]}
            </Badge>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma versão selecionada</p>
        )}
      </CardContent>
    </Card>
  )
}
