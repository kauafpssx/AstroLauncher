import { Download, Plus, RefreshCw, Shirt } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { AccountDropdown } from '@/components/layout/AccountDropdown'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { tooltipProps } from '@/lib/tooltip'

interface TopBarProps {
  onCreateInstance: () => void
  onImportInstance?: () => void
}

export function TopBar({ onCreateInstance, onImportInstance }: TopBarProps) {
  const navigate = useNavigate()

  return (
    <header className="flex h-14 shrink-0 items-center gap-1 border-b px-3">
      <Button onClick={onCreateInstance}>
        <Plus /> Nova Instância
      </Button>
      <Separator orientation="vertical" className="mx-1 !h-6 !self-auto" />
      {onImportInstance && (
        <Button
          variant="ghost"
          size="icon"
          {...tooltipProps('Importar .astropack')}
          onClick={onImportInstance}
        >
          <Download />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        {...tooltipProps('Skins')}
        onClick={() => navigate('/skins')}
      >
        <Shirt />
      </Button>
      <div className="ml-auto flex items-center gap-1">
        <AccountDropdown />
        <Button variant="ghost" size="icon" {...tooltipProps('Atualizações')}>
          <RefreshCw />
        </Button>
      </div>
    </header>
  )
}
