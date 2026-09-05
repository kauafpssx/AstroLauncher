const MAX_CONCURRENT = 16
let active = 0
const queue: (() => void)[] = []
function runNext() {
  if (active >= MAX_CONCURRENT) return
  const run = queue.shift()
  if (!run) return
  active++
  run()
}
export function withThumbnailLimit<T>(task: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    queue.push(() => {
      task()
        .then(resolve, reject)
        .finally(() => {
          active--
          runNext()
        })
    })
    runNext()
  })
}
