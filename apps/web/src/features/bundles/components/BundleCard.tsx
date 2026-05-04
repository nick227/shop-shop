/**
 * Bundle Card Component
 * Displays bundle information with pricing and actions
 */
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@shared/ui/primitives/ui/Card/Card'
import { Button, Badge } from '@shared/ui/primitives'
import { BundlePricing } from './BundlePricing'
import { Package, Edit, Power, Trash2 } from 'lucide-react'
import type { Bundle } from '@api/types'
import { useHaptics } from '@shared/hooks/useHaptics'

interface BundleCardProps {
  bundle: Bundle
  onEdit?: (bundle: Bundle) => void
  onDelete?: (bundle: Bundle) => void
  onToggleStatus?: (bundle: Bundle) => void
  showActions?: boolean
  className?: string
}

export function BundleCard({
  bundle,
  onEdit,
  onDelete,
  onToggleStatus,
  showActions = true,
  className = ''
}: Readonly<BundleCardProps>) {
  const haptics = useHaptics()
  
  const handleEdit = () => { haptics.light(); onEdit?.(bundle); }
  const handleDelete = () => { haptics.heavy(); onDelete?.(bundle); }
  const handleToggleStatus = () => { haptics.light(); onToggleStatus?.(bundle); }

  return (
    <Card className={`flex flex-col h-full hover:border-primary/50 transition-colors tap-scale active:scale-[0.98] ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex gap-4 items-start">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex shrink-0 items-center justify-center">
            {bundle.imageUrl ? (
              <img 
                src={bundle.imageUrl} 
                alt={bundle.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-6 h-6 text-muted-foreground/50" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <CardTitle className="text-lg line-clamp-1">{bundle.name}</CardTitle>
              <Badge 
                variant={bundle.isActive ? 'success' : 'secondary'}
                className="shrink-0"
              >
                {bundle.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {bundle.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{bundle.description}</p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 py-2">
        <div className="bg-muted/30 p-3 rounded-lg">
          <BundlePricing bundle={bundle} />
        </div>
        
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items ({bundle.totalItems || 0})</h4>
          <div className="space-y-1.5">
            {bundle.items?.slice(0, 3).map((bundleItem) => (
              <div key={bundleItem.itemId || bundleItem.id} className="flex justify-between items-center text-sm">
                <span className="text-foreground truncate flex-1 mr-2">
                  {bundleItem.title ?? bundleItem.itemId ?? 'Unknown Item'}
                </span>
                <span className="text-muted-foreground font-medium shrink-0">
                  x{bundleItem.quantity}
                </span>
              </div>
            ))}
            {bundle.items && bundle.items.length > 3 && (
              <div className="text-xs text-muted-foreground italic pt-1">
                +{bundle.items.length - 3} more items
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="pt-4 border-t border-border mt-auto gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleDelete}
            className="shrink-0 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleToggleStatus}
            className="shrink-0"
          >
            <Power className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="primary" 
            className="flex-1"
            onClick={handleEdit}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
