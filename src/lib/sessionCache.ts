const cache = new Map<string, unknown>()
export function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const existing = cache.get(key) as Promise<T> | undefined
  if (existing !== undefined) return existing
  const promise = fetcher()
  cache.set(key, promise)
  return promise
}
