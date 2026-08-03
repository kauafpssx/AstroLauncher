import { getVersion } from '@tauri-apps/api/app'
import { useEffect, useState } from 'react'

interface StatusBarProps {
  instanceCount: number
}

export function StatusBar({ instanceCount }: StatusBarProps) {
  const [version, setVersion] = useState('')

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => {})
  }, [])

  return (
    <footer className="flex h-7 shrink-0 items-center justify-end gap-4 border-t px-3 text-xs text-muted-foreground">
      <span>{instanceCount} instâncias</span>
      {version && <span>AstroLauncher v{version}</span>}
    </footer>
  )
}
