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
    <footer className="text-muted-foreground flex h-7 shrink-0 items-center justify-end gap-4 border-t px-3 text-xs">
      <span>{instanceCount} instâncias</span>
      {version && (
        <button
          type="button"
          onClick={() => setChangelogOpen(true)}
          className="hover:text-foreground underline underline-offset-2"
        >
          AstroLauncher v{version}
        </button>
      )}
      <ChangelogDialog open={changelogOpen} onOpenChange={setChangelogOpen} />
    </footer>
  )
}
