import { convertFileSrc } from '@tauri-apps/api/core'
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
