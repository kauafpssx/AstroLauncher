import { getVersion } from '@tauri-apps/api/app'
import { useEffect, useState } from 'react'

import { ChangelogDialog } from './ChangelogDialog'

interface StatusBarProps {
  instanceCount: number
}

export function StatusBar({ instanceCount }: StatusBarProps) {
  const [version, setVersion] = useState('')
  const [changelogOpen, setChangelogOpen] = useState(false)

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => {})
  }, [])

  return (
    <footer className="text-muted-foreground flex h-7 shrink-0 items-center justify-between gap-4 border-t px-3 text-xs">
      {version && (
        <button
          type="button"
          onClick={() => setChangelogOpen(true)}
          className="hover:text-foreground flex items-center gap-1.5 underline underline-offset-2"
        >
          <img src="/logos/logo.svg" alt="" className="size-3.5" />
          AstroLauncher v{version}
        </button>
      )}
      <span>{instanceCount} instâncias</span>
      <ChangelogDialog open={changelogOpen} onOpenChange={setChangelogOpen} />
    </footer>
  )
}
