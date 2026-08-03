import { Search } from 'lucide-react'
import * as React from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchInputProps extends React.ComponentProps<typeof Input> {
  containerClassName?: string
}

export function SearchInput({
  containerClassName,
  className,
  ...props
}: SearchInputProps) {
  return (
    <div className={cn('relative', containerClassName)}>
      <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      <Input className={cn('pl-8', className)} {...props} />
    </div>
  )
}
