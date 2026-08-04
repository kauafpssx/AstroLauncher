import { useEffect, useState } from 'react'

import { apiInvoke } from '@/lib/api/client'

export interface AppApiConfig {
  curseforge: string
  mcstat: string
  playermc: string
  modrinth: string
  mojangManifest: string
  mojangAssets: string
  adoptium: string
  fabricMeta: string
  quiltMeta: string
  liteloaderVersions: string
  liteloaderRepo: string
  mavenCentral: string
}

export interface AppEnvConfig {
  api: AppApiConfig
  githubRepo: string
  mcstatDashboard: string
  mcstatDocs: string
  curseforgeConsole: string
}

let cache: Promise<AppEnvConfig> | null = null

/**
 * External URLs/links, read from `plugins.env` in `tauri.conf.json` so the
 * frontend never hardcodes them. Resolved once and cached for the app's life.
 */
export function getAppEnvConfig(): Promise<AppEnvConfig> {
  cache ??= apiInvoke<AppEnvConfig>('get_app_env_config')
  return cache
}

export function useAppEnvConfig(): AppEnvConfig | undefined {
  const [config, setConfig] = useState<AppEnvConfig | undefined>(undefined)

  useEffect(() => {
    let active = true
    getAppEnvConfig().then((cfg) => {
      if (active) setConfig(cfg)
    })
    return () => {
      active = false
    }
  }, [])

  return config
}
