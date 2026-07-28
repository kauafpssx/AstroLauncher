export type LaunchEvent =
  | { type: 'stage'; label: string }
  | {
      type: 'progress'
      stage: string
      currentItem: string
      stageCurrent: number
      stageTotal: number
      overallCurrent: number
      overallTotal: number
    }
  | { type: 'error'; message: string }
