const fs = require('fs');
const path = require('path');

// Complete StoreWithDistance mock data
const completeStoreMock = {
  ownerUserId: 'user1',
  slug: 'test-store',
  description: 'Test store description',
  companyName: 'Test Company',
  taxId: '123456789',
  addressStreet: '123 Test St',
  addressCity: 'Test City',
  addressState: 'TS',
  addressZip: '12345',
  phone: '555-1234',
  email: 'test@store.com',
  website: 'https://teststore.com',
  hours: '9AM-5PM',
  rating: 4.5,
  reviewCount: 100,
  prepTimeMin: 30,
  deliveryFee: 2.99,
  minOrder: 15.00,
  serviceFeePercent: 10,
  deliveryRadius: 5,
  isOpen: true,
  isDeliveryAvailable: true,
  isPickupAvailable: true,
  categories: ['restaurant'],
  tags: ['fast-food'],
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z'
};

// Files to fix
const filesToFix = [
  'src/features/stores/components/StoreMap/hooks/__tests__/useOptimizedMapData.test.ts',
  'src/features/stores/components/StoreMap/hooks/__tests__/useMapCenter.test.ts',
  'src/features/stores/components/StoreMap/hooks/__tests__/useMapZoom.test.ts'
];

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace incomplete store objects with complete ones
    content = content.replace(
      /{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"],\s*latitude:\s*['"]([^'"]+)['"],\s*longitude:\s*['"]([^'"]+)['"],\s*distance:\s*([^}]+)\s*}/g,
      (match, id, name, lat, lng, distance) => {
        return `{
      id: '${id}',
      name: '${name}',
      latitude: '${lat}',
      longitude: '${lng}',
      distance: ${distance},
      ...${JSON.stringify(completeStoreMock).replace(/"/g, "'")}
    } as unknown as StoreWithDistance`;
      }
    );
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed ${filePath}`);
  }
});

console.log('Batch fix complete!');
