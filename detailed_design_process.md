# BagLunch Detailed Design Process: Intent-Driven Page Design

## Design Philosophy
Every element must serve a specific purpose in the food discovery and ordering journey. No generic solutions.

---

## HOMEPAGE DESIGN SPECIFICATIONS

### Section 1: Navigation Bar (64px height)
**Intent**: Establish brand presence while prioritizing location and cart access

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ [BagLunch Logo]        [📍 Austin, TX]    [🔍 Search] [🛒 $0] [👤] │
└─────────────────────────────────────────────────────────────┘
```

**Specific Decisions**:
- Logo: 32px height, green-600 color
- Location: 16px font, clickable, shows current delivery area
- Search: 200px width, placeholder "Search dishes or kitchens"
- Cart: Shows item count and total, green-600 when items > 0
- Profile: Simple avatar icon, dropdown on click

### Section 2: Full-Screen Hero (100vh minimum)
**Intent**: Create immediate emotional connection with local food discovery

**Layout Structure**:
```
┌─────────────────────────────────────────────────────────────┐
│ Background: Artistic food photography with warm overlay      │
│                                                             │
│              What's for lunch today?                        │
│              Fresh from kitchens around Austin              │
│                                                             │
│    [📍 Use my location]    [🔍 Search for dishes...]         │
│                                                             │
│  [Featured Kitchen 1] [Featured Kitchen 2] [Featured Kitchen 3] │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Design Decisions**:
- Background: Full-bleed image of diverse local dishes, 40% opacity cream overlay
- Headline: 64px, font-bold, green-600, centered
- Subheadline: 24px, font-medium, gray-600, centered
- Location button: 180px width, 48px height, green-600 background, white text
- Search bar: 400px width, 48px height, white background, gray-400 border
- Featured kitchens: 3 cards, 320px width each, floating with shadow-lg

### Section 3: Popular Near You (120px section header + content)
**Intent**: Show social proof and immediate ordering options

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ Popular Near You                                           │
│ What Austin is ordering right now                          │
│                                                             │
│ [Large Featured Item] [Item] [Item] [Item]                 │
│   400px width          280px each                           │
└─────────────────────────────────────────────────────────────┘
```

**Specifics**:
- Section title: 30px, font-bold, green-600
- Subtitle: 16px, font-medium, gray-600
- Featured item: Large card with hero image, store name, 3 popular items
- Standard items: Smaller cards with single item focus
- Grid: 4-column on desktop, 2-column tablet, 1-column mobile

### Section 4: Browse by Craving (80px header + category grid)
**Intent**: Help users discover by food type, not just store

**Category Grid (6 items, 180px height each)**:
```
┌─────────────────────────────────────────────────────────────┐
│ Browse by Craving                                           │
│                                                             │
│ [🥪 Sandwiches] [🍔 Burgers] [🍕 Pizza] [🥗 Salads] [🍰 Desserts] [☕ Coffee] │
│   200px width      200px width     200px width              │
└─────────────────────────────────────────────────────────────┘
```

**Design Details**:
- Category cards: 200px × 120px, cream-100 background, rounded-lg
- Icons: 32px, category-specific, green-600
- Labels: 16px, font-medium, centered
- Hover state: green-600 background, white text, shadow-md

### Section 5: New Kitchens (100px header + horizontal scroll)
**Intent**: Showcase new sellers and encourage exploration

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ New Kitchens This Week                                      │
│ Discover the latest additions to your neighborhood          │
│                                                             │
│ ← [Store Card] [Store Card] [Store Card] [Store Card] →    │
│    280px width each, horizontal scroll                     │
└─────────────────────────────────────────────────────────────┘
```

**Card Specifications**:
- Width: 280px, Height: 320px
- Image: 280px × 180px, rounded-t-lg
- Content padding: 20px
- Store name: 18px, font-bold, green-600
- Cuisine: 14px, gray-600
- Rating: 14px, orange-500
- CTA: "View Menu" button, 120px width, 36px height

### Section 6: Fresh on Menus (Same structure as New Kitchens)
**Intent**: Show new menu items from existing stores

**Item Card Specifications**:
- Width: 240px, Height: 280px
- Image: 240px × 160px, rounded-t-lg
- Item name: 16px, font-bold
- Store name: 14px, gray-600
- Price: 18px, font-bold, green-600
- Add button: 80px width, 32px height, tomato-500

### Section 7: Start Selling CTA (400px height)
**Intent**: Convert potential sellers to platform users

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│              Join the BagLunch Community                    │
│              Share your food with your neighborhood        │
│                                                             │
│     [Create Owner Account]    [Learn More]                │
└─────────────────────────────────────────────────────────────┘
```

**Design Elements**:
- Background: green-600 with subtle pattern
- Text: white, centered
- Buttons: white background, green-600 text, 180px width, 48px height

---

## STORE PAGE DESIGN SPECIFICATIONS

### Section 1: Store Hero (400px height)
**Intent**: Establish store identity and build trust immediately

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ [Full-width store image with gradient overlay]               │
│                                                             │
│ Burger Shack West Campus                     [Open Now] [25-35 min] │
│ American • Burgers • Fast Food                           │
│ 📍 2400 Guadalupe St, Austin, TX  📞 (512) 555-0123      │
│                                                             │
│ [View Menu] [📍 Directions] [⭐ Save Store]                │
└─────────────────────────────────────────────────────────────┘
```

**Specific Decisions**:
- Hero image: 100vw width, 400px height, dark overlay for text readability
- Store name: 36px, font-bold, white
- Status badges: 80px width, 32px height, green-500 background
- Meta info: 16px, white, 80% opacity
- Action buttons: 120px width, 40px height, white background, green-600 text

### Section 2: Sticky Navigation (60px height)
**Intent**: Enable quick menu navigation without scrolling

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ [Popular] [Sandwiches] [Sides] [Drinks] [Info] [Reviews]   │
│     Active: green-600 underline, 2px thickness            │
└─────────────────────────────────────────────────────────────┘
```

**Navigation Details**:
- Height: 60px, white background, shadow-md
- Items: 16px, font-medium, gray-600 (green-600 when active)
- Active state: green-600 text with underline
- Sticky: top-0, z-50

### Section 3: Popular Items (Variable height)
**Intent**: Drive quick decisions with best-sellers

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ Popular Items                                               │
│                                                             │
│ [Large Featured Item Card] [Standard Item] [Standard Item] │
│      400px width              300px each                   │
│                                                             │
│ [Standard Item] [Standard Item] [Standard Item]            │
│      300px each                                            │
└─────────────────────────────────────────────────────────────┘
```

**Featured Item Card**:
- Width: 400px, Height: 480px
- Image: 400px × 240px, rounded-t-xl
- Item name: 20px, font-bold
- Description: 14px, gray-600, 2 lines max
- Price: 24px, font-bold, green-600
- Add button: 140px width, 44px height, tomato-500

**Standard Item Card**:
- Width: 300px, Height: 360px
- Image: 300px × 180px, rounded-t-lg
- Item name: 18px, font-bold
- Price: 20px, font-bold, green-600
- Add button: 100px width, 36px height, tomato-500

### Section 4: Menu Categories (Each category 80px header + grid)
**Intent**: Organized browsing with clear category separation

**Category Header**:
```
┌─────────────────────────────────────────────────────────────┐
│ Sandwiches                                                  │
│ 12 items                                                    │
└─────────────────────────────────────────────────────────────┘
```

**Grid Layout**:
- Desktop: 3 columns, 300px cards
- Tablet: 2 columns, 280px cards
- Mobile: 1 column, 100% width cards

### Section 5: Store Info Panel (300px height)
**Intent**: Provide essential store information without cluttering menu

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ Store Information                                           │
│                                                             │
│ 📍 Address: 2400 Guadalupe St, Austin, TX 78705            │
│ 🕐 Hours: Mon-Sun 11:00 AM - 10:00 PM                     │
│ 📞 Phone: (512) 555-0123                                   │
│ 🚗 Delivery: $2.99, 25-35 min                              │
│ 🏪 Pickup: Ready in 20-25 min                              │
│                                                             │
│ [📍 Get Directions] [📞 Call Store]                        │
└─────────────────────────────────────────────────────────────┘
```

---

## SEARCH PAGE DESIGN SPECIFICATIONS

### Section 1: Search Header (200px height)
**Intent**: Powerful search interface with immediate context

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Search dishes, kitchens, or neighborhoods...              │
│ [📍 Austin, TX] [Change]                                     │
│                                                             │
│ [All] [Open Now] [Free Delivery] [Under 30min] [4★+]        │
│                                                             │
│ Found 24 results near Austin, TX                            │
└─────────────────────────────────────────────────────────────┘
```

**Search Bar Specifications**:
- Width: 600px, Height: 56px
- Font size: 18px, padding: 16px 24px
- Border: 2px solid gray-200, focus: green-600
- Location: 16px, green-600, clickable

**Filter Chips**:
- Width: auto, Height: 36px
- Padding: 8px 16px
- Active: green-600 background, white text
- Inactive: gray-100 background, gray-700 text

### Section 2: Results Grid (Variable height)
**Intent**: Mixed-size grid for visual interest and prioritization

**Grid Pattern**:
```
Row 1: [Large Featured] [Standard] [Standard] [Standard]
Row 2: [Standard] [Standard] [Standard] [Standard]
Row 3: [Large Featured] [Standard] [Standard] [Standard]
```

**Featured Result Card**:
- Width: 400px, Height: 440px
- Image: 400px × 240px
- Store name: 18px, font-bold
- Item name: 16px, font-medium
- Description: 14px, gray-600
- Price: 20px, font-bold, green-600
- Distance: 14px, gray-600
- Add button: 100px width, 36px height

**Standard Result Card**:
- Width: 280px, Height: 340px
- Image: 280px × 160px
- Item name: 16px, font-bold
- Store name: 14px, gray-600
- Price: 18px, font-bold, green-600
- Add button: 80px width, 32px height

---

## COMPONENT DESIGN SPECIFICATIONS

### AddToBagButton Component
**Intent**: Clear, accessible purchasing action

**Variants**:
1. **Primary**: 140px × 44px, tomato-500 background, white text
2. **Secondary**: 100px × 36px, white background, green-600 text
3. **Icon Only**: 44px × 44px, circular, green-600 background

**States**:
- Default: Solid color, shadow-sm
- Hover: Darker background, shadow-md
- Active: Scale 0.98, shadow-sm
- Loading: Spinner, disabled state
- Added: Green background, "✓ Added" text

### StoreCard Component
**Intent**: Quick store discovery and decision making

**Structure**:
```
┌─────────────────┐
│ Image (280×180) │
├─────────────────┤
│ Store Name      │
│ Cuisine Type    │
│ ⭐ 4.5 (120)    │
│ 📍 0.8 mi       │
│ ⏱️ 25-35 min    │
│                 │
│ [View Menu]     │
└─────────────────┘
```

**Measurements**:
- Total width: 280px
- Total height: 360px
- Border radius: 12px
- Shadow: shadow-md
- Padding: 20px

### MenuItemCard Component
**Intent**: Clear item information with immediate action

**Structure**:
```
┌─────────────────┐
│ Image (300×180) │
├─────────────────┤
│ Category        │
│ Item Name       │
│ Description     │
│                 │
│ $12.99  [Add]  │
└─────────────────┘
```

**Measurements**:
- Total width: 300px
- Total height: 360px
- Image height: 180px
- Content padding: 20px

---

## IMPLEMENTATION SPECIFICATIONS

### CSS Variables
```css
:root {
  /* Colors */
  --cream-50: #FFF8ED;
  --cream-100: #FAF7F0;
  --green-600: #14532D;
  --green-500: #166534;
  --tomato-500: #F97316;
  --gray-900: #111827;
  --gray-600: #6B7280;
  --gray-400: #9CA3AF;
  --white: #FFFFFF;
  
  /* Typography */
  --text-5xl: 48px;
  --text-4xl: 36px;
  --text-3xl: 30px;
  --text-2xl: 24px;
  --text-xl: 20px;
  --text-lg: 18px;
  --text-base: 16px;
  --text-sm: 14px;
  --text-xs: 12px;
  
  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
  --space-24: 96px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
  --shadow-xl: 0 20px 25px rgba(0,0,0,0.1);
}
```

### Responsive Breakpoints
```css
/* Mobile */
@media (max-width: 640px) {
  .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

/* Desktop */
@media (min-width: 1025px) {
  .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
```

### Animation Specifications
```css
/* Hover Effects */
.card-hover {
  transition: all 0.2s ease;
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Button Press */
.button-press {
  transition: all 0.1s ease;
}

.button-press:active {
  transform: scale(0.98);
}

/* Fade In */
.fade-in {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## DESIGN INTENT SUMMARY

### Homepage Intent Flow
1. **Emotional Connection** → Full-screen hero with local food photography
2. **Social Proof** → Popular items showing what others are ordering
3. **Discovery** → Category-based browsing by craving
4. **Exploration** → New kitchens and fresh menu items
5. **Conversion** → Strong seller CTA

### Store Page Intent Flow
1. **Trust Building** → Professional store hero with complete information
2. **Quick Decisions** → Popular items prominently featured
3. **Organized Browsing** → Clear category navigation
4. **Easy Ordering** → Prominent add buttons and clear pricing
5. **Information Access** → Store info panel without menu clutter

### Search Page Intent Flow
1. **Powerful Search** → Large, prominent search bar with filters
2. **Context Awareness** → Location-based results
3. **Visual Hierarchy** → Mixed grid sizes for prioritization
4. **Quick Actions** → Add buttons on every result
5. **Refinement** → Easy filter adjustment

This detailed design process ensures every element serves a specific purpose in the user journey, eliminating generic solutions in favor of intentional, food-first design decisions.
