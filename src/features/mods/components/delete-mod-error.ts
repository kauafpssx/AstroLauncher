import { toast } from 'sonner'

function isFileLockedError(err: unknown): boolean {
  const msg = String(err).toLowerCase()
  return (
    msg.includes('being used') ||
    msg.includes('in use') ||
    msg.includes('os error 32') ||
    msg.includes('os error 5') ||
    msg.includes('access is denied')
  )
}

export function toastDeleteModError(err: unknown): void {
  if (isFileLockedError(err)) {
    toast.error(
      'Não foi possível apagar: o arquivo está em uso. Feche o jogo antes de apagar o mod.',
    )
    return
  }
  toast.error(`Falha ao remover: ${String(err)}`)
}
