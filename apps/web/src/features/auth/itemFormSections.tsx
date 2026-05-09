/**
 * Item Form Sections Builder;
 * Extracts section definitions from ItemFormPage for cleaner code;
 */
import { Input, TextArea, Checkbox, Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from '@shared/ui/primitives'
import { CharCount, FormRow, CheckboxGroup } from '@shared/ui/templates'
import { EnhancedMediaGalleryManager } from '@shared/ui/media'
import type { FormSection } from '@shared/ui/templates'
import type { ItemFormData } from '@api/types'
import { resolveBrowserAssetUrl } from '@shared/lib/utils/resolveBrowserAssetUrl'
import {
  CATEGORIES,
  getCategoriesForStoreType,
  getAvailableItemTypes,
  isTypeValidForCategory,
  getAvailableSubTypes,
  isSubTypeValidForCategoryType
} from './itemClassificationData'



// Common tag suggestions
const TAG_SUGGESTIONS = [
  // Flavor & Texture
  'spicy', 'mild', 'sweet', 'savory', 'crispy', 'creamy',
  // Quality & Source
  'fresh', 'homemade', 'signature', 'popular', 'healthy',
  'organic', 'local', 'seasonal', 'limited-time', 'comfort-food',
  // Dietary Preferences (now tags instead of separate fields)
  'vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'keto-friendly', 'paleo-friendly',
  // Nutritional
  'low-carb', 'high-protein', 'low-calorie', 'low-sugar', 'low-sodium',
  // Style & Origin
  'kid-friendly', 'shareable', 'farm-to-table', 'artisan', 'handcrafted',
  'traditional', 'modern', 'fusion', 'authentic', 'regional', 'imported',
  // Price & Value
  'premium', 'budget-friendly', 'value', 'gourmet'
]

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return []

  return tags
    .map((tag) => {
      if (typeof tag === 'string') return tag
      if (tag && typeof tag === 'object') {
        if ('name' in tag && typeof (tag as { name?: unknown }).name === 'string') {
          return (tag as { name: string }).name
        }
        if ('label' in tag && typeof (tag as { label?: unknown }).label === 'string') {
          return (tag as { label: string }).label
        }
        if ('value' in tag && typeof (tag as { value?: unknown }).value === 'string') {
          return (tag as { value: string }).value
        }
      }
      return ''
    })
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
}


export function createItemFormSections(
  formData: ItemFormData,
  onChange: (field: keyof ItemFormData, value: string | number | boolean | string[]) => void,
  options?: {
    storeId?: string
    itemId?: string
    storeType?: string
  }
): FormSection[] {
  // Get categories based on store type, fallback to legacy categories
  const categories = options?.storeType 
    ? getCategoriesForStoreType(options.storeType)
    : CATEGORIES

  return [
    {
      id: 'basic',
      icon: '🍽️',
      title: 'Basic Information',
      description: 'Describe your appetizing item with delicious information',
      content: (
        <>
          <FormRow>
            <div className="space-y-2">
              <Input
                label="Item Title *"
                value={formData.title}
                onChange={(e) => onChange('title', e.target.value)}
                placeholder="Delicious Menu Item"
                required
              />
              
              <Select
                value={formData.category || ''}
                onValueChange={(value) => {
                  onChange('category', value)
                  // Reset type if it's not valid for new category
                  if (formData.type && !isTypeValidForCategory(formData.type, value)) {
                    onChange('type', '')
                  }
                  // Reset subtype if it's not valid for new category/type combination
                  if (formData.subtype && !isSubTypeValidForCategoryType(formData.subtype, value, formData.type || '')) {
                    onChange('subtype', '')
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

            <Select
              value={formData.type || ''}
              onValueChange={(value) => {
                onChange('type', value)
                // Reset subtype if it's not valid for the new category/type combination
                if (formData.subtype && !isSubTypeValidForCategoryType(formData.subtype, formData.category || '', value)) {
                  onChange('subtype', '')
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select item type" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableItemTypes(formData.category || '').map((itemType) => (
                  <SelectItem key={itemType.value} value={itemType.value}>
                    {itemType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={formData.subtype || ''}
              onValueChange={(value) => onChange('subtype', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select item subtype" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableSubTypes(formData.category || '', formData.type || '').map((subType) => (
                  <SelectItem key={subType.value} value={subType.value}>
                    {subType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
            
            <div className="space-y-2">
              <TextArea
                label="Description"
                value={formData.description}
                onChange={(e) => onChange('description', e.target.value)}
                placeholder="Describe ingredients, preparation, allergens, and what makes this item special..."
                rows={4}
                maxLength={1000}
              />
              <CharCount current={formData.description.length} max={1000} />
            </div>
          </FormRow>

          <FormRow>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Price *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => onChange('price', e.target.value)}
                  placeholder="9.99"
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                💲 Price in USD (customers will see this)
              </p>
            </div>
          </FormRow>

        </>
      )},
    {
      id: 'availability',
      icon: '📊',
      title: 'Availability',
      description: 'Control when customers can see and order this item',
      content: (
        <CheckboxGroup>
          <Checkbox
            label="Active (visible to customers)"
            checked={formData.isActive}
            onChange={(e) => onChange('isActive', e.target.checked)}
          />

          <Checkbox
            label="Sold Out"
            checked={formData.isSoldOut}
            onChange={(e) => onChange('isSoldOut', e.target.checked)}
          />
        </CheckboxGroup>
      )},
    {
      id: 'tags',
      icon: '🏷️',
      title: 'Tags & Keywords',
      description: 'Add tags to help customers discover your item. Use keywords that describe flavors, style, and dietary preferences.',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              💡 Suggested Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {TAG_SUGGESTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    const currentTags = normalizeTags(formData.tags)
                    if (!currentTags.includes(tag)) {
                      onChange('tags', [...currentTags, tag])
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    normalizeTags(formData.tags).includes(tag)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Tags
            </label>
            <Input
              value={normalizeTags(formData.tags).join(', ')}
              onChange={(e) => {
                const tags = e.target.value
                  .split(',')
                  .map(tag => tag.trim())
                  .filter(tag => tag.length > 0)
                onChange('tags', tags)
              }}
              placeholder="Enter tags separated by commas (e.g., spicy, fresh, homemade)"
              helperText="🏷️ Tags help customers find your items through search"
            />
          </div>
        </div>
      )},
    {
      id: 'media',
      icon: '📸',
      title: 'Product Media',
      description: 'Upload high-quality photos and videos to showcase your item. The first image will be the primary display image.',
      content: (
        <EnhancedMediaGalleryManager
          storeId={options?.storeId}
          itemId={options?.itemId}
          maxFiles={100}
          thumbnailUrl={formData.imageUrl}
          onThumbnailChange={(url) =>
            onChange('imageUrl', url)
          }
          thumbnailLabel="Product thumbnail"
        />
      ),
    },
  ]
}

