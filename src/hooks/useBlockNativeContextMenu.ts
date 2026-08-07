import { useEffect } from 'react'

/** Disables the WebView's native right-click context menu (Inspect,
 * Reload, ...) in production builds: end users shouldn't reach devtools
 * through it. Left enabled in dev for debugging. Areas with their own
 * `EntityContextMenu` are unaffected, since Radix intercepts the event on
 * the trigger itself before this would ever need to act. */
export function useBlockNativeContextMenu() {
  useEffect(() => {
    if (import.meta.env.DEV) return

    const blockContextMenu = (e: MouseEvent) => e.preventDefault()
    window.addEventListener('contextmenu', blockContextMenu)
    return () => window.removeEventListener('contextmenu', blockContextMenu)
  }, [])
}
