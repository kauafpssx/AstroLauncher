import { Download, Plus, Shirt } from 'lucide-react'
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
      {/* Ghost icon buttons have ~8px of invisible padding before the glyph
          (size-8 box, size-4 icon centered) that the solid button doesn't:
          skip the right margin so the visible gap looks even on both sides. */}
      <Separator orientation="vertical" className="ml-2 !h-6 !self-auto" />
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
      </div>
    </header>
  )
}
