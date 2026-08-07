// Caps concurrent texture fetches so a full grid mount doesn't fire dozens
// of backend requests in the exact same instant. Cheap and mild: the
// actual thumbnail rendering itself is serialized separately, and much more
// strictly, by thumbnailRenderer's single shared WebGL context.
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

/** Caps how many thumbnail fetch chains run at once, app-wide. */
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
