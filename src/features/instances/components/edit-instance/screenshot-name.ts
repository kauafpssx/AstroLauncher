export function splitExtension(fileName: string): {
  base: string
  ext: string
} {
  const dot = fileName.lastIndexOf('.')
  if (dot <= 0) return { base: fileName, ext: '' }
  return { base: fileName.slice(0, dot), ext: fileName.slice(dot) }
}
