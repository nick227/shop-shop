// @ts-nocheck
/**
 * Item Form Sections Builder;
 * Extracts section definitions from ItemFormPage for cleaner code;
 */
import { Input, TextArea, Checkbox, Select } from '@shared/ui/primitives'
import { CharCount, FormRow, CheckboxGroup } from '@shared/ui/templates'
import { MediaGalleryManager } from '@shared/ui/media'
import type { FormSection } from '@shared/ui/templates'
import type { ItemFormData } from '@api/types'

// Category options for menu items
const CATEGORIES = [
  { value: 'appetizers', label: '🥗 Appetizers' },
  { value: 'entrees', label: '🍽️ Entrees' },
  { value: 'sandwiches', label: '🥪 Sandwiches' },
  { value: 'salads', label: '🥗 Salads' },
  { value: 'soups', label: '🍲 Soups' },
  { value: 'sides', label: '🍟 Sides' },
  { value: 'desserts', label: '🍰 Desserts' },
  { value: 'beverages', label: '🥤 Beverages' },
  { value: 'breakfast', label: '🍳 Breakfast' },
  { value: 'specials', label: '⭐ Specials' },
]

// Item type options
const ITEM_TYPES = [
  { value: 'entree', label: '🍽️ Main Entree' },
  { value: 'side', label: '🍟 Side Dish' },
  { value: 'drink', label: '🥤 Beverage' },
  { value: 'dessert', label: '🍰 Dessert' },
  { value: 'appetizer', label: '🥗 Appetizer' },
  { value: 'salad', label: '🥗 Salad' },
  { value: 'sandwich', label: '🥪 Sandwich' },
  { value: 'soup', label: '🍲 Soup' },
  { value: 'breakfast', label: '🍳 Breakfast' },
  { value: 'bundle', label: '📦 Bundle/Combo' },
]

// Dietary attribute options
const DIETARY_ATTRIBUTES = [
  { key: 'isVegan', label: '🌱 Vegan', description: 'No animal products' },
  { key: 'isVegetarian', label: '🥬 Vegetarian', description: 'No meat or fish' },
  { key: 'isGlutenFree', label: '🌾 Gluten-Free', description: 'No gluten ingredients' },
  { key: 'isDairyFree', label: '🥛 Dairy-Free', description: 'No dairy products' },
  { key: 'isKeto', label: '🥑 Keto-Friendly', description: 'Low carb, high fat' },
  { key: 'isPaleo', label: '🦕 Paleo-Friendly', description: 'Whole foods, no processed' },
]

// Common tag suggestions
const TAG_SUGGESTIONS = [
  'spicy', 'mild', 'sweet', 'savory', 'crispy', 'creamy',
  'fresh', 'homemade', 'signature', 'popular', 'healthy',
  'organic', 'local', 'seasonal', 'limited-time', 'comfort-food',
  'kid-friendly', 'shareable', 'gluten-free', 'dairy-free', 'vegan',
  'vegetarian', 'low-carb', 'high-protein', 'low-calorie', 'organic',
  'farm-to-table', 'artisan', 'handcrafted', 'traditional', 'modern',
  'fusion', 'authentic', 'regional', 'imported', 'premium', 'budget-friendly'
]

// Stock quantity suggestions
const STOCK_SUGGESTIONS = [
  { label: '🔢 Limited Stock', value: '10', description: 'For special or premium items' },
  { label: '📊 Standard Stock', value: '50', description: 'Regular menu items' },
  { label: '📦 High Stock', value: '100', description: 'Popular items' },
  { label: '♾️ Unlimited', value: '', description: 'Made-to-order or always available' },
]

export function createItemFormSections(
  formData: ItemFormData,
  onChange: (field: keyof ItemFormData, value: string | number | boolean) => void,
  options?: {
    storeId?: string
    itemId?: string
  }
): FormSection[] {
  return [
    {
      id: 'basic',
      icon: '🍽️',
      title: 'Basic Information',
      description: 'Describe your menu item with an appetizing title, description, and price',
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
                onValueChange={(value) => onChange('category', value)}
                placeholder="Select category"
              >
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
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
            <Input
              label="Price *"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => onChange('price', e.target.value)}
              placeholder="9.99"
              helperText="💲 Price in USD (customers will see this)"
              required
            />

            <Select
              value={formData.type || ''}
              onValueChange={(value) => onChange('type', value)}
              placeholder="Select item type"
            >
              {ITEM_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </Select>
          </FormRow>

          <FormRow>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📦 Stock Quantity Suggestions
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STOCK_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion.value}
                    type="button"
                    onClick={() => onChange('stockQty', suggestion.value)}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      formData.stockQty === suggestion.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{suggestion.label}</div>
                    <div className="text-xs text-gray-500">{suggestion.description}</div>
                  </button>
                ))}
              </div>
              
              <Input
                label="Custom Stock Quantity"
                type="number"
                min="0"
                value={formData.stockQty}
                onChange={(e) => onChange('stockQty', e.target.value)}
                placeholder="Or enter custom quantity"
                helperText="� Leave empty for unlimited stock"
              />
            </div>

            <Input
              label="Sort Order"
              type="number"
              min="0"
              value={formData.sortIndex.toString()}
              onChange={(e) => onChange('sortIndex', Number.parseInt(e.target.value) || 0)}
              helperText="📌 Lower numbers appear first on your menu (0 = top)"
            />
          </FormRow>
        </>
      )},
    {
      id: 'attributes',
      icon: '🌱',
      title: 'Dietary Attributes',
      description: 'Help customers find items that match their dietary preferences and restrictions',
      content: (
        <CheckboxGroup>
          {DIETARY_ATTRIBUTES.map((attr) => (
            <div key={attr.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg mb-2">
              <div className="flex items-center space-x-3">
                <Checkbox
                  label={attr.label}
                  checked={formData[attr.key] || false}
                  onChange={(e) => onChange(attr.key, e.target.checked)}
                />
                <span className="text-sm text-gray-500">{attr.description}</span>
              </div>
            </div>
          ))}
        </CheckboxGroup>
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
      description: 'Add tags to help customers discover your item. Use keywords that describe flavors, style, and special qualities.',
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
                    const currentTags = formData.tags || []
                    if (!currentTags.includes(tag)) {
                      onChange('tags', [...currentTags, tag])
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    formData.tags?.includes(tag)
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
              value={(formData.tags || []).join(', ')}
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
      title: 'Product Images & Videos',
      description: 'Upload high-quality photos and videos to showcase your item. The first image will be the primary display image.',
      content: options?.itemId ? (
        <MediaGalleryManager
          storeId={options?.storeId}
          itemId={options?.itemId}
          maxFiles={10}
        />
      ) : (
        <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-gray-500">
            <div className="text-2xl mb-2">📸</div>
            <p className="font-medium mb-1">Media Upload Available After Item Creation</p>
            <p className="text-sm">Create the item first, then you can upload product images and videos.</p>
          </div>
        </div>
      )},
  ]
}

