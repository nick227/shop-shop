import { Toaster as Sonner } from 'sonner'

/**
 * Modern toast notifications using Sonner;
 * Usage: import { toast } from 'sonner'; toast.success('Success!')
 */
export function Toaster() {
  return (
    <Sonner
      position="top-center"
      toastOptions={{
        classNames: {
          toast: 'rounded-lg border border-border bg-background text-foreground shadow-lg',
          description: 'text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
          error: 'border-destructive bg-destructive text-destructive-foreground',
          success: 'border-green-500 bg-green-50 text-green-900',
          warning: 'border-yellow-500 bg-yellow-50 text-yellow-900',
          info: 'border-blue-500 bg-blue-50 text-blue-900'}}}
    />
  )
}

