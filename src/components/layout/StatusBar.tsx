interface StatusBarProps {
  instanceCount: number
}

export function StatusBar({ instanceCount }: StatusBarProps) {
  return (
    <footer className="flex h-7 shrink-0 items-center justify-end gap-4 border-t px-3 text-xs text-muted-foreground">
      <span>{instanceCount} instâncias</span>
      <span>AstroLauncher v0.1.0</span>
    </footer>
  )
}
