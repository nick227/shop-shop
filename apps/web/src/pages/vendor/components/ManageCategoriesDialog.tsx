/**
 * Rename, merge or remove the store's own menu categories.
 * A category lives on its items, so renaming or removing one rewrites those items.
 */
import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { authPost } from '@shared/lib/auth/authFetch'
import { Button } from '@shared/ui/primitives'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/primitives/ui/Dialog'
import { Input } from '@shared/ui/primitives/ui/Input/Input'
import { storeItemsQueryKey } from '@shared/hooks/hooks/vendor/useStoreItems'
import { canonicalCategory, normalizeCategory, type MenuCategory } from '../menuCategories'

interface ManageCategoriesDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly storeId: string
  readonly categories: readonly MenuCategory[]
}

/** One request; the server rewrites every matching item in a single transaction (empty `to` removes). */
async function renameCategory(storeId: string, from: string, to: string) {
  const response = await authPost(`/api/stores/${encodeURIComponent(storeId)}/menu-categories/rename`, { from, to })
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? 'Could not update the category. Nothing was changed.')
  }
}

export function ManageCategoriesDialog({ open, onOpenChange, storeId, categories }: ManageCategoriesDialogProps) {
  const queryClient = useQueryClient()
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) setDrafts(Object.fromEntries(categories.map((c) => [c.name, c.name])))
  }, [open, categories])

  const mutation = useMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) => renameCategory(storeId, from, to),
    onSuccess: (_data, { from, to }) => {
      toast.success(to ? `“${from}” is now “${to}”` : `Removed “${from}”; its items are uncategorized`)
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not update the category'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: storeItemsQueryKey(storeId) }),
  })

  const rename = (from: string) => {
    const typed = normalizeCategory(drafts[from])
    if (!typed || typed === from) return
    // Renaming onto an existing category merges the two, using that category's spelling.
    const to = canonicalCategory(typed, categories.filter((c) => c.name !== from))
    mutation.mutate({ from, to })
  }

  const remove = (category: MenuCategory) => {
    if (confirm(`Remove “${category.name}”? Its ${category.count} item(s) stay on your menu, uncategorized.`)) {
      mutation.mutate({ from: category.name, to: '' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Your categories</DialogTitle>
          <DialogDescription>
            Categories are yours: add one by typing a new name on any item. Rename a category here, or give it
            another category’s name to merge them.
          </DialogDescription>
        </DialogHeader>

        {categories.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            No categories yet. Edit an item and type a category name to create your first one.
          </p>
        ) : (
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
            {categories.map((category) => {
              const changed = normalizeCategory(drafts[category.name]) !== category.name
              return (
                <li key={category.name} className="flex items-center gap-2">
                  <Input
                    aria-label={`Name of ${category.name}`}
                    value={drafts[category.name] ?? category.name}
                    onChange={(e) => setDrafts((d) => ({ ...d, [category.name]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && rename(category.name)}
                    disabled={mutation.isPending}
                  />
                  <span className="w-16 shrink-0 text-right text-sm text-muted-foreground">
                    {category.count} item{category.count === 1 ? '' : 's'}
                  </span>
                  {changed ? (
                    <Button variant="primary" onClick={() => rename(category.name)} disabled={mutation.isPending}>
                      Save
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => remove(category)}
                      disabled={mutation.isPending}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      Remove
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
