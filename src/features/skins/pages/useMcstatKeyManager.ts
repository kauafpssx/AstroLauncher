import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { SettingsAPI } from '@/features/settings/services/settings.api'
import { SkinAPI } from '@/features/skins/services/skin.api'
import type { SkinSortBy, SkinSource } from '@/types/skins'
function defaultSortFor(source: SkinSource): SkinSortBy {
  return source === 'mcstat' ? 'popular' : 'popular-desc'
}
function isUnauthorized(err: unknown) {
  return String(err).includes('401')
}
interface UseMcstatKeyManagerResult {
  mcstatApiKey: string
  setMcstatApiKey: (key: string) => void
  mcstatKeyDialogOpen: boolean
  setMcstatKeyDialogOpen: (open: boolean) => void
  mcstatKeyInvalid: boolean
  markKeyInvalid: () => void
  submitMcstatKey: (key: string) => Promise<void>
}
export function useMcstatKeyManager(): UseMcstatKeyManagerResult {
  const [mcstatApiKey, setMcstatApiKey] = useState('')
  const [mcstatKeyDialogOpen, setMcstatKeyDialogOpen] = useState(false)
  const [mcstatKeyInvalid, setMcstatKeyInvalid] = useState(false)
  useEffect(() => {
    SettingsAPI.get()
      .then((settings) => setMcstatApiKey(settings.mcstatApiKey ?? ''))
      .catch(() => {})
  }, [])
  const handleDialogOpenChange = (open: boolean) => {
    setMcstatKeyDialogOpen(open)
    if (!open) setMcstatKeyInvalid(false)
  }
  const submitMcstatKey = async (key: string) => {
    const settings = await SettingsAPI.get()
    let keySaved = false
    try {
      await SettingsAPI.update({
        curseforgeApiKey: settings.curseforgeApiKey,
        mcstatApiKey: key,
      })
      keySaved = true
      const mcstatSortBy = defaultSortFor('mcstat')
      await SkinAPI.search({
        source: 'mcstat',
        query: '',
        page: 1,
        sortBy: mcstatSortBy,
        model: null,
      })
      setMcstatApiKey(key)
      setMcstatKeyInvalid(false)
    } catch (err) {
      if (isUnauthorized(err)) {
        setMcstatKeyInvalid(true)
        SettingsAPI.update({
          curseforgeApiKey: settings.curseforgeApiKey,
          mcstatApiKey: settings.mcstatApiKey,
        }).catch(() => {})
      } else {
        toast.error(
          `Falha ao ${keySaved ? 'validar' : 'salvar'} chave: ${String(err)}`,
        )
      }
      throw err
    }
  }
  const markInvalid = () => {
    setMcstatKeyInvalid(true)
    setMcstatKeyDialogOpen(true)
  }
  return {
    mcstatApiKey,
    setMcstatApiKey,
    mcstatKeyDialogOpen,
    setMcstatKeyDialogOpen: handleDialogOpenChange,
    mcstatKeyInvalid,
    markKeyInvalid: markInvalid,
    submitMcstatKey,
  }
}
