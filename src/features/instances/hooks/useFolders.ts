import { useEffect } from 'react'

import { useFolderStore } from '@/stores/folder.store'

export function useFolders() {
  const folders = useFolderStore((s) => s.folders)
  const isLoading = useFolderStore((s) => s.isLoading)
  const error = useFolderStore((s) => s.error)
  const fetchFolders = useFolderStore((s) => s.fetchFolders)

  useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  return { folders, isLoading, error, refresh: fetchFolders }
}
