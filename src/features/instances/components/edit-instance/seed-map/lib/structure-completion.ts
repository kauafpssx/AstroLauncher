function structureCompletedStorageKey(seed: string): string {
  return `astro-seedmap-completed:${seed}`
}
export function loadStructureCompleted(seed: string): Map<string, boolean> {
  const map = new Map<string, boolean>()
  try {
    const raw = localStorage.getItem(structureCompletedStorageKey(seed))
    if (raw) {
      const keys: string[] = JSON.parse(raw)
      for (const key of keys) map.set(key, true)
    }
  } catch {}
  return map
}
export function persistStructureCompleted(
  seed: string,
  map: Map<string, boolean>,
) {
  try {
    const keys = [...map.entries()].filter(([, v]) => v).map(([k]) => k)
    localStorage.setItem(
      structureCompletedStorageKey(seed),
      JSON.stringify(keys),
    )
  } catch {}
}
