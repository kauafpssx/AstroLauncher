import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { ContentKind, InstalledMod } from '@/types/mods'

import { ModAPI } from '../services/mod.api'

interface UseInstalledContentArgs {
  instanceId: string
  kind: ContentKind
}

export function useInstalledContent({
  instanceId,
  kind,
}: UseInstalledContentArgs) {
  const [items, setItems] = useState<InstalledMod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isBatchPending, setIsBatchPending] = useState(false)

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

  // Drop selection ids that no longer exist in the list (deleted elsewhere,
  // reloaded, etc.) so the floating bar never references a ghost item:
  // adjusted during render rather than in an effect, same as the reset
  // patterns elsewhere (the fetch effect above only performs the load).
  const [prevItems, setPrevItems] = useState(items)
  if (prevItems !== items) {
    setPrevItems(items)
    setSelectedIds((prev) => {
      const valid = new Set(items.map((m) => m.id))
      const next = new Set([...prev].filter((id) => valid.has(id)))
      return next.size === prev.size ? prev : next
    })
  }

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

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(items.map((m) => m.id)) : new Set())
  }

  const selectedItems = items.filter((m) => selectedIds.has(m.id))
  const allSelected = items.length > 0 && selectedIds.size === items.length
  const someSelected = selectedIds.size > 0 && !allSelected
  // Any selected item still enabled -> the batch action is "disable"; only
  // when every selected item is already disabled does it become "enable".
  const anySelectedEnabled = selectedItems.some((m) => m.enabled)

  // Silent re-sync: the batch handler already toasted the failure, so a
  // second toast from `load` here would be noise.
  const resync = async () => {
    try {
      setItems(await ModAPI.listInstalled(instanceId, kind))
    } catch {
      // keep the optimistic state; the user can retry.
    }
  }

  const handleBatchToggle = async () => {
    const ids = Array.from(selectedIds)
    const target = !anySelectedEnabled
    setItems((prev) =>
      prev.map((m) => (ids.includes(m.id) ? { ...m, enabled: target } : m)),
    )
    setIsBatchPending(true)
    try {
      await Promise.all(
        ids.map((id) => ModAPI.setEnabled(instanceId, id, target)),
      )
      toast.success(target ? 'Itens ativados' : 'Itens desativados')
      // Clear the selection once the action landed: the bar's job is done.
      setSelectedIds(new Set())
    } catch (err) {
      toast.error(`Falha ao atualizar: ${String(err)}`)
      // Backend is the source of truth: re-sync instead of guessing which
      // items actually flipped when a partial failure happened. Keep the
      // selection on failure so the user can retry.
      resync()
    } finally {
      setIsBatchPending(false)
    }
  }

  const handleBatchDelete = async () => {
    const ids = Array.from(selectedIds)
    setDeleteConfirmOpen(false)
    setIsBatchPending(true)
    try {
      await Promise.all(ids.map((id) => ModAPI.deleteInstalled(instanceId, id)))
      setItems((prev) => prev.filter((m) => !ids.includes(m.id)))
      setSelectedIds(new Set())
      toast.success(
        `${ids.length} ${ids.length === 1 ? 'item excluído' : 'itens excluídos'}`,
      )
    } catch (err) {
      toast.error(`Falha ao remover: ${String(err)}`)
      resync()
    } finally {
      setIsBatchPending(false)
    }
  }

  return {
    items,
    isLoading,
    searchOpen,
    setSearchOpen,
    load,
    handleToggle,
    handleDelete,
    selectedIds,
    selectedItems,
    allSelected,
    someSelected,
    anySelectedEnabled,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    isBatchPending,
    toggleSelected,
    toggleSelectAll,
    handleBatchToggle,
    handleBatchDelete,
  }
}
