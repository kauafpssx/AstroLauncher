import { Plus, Puzzle, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { EntityAvatar } from '@/components/common/EntityAvatar'
import { TabHeader } from '@/components/common/TabHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ContentKind, InstalledMod } from '@/types/mods'

import { ModAPI } from '../services/mod.api'
import { ModBrowserDialog } from './ModBrowserDialog'

const SOURCE_LOGO: Record<string, string> = {
  modrinth: '/providers/modrinth.svg',
  curseforge: '/providers/curseforge.png',
}

const LABELS: Record<
  ContentKind,
  { title: string; addLabel: string; emptyLabel: string }
> = {
  mod: {
    title: 'Mods instalados nesta instância.',
    addLabel: 'Adicionar Mod',
    emptyLabel: 'Nenhum mod instalado.',
  },
  resourcepack: {
    title: 'Resource packs instalados nesta instância.',
    addLabel: 'Adicionar Resource Pack',
    emptyLabel: 'Nenhum resource pack instalado.',
  },
  shader: {
    title: 'Shader packs instalados nesta instância.',
    addLabel: 'Adicionar Shader Pack',
    emptyLabel: 'Nenhum shader pack instalado.',
  },
}

interface InstalledContentTabProps {
  instanceId: string
  gameVersion: string
  loader: string | null
  kind: ContentKind
}

export function InstalledContentTab({
  instanceId,
  gameVersion,
  loader,
  kind,
}: InstalledContentTabProps) {
  const [items, setItems] = useState<InstalledMod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const labels = LABELS[kind]

  const load = async () => {
    try {
      setItems(await ModAPI.listInstalled(instanceId, kind))
    } catch (err) {
      toast.error(`Falha ao listar: ${String(err)}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    ModAPI.listInstalled(instanceId, kind)
      .then((data) => !cancelled && setItems(data))
      .catch(
        (err) => !cancelled && toast.error(`Falha ao listar: ${String(err)}`),
      )
      .finally(() => !cancelled && setIsLoading(false))
    return () => {
      cancelled = true
    }
  }, [instanceId, kind])

  const handleToggle = async (item: InstalledMod, enabled: boolean) => {
    setItems((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, enabled } : m)),
    )
    try {
      await ModAPI.setEnabled(instanceId, item.id, enabled)
    } catch (err) {
      toast.error(`Falha ao atualizar: ${String(err)}`)
      setItems((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, enabled: !enabled } : m)),
      )
    }
  }

  const handleDelete = async (item: InstalledMod) => {
    try {
      await ModAPI.deleteInstalled(instanceId, item.id)
      setItems((prev) => prev.filter((m) => m.id !== item.id))
    } catch (err) {
      toast.error(`Falha ao remover: ${String(err)}`)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <TabHeader description={labels.title}>
        <Button size="sm" onClick={() => setSearchOpen(true)}>
          <Plus /> {labels.addLabel}
        </Button>
      </TabHeader>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Fonte</TableHead>
              <TableHead>Versão</TableHead>
              <TableHead className="w-16">Ativo</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground h-24 text-center"
                >
                  <Puzzle className="mx-auto mb-2 size-6" />
                  {labels.emptyLabel}
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2.5">
                    <EntityAvatar
                      name={item.name}
                      iconUrl={item.iconUrl}
                      className="size-7"
                      fallbackClassName="text-[10px]"
                    />
                    {item.name}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {SOURCE_LOGO[item.source] && (
                      <img
                        src={SOURCE_LOGO[item.source]}
                        alt=""
                        className="size-3"
                      />
                    )}
                    {item.source}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.version}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={item.enabled}
                    onCheckedChange={(checked) => handleToggle(item, checked)}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ModBrowserDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        instanceId={instanceId}
        gameVersion={gameVersion}
        loader={loader}
        kind={kind}
        onInstalled={load}
      />
    </div>
  )
}
