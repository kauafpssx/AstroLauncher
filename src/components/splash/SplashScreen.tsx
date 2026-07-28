import { invoke } from '@tauri-apps/api/core'
import { motion } from 'framer-motion'
import { useEffect } from 'react'

const SPLASH_DURATION_MS = 1600

export function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      invoke('finish_splash').catch((error) => console.error('Failed to finish splash:', error))
    }, SPLASH_DURATION_MS)

    return () => clearTimeout(timer)
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
      <div data-tauri-drag-region className="flex gap-1.5">
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
    </div>
  )
}
