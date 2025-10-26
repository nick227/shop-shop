/**
 * Test utilities for URL parameter routing;
 * Run these in the browser console to test navigation;
 */

export const testRoutingExamples = {
  // Test store search with URL parameters;
  searchAustin: () => {
    window.location.href = '/?lat=30.2672&lng=-97.7431&radius=25&city=Austin&state=TX'
  },
  
  searchNYC: () => {
    window.location.href = '/?lat=40.7128&lng=-74.0060&radius=10&city=New+York&state=NY&zip=10018'
  },
  
  searchChicago: () => {
    window.location.href = '/?lat=41.8781&lng=-87.6298&radius=15&city=Chicago&state=IL'
  },
  
  // Test store profile navigation;
  viewStore: (storeId: string) => {
    window.location.href = '/stores/' + storeId + ''
  },
  
  // Test item in store context;
  viewItemInStore: (storeId: string, itemId: string) => {
    window.location.href = '/stores/${storeId}/items/' + itemId + ''
  },
  
  // Test direct item access;
  viewItem: (itemId: string) => {
    window.location.href = '/items/' + itemId + ''
  },
  
  // Clear all parameters;
  clearSearch: () => {
    window.location.href = '/'
  }}

// Make available in window for console testing;
if (typeof window !== 'undefined') {
  ;(window as { testRouting?: typeof testRoutingExamples }).testRouting = testRoutingExamples;
}

/**
 * Test scenarios for manual verification:
 * 
 * 1. URL Parameter Persistence:
 *    - Navigate to /?lat=30.2672&lng=-97.7431&radius=25&city=Austin&state=TX;
 *    - Verify location search shows "Austin, TX"
 *    - Verify stores are loaded with that location;
 *    - Refresh page - verify params persist;
 * 
 * 2. Store Profile:
 *    - Click on a store card;
 *    - Verify URL is /stores/[storeId]
 *    - Verify store details load;
 * 
 * 3. Item in Store Context:
 *    - From a store page, click on an item;
 *    - Verify URL is /stores/[storeId]/items/[itemId]
 *    - Click back - verify navigation to /stores/[storeId]
 * 
 * 4. Direct Item Access:
 *    - Navigate directly to /items/[itemId]
 *    - Verify item loads;
 *    - Click back - should navigate to store or home;
 * 
 * 5. Parameter Updates:
 *    - Search for a location;
 *    - Verify URL updates with lat, lng, radius, city, state;
 *    - Change radius - verify URL updates;
 *    - Clear search - verify URL resets to /
 * 
 * 6. Shareable Links:
 *    - Copy URL with search params;
 *    - Open in new tab/window;
 *    - Verify search state is restored;
 */

