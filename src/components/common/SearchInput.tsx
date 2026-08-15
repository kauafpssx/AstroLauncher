import { Search } from 'lucide-react'
import * as React from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { MAX } from '@/lib/validation'

import { CharacterCounter } from './CharacterCounter'

interface SearchInputProps extends React.ComponentProps<typeof Input> {
  containerClassName?: string
}

export function SearchInput({
  containerClassName,
  className,
  maxLength = MAX.SEARCH_QUERY,
  ...props
}: SearchInputProps) {
  return (
    <div className={cn('relative', containerClassName)}>
      <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      {/* `pr-14` always reserves room for the counter so it never shifts the
          layout when it appears near the limit. */}
      <Input
        className={cn('pr-14 pl-8', className)}
        maxLength={maxLength}
        {...props}
      />
      <CharacterCounter
        value={String(props.value ?? '')}
        max={maxLength}
        className="absolute top-1/2 right-2.5 -translate-y-1/2"
      />
    </div>
  )
}
