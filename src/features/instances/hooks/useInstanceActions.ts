import { useInstanceStore } from '@/stores/instance.store'

export function useInstanceActions() {
  const selectInstance = useInstanceStore((s) => s.selectInstance)
  const deleteInstance = useInstanceStore((s) => s.deleteInstance)

  return { selectInstance, deleteInstance }
}
