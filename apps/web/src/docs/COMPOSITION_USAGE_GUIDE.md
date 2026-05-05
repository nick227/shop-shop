# 🏗️ **Composition System Usage Guide**

## **📚 Overview**

The Composition System provides a unified, consistent way to build React components and pages. It replaces multiple component implementations with a single, flexible system that promotes reusability, maintainability, and developer experience.

### **🎯 Key Benefits**
- **Consistent Patterns** - All components follow the same composition patterns
- **Responsive by Default** - Built-in responsive behavior with breakpoint awareness
- **Accessibility First** - ARIA-compliant components with keyboard navigation
- **Performance Optimized** - Memoized components with lazy loading support
- **Type Safe** - Full TypeScript support with autocomplete

---

## **🚀 Quick Start**

### **1. Import Composition Components**

```typescript
// Import specific composition factories
import { PageCompositionFactory, CardCompositionFactory, LayoutCompositionFactory } from '@components/composition'

// Or import everything
import { CompositionFactory } from '@components/composition'
```

### **2. Wrap Your App with CompositionProvider**

```typescript
// In your main App component
import { CompositionProvider } from '@components/composition'

function App() {
  return (
    <CompositionProvider
      config={{
        responsive: { enabled: true },
        accessibility: { enabled: true },
        performance: { memoization: true }
      }}
    >
      <YourAppContent />
    </CompositionProvider>
  )
}
```

### **3. Use Composition Components**

```typescript
// Page composition
<PageCompositionFactory.App
  layout="sidebar"
  sections={['header', 'content', 'sidebar']}
  responsive={true}
  accessibility={true}
>
  <YourPageContent />
</PageCompositionFactory.App>

// Card composition
<CardCompositionFactory.Product
  layout="vertical"
  size="md"
  features={{
    image: { aspectRatio: '4/3', zoom: true },
    actions: { primary: { label: 'Add to Cart' } },
    meta: { price: { amount: 29.99 } }
  }}
  responsive={true}
  interactive={true}
>
  <ProductContent />
</CardCompositionFactory.Product>

// Layout composition
<LayoutCompositionFactory.Grid
  columns={{ mobile: 1, tablet: 2, desktop: 3 }}
  gap="md"
  responsive={true}
>
  {items.map(item => <ItemCard key={item.id} item={item} />)}
</LayoutCompositionFactory.Grid>
```

---

## **📄 Page Composition**

### **Available Page Templates**

```typescript
// App pages (with sidebar navigation)
<PageCompositionFactory.App
  layout="sidebar"
  sections={['header', 'content', 'sidebar']}
  responsive={true}
  accessibility={true}
>
  <AppContent />
</PageCompositionFactory.App>

// Marketing pages (with top navigation)
<PageCompositionFactory.Marketing
  layout="top-nav"
  sections={['header', 'content', 'footer']}
  responsive={true}
  accessibility={true}
>
  <MarketingContent />
</PageCompositionFactory.Marketing>

// Auth pages (minimal layout)
<PageCompositionFactory.Auth
  layout="minimal"
  sections={['content']}
  responsive={true}
  accessibility={true}
>
  <AuthContent />
</PageCompositionFactory.Auth>

// Admin pages (with sidebar navigation)
<PageCompositionFactory.Admin
  layout="sidebar"
  sections={['header', 'content', 'sidebar']}
  responsive={true}
  accessibility={true}
>
  <AdminContent />
</PageCompositionFactory.Admin>

// Mobile pages (with bottom navigation)
<PageCompositionFactory.Mobile
  layout="bottom-nav"
  sections={['header', 'content', 'bottom-nav']}
  responsive={true}
  accessibility={true}
>
  <MobileContent />
</PageCompositionFactory.Mobile>
```

### **Page Layout Options**

```typescript
type PageLayout = 'sidebar' | 'top-nav' | 'bottom-nav' | 'minimal' | 'full'

// Sidebar layout - navigation on the left
layout="sidebar"

// Top navigation layout - navigation at the top
layout="top-nav"

// Bottom navigation layout - navigation at the bottom (mobile)
layout="bottom-nav"

// Minimal layout - no navigation (auth pages)
layout="minimal"

// Full layout - no constraints (marketing pages)
layout="full"
```

### **Page Sections**

```typescript
type PageSection = 'header' | 'content' | 'sidebar' | 'footer' | 'navigation'

// Define which sections to include
sections={['header', 'content', 'sidebar']}
sections={['header', 'content', 'footer']}
sections={['content']} // Minimal
```

---

## **🃏 Card Composition**

### **Available Card Variants**

```typescript
// Product cards
<CardCompositionFactory.Product
  layout="vertical"
  size="md"
  features={{
    image: { aspectRatio: '4/3', zoom: true },
    actions: { primary: { label: 'Add to Cart' } },
    badges: { sale: true, new: true },
    meta: { price: { amount: 29.99 } }
  }}
  responsive={true}
  interactive={true}
>
  <ProductContent />
</CardCompositionFactory.Product>

// Store cards
<CardCompositionFactory.Store
  layout="vertical"
  size="lg"
  features={{
    image: { aspectRatio: '16/9' },
    actions: { primary: { label: 'View Store' } },
    badges: { featured: true },
    meta: { rating: { value: 4.5, count: 128 } }
  }}
  responsive={true}
  interactive={true}
>
  <StoreContent />
</CardCompositionFactory.Store>

// Order cards
<CardCompositionFactory.Order
  layout="horizontal"
  size="md"
  features={{
    actions: { primary: { label: 'View Details' } },
    meta: { status: { text: 'Pending', variant: 'info' } }
  }}
  responsive={true}
  interactive={true}
>
  <OrderContent />
</CardCompositionFactory.Order>

// Custom cards
<CardCompositionFactory.Custom
  layout="vertical"
  size="md"
  features={{}}
  responsive={true}
  interactive={true}
>
  <CustomContent />
</CardCompositionFactory.Custom>
```

### **Card Layout Options**

```typescript
type CardLayout = 'horizontal' | 'vertical' | 'grid' | 'list'

// Vertical layout (default)
layout="vertical"

// Horizontal layout (for lists)
layout="horizontal"

// Grid layout (for grids)
layout="grid"

// List layout (for lists)
layout="list"
```

### **Card Sizes**

```typescript
type CardSize = 'sm' | 'md' | 'lg' | 'xl'

// Small cards
size="sm" // 32x48 (h-32 w-48)

// Medium cards (default)
size="md" // 48x64 (h-48 w-64)

// Large cards
size="lg" // 64x80 (h-64 w-80)

// Extra large cards
size="xl" // 80x96 (h-80 w-96)
```

### **Card Features**

```typescript
interface CardFeatures {
  image?: {
    src?: string
    alt?: string
    aspectRatio?: string
    zoom?: boolean
    gallery?: boolean
    videos?: boolean
    placeholder?: string
  }
  actions?: {
    primary?: {
      label: string
      onClick?: () => void
      href?: string
      variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
      icon?: React.ComponentType<{ className?: string }>
      disabled?: boolean
    }
    secondary?: {
      label: string
      onClick?: () => void
      href?: string
      variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
      icon?: React.ComponentType<{ className?: string }>
      disabled?: boolean
    }
  }
  badges?: {
    sale?: boolean
    new?: boolean
    featured?: boolean
    limited?: boolean
    custom?: {
      label: string
      variant?: 'default' | 'secondary' | 'destructive' | 'outline'
      color?: string
    }[]
  }
  meta?: {
    price?: {
      amount: number
      currency?: string
      originalAmount?: number
      discount?: number
    }
    rating?: {
      value: number
      count: number
      max?: number
    }
    status?: {
      text: string
      variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'
    }
    location?: {
      address: string
      distance?: number
      city?: string
      state?: string
    }
    timestamp?: {
      date: string
      time?: string
      relative?: boolean
    }
  }
}
```

---

## **📐 Layout Composition**

### **Available Layout Types**

```typescript
// Grid layout
<LayoutCompositionFactory.Grid
  columns={{ mobile: 1, tablet: 2, desktop: 3 }}
  rows={{ mobile: 2, tablet: 3, desktop: 4 }}
  gap="md"
  responsive={true}
>
  {items.map(item => <ItemCard key={item.id} item={item} />)}
</LayoutCompositionFactory.Grid>

// Flex layout
<LayoutCompositionFactory.Flex
  direction="row"
  alignment="center"
  justify="between"
  gap="md"
  wrap={true}
  responsive={true}
>
  <FlexItem1 />
  <FlexItem2 />
  <FlexItem3 />
</LayoutCompositionFactory.Flex>

// Stack layout
<LayoutCompositionFactory.Stack
  direction="column"
  gap="lg"
  responsive={true}
>
  <StackItem1 />
  <StackItem2 />
  <StackItem3 />
</LayoutCompositionFactory.Stack>

// Sidebar layout
<LayoutCompositionFactory.Sidebar
  sidebar={<SidebarContent />}
  content={<MainContent />}
  sidebarPosition="left"
  sidebarWidth="md"
  responsive={true}
/>

// Header content footer layout
<LayoutCompositionFactory.HeaderContentFooter
  header={<HeaderContent />}
  content={<MainContent />}
  footer={<FooterContent />}
  stickyHeader={true}
  stickyFooter={false}
  responsive={true}
/>
```

### **Layout Options**

```typescript
// Layout directions
type LayoutDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse'

// Layout alignments
type LayoutAlignment = 'start' | 'center' | 'end' | 'stretch' | 'baseline'

// Layout justify options
type LayoutJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'

// Layout gaps
type LayoutGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
```

---

## **📱 Responsive Composition**

### **Using Responsive Hooks**

```typescript
import { useResponsiveComposition, useCompositionBreakpoint } from '@components/composition'

function MyComponent() {
  // Responsive configuration
  const responsiveConfig = {
    mobile: { columns: 1, gap: 'sm', padding: 'sm' },
    tablet: { columns: 2, gap: 'md', padding: 'md' },
    desktop: { columns: 3, gap: 'lg', padding: 'lg' }
  }
  
  const layout = useResponsiveComposition(responsiveConfig)
  
  // Breakpoint information
  const { isMobile, isTablet, isDesktop, breakpoint } = useCompositionBreakpoint()
  
  return (
    <LayoutCompositionFactory.Grid
      columns={layout.columns}
      gap={layout.gap}
      responsive={true}
    >
      {items.map(item => <ItemCard key={item.id} item={item} />)}
    </LayoutCompositionFactory.Grid>
  )
}
```

### **Responsive Configuration**

```typescript
// Define responsive behavior
const responsiveConfig = {
  mobile: {
    columns: 1,
    gap: 'sm',
    padding: 'sm',
    fontSize: 'sm'
  },
  tablet: {
    columns: 2,
    gap: 'md',
    padding: 'md',
    fontSize: 'base'
  },
  desktop: {
    columns: 3,
    gap: 'lg',
    padding: 'lg',
    fontSize: 'lg'
  },
  wide: {
    columns: 4,
    gap: 'xl',
    padding: 'xl',
    fontSize: 'xl'
  }
}
```

---

## **♿ Accessibility Composition**

### **Accessibility Features**

```typescript
// All composition components include accessibility features by default
<PageCompositionFactory.App
  accessibility={true} // Enable accessibility features
  responsive={true}
>
  <AppContent />
</PageCompositionFactory.App>

// Card components with accessibility
<CardCompositionFactory.Product
  features={{
    actions: { 
      primary: { 
        label: 'Add to Cart',
        // Accessibility attributes are added automatically
      } 
    }
  }}
  responsive={true}
  interactive={true} // Enables keyboard navigation
>
  <ProductContent />
</CardCompositionFactory.Product>
```

### **Accessibility Configuration**

```typescript
// Configure accessibility in CompositionProvider
<CompositionProvider
  config={{
    accessibility: {
      enabled: true,
      ariaLabels: true,
      keyboardNavigation: true,
      screenReaderSupport: true
    }
  }}
>
  <YourApp />
</CompositionProvider>
```

---

## **⚡ Performance Composition**

### **Performance Features**

```typescript
// All composition components are performance optimized
<PageCompositionFactory.App
  responsive={true}
  accessibility={true}
  // Memoization is enabled by default
>
  <AppContent />
</PageCompositionFactory.App>

// Card components with performance optimization
<CardCompositionFactory.Product
  features={productFeatures}
  responsive={true}
  interactive={true}
  loading={false} // Show loading state
  error={false}   // Show error state
>
  <ProductContent />
</CardCompositionFactory.Product>
```

### **Performance Configuration**

```typescript
// Configure performance in CompositionProvider
<CompositionProvider
  config={{
    performance: {
      memoization: true,    // Enable component memoization
      lazyLoading: true,    // Enable lazy loading
      virtualization: false // Enable virtualization for large lists
    }
  }}
>
  <YourApp />
</CompositionProvider>
```

---

## **🎨 Styling Composition**

### **Custom Styling**

```typescript
// Add custom classes to composition components
<PageCompositionFactory.App
  className="custom-page-class"
  responsive={true}
  accessibility={true}
>
  <AppContent />
</PageCompositionFactory.App>

// Card components with custom styling
<CardCompositionFactory.Product
  className="custom-card-class"
  features={productFeatures}
  responsive={true}
  interactive={true}
>
  <ProductContent />
</CardCompositionFactory.Product>

// Layout components with custom styling
<LayoutCompositionFactory.Grid
  className="custom-grid-class"
  columns={{ mobile: 1, tablet: 2, desktop: 3 }}
  gap="md"
  responsive={true}
>
  {items.map(item => <ItemCard key={item.id} item={item} />)}
</LayoutCompositionFactory.Grid>
```

### **CSS Custom Properties**

```css
/* Customize composition components with CSS variables */
:root {
  --composition-gap-sm: 0.5rem;
  --composition-gap-md: 1rem;
  --composition-gap-lg: 1.5rem;
  --composition-gap-xl: 2rem;
  
  --composition-radius-sm: 0.25rem;
  --composition-radius-md: 0.5rem;
  --composition-radius-lg: 0.75rem;
  
  --composition-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --composition-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --composition-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}
```

---

## **🔧 Migration Guide**

### **Migrating Existing Components**

1. **Install the composition system** (already done)
2. **Import composition components**
3. **Replace existing components** with composition equivalents
4. **Update styling** to use composition classes
5. **Test responsive behavior**

### **Migration Script**

```bash
# Migrate all files
tsx scripts/composition-migration.ts all

# Migrate specific file
tsx scripts/composition-migration.ts file src/pages/HomePage.tsx

# Migrate specific directory
tsx scripts/composition-migration.ts directory src/pages
```

### **Before and After Examples**

#### **Before (Old Pattern)**
```typescript
// ❌ Old way - inconsistent patterns
<div className="min-h-screen bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700">
  <Header />
  <main className="max-w-6xl mx-auto px-4 py-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map(item => (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <p className="text-gray-600">{item.description}</p>
        </div>
      ))}
    </div>
  </main>
</div>
```

#### **After (Composition Pattern)**
```typescript
// ✅ New way - unified composition
<PageCompositionFactory.Marketing
  layout="top-nav"
  sections={['header', 'content']}
  responsive={true}
  accessibility={true}
  className="min-h-screen bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700"
>
  <Header />
  
  <LayoutCompositionFactory.Stack
    direction="column"
    gap="lg"
    responsive={true}
    className="max-w-6xl mx-auto px-4 py-8"
  >
    <LayoutCompositionFactory.Grid
      columns={{ mobile: 1, tablet: 2, desktop: 3 }}
      gap="md"
      responsive={true}
    >
      {items.map(item => (
        <CardCompositionFactory.Custom
          key={item.id}
          layout="vertical"
          size="md"
          features={{}}
          responsive={true}
          interactive={true}
        >
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <p className="text-gray-600">{item.description}</p>
        </CardCompositionFactory.Custom>
      ))}
    </LayoutCompositionFactory.Grid>
  </LayoutCompositionFactory.Stack>
</PageCompositionFactory.Marketing>
```

---

## **📚 Best Practices**

### **1. Use Composition Factories**
```typescript
// ✅ Good - Use composition factories
<PageCompositionFactory.App>
  <AppContent />
</PageCompositionFactory.App>

// ❌ Bad - Don't use raw components
<PageComposition template="app">
  <AppContent />
</PageComposition>
```

### **2. Configure Responsive Behavior**
```typescript
// ✅ Good - Configure responsive behavior
<LayoutCompositionFactory.Grid
  columns={{ mobile: 1, tablet: 2, desktop: 3 }}
  gap="md"
  responsive={true}
>
  {items.map(item => <ItemCard key={item.id} item={item} />)}
</LayoutCompositionFactory.Grid>

// ❌ Bad - Don't hardcode responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => <ItemCard key={item.id} item={item} />)}
</div>
```

### **3. Use Appropriate Card Variants**
```typescript
// ✅ Good - Use specific card variants
<CardCompositionFactory.Product features={productFeatures}>
  <ProductContent />
</CardCompositionFactory.Product>

<CardCompositionFactory.Store features={storeFeatures}>
  <StoreContent />
</CardCompositionFactory.Store>

// ❌ Bad - Don't use generic cards for specific content
<CardCompositionFactory.Custom features={productFeatures}>
  <ProductContent />
</CardCompositionFactory.Custom>
```

### **4. Enable Accessibility**
```typescript
// ✅ Good - Enable accessibility features
<PageCompositionFactory.App
  accessibility={true}
  responsive={true}
>
  <AppContent />
</PageCompositionFactory.App>

// ❌ Bad - Don't disable accessibility
<PageCompositionFactory.App
  accessibility={false}
  responsive={true}
>
  <AppContent />
</PageCompositionFactory.App>
```

### **5. Use Composition Hooks**
```typescript
// ✅ Good - Use composition hooks for responsive behavior
const { isMobile, isTablet, isDesktop } = useCompositionBreakpoint()
const layout = useResponsiveComposition(responsiveConfig)

// ❌ Bad - Don't manually handle responsive behavior
const [isMobile, setIsMobile] = useState(false)
useEffect(() => {
  const checkScreenSize = () => {
    setIsMobile(window.innerWidth < 768)
  }
  // ... manual responsive logic
}, [])
```

---

## **🐛 Troubleshooting**

### **Common Issues**

1. **Import Errors**
   ```typescript
   // ✅ Correct import
   import { PageCompositionFactory } from '@components/composition'
   
   // ❌ Incorrect import
   import { PageCompositionFactory } from './components/composition'
   ```

2. **Missing CompositionProvider**
   ```typescript
   // ✅ Wrap app with CompositionProvider
   <CompositionProvider>
     <YourApp />
   </CompositionProvider>
   
   // ❌ Don't use composition components without provider
   <PageCompositionFactory.App>
     <YourApp />
   </PageCompositionFactory.App>
   ```

3. **Responsive Not Working**
   ```typescript
   // ✅ Enable responsive behavior
   <LayoutCompositionFactory.Grid responsive={true}>
     <GridContent />
   </LayoutCompositionFactory.Grid>
   
   // ❌ Don't disable responsive behavior
   <LayoutCompositionFactory.Grid responsive={false}>
     <GridContent />
   </LayoutCompositionFactory.Grid>
   ```

### **Debug Mode**

```typescript
// Enable debug mode in CompositionProvider
<CompositionProvider
  config={{
    responsive: { enabled: true },
    accessibility: { enabled: true },
    performance: { memoization: true }
  }}
  debug={true} // Enable debug mode
>
  <YourApp />
</CompositionProvider>
```

---

## **📖 API Reference**

### **PageCompositionFactory**

```typescript
interface PageCompositionProps {
  template: 'app' | 'marketing' | 'auth' | 'admin' | 'mobile'
  layout: 'sidebar' | 'top-nav' | 'bottom-nav' | 'minimal' | 'full'
  sections: ('header' | 'content' | 'sidebar' | 'footer' | 'navigation')[]
  responsive: boolean
  accessibility: boolean
  children: React.ReactNode
  className?: string
}
```

### **CardCompositionFactory**

```typescript
interface CardCompositionProps {
  variant: 'product' | 'store' | 'order' | 'custom' | 'base'
  layout: 'horizontal' | 'vertical' | 'grid' | 'list'
  size: 'sm' | 'md' | 'lg' | 'xl'
  features: CardFeatures
  responsive: boolean
  interactive: boolean
  loading: boolean
  error: boolean
  children?: React.ReactNode
  className?: string
}
```

### **LayoutCompositionFactory**

```typescript
interface LayoutCompositionProps {
  type: 'grid' | 'flex' | 'stack' | 'sidebar' | 'header-content-footer'
  direction: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  alignment: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  gap: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  wrap: boolean
  responsive: boolean
  children: React.ReactNode
  className?: string
}
```

---

## **🎉 Conclusion**

The Composition System provides a powerful, flexible way to build consistent, responsive, and accessible React components. By following the patterns and best practices outlined in this guide, you can create maintainable, scalable applications with excellent developer experience.

For more information, see:
- [Composition Analysis](./COMPONENT_PAGE_COMPOSITION_ANALYSIS.md)
- [Composition Optimization Summary](./COMPOSITION_OPTIMIZATION_SUMMARY.md)
- [API Documentation](./COMPOSITION_API_REFERENCE.md)

Happy composing! 🏗️✨
