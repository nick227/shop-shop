/**
 * StoreItemsPage - the store's menu: every item, grouped by the store's own sections (empty and hidden
 * ones included, so the vendor can fill them), with each item's sales for the chosen period on the row.
 */
import { vendorPaths } from '@shared/lib/utils/navigation/vendorPaths'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { toast } from 'sonner'
import { handleApiError } from '@api/errors'
import {
  Badge,
  Button,
  SearchInput,
  SegmentedControl,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/primitives'
import { VendorPage } from '@layouts/VendorLayout/page'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { Edit, EyeOff, FolderCog, Package, Plus, Trash2 } from 'lucide-react'
import type { ItemResponse } from '@api/types'
import { formatCurrency, parsePrice } from '@shared/lib/utils/format'
import { authGet } from '@shared/lib/auth/authFetch'
import { storeItemsQueryKey, useStoreItems } from '@shared/hooks/hooks/vendor/useStoreItems'
import { CsvImportButton } from './components/CsvImportButton'
import { MenuTabs } from './components/MenuTabs'
import { ManageSectionsDialog } from './components/ManageSectionsDialog'
import { groupItemsBySection, matchesMenuSearch } from '@shared/lib/menu/menuSections'
import { useMenuSections } from '@shared/hooks/hooks/useMenuSections'

/** Heading for items that are not in any section yet. */
const NOT_IN_A_SECTION = 'Not in a section'

type Period = '7d' | '30d' | '90d' | 'all'
type SortMode = 'menu' | 'best' | 'price' | 'name'

const ALL = '__all__'

const PERIODS: readonly { id: Period; label: string }[] = [
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
  { id: '90d', label: '90d' },
  { id: 'all', label: 'All time' },
]

interface ItemSales {
  readonly itemId: string
  readonly periodUnitsSold: number
  readonly periodRevenue: number
}

/** The analytics endpoint pages at 100; a menu can be longer, so read every page. */
async function fetchSales(storeId: string, period: Period): Promise<Map<string, ItemSales>> {
  const sales = new Map<string, ItemSales>()
  const pageSize = 100
  for (let page = 0; page < 10; page += 1) {
    const qs = new URLSearchParams({
      storeId,
      period,
      sortBy: 'revenue',
      sortOrder: 'desc',
      limit: String(pageSize),
      offset: String(page * pageSize),
    })
    const response = await authGet(`/api/items/analytics?${qs.toString()}`)
    if (!response.ok) throw new Error('Failed to load sales')
    const body = (await response.json()) as { data?: { items?: ItemSales[] } }
    const rows = body.data?.items ?? []
    for (const row of rows) sales.set(row.itemId, row)
    if (rows.length < pageSize) break
  }
  return sales
}

function sortItems(items: ItemResponse[], mode: SortMode, sales: Map<string, ItemSales> | undefined) {
  const byMenu = (a: ItemResponse, b: ItemResponse) =>
    (a.sortIndex ?? 0) - (b.sortIndex ?? 0) || a.title.localeCompare(b.title)
  const compare: Record<SortMode, (a: ItemResponse, b: ItemResponse) => number> = {
    menu: byMenu,
    name: (a, b) => a.title.localeCompare(b.title),
    price: (a, b) => parsePrice(a.price) - parsePrice(b.price) || byMenu(a, b),
    best: (a, b) =>
      (sales?.get(b.id)?.periodRevenue ?? 0) - (sales?.get(a.id)?.periodRevenue ?? 0) || byMenu(a, b),
  }
  return [...items].sort(compare[mode])
}

export default function StoreItemsPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState<string>(ALL)
  const [period, setPeriod] = useState<Period>('30d')
  const [sortMode, setSortMode] = useState<SortMode>('menu')
  const [managing, setManaging] = useState(false)

  const { data: store, isLoading: isLoadingStore } = useQuery({
    queryKey: ['store', storeId],
    queryFn: async () => await apiClient.stores().getStoreById({ id: storeId! }),
    enabled: !!storeId,
  })

  const { data: items = [], isLoading: isLoadingItems } = useStoreItems(storeId)
  const { data: sections = [], isLoading: isLoadingSections } = useMenuSections(storeId, { view: 'team' })

  const { data: sales } = useQuery({
    queryKey: ['item-analytics', storeId, period],
    queryFn: () => fetchSales(storeId!, period),
    enabled: !!storeId && items.length > 0,
    refetchInterval: 60_000,
  })

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => await apiClient.items().deleteItem({ id: itemId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: storeItemsQueryKey(storeId) })
      toast.success('Item deleted')
    },
    onError: async (error) => {
      const appError = await handleApiError(error)
      toast.error(appError.message)
    },
  })

  const groups = useMemo(
    () => groupItemsBySection(items, sections, { includeEmpty: true, unsectionedName: NOT_IN_A_SECTION }),
    [items, sections],
  )

  // A section can disappear (deleted, or emptied of its last unsectioned item); fall back to the whole menu.
  const activeCategory = category === ALL || groups.some((g) => g.id === category) ? category : ALL
  const searching = searchQuery.trim().length > 0

  const visibleGroups = useMemo(
    () =>
      groups
        .filter((group) => activeCategory === ALL || group.id === activeCategory)
        .map((group) => ({
          ...group,
          items: sortItems(group.items.filter((item) => matchesMenuSearch(item, searchQuery)), sortMode, sales),
        }))
        // While searching, only sections with a match; otherwise empty sections stay, ready to fill.
        .filter((group) => !searching || group.items.length > 0),
    [groups, activeCategory, searchQuery, searching, sortMode, sales],
  )

  const addItemPath = (sectionId?: string) =>
    `${vendorPaths.newItem(storeId!)}${sectionId ? `?section=${encodeURIComponent(sectionId)}` : ''}`

  const handleDeleteItem = (item: ItemResponse) => {
    if (confirm(`Delete "${item.title}"?`)) deleteItemMutation.mutate(item.id)
  }

  const available = items.filter((i) => i.isActive && !i.isSoldOut).length
  const soldOut = items.filter((i) => i.isSoldOut).length
  const hidden = items.filter((i) => !i.isActive).length
  const periodRevenue = [...(sales?.values() ?? [])].reduce((sum, s) => sum + s.periodRevenue, 0)
  const periodUnits = [...(sales?.values() ?? [])].reduce((sum, s) => sum + s.periodUnitsSold, 0)

  const categoryChoices = [
    { id: ALL, label: 'All', count: items.length },
    ...groups.map((g) => ({ id: g.id, label: g.name, count: g.items.length })),
  ]
  const menuIsBlank = items.length === 0 && sections.length === 0

  return (
    <VendorPage
      title="Menu"
      loading={isLoadingStore || isLoadingItems || isLoadingSections}
      error={!isLoadingStore && !store ? { message: 'This store could not be loaded' } : undefined}
      tabs={<MenuTabs storeId={storeId!} />}
      actions={
        <>
          <CsvImportButton storeId={storeId!} />
          <Button variant="primary" onClick={() => navigate(addItemPath())}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add item
          </Button>
        </>
      }
    >
      {menuIsBlank ? (
        <EmptyState
          icon={Package}
          title="Your menu is empty"
          description="Start with sections like “Breakfast” or “Drinks”, then add items to them. You can also import a CSV."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="primary" onClick={() => setManaging(true)}>
                <FolderCog className="mr-2 h-4 w-4" />
                Add sections
              </Button>
              <Button variant="outline" onClick={() => navigate(addItemPath())}>
                <Plus className="mr-2 h-4 w-4" />
                Add an item
              </Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-5">
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <SegmentedControl
              label="Menu sections"
              items={categoryChoices}
              value={activeCategory}
              onChange={setCategory}
            />
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="w-full lg:w-72">
              <SearchInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items"
                aria-label="Search items"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SegmentedControl label="Sales period" items={PERIODS} value={period} onChange={setPeriod} />
              <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                <SelectTrigger className="w-40" aria-label="Sort items">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="menu">Menu order</SelectItem>
                  <SelectItem value="best">Best selling</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => setManaging(true)}>
                <FolderCog className="mr-1.5 h-4 w-4" />
                Sections
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {items.length} items · {available} available
            {soldOut > 0 && ` · ${soldOut} sold out`}
            {hidden > 0 && ` · ${hidden} hidden`}
            {sales && ` · ${periodUnits} sold for ${formatCurrency(periodRevenue)} (${period === 'all' ? 'all time' : `last ${period}`})`}
          </p>

          {visibleGroups.length === 0 ? (
            <EmptyState icon={Package} title="No items found" description="No items match your search." />
          ) : (
            visibleGroups.map((group) => (
              <section key={group.id} aria-labelledby={`section-${group.id}`} className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <h2 id={`section-${group.id}`} className="flex items-baseline gap-2 text-base font-semibold">
                    {group.name}
                    <span className="text-sm font-normal text-muted-foreground">{group.items.length}</span>
                  </h2>
                  {group.section && !group.section.isVisible ? (
                    <Badge variant="warning" className="gap-1">
                      <EyeOff className="h-3 w-3" aria-hidden />
                      Hidden from shoppers
                    </Badge>
                  ) : null}
                  {group.section ? (
                    <Button
                      variant="link"
                      size="small"
                      className="ml-auto h-auto px-0"
                      onClick={() => navigate(addItemPath(group.id))}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add item
                    </Button>
                  ) : null}
                </div>
                {group.description ? <p className="text-sm text-muted-foreground">{group.description}</p> : null}
                {group.items.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No items yet. Shoppers won’t see this section until it has one.
                  </p>
                ) : (
                  <ul className="divide-y overflow-hidden rounded-lg border bg-card">
                    {group.items.map((item) => (
                      <MenuItemRow
                        key={item.id}
                        item={item}
                        sales={sales?.get(item.id)}
                        salesLoaded={!!sales}
                        onEdit={() => navigate(vendorPaths.item(storeId!, item.id))}
                        onDelete={() => handleDeleteItem(item)}
                        isDeleting={deleteItemMutation.isPending && deleteItemMutation.variables === item.id}
                      />
                    ))}
                  </ul>
                )}
              </section>
            ))
          )}
        </div>
      )}

      <ManageSectionsDialog open={managing} onOpenChange={setManaging} storeId={storeId!} sections={sections} />
    </VendorPage>
  )
}

type MenuItemRowProps = Readonly<{
  item: ItemResponse
  sales: ItemSales | undefined
  salesLoaded: boolean
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}>

function MenuItemRow({ item, sales, salesLoaded, onEdit, onDelete, isDeleting }: MenuItemRowProps) {
  const extra = item as { imageUrl?: string | null; mediaAssets?: { url: string }[] }
  const thumb = extra.imageUrl || extra.mediaAssets?.[0]?.url
  let status: { label: string; variant: 'warning' | 'destructive' } | undefined
  if (!item.isActive) status = { label: 'Hidden', variant: 'warning' }
  else if (item.isSoldOut) status = { label: 'Sold out', variant: 'destructive' }

  return (
    <li className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/30">
      <button type="button" onClick={onEdit} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        {thumb ? (
          <img src={thumb} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-muted">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{item.title}</span>
            {status && <Badge variant={status.variant}>{status.label}</Badge>}
          </div>
          {item.description && <p className="truncate text-sm text-muted-foreground">{item.description}</p>}
          <p className="text-sm text-muted-foreground sm:hidden">
            {formatCurrency(parsePrice(item.price))}
            {salesLoaded && ` · ${sales?.periodUnitsSold ?? 0} sold`}
          </p>
        </div>
      </button>

      <div className="hidden w-20 text-right text-sm font-medium sm:block">{formatCurrency(parsePrice(item.price))}</div>
      <div className="hidden w-24 text-right text-xs text-muted-foreground md:block">
        {salesLoaded ? (
          <>
            <div>{sales?.periodUnitsSold ?? 0} sold</div>
            <div>{formatCurrency(sales?.periodRevenue ?? 0)}</div>
          </>
        ) : (
          '—'
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label={`Edit ${item.title}`}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          disabled={isDeleting}
          aria-label={`Delete ${item.title}`}
          className="text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  )
}
