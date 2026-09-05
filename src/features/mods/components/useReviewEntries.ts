import { useEffect, useState } from 'react'
import { ModAPI } from '@/features/mods/services/mod.api'
import type { ModSearchResult, ModVersion } from '@/types/mods'
import type { ReviewEntry } from './mod-review.types'
interface UseReviewEntriesArgs {
  selection: Record<
    string,
    {
      result: ModSearchResult
      version: ModVersion
    }
  >
  gameVersion?: string
  loader?: string | null
  installedKeys: Set<string>
  installedFileNames: Set<string>
}
export function useReviewEntries({
  selection,
  gameVersion,
  loader,
  installedKeys,
  installedFileNames,
}: UseReviewEntriesArgs) {
  const [entries, setEntries] = useState<ReviewEntry[]>([])
  const [isResolving, setIsResolving] = useState(true)
  useEffect(() => {
    let cancelled = false
    async function resolve() {
      const resolved = new Map<string, ReviewEntry>()
      for (const [key, entry] of Object.entries(selection)) {
        resolved.set(key, {
          key,
          result: entry.result,
          version: entry.version,
          isDependency: false,
        })
      }
      let queue = Object.values(selection).filter(
        (e) => e.result.source === 'modrinth',
      )
      let guard = 0
      while (queue.length > 0 && guard < 5) {
        guard += 1
        const nextQueue: typeof queue = []
        for (const entry of queue) {
          for (const depId of entry.version.requiredDependencyProjectIds) {
            const depKey = `modrinth:${depId}`
            if (resolved.has(depKey)) continue
            if (installedKeys.has(depKey)) continue
            try {
              const [project, versions] = await Promise.all([
                ModAPI.getProject('modrinth', depId),
                ModAPI.getVersions({
                  source: 'modrinth',
                  projectId: depId,
                  gameVersion,
                  loader,
                }),
              ])
              const version = versions[0]
              if (!version) continue
              if (installedFileNames.has(version.fileName.toLowerCase()))
                continue
              const result: ModSearchResult = {
                source: 'modrinth',
                projectId: depId,
                name: project.name,
                description: project.description,
                iconUrl: project.iconUrl,
                downloads: project.downloads,
                author: '',
                loader: loader ?? null,
                gameVersion: gameVersion ?? null,
              }
              resolved.set(depKey, {
                key: depKey,
                result,
                version,
                isDependency: true,
              })
              nextQueue.push({ result, version })
            } catch {}
          }
        }
        queue = nextQueue
      }
      if (!cancelled) {
        setEntries([...resolved.values()])
        setIsResolving(false)
      }
    }
    resolve()
    return () => {
      cancelled = true
    }
  }, [])
  return { entries, setEntries, isResolving }
}
