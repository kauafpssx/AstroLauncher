export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 MB'
  const mb = bytes / (1024 * 1024)
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`
}

export function formatFileSize(bytes: number): string {
  const kb = bytes / 1024
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('pt-BR')
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('pt-BR')
}

export function formatDuration(totalSeconds: number): string {
  const total = Math.floor(totalSeconds)
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60

  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

/** Parses a launcher timestamp: RFC-3339 ("...T...") or SQLite
 *  `datetime('now')` ("YYYY-MM-DD HH:MM:SS", UTC). */
export function parseLauncherDate(value: string): Date {
  return new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`)
}
