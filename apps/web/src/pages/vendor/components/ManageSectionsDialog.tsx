/**
 * The store's menu sections: add, rename, describe, reorder, hide and delete them.
 * Sections exist apart from items, so a vendor can lay out the menu before adding anything to it.
 * Each change saves on its own; there is no dialog-wide save.
 */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2 } from 'lucide-react'
import { Button } from '@shared/ui/primitives'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/primitives/ui/Dialog'
import { Input } from '@shared/ui/primitives/ui/Input/Input'
import { cn } from '@shared/lib/cn'
import {
  MAX_SECTION_DESCRIPTION,
  MAX_SECTION_NAME,
  normalizeSectionName,
  type MenuSection,
} from '@shared/lib/menu/menuSections'
import { useMenuSectionMutations } from '@shared/hooks/hooks/useMenuSections'

interface ManageSectionsDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly storeId: string
  readonly sections: readonly MenuSection[]
}

const failed = (error: unknown) => toast.error(error instanceof Error ? error.message : 'Something went wrong')

export function ManageSectionsDialog({ open, onOpenChange, storeId, sections }: ManageSectionsDialogProps) {
  const { create, update, reorder, remove } = useMenuSectionMutations(storeId)
  const [newName, setNewName] = useState('')
  const ordered = [...sections].sort((a, b) => a.sortIndex - b.sortIndex)

  useEffect(() => {
    if (!open) setNewName('')
  }, [open])

  const add = () => {
    const name = normalizeSectionName(newName)
    if (!name) return
    create.mutate(
      { name },
      {
        onSuccess: () => setNewName(''),
        onError: failed,
      },
    )
  }

  const move = (index: number, offset: -1 | 1) => {
    const ids = ordered.map((section) => section.id)
    const target = index + offset
    if (target < 0 || target >= ids.length) return
    const swapped = ids.map((id, i) => {
      if (i === index) return ids[target]
      if (i === target) return ids[index]
      return id
    })
    reorder.mutate(swapped, { onError: failed })
  }

  const destroy = (section: MenuSection) => {
    const items = section.itemCount === 1 ? '1 item' : `${section.itemCount} items`
    const message =
      section.itemCount > 0
        ? `Delete “${section.name}”? Its ${items} stay on your menu, outside any section.`
        : `Delete “${section.name}”?`
    if (confirm(message)) remove.mutate(section.id, { onError: failed })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Menu sections</DialogTitle>
          <DialogDescription>
            Sections organize your storefront, in this order. Hidden sections and their items are not shown to
            shoppers. Empty sections stay here until you add items.
          </DialogDescription>
        </DialogHeader>

        {ordered.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">No sections yet. Add your first one below, like “Breakfast” or “Drinks”.</p>
        ) : (
          <ol className="max-h-[55vh] space-y-3 overflow-y-auto pr-1" aria-label="Sections in menu order">
            {ordered.map((section, index) => (
              <SectionRow
                key={section.id}
                section={section}
                isFirst={index === 0}
                isLast={index === ordered.length - 1}
                busy={reorder.isPending}
                onMove={(offset) => move(index, offset)}
                onSave={async (draft) => {
                  await update.mutateAsync({ id: section.id, ...draft })
                }}
                onDelete={() => destroy(section)}
              />
            ))}
          </ol>
        )}

        <form
          className="flex items-center gap-2 border-t border-border pt-4"
          onSubmit={(e) => {
            e.preventDefault()
            add()
          }}
        >
          <Input
            aria-label="New section name"
            placeholder="New section, like “Breakfast”"
            value={newName}
            maxLength={MAX_SECTION_NAME}
            onChange={(e) => setNewName(e.target.value)}
            disabled={create.isPending}
          />
          <Button type="submit" variant="primary" disabled={!normalizeSectionName(newName) || create.isPending}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface SectionRowProps {
  readonly section: MenuSection
  readonly isFirst: boolean
  readonly isLast: boolean
  readonly busy: boolean
  readonly onMove: (offset: -1 | 1) => void
  readonly onSave: (draft: { name?: string; description?: string | null; isVisible?: boolean }) => Promise<void>
  readonly onDelete: () => void
}

function SectionRow({ section, isFirst, isLast, busy, onMove, onSave, onDelete }: SectionRowProps) {
  const [name, setName] = useState(section.name)
  const [description, setDescription] = useState(section.description ?? '')
  const [saving, setSaving] = useState(false)

  // Follow the saved values when they change underneath (a save, a refetch).
  useEffect(() => setName(section.name), [section.name])
  useEffect(() => setDescription(section.description ?? ''), [section.description])

  const nextName = normalizeSectionName(name)
  const nextDescription = description.trim()
  const dirty = nextName !== section.name || nextDescription !== (section.description ?? '')

  const save = async () => {
    if (!dirty || !nextName) return
    setSaving(true)
    try {
      await onSave({ name: nextName, description: nextDescription || null })
    } catch (error) {
      failed(error)
    } finally {
      setSaving(false)
    }
  }

  const toggleVisible = async () => {
    try {
      await onSave({ isVisible: !section.isVisible })
    } catch (error) {
      failed(error)
    }
  }

  const count = section.itemCount === 1 ? '1 item' : `${section.itemCount} items`

  return (
    <li className={cn('rounded-lg border border-border p-3', !section.isVisible && 'bg-muted/40')}>
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        <div className="flex items-center gap-2">
          <Input
            aria-label={`Name of ${section.name}`}
            value={name}
            maxLength={MAX_SECTION_NAME}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
          />
          <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">{count}</span>
        </div>
        <Input
          aria-label={`Description of ${section.name}`}
          placeholder="Short description (optional)"
          value={description}
          maxLength={MAX_SECTION_DESCRIPTION}
          onChange={(e) => setDescription(e.target.value)}
          disabled={saving}
          className="text-sm"
        />
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Move ${section.name} up`}
            disabled={isFirst || busy}
            onClick={() => onMove(-1)}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Move ${section.name} down`}
            disabled={isLast || busy}
            onClick={() => onMove(1)}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="small"
            aria-pressed={!section.isVisible}
            onClick={() => void toggleVisible()}
            className="text-muted-foreground"
          >
            {section.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {section.isVisible ? 'Shown' : 'Hidden'}
          </Button>
          <span className="flex-1" />
          {dirty ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="small"
                onClick={() => {
                  setName(section.name)
                  setDescription(section.description ?? '')
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="small" disabled={!nextName || saving}>
                Save
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Delete ${section.name}`}
              onClick={onDelete}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </li>
  )
}
