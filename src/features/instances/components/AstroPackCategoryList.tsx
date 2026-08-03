import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export interface AstroPackCategoryItem {
  key: string
  label: string
  count: number | boolean
  checked: boolean
}

interface AstroPackCategoryListProps {
  items: AstroPackCategoryItem[]
  onToggle: (key: string, checked: boolean) => void
}

function formatCount(count: number | boolean): string | null {
  if (typeof count === 'boolean') return null
  return `(${count})`
}

export function AstroPackCategoryList({
  items,
  onToggle,
}: AstroPackCategoryListProps) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-2">
      {items.map((item) => {
        const present =
          typeof item.count === 'boolean' ? item.count : item.count > 0
        return (
          <label
            key={item.key}
            className="hover:bg-accent flex items-center gap-2.5 rounded-md px-2 py-1.5 data-[disabled=true]:opacity-50"
            data-disabled={!present}
          >
            <Checkbox
              checked={present && item.checked}
              disabled={!present}
              onCheckedChange={(checked) => onToggle(item.key, !!checked)}
            />
            <Label className="flex-1 cursor-pointer text-sm font-normal">
              {item.label}
            </Label>
            {formatCount(item.count) && (
              <span className="text-muted-foreground text-xs">
                {formatCount(item.count)}
              </span>
            )}
          </label>
        )
      })}
    </div>
  )
}
