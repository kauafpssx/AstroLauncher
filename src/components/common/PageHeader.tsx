import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { tooltipProps } from '@/lib/tooltip'

interface PageHeaderProps {
  title: string
  onBack: () => void
  children?: ReactNode
}

export function PageHeader({ title, onBack, children }: PageHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={onBack}
        aria-label="Voltar"
        {...tooltipProps('Voltar')}
      >
        <ArrowLeft />
      </Button>
      <span className="font-medium">{title}</span>
      {children}
    </header>
  )
}
