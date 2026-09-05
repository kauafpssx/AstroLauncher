import { useEffect } from 'react'
export function useBlockNativeContextMenu() {
  useEffect(() => {
    if (import.meta.env.DEV) return
    const blockContextMenu = (e: MouseEvent) => e.preventDefault()
    window.addEventListener('contextmenu', blockContextMenu)
    return () => window.removeEventListener('contextmenu', blockContextMenu)
  }, [])
}
