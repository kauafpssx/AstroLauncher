import { listen } from '@tauri-apps/api/event'
import { toast } from 'sonner'
import { create } from 'zustand'

import { apiInvoke } from '@/lib/api/client'
import type { LaunchEvent } from '@/types/launch'

interface ProgressState {
  stage: string
  currentItem: string
  stageCurrent: number
  stageTotal: number
  overallCurrent: number
  overallTotal: number
}

interface LaunchStore {
  isOpen: boolean
  instanceId: string | null
  stageLabel: string
  progress: ProgressState | null
  error: string | null
  runningInstanceId: string | null

  launch: (id: string) => Promise<void>
  stop: (id: string) => Promise<void>
  cancel: () => Promise<void>
  close: () => void
}

export const useLaunchStore = create<LaunchStore>((set) => ({
  isOpen: false,
  instanceId: null,
  stageLabel: '',
  progress: null,
  error: null,
  runningInstanceId: null,

  launch: async (id) => {
    set({
      isOpen: true,
      instanceId: id,
      stageLabel: 'Preparando...',
      progress: null,
      error: null,
    })

    const unlisten = await listen<LaunchEvent>('launch://event', (event) => {
      const payload = event.payload
      if (payload.type === 'stage') {
        set({ stageLabel: payload.label, progress: null })
      } else if (payload.type === 'progress') {
        set({
          stageLabel: payload.stage,
          progress: {
            stage: payload.stage,
            currentItem: payload.currentItem,
            stageCurrent: payload.stageCurrent,
            stageTotal: payload.stageTotal,
            overallCurrent: payload.overallCurrent,
            overallTotal: payload.overallTotal,
          },
        })
      } else if (payload.type === 'error') {
        set({ error: payload.message })
      }
    })

    try {
      await apiInvoke<void>('launch_instance', { id })
      set((state) =>
        state.error ? state : { isOpen: false, runningInstanceId: id },
      )
      if (!useLaunchStore.getState().error) toast.success('Jogo iniciado')
    } catch (err) {
      set((state) => ({ error: state.error ?? String(err) }))
    } finally {
      unlisten()
    }
  },

  stop: async (id) => {
    try {
      await apiInvoke<void>('stop_instance', { id })
      set((state) =>
        state.runningInstanceId === id ? { runningInstanceId: null } : state,
      )
    } catch (err) {
      toast.error(`Falha ao encerrar: ${String(err)}`)
    }
  },

  cancel: async () => {
    set({ isOpen: false, instanceId: null, error: null, progress: null })
    try {
      await apiInvoke<void>('cancel_launch')
    } catch (err) {
      toast.error(`Falha ao cancelar: ${String(err)}`)
    }
  },

  close: () =>
    set({ isOpen: false, instanceId: null, error: null, progress: null }),
}))

// Persistent, app-lifetime listener: the game can exit long after the launch
// call (and its transient progress listener) has already resolved.
listen<string>('instance://stopped', (event) => {
  useLaunchStore.setState((state) =>
    state.runningInstanceId === event.payload
      ? { runningInstanceId: null }
      : state,
  )
})
