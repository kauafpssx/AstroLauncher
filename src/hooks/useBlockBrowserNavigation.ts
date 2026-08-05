import { useEffect } from 'react'

const NAV_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'Backspace'])

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA'
  )
}

/** Blocks the WebView's native back/forward navigation gestures — mouse
 * side buttons and Alt+Left/Right (and Backspace outside text fields) — so
 * they never fight the app's own HashRouter history. Escape is left alone. */
export function useBlockBrowserNavigation() {
  useEffect(() => {
    const blockMouseButtons = (e: MouseEvent) => {
      if (e.button === 3 || e.button === 4) e.preventDefault()
    }

    const blockKeys = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return
      if (!NAV_KEYS.has(e.key)) return
      if (e.key === 'Backspace') {
        if (!isTypingTarget(e.target)) e.preventDefault()
        return
      }
      if (e.altKey) e.preventDefault()
    }

    window.addEventListener('mousedown', blockMouseButtons)
    window.addEventListener('mouseup', blockMouseButtons)
    window.addEventListener('auxclick', blockMouseButtons)
    window.addEventListener('keydown', blockKeys)
    return () => {
      window.removeEventListener('mousedown', blockMouseButtons)
      window.removeEventListener('mouseup', blockMouseButtons)
      window.removeEventListener('auxclick', blockMouseButtons)
      window.removeEventListener('keydown', blockKeys)
    }
  }, [])
}
