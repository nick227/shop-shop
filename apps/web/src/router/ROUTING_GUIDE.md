# Client-Side Routing Guide

## URL Parameter System

The application now supports URL parameters for shareable searches and deep linking.

### Store Search (HomePage)

**Route:** `/`

**URL Parameters:**
- `lat` - Latitude coordinate (e.g., `30.2672`)
- `lng` - Longitude coordinate (e.g., `-97.7431`)
- `radius` - Search radius in miles (e.g., `25`)
- `city` - City name (e.g., `Austin`)
- `state` - State abbreviation (e.g., `TX`)
- `zip` - ZIP code (e.g., `78758`)

**Examples:**
```
/?lat=30.2672&lng=-97.7431&radius=25&city=Austin&state=TX
/?lat=40.7128&lng=-74.0060&radius=10&zip=10018
```

**Usage:**
```typescript
import { useLocationParams } from '@hooks/useLocationParams'

function MyComponent() {
  const { params, updateParams, clearParams } = useLocationParams()
  
  // Read current params
  console.log(params.latitude, params.longitude)
  
  // Update params
  updateParams({
    latitude: '30.2672',
    longitude: '-97.7431',
    radius: '25',
    city: 'Austin',
    state: 'TX'
  })
  
  // Clear all params
  clearParams()
}
```

### Kitchen Profile

**Route:** `/kitchen/:slug`

**URL Parameters:**
- `slug` - Kitchen slug (name + id suffix)

**Example:**
```
/kitchen/joes-pizza-abc123def456
```

**Usage:**
```typescript
import { useStoreParams } from '@hooks/useStoreParams'

function StoreComponent() {
  const { storeId } = useStoreParams()
}
```

### Item Detail

**Route:** `/items/:itemId`

**URL Parameters:**
- `itemId` - Item UUID

**Example:**
```
/items/xyz789uvw012
```

**Usage:**
```typescript
import { useParams } from 'react-router-dom'

function ItemComponent() {
  const { itemId } = useParams<{ itemId: string }>()
  
  // Navigate to canonical item route
  navigate(`/items/${itemId}`)
}
```

**Note:** `/items/:itemId` is the canonical item route.

## Benefits

1. **Shareable Links** - Users can share search results with specific locations
2. **Bookmarkable Searches** - Save frequently used search locations
3. **Deep Linking** - Direct navigation to specific store contexts
4. **SEO-Friendly** - Better URL structure for search engines
5. **State Persistence** - URL reflects current application state

## Implementation Details

### Hooks

- `useLocationParams()` - Read/write location search parameters
- `useLocationSearchParams()` - Read-only location parameters
- `useUpdateLocationParams()` - Write-only parameter updater
- `useStoreParams()` - Read kitchen and item IDs from URL

### Components

- **HomePage** - Automatically syncs location state with URL parameters
- **LocationSearch** - Updates URL when location changes
- **ItemDetailPage** - Uses canonical `/items/:itemId` route

### Type Safety

All URL parameters are properly typed:

```typescript
type LocationSearchParams = {
  latitude?: string
  longitude?: string
  radius?: string
  city?: string
  state?: string
  zip?: string
}

type StoreParams = {
  storeId: string
  itemId?: string
}
```

## Navigation Examples

### Programmatic Navigation with Parameters

```typescript
import { useNavigate } from 'react-router-dom'

function MyComponent() {
  const navigate = useNavigate()
  
  // Navigate to home with location params
  navigate('/?lat=30.2672&lng=-97.7431&radius=25&city=Austin&state=TX')
  
  // Navigate to kitchen
  navigate(`/kitchen/${kitchenSlug}`)
  
  // Navigate to item
  navigate(`/items/${itemId}`)
}
```

### Link Components

```tsx
import { Link } from 'react-router-dom'

// Kitchen link
<Link to={`/kitchen/${kitchenSlug}`}>View Kitchen</Link>

// Item link
<Link to={`/items/${itemId}`}>View Item</Link>

// Search with params
<Link to="/?lat=30.2672&lng=-97.7431&radius=25">Austin Stores</Link>
```

