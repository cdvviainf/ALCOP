import { Loader2 } from 'lucide-react'
import { cn } from 'cn'

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className="flex items-center justify-center p-6 text-muted-foreground">
      <Loader2 className={cn('size-5 animate-spin', className)} />
    </div>
  )
}
