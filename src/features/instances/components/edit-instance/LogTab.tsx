import { Copy, ChevronDown, RefreshCw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { TabHeader } from '@/components/common/TabHeader'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { InstanceWorkspaceAPI } from '@/features/instances/services/instance-workspace.api'
import { cn } from '@/lib/utils'
import { parseLogContent } from '@/lib/log-utils'

interface LogTabProps {
  instanceId: string
}

export function LogTab({ instanceId }: LogTabProps) {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [autoScroll, setAutoScroll] = useState(true)
  const [wrapLines, setWrapLines] = useState(true)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const containerRef = useRef<HTMLPreElement>(null)

  const parsed = useMemo(() => parseLogContent(content), [content])

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    InstanceWorkspaceAPI.readLog(instanceId)
      .then((log) => {
        if (cancelled) return
        setContent(
          log ||
            'Nenhum log disponível ainda. Inicie a instância para gerar um.',
        )
      })
      .catch((err) => {
        if (cancelled) return
        toast.error(`Falha ao ler log: ${String(err)}`)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [instanceId])

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom()
    }
  }, [content, autoScroll, scrollToBottom])

  const handleReload = () => {
    setIsLoading(true)
    InstanceWorkspaceAPI.readLog(instanceId)
      .then((log) =>
        setContent(
          log ||
            'Nenhum log disponível ainda. Inicie a instância para gerar um.',
        ),
      )
      .catch((err) => toast.error(`Falha ao ler log: ${String(err)}`))
      .finally(() => setIsLoading(false))
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
  }

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50
    setShowScrollBtn(!atBottom)
    if (autoScroll && !atBottom) {
      setAutoScroll(false)
    }
  }

  const handleAutoScrollChange = (v: boolean) => {
    setAutoScroll(v)
    if (v) scrollToBottom()
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <TabHeader description="Log do Minecraft." />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <Checkbox
              checked={autoScroll}
              onCheckedChange={handleAutoScrollChange}
            />
            Auto rolagem
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={wrapLines}
              onCheckedChange={(v) => setWrapLines(v === true)}
            />
            Quebrar linhas
          </label>
        </div>

        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" onClick={handleReload}>
            <RefreshCw /> Recarregar
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy /> Copiar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setContent('')}>
            <Trash2 /> Limpar
          </Button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <pre
          ref={containerRef}
          onScroll={handleScroll}
          className={cn(
            'bg-muted/30 h-full overflow-auto rounded-lg border p-3 font-mono text-xs leading-relaxed',
            wrapLines ? 'break-words whitespace-pre-wrap' : 'whitespace-pre',
          )}
        >
          {isLoading
            ? 'Carregando...'
            : parsed.map((segments, i) => (
                <span key={i}>
                  {segments.map((seg, j) => (
                    <span
                      key={j}
                      style={seg.color ? { color: seg.color } : undefined}
                    >
                      {seg.text}
                    </span>
                  ))}
                  {i < parsed.length - 1 ? '\n' : ''}
                </span>
              ))}
        </pre>

        {showScrollBtn && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute right-3 bottom-3 size-7 rounded-full shadow"
            onClick={() => {
              scrollToBottom()
              setAutoScroll(true)
              setShowScrollBtn(false)
            }}
          >
            <ChevronDown />
          </Button>
        )}
      </div>
    </div>
  )
}
