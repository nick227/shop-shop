import { Drawer } from 'vaul'
import { cn } from '@utils/cn'

interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  title?: string | undefined
  description?: string | undefined
}

/**
 * Mobile-native bottom sheet using Vaul
 * Provides smooth drawer experience with gestures
 */
export function BottomSheet({ open, onOpenChange, children, title, description }: BottomSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className="bg-background flex flex-col rounded-t-[10px] h-[96%] mt-24 fixed bottom-0 left-0 right-0 z-50">
          <div className="p-4 bg-background rounded-t-[10px] flex-1 overflow-auto">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-8" />
            {(title || description) && (
              <div className="mb-4">
                {title && (
                  <Drawer.Title className="text-lg font-semibold">
                    {title}
                  </Drawer.Title>
                )}
                {description && (
                  <Drawer.Description className="text-sm text-muted-foreground mt-2">
                    {description}
                  </Drawer.Description>
                )}
              </div>
            )}
            <div className="max-w-md mx-auto">{children}</div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

BottomSheet.Trigger = Drawer.Trigger
BottomSheet.Close = Drawer.Close

