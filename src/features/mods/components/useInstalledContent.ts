import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { ContentKind, InstalledMod } from '@/types/mods'
import { ModAPI } from '@/features/mods/services/mod.api'
import { toastDeleteModError } from './delete-mod-error'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isBatchPending, setIsBatchPending] = useState(false)
  const load = useCallback(async () => {
    try {
      setItems(await ModAPI.listInstalled(instanceId, kind))
    } catch (err) {
      toast.error(`Falha ao listar: ${String(err)}`)
    } finally {
      setIsLoading(false)
    }
  }, [instanceId, kind])
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
  const [prevItems, setPrevItems] = useState(items)
  if (prevItems !== items) {
    setPrevItems(items)
    setSelectedIds((prev) => {
      const valid = new Set(items.map((m) => m.id))
      const next = new Set([...prev].filter((id) => valid.has(id)))
      return next.size === prev.size ? prev : next
    })
  }
  const handleToggle = useCallback(
    async (item: InstalledMod, enabled: boolean) => {
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
    },
    [instanceId],
  )
  const handleDelete = useCallback(
    async (item: InstalledMod) => {
      try {
        await ModAPI.deleteInstalled(instanceId, item.id)
        setItems((prev) => prev.filter((m) => m.id !== item.id))
      } catch (err) {
        toastDeleteModError(err)
      }
    },
    [instanceId],
  )
  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])
  const toggleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedIds(checked ? new Set(items.map((m) => m.id)) : new Set())
    },
    [items],
  )
  const query = searchQuery.trim().toLowerCase()
  const filteredItems = useMemo(
    () =>
      query ? items.filter((m) => m.name.toLowerCase().includes(query)) : items,
    [items, query],
  )
  const selectedItems = items.filter((m) => selectedIds.has(m.id))
  const allSelected = items.length > 0 && selectedIds.size === items.length
  const someSelected = selectedIds.size > 0 && !allSelected
  const anySelectedEnabled = selectedItems.some((m) => m.enabled)
  const resync = useCallback(async () => {
    try {
      setItems(await ModAPI.listInstalled(instanceId, kind))
    } catch {}
  }, [instanceId, kind])
  const handleBatchToggle = useCallback(async () => {
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
      setSelectedIds(new Set())
    } catch (err) {
      toast.error(`Falha ao atualizar: ${String(err)}`)
      resync()
    } finally {
      setIsBatchPending(false)
    }
  }, [anySelectedEnabled, instanceId, selectedIds, resync])
  const handleBatchDelete = useCallback(async () => {
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
      toastDeleteModError(err)
      resync()
    } finally {
      setIsBatchPending(false)
    }
  }, [instanceId, resync, selectedIds])
  return {
    items,
    filteredItems,
    isLoading,
    searchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,
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
