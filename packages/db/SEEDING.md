# Database Seeding Guide

## Overview

This project includes several seeding scripts to populate the database with test data.

## Available Scripts

### 1. Basic Seed (Default Test Data)

```bash
pnpm --filter @packages/db seed
```

Creates:
- 4 users (1 customer, 3 vendors)
- 3 stores (Pizza, Burger, Sushi) in various US cities
- 20 menu items

### 2. Austin Area Stores (Enhanced)

```bash
cd packages/db
pnpm tsx src/scripts/seed-austin-stores.ts
```

Creates comprehensive stores in Austin, TX near ZIP code 78758 with:
- Multiple vendors (auto-generated)
- 10-30+ stores across 8 Austin neighborhoods
- Full menu items for each store type with dietary information
- Store cover images (from picsum.photos)
- Item images (from picsum.photos)
- 2-5 river posts per store with images
- **Bundle combinations** for each store type
- **Delivery zones** with realistic polygon areas
- **Sample favorites** for user engagement

**Enhanced Features:**
- 🌱 **Dietary flags**: vegan, vegetarian, gluten-free, dairy-free
- ⚠️ **Allergen information**: common allergens tagged on items
- 🌶️ **Spice levels**: 1-5 scale for appropriate items
- 📦 **Bundle deals**: 2 bundles per store type with pricing strategies
- 🗺️ **Delivery zones**: 3-tier polygon-based delivery areas
- ❤️ **Favorites**: Sample user favorites for testing

**Store Types Included:**
- ☕ Coffee shops
- 🍕 Pizza restaurants
- 🍔 Burger joints
- 🍣 Sushi bars
- 🌮 Taco places
- 🍜 Thai restaurants
- 🍖 BBQ joints
- 🥐 Bakeries

**Locations Covered:**
- 78758 (North Central)
- 78757 (North Loop)
- 78759 (Allandale)
- 78752 (Windsor Park)
- 78753 (Georgian Acres)
- 78751 (Hyde Park)
- 78756 (Hancock)
- 78705 (West Campus)

**Features:**
- Realistic coordinates (latitude/longitude)
- Complete address information
- Business hours
- Delivery settings
- Commission rates
- Phone numbers and emails

**Delivery Zones**
Each store gets 3 concentric delivery zones:

1. **Nearby Delivery** (1-mile radius)
   - Base fee: $2.99
   - Minimum order: $15.00
   - Priority: 3 (highest)

2. **Extended Delivery** (3-mile radius)
   - Base fee: $4.99
   - Minimum order: $20.00
   - Priority: 2

3. **Far Delivery** (5-mile radius)
   - Base fee: $7.99
   - Minimum order: $25.00
   - Priority: 1 (lowest)

All zones use GeoJSON polygon coordinates for accurate geographic boundaries.

**Bundle System**
Each store type gets 2 pre-configured bundles:

- **Coffee Shops**: Morning Starter Pack, Coffee Lover's Combo
- **Pizza**: Classic Pizza Night, Family Feast
- **Burgers**: Burger & Fries Combo, Double Burger Deluxe
- **Sushi**: Sushi Sampler, Sushi Master Platter
- **Tacos**: Taco Trio, Taco Feast
- **Thai**: Thai Favorites, Spicy Thai Experience
- **BBQ**: BBQ Sampler, BBQ Feast
- **Bakery**: Morning Pastries, Sweet Tooth Special

**Pricing Strategies**:
- Fixed price bundles
- Percentage discount bundles
- Amount discount bundles
- Savings labels for marketing

### 3. Store Locations Seed

```bash
cd packages/db
pnpm tsx src/scripts/seed-store-locations.ts
```

Adds coordinates to existing stores without location data. Uses 20 major US cities.

## Test Credentials

### Default Seed
- **Customer**: `customer@test.com` / `Test123456!`
- **Vendor 1**: `vendor1@test.com` / `Test123456!`
- **Vendor 2**: `vendor2@test.com` / `Test123456!`
- **Vendor 3**: `vendor3@test.com` / `Test123456!`

### Austin Seed
- **Password**: `Test123456!` (for all vendors)
- **Email Format**: `vendor-{store-slug}@test.com`
- **Example**: `vendor-roast-house-north-central@test.com`

## Image Placeholders

All seeded data uses realistic images from **picsum.photos**:

- **Store covers**: `https://picsum.photos/seed/{store-name}/1200x400.jpg`
- **Menu items**: `https://picsum.photos/seed/{item-name}/{size}x{size}.jpg`
- **River posts**: `https://picsum.photos/seed/{store-name}-post-{id}/{width}x{height}.jpg`
- **Bundle images**: `https://picsum.photos/seed/{bundle-name}/600x400.jpg`

Images use consistent seeds for reproducibility.

**Dietary Information**
All menu items include:
- **Vegan/Vegetarian flags** for plant-based options
- **Gluten-free indicators** for celiac-friendly items
- **Dairy-free flags** for lactose-intolerant customers
- **Allergen arrays** containing: wheat, dairy, eggs, nuts, fish, shellfish, peanuts
- **Spice levels** (1-5) for appropriate cuisines

**Sample Favorites**
Creates realistic user engagement:
- 3-5 favorite stores per customer
- 5-10 favorite items per customer
- Uses customer@seed.local account

## Full Reset & Reseed

If you want to completely reset and reseed:

```bash
# Reset database (WARNING: Deletes all data!)
pnpm --filter @packages/db reset

# Run migrations
pnpm --filter @packages/db migrate

# Seed with Austin data
cd packages/db
pnpm tsx src/scripts/seed-austin-stores.ts
```

## Custom Seeding

To create your own seeding script:

1. Create a new file in `packages/db/src/scripts/`
2. Import PrismaClient: `import { PrismaClient } from '../generated/client/index.js'`
3. Add your seeding logic
4. Add a script to `package.json`
5. Run with `pnpm --filter @packages/db {your-script-name}`

## Modifying Austin Seed

The Austin seeding script is located at:
```
packages/db/src/scripts/seed-austin-stores.ts
```

You can customize:
- Store types (STORE_TYPES constant)
- Menu items (MENU_ITEMS constant)
- River post templates (POST_TEMPLATES constant)
- Locations (AUSTIN_LOCATIONS constant)
- Image sizes and colors
- Number of stores per location
- Number of items per store
- Number of posts per store

## Tips

1. **Run from project root**: Use `pnpm --filter @packages/db seed:austin`
2. **Check data**: Use `pnpm --filter @packages/db studio` to view Prisma Studio
3. **Idempotent**: Austin seed checks for existing stores by slug (won't duplicate)
4. **Performance**: Seeding 20-30 stores takes ~30-60 seconds
5. **Development only**: Seeding scripts are for development/testing, not production

## Troubleshooting

### Database connection error
```bash
# Check your .env file in packages/db/
DATABASE_URL="mysql://user:password@localhost:3306/shop_shop"
```

### Prisma client not generated
```bash
pnpm --filter @packages/db generate
```

### Migration issues
```bash
pnpm --filter @packages/db migrate
```

### Permission errors
Make sure your database user has CREATE, INSERT, UPDATE, DELETE permissions.

## Next Steps

After seeding:
1. Start the backend server: `pnpm --filter @apps/server dev`
2. Start the frontend: `pnpm --filter @apps/web dev`
3. Navigate to the homepage to see stores
4. Login with test credentials
5. Browse stores, add items to cart, view river posts

---

**Last Updated**: October 23, 2025

