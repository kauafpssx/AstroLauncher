import { save } from '@tauri-apps/plugin-dialog'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { SkinDetail, SkinSource } from '@/types/skins'

import { SkinAPI } from '../services/skin.api'

interface UseSkinDetailArgs {
  source: SkinSource | null
  id: string | null
}

/** Estado, dados e handlers do diálogo de detalhes de skin (fetch, cópia de
 * nome/URL e download). */
export function useSkinDetail({ source, id }: UseSkinDetailArgs) {
  const [detail, setDetail] = useState<SkinDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [copiedUuid, setCopiedUuid] = useState<string | null>(null)
  const [copyAsCommand, setCopyAsCommand] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  // `null` means "use the model the API reported" — set once the user
  // overrides it, since detection isn't always right (e.g. a classic skin
  // that's actually meant to be worn as slim).
  const [copyModel, setCopyModel] = useState<'classic' | 'slim' | null>(null)

  // Clear/reset during render when the selected skin changes (the effect
  // below only performs the fetch).
  const [prevId, setPrevId] = useState<typeof id>(null)
  if (prevId !== id) {
    setPrevId(id)
    setCopyModel(null)
    if (id) {
      setIsLoading(true)
    } else {
      setDetail(null)
    }
  }

  useEffect(() => {
    if (!id || !source) return
    SkinAPI.getSkin(source, id)
      .then(setDetail)
      .catch((err) => toast.error(`Falha ao carregar skin: ${String(err)}`))
      .finally(() => setIsLoading(false))
  }, [source, id])

  const copyName = async (uuid: string, username: string) => {
    await navigator.clipboard.writeText(
      copyAsCommand ? `/skin set mojang ${username}` : username,
    )
    setCopiedUuid(uuid)
    setTimeout(
      () => setCopiedUuid((current) => (current === uuid ? null : current)),
      1500,
    )
  }

  // SkinRestorer (the most common skin plugin on servers that don't use
  // Mojang accounts) can apply a skin straight from its PNG URL — no
  // username or Mojang lookup needed, which works even for skins nobody's
  // currently wearing. Syntax: `/skin set web <classic|slim> "<url>"`.
  const effectiveModel =
    copyModel ?? (detail?.model === 'slim' ? 'slim' : 'classic')

  const copySkinUrlCommand = async () => {
    if (!detail) return
    await navigator.clipboard.writeText(
      `/skin set web ${effectiveModel} "${detail.skinUrl}"`,
    )
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 1500)
  }

  const downloadSkin = async () => {
    if (!detail) return
    const urlName = detail.skinUrl
      .split('/')
      .pop()
      ?.replace(/\.png$/i, '')
    const destPath = await save({
      defaultPath: `${detail.oldestPlayer.username || urlName || 'skin'}.png`,
      filters: [{ name: 'Skin PNG', extensions: ['png'] }],
    })
    if (!destPath || Array.isArray(destPath)) return

    setIsDownloading(true)
    try {
      await SkinAPI.downloadSkin(detail.skinUrl, destPath)
    } catch (err) {
      toast.error(`Falha ao baixar skin: ${String(err)}`)
    } finally {
      setIsDownloading(false)
    }
  }

  return {
    detail,
    isLoading,
    isDownloading,
    copiedUuid,
    copyAsCommand,
    setCopyAsCommand,
    copiedUrl,
    setCopyModel,
    effectiveModel,
    copyName,
    copySkinUrlCommand,
    downloadSkin,
  }
}
