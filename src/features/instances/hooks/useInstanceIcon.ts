import { toast } from 'sonner'

import { useInstanceStore } from '@/stores/instance.store'
import type { InstanceDTO } from '@/types/instance'

export function useInstanceIcon(instance: InstanceDTO) {
  const updateInstance = useInstanceStore((s) => s.updateInstance)

  const handleIconSelect = async (iconPath: string) => {
    try {
      await updateInstance({
        id: instance.id,
        name: instance.name,
        version: instance.version,
        loader: instance.loader,
        loaderVersion: instance.loaderVersion,
        javaArgs: instance.javaArgs,
        minMemory: instance.minMemory,
        maxMemory: instance.maxMemory,
        iconPath,
      })
    } catch (err) {
      toast.error(`Falha ao atualizar ícone: ${String(err)}`)
    }
  }

  return { handleIconSelect }
}
