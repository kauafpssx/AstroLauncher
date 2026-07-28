import { useEffect } from 'react'

import { useInstanceStore } from '@/stores/instance.store'

export function useInstances() {
  const instances = useInstanceStore((s) => s.instances)
  const isLoading = useInstanceStore((s) => s.isLoading)
  const error = useInstanceStore((s) => s.error)
  const fetchInstances = useInstanceStore((s) => s.fetchInstances)
  const createInstance = useInstanceStore((s) => s.createInstance)
  const deleteInstance = useInstanceStore((s) => s.deleteInstance)

  useEffect(() => {
    fetchInstances()
  }, [fetchInstances])

  return { instances, isLoading, error, createInstance, deleteInstance, refresh: fetchInstances }
}
