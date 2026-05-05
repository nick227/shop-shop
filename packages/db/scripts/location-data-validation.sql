-- Location Data Validation Script
-- Purpose: Validate consistency and completeness of location data across the system

-- Step 1: Check Store location data completeness
SELECT 
  COUNT(*) as total_stores,
  COUNT(latitude) as stores_with_lat,
  COUNT(longitude) as stores_with_lng,
  COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as stores_with_both_coords,
  COUNT(CASE WHEN latitude IS NULL OR longitude IS NULL THEN 1 END) as stores_missing_coords,
  COUNT(addressCity) as stores_with_city,
  COUNT(addressState) as stores_with_state,
  COUNT(addressZip) as stores_with_zip
FROM Store;

-- Step 2: Check for invalid coordinates (out of range)
SELECT 
  COUNT(*) as invalid_latitude,
  'Invalid latitude (must be -90 to 90)' as issue
FROM Store 
WHERE latitude IS NOT NULL AND (latitude < -90 OR latitude > 90)

UNION ALL

SELECT 
  COUNT(*) as invalid_longitude,
  'Invalid longitude (must be -180 to 180)' as issue  
FROM Store 
WHERE longitude IS NOT NULL AND (longitude < -180 OR longitude > 180);

-- Step 3: Check Address model location data
SELECT 
  COUNT(*) as total_addresses,
  COUNT(geo) as addresses_with_geo_data,
  COUNT(CASE WHEN geo IS NOT NULL THEN 1 END) as addresses_with_coordinates,
  COUNT(CASE WHEN geo IS NULL THEN 1 END) as addresses_missing_geo,
  COUNT(city) as addresses_with_city,
  COUNT(state) as addresses_with_state,
  COUNT(postalCode) as addresses_with_zip
FROM Address;

-- Step 4: Check Order location data (delivery addresses)
SELECT 
  COUNT(*) as total_orders,
  COUNT(addressId) as orders_with_address,
  COUNT(addressSnapshot) as orders_with_snapshot,
  COUNT(CASE WHEN addressId IS NOT NULL OR addressSnapshot IS NOT NULL THEN 1 END) as orders_with_location,
  COUNT(CASE WHEN addressId IS NULL AND addressSnapshot IS NULL THEN 1 END) as orders_missing_location
FROM Order;

-- Step 5: Validate geocoding cache consistency
SELECT 
  COUNT(*) as total_cache_entries,
  COUNT(latitude) as entries_with_lat,
  COUNT(longitude) as entries_with_lng,
  COUNT(city) as entries_with_city,
  COUNT(state) as entries_with_state,
  COUNT(zip) as entries_with_zip,
  COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as complete_entries
FROM GeocodingCache;

-- Step 6: Find stores with coordinates but no address info
SELECT 
  id,
  name,
  latitude,
  longitude,
  addressCity,
  addressState,
  addressZip,
  CASE 
    WHEN latitude IS NOT NULL AND longitude IS NOT NULL AND 
         (addressCity IS NULL OR addressState IS NULL OR addressZip IS NULL) 
    THEN 'Has coordinates but missing address info'
    WHEN latitude IS NULL OR longitude IS NULL THEN 'Missing coordinates'
    ELSE 'Complete location data'
  END as location_status
FROM Store
ORDER BY location_status, name;

-- Step 7: Check for stores with address info but no coordinates (geocoding candidates)
SELECT 
  COUNT(*) as stores_needing_geocoding,
  'Stores with address but missing coordinates' as description
FROM Store 
WHERE 
  (addressCity IS NOT NULL OR addressState IS NOT NULL OR addressZip IS NOT NULL)
  AND (latitude IS NULL OR longitude IS NULL);

-- Step 8: Validate coordinate precision (should have proper decimal places)
SELECT 
  COUNT(*) as low_precision_lat,
  'Low precision latitude (< 4 decimal places)' as issue
FROM Store 
WHERE latitude IS NOT NULL 
  AND LENGTH(SUBSTRING_INDEX(latitude, '.', -1)) < 4

UNION ALL

SELECT 
  COUNT(*) as low_precision_lng,
  'Low precision longitude (< 4 decimal places)' as issue
FROM Store 
WHERE longitude IS NOT NULL 
  AND LENGTH(SUBSTRING_INDEX(longitude, '.', -1)) < 4;

-- Step 9: Check for duplicate coordinates (possible data entry errors)
SELECT 
  latitude,
  longitude,
  COUNT(*) as duplicate_count,
  GROUP_CONCAT(name ORDER BY name) as store_names
FROM Store 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
GROUP BY latitude, longitude
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 10: Location data quality summary
SELECT 
  'Location Data Quality Summary' as metric,
  value as count
FROM (
  SELECT 'Total Stores' as metric, COUNT(*) as value FROM Store
  UNION ALL
  SELECT 'Stores with Complete Location Data', COUNT(*) FROM Store 
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL 
    AND addressCity IS NOT NULL AND addressState IS NOT NULL
  UNION ALL
  SELECT 'Stores Requiring Geocoding', COUNT(*) FROM Store 
    WHERE (latitude IS NULL OR longitude IS NULL) 
    AND (addressCity IS NOT NULL OR addressState IS NOT NULL)
  UNION ALL
  SELECT 'Orders with Location Data', COUNT(*) FROM Order 
    WHERE addressId IS NOT NULL OR addressSnapshot IS NOT NULL
  UNION ALL
  SELECT 'Cache Hit Rate', COUNT(*) FROM GeocodingCache 
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
) as summary;
