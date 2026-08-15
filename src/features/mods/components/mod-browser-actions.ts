import { open as openFileDialog } from '@tauri-apps/plugin-dialog'
import type { Dispatch, SetStateAction } from 'react'
import { toast } from 'sonner'

import type {
  ContentKind,
  InstalledMod,
  ModSearchResult,
  ModSource,
  ModVersion,
} from '@/types/mods'

import { ModAPI } from '../services/mod.api'
import {
  normalizeName,
  selectionKey,
  type SelectionMap,
} from './selection-utils'

interface ToggleSelectionDeps {
  selection: SelectionMap
  setSelection: Dispatch<SetStateAction<SelectionMap>>
  pendingKeys: Set<string>
  setPendingKeys: Dispatch<SetStateAction<Set<string>>>
  installedKeys: Set<string>
  installedFileNames: Set<string>
  gameVersion?: string
  effectiveLoader?: string | null
  setError: Dispatch<SetStateAction<string | null>>
}

export function createToggleSelection({
  selection,
  setSelection,
  pendingKeys,
  setPendingKeys,
  installedKeys,
  installedFileNames,
  gameVersion,
  effectiveLoader,
  setError,
}: ToggleSelectionDeps) {
  return async (result: ModSearchResult, version?: ModVersion) => {
    const key = selectionKey(result.source, result.projectId)
    if (selection[key]) {
      setSelection((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      return
    }

    if (pendingKeys.has(key)) {
      // Second click while the version fetch is still in flight: cancel it,
      // the checkbox flips back off instantly.
      setPendingKeys((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
      return
    }

    if (installedKeys.has(key)) return

    if (version) {
      if (installedFileNames.has(version.fileName.toLowerCase())) {
        toast.error('Este mod já está instalado (mesmo arquivo).')
        return
      }
      setSelection((prev) => ({ ...prev, [key]: { result, version } }))
      return
    }

    setPendingKeys((prev) => new Set(prev).add(key))
    try {
      const versions = await ModAPI.getVersions({
        source: result.source,
        projectId: result.projectId,
        gameVersion,
        loader: effectiveLoader,
      })

      let wasCancelled = false
      setPendingKeys((prev) => {
        if (!prev.has(key)) {
          wasCancelled = true
          return prev
        }
        const next = new Set(prev)
        next.delete(key)
        return next
      })
      if (wasCancelled || !versions[0]) return

      if (installedFileNames.has(versions[0].fileName.toLowerCase())) {
        toast.error('Este mod já está instalado (mesmo arquivo).')
        return
      }
      setSelection((prev) => ({
        ...prev,
        [key]: { result, version: versions[0] },
      }))
    } catch (err) {
      setPendingKeys((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
      setError(String(err))
    }
  }
}

interface DeleteInstalledDeps {
  instanceId: string
  installedMods: InstalledMod[]
  setInstalledMods: Dispatch<SetStateAction<InstalledMod[]>>
  onInstalled: () => void
}

export function createDeleteInstalled({
  instanceId,
  installedMods,
  setInstalledMods,
  onInstalled,
}: DeleteInstalledDeps) {
  return async (result: ModSearchResult) => {
    const key = selectionKey(result.source, result.projectId)
    const resultName = normalizeName(result.name)
    const installed = installedMods.find(
      (m) =>
        selectionKey(m.source as ModSource, m.modId) === key ||
        normalizeName(m.name) === resultName,
    )
    if (!installed) return

    try {
      await ModAPI.deleteInstalled(instanceId, installed.id)
      setInstalledMods((prev) => prev.filter((m) => m.id !== installed.id))
      onInstalled()
    } catch (err) {
      toast.error(`Falha ao remover: ${String(err)}`)
    }
  }
}

interface UploadCustomDeps {
  instanceId: string
  kind: ContentKind
  kindLabel: string
  fileFilter: string
  setIsUploading: Dispatch<SetStateAction<boolean>>
  onOpenChange: (open: boolean) => void
  onInstalled: () => void
}

export function createUploadCustom({
  instanceId,
  kind,
  kindLabel,
  fileFilter,
  setIsUploading,
  onOpenChange,
  onInstalled,
}: UploadCustomDeps) {
  return async () => {
    const filePath = await openFileDialog({
      multiple: false,
      filters: [{ name: kindLabel, extensions: [fileFilter] }],
    })
    if (!filePath || Array.isArray(filePath)) return

    setIsUploading(true)
    try {
      await ModAPI.installCustom({ instanceId, filePath, kind })
      onInstalled()
      onOpenChange(false)
    } catch (err) {
      toast.error(`Falha ao adicionar: ${String(err)}`)
    } finally {
      setIsUploading(false)
    }
  }
}
