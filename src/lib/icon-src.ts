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
