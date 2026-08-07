import { convertFileSrc } from '@tauri-apps/api/core'

/**
 * Instance icons are either a bundled preset (`/picker/...`), a legacy
 * inline data URI, or an absolute filesystem path to a saved custom upload
 * (needs the Tauri asset protocol to be rendered in an `<img>`).
 */
export function resolveIconSrc(
  iconPath: string | null | undefined,
): string | undefined {
  if (!iconPath) return undefined
  if (
    iconPath.startsWith('/picker/') ||
    iconPath.startsWith('data:') ||
    iconPath.startsWith('http')
  )
    return iconPath
  return convertFileSrc(iconPath)
}

/**
 * Resolves a bundled preset icon (`/picker/...`) to base64 PNG bytes for the
 * desktop shortcut's `.ico`. Data URIs and custom uploads are resolved by
 * the backend instead (it already has the data URI / a real filesystem path
 * in the DB): going through `fetch` for those hit the Tauri asset protocol,
 * which doesn't send CORS headers and silently produced corrupt bytes.
 */
export async function resolvePickerIconPngBase64(
  iconPath: string | null,
): Promise<string | null> {
  if (!iconPath || !iconPath.startsWith('/picker/')) return null

  const response = await fetch(iconPath)
  const bytes = new Uint8Array(await response.arrayBuffer())
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}
