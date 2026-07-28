import { invoke } from '@tauri-apps/api/core'
import { relaunch } from '@tauri-apps/plugin-process'
import { check } from '@tauri-apps/plugin-updater'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const MIN_SPLASH_DURATION_MS = 1600

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function SplashScreen() {
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      const startedAt = Date.now()

      try {
        const update = await check()

        if (update?.available && !cancelled) {
          setStatus('Baixando atualização…')
          let downloaded = 0
          let contentLength = 0

          await update.downloadAndInstall((event) => {
            switch (event.event) {
              case 'Started':
                contentLength = event.data.contentLength ?? 0
                break
              case 'Progress':
                downloaded += event.data.chunkLength
                if (contentLength > 0) {
                  const percent = Math.round((downloaded / contentLength) * 100)
                  setStatus(`Baixando atualização… ${percent}%`)
                }
                break
              case 'Finished':
                setStatus('Instalando…')
                break
            }
          })

          if (!cancelled) {
            await relaunch()
          }
          return
        }
      } catch (error) {
        console.error('Update check failed:', error)
      }

      const elapsed = Date.now() - startedAt
      if (elapsed < MIN_SPLASH_DURATION_MS) {
        await sleep(MIN_SPLASH_DURATION_MS - elapsed)
      }

      if (!cancelled) {
        invoke('finish_splash').catch((error) => console.error('Failed to finish splash:', error))
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div
      data-tauri-drag-region
      className="bg-background flex h-screen w-screen flex-col items-center justify-center gap-6 select-none"
    >
      <motion.img
        data-tauri-drag-region
        src="/logo.svg"
        alt="AstroLauncher"
        className="h-20 w-auto"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
      <div data-tauri-drag-region className="flex flex-col items-center gap-3">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((index) => (
            <motion.span
              key={index}
              className="bg-foreground/60 h-1.5 w-1.5 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: index * 0.2,
              }}
            />
          ))}
        </div>
        {status && <span className="text-muted-foreground text-xs">{status}</span>}
      </div>
    </div>
  )
}
