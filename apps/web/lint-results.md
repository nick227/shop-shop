(base) PS C:\wamp64\www\shop-shop\apps\web> pnpm typecheck

> @apps/web@0.1.0 typecheck C:\wamp64\www\shop-shop\apps\web
> tsc -p tsconfig.json --noEmit

src/features/checkout/components/AddressCard/AddressCard.tsx:5:15 - error TS2305: Module '"../../../../api/backend-types"' has no exported member 'Address'.

5 import type { Address } from '../../../../api/backend-types'
                ~~~~~~~

src/features/search/utils/searchTransformers.ts:6:40 - error TS2307: Cannot find module '../../../../api/backend-types' or its corresponding type declarations.

6 import type { StoreWithDistance } from '../../../../api/backend-types'
                                         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/features/search/utils/searchTransformers.ts:7:35 - error TS2307: Cannot find module '../../../../api/backend-types' or its corresponding type declarations.

7 import type { ItemResponse } from '../../../../api/backend-types'
                                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/features/stores/components/examples/CarouselExamples.tsx:31:13 - error TS2322: Type 'Omit<ListStores200ResponseDataInner, "media"> & { id: string; createdAt: string; updatedAt: string; deliveryFee: number; minOrder: number; ... 4 more ...; media: MediaItem[]; } & { ...; }' is not assignable to type 'StoreWithDistance'.
  Types of property 'media' are incompatible.
    Type 'MediaItem[]' is not assignable to type 'string & MediaItem[]'.
      Type 'MediaItem[]' is not assignable to type 'string'.

31             store={store}
               ~~~~~

  src/features/stores/components/StoreCard/StoreCardCompact.tsx:15:12
    15   readonly store: StoreWithDistance
                  ~~~~~
    The expected type comes from property 'store' which is declared here on type 'IntrinsicAttributes & StoreCardCompactProps'

src/features/stores/components/examples/CarouselExamples.tsx:49:15 - error TS2322: Type 'Omit<ListStores200ResponseDataInner, "media"> & { id: string; createdAt: string; updatedAt: string; deliveryFee: number; minOrder: number; ... 4 more ...; media: MediaItem[]; } & { ...; }' is not assignable to type 'StoreWithDistance'.
  Types of property 'media' are incompatible.
    Type 'MediaItem[]' is not assignable to type 'string & MediaItem[]'.
      Type 'MediaItem[]' is not assignable to type 'string'.

49               store={store}
                 ~~~~~

  src/features/stores/components/StoreCard/StoreCardExpanded.tsx:15:12
    15   readonly store: StoreWithDistance
                  ~~~~~
    The expected type comes from property 'store' which is declared here on type 'IntrinsicAttributes & StoreCardExpandedProps'

src/features/stores/components/examples/CarouselExamples.tsx:74:15 - error TS2322: Type 'Omit<ListStores200ResponseDataInner, "media"> & { id: string; createdAt: string; updatedAt: string; deliveryFee: number; minOrder: number; ... 4 more ...; media: MediaItem[]; } & { ...; }' is not assignable to type 'StoreWithDistance'.
  Types of property 'media' are incompatible.
    Type 'MediaItem[]' is not assignable to type 'string & MediaItem[]'.
      Type 'MediaItem[]' is not assignable to type 'string'.

74               store={store}
                 ~~~~~

  src/features/stores/components/StoreCard/StoreCardCompact.tsx:15:12
    15   readonly store: StoreWithDistance
                  ~~~~~
    The expected type comes from property 'store' which is declared here on type 'IntrinsicAttributes & StoreCardCompactProps'

src/features/stores/components/FeaturedStores/FeaturedStores.tsx:13:9 - error TS2322: Type 'import("C:/wamp64/www/shop-shop/apps/web/src/api/types").StoreResponse[]' is not assignable to type 'import("C:/wamp64/www/shop-shop/apps/web/src/api/backend-types").StoreResponse[]'.
  Type 'import("C:/wamp64/www/shop-shop/apps/web/src/api/types").StoreResponse' is not assignable to type 'import("C:/wamp64/www/shop-shop/apps/web/src/api/backend-types").StoreResponse'.
    Type 'StoreResponse' is missing the following properties from type '{ id: string; createdAt: string; updatedAt: string; deliveryFee: number; minOrder: number; distance?: number | undefined; city?: string | undefined; state?: string | undefined; zipCode?: string | undefined; media: MediaItem[]; }': deliveryFee, minOrder

13         stores={stores ?? []}
           ~~~~~~

  src/features/stores/components/StoreCarousel/StoreCarousel.tsx:9:12
    9   readonly stores: StoreResponse[]
                 ~~~~~~
    The expected type comes from property 'stores' which is declared here on type 'IntrinsicAttributes & StoreCarouselProps'

src/features/stores/components/NewestStores/NewestStores.tsx:13:9 - error TS2322: Type 'import("C:/wamp64/www/shop-shop/apps/web/src/api/types").StoreResponse[]' is not assignable to type 'import("C:/wamp64/www/shop-shop/apps/web/src/api/backend-types").StoreResponse[]'.
  Type 'import("C:/wamp64/www/shop-shop/apps/web/src/api/types").StoreResponse' is not assignable to type 'import("C:/wamp64/www/shop-shop/apps/web/src/api/backend-types").StoreResponse'.
    Type 'StoreResponse' is missing the following properties from type '{ id: string; createdAt: string; updatedAt: string; deliveryFee: number; minOrder: number; distance?: number | undefined; city?: string | undefined; state?: string | undefined; zipCode?: string | undefined; media: MediaItem[]; }': deliveryFee, minOrder

13         stores={stores ?? []}
           ~~~~~~

  src/features/stores/components/StoreCarousel/StoreCarousel.tsx:9:12
    9   readonly stores: StoreResponse[]
                 ~~~~~~
    The expected type comes from property 'stores' which is declared here on type 'IntrinsicAttributes & StoreCarouselProps'

src/features/stores/components/StoreCarousel/StoreCarousel.tsx:17:36 - error TS2552: Cannot find name 'Store'. Did you mean 'Storage'?

17   const handleStoreClick = (store: Store) => {
                                      ~~~~~

  ../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.dom.d.ts:31366:13
    31366 declare var Storage: {
                      ~~~~~~~
    'Storage' is declared here.

src/features/stores/components/StoreCarousel/StoreCarousel.tsx:53:15 - error TS2322: Type 'StoreResponse' is not assignable to type 'StoreWithDistance'.
  Types of property 'media' are incompatible.
    Type 'MediaItem[]' is not assignable to type 'string & MediaItem[]'.
      Type 'MediaItem[]' is not assignable to type 'string'.

53               store={store}
                 ~~~~~

  src/features/stores/components/StoreCard/StoreCardCompact.tsx:15:12
    15   readonly store: StoreWithDistance
                  ~~~~~
    The expected type comes from property 'store' which is declared here on type 'IntrinsicAttributes & StoreCardCompactProps'

src/features/stores/components/StoreCategoryCarousels/StoreCategoryCarousels.tsx:25:33 - error TS2552: Cannot find name 'Store'. Did you mean 'Storage'?

25 function categorizeStore(store: Store): string[] {
                                   ~~~~~

  ../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.dom.d.ts:31366:13
    31366 declare var Storage: {
                      ~~~~~~~
    'Storage' is declared here.

src/features/stores/components/StoreCategoryCarousels/StoreCategoryCarousels.tsx:46:34 - error TS2552: Cannot find name 'Store'. Did you mean 'Storage'?

46     const result: Record<string, Store[]> = {}
                                    ~~~~~

  ../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.dom.d.ts:31366:13
    31366 declare var Storage: {
                      ~~~~~~~
    'Storage' is declared here.

src/features/stores/components/StoreList/StoreList.tsx:44:21 - error TS2322: Type 'StoreResponse[]' is not assignable to type 'StoreWithDistance[]'.
  Type 'StoreResponse' is not assignable to type 'StoreWithDistance'.
    Types of property 'media' are incompatible.
      Type 'MediaItem[]' is not assignable to type 'string & MediaItem[]'.
        Type 'MediaItem[]' is not assignable to type 'string'.

44   return <StoreGrid stores={stores} onStoreClick={handleStoreClick} />
                       ~~~~~~

  src/features/stores/components/StoreGrid/StoreGrid.tsx:13:12
    13   readonly stores: StoreWithDistance[]
                  ~~~~~~
    The expected type comes from property 'stores' which is declared here on type 'IntrinsicAttributes & StoreGridProps'

src/features/stores/components/StoreList/StoreList.tsx:44:37 - error TS2322: Type '(store: StoreResponse | StoreWithDistance) => void' is not assignable to type 'StoreClickHandler'.
  Types of parameters 'store' and 'store' are incompatible.
    Type 'StoreResponse' is not assignable to type 'StoreResponse | StoreWithDistance'.
      Type 'StoreResponse' is missing the following properties from type 'StoreWithDistance': deliveryFee, minOrder

44   return <StoreGrid stores={stores} onStoreClick={handleStoreClick} />
                                       ~~~~~~~~~~~~

  src/features/stores/components/StoreGrid/StoreGrid.tsx:14:12
    14   readonly onStoreClick?: StoreClickHandler;
                  ~~~~~~~~~~~~
    The expected type comes from property 'onStoreClick' which is declared here on type 'IntrinsicAttributes & StoreGridProps'

src/hooks/store/useAvailableLocations.ts:18:60 - error TS2552: Cannot find name 'Store'. Did you mean 'Storage'?

18       const stores = (response?.data || response || []) as Store[]
                                                              ~~~~~

  ../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.dom.d.ts:31366:13
    31366 declare var Storage: {
                      ~~~~~~~
    'Storage' is declared here.

src/hooks/useAuth.ts:24:15 - error TS2345: Argument of type 'import("C:/wamp64/www/shop-shop/apps/web/src/api/backend-types").UserResponse' is not assignable to parameter of type 'import("C:/wamp64/www/shop-shop/apps/web/src/api/types").UserResponse'.
  Type 'UserResponse' is missing the following properties from type 'UserResponse': isCompany, companyName, addresses, carts, and 13 more.

24       setAuth(authData.user, authData.token)
                 ~~~~~~~~~~~~~

src/hooks/useAuth.ts:39:15 - error TS2345: Argument of type 'import("C:/wamp64/www/shop-shop/apps/web/src/api/backend-types").UserResponse' is not assignable to parameter of type 'import("C:/wamp64/www/shop-shop/apps/web/src/api/types").UserResponse'.
  Type 'UserResponse' is missing the following properties from type 'UserResponse': isCompany, companyName, addresses, carts, and 13 more.

39       setAuth(authData.user, authData.token)
                 ~~~~~~~~~~~~~

src/hooks/vendor/useVendorOrders.ts:46:22 - error TS2345: Argument of type '<T extends { createdAt: string | Date; }>(a: T, b: T) => number' is not assignable to parameter of type '(a: OrderResponse, b: OrderResponse) => number'.
  Types of parameters 'a' and 'a' are incompatible.
    Type 'OrderResponse' is not assignable to type '{ createdAt: string | Date; }'.
      Types of property 'createdAt' are incompatible.
        Type 'string | undefined' is not assignable to type 'string | Date'.
          Type 'undefined' is not assignable to type 'string | Date'.

46       allOrders.sort(sortOrdersByDateDesc)
                        ~~~~~~~~~~~~~~~~~~~~

src/layouts/VendorLayout/VendorLayout.tsx:17:15 - error TS2305: Module '"@api/types"' has no exported member 'Store'.

17 import type { Store } from '@api/types'
                 ~~~~~

src/pages/CheckoutPage/CheckoutPage.tsx:94:21 - error TS2352: Conversion of type 'ListOrders200ResponseDataInner' to type '{ id: string; }' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Property 'id' is missing in type 'ListOrders200ResponseDataInner' but required in type '{ id: string; }'.

 94       const order = await createOrderMutation.mutateAsync({
                        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 95         cartId: cart?.id,
    ~~~~~~~~~~~~~~~~~~~~~~~~~
...
 97         tip: tipAmount > 0 ? tipAmount.toFixed(2) : undefined,
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 98       }) as { id: string }
    ~~~~~~~~~~~~~~~~~~~~~~~~~~

  src/pages/CheckoutPage/CheckoutPage.tsx:98:15
    98       }) as { id: string }
                     ~~
    'id' is declared here.

src/pages/ErrorPage.tsx:51:9 - error TS2322: Type 'unknown' is not assignable to type 'ReactNode'.

 51         {import.meta.env.DEV && error && typeof error === 'object' && 'stack' in error && (
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 52           <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-md text-left">
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
...
 56           </div>
    ~~~~~~~~~~~~~~~~
 57         )}
    ~~~~~~~~~~

src/pages/examples/ModularWidgetsExample.tsx:169:21 - error TS2322: Type 'StoreResponse' is not assignable to type 'StoreWithDistance'.
  Types of property 'media' are incompatible.
    Type 'MediaItem[]' is not assignable to type 'string & MediaItem[]'.
      Type 'MediaItem[]' is not assignable to type 'string'.

169                     store={store}
                        ~~~~~

  src/features/stores/components/StoreCard/StoreCardCompact.tsx:15:12
    15   readonly store: StoreWithDistance
                  ~~~~~
    The expected type comes from property 'store' which is declared here on type 'IntrinsicAttributes & StoreCardCompactProps'

src/pages/ItemFormPage/ItemFormPage.tsx:149:79 - error TS2345: Argument of type '(field: "description" | "title" | "sortIndex" | "price" | "isActive" | "stockQty" | "isSoldOut", value: string | number | boolean) => void' is not assignable to parameter of type '(field: "description" | "title" | "storeId" | "sortIndex" | "price" | "isActive" | "stockQty" | "isSoldOut", value: string | number | boolean) => void'.
  Types of parameters 'field' and 'field' are incompatible.
    Type '"description" | "title" | "storeId" | "sortIndex" | "price" | "isActive" | "stockQty" | "isSoldOut"' is not assignable to type '"description" | "title" | "sortIndex" | "price" | "isActive" | "stockQty" | "isSoldOut"'.
      Type '"storeId"' is not assignable to type '"description" | "title" | "sortIndex" | "price" | "isActive" | "stockQty" | "isSoldOut"'.

149   const sections = createItemFormSections({ ...formData, storeId: storeId! }, handleChange)
                                                                                  ~~~~~~~~~~~~

src/pages/ItemFormPage/ItemFormPage.tsx:158:11 - error TS2322: Type '(FormSection | { title: string; description: string; component: Element; })[]' is not assignable to type 'FormSection[]'.
  Type 'FormSection | { title: string; description: string; component: Element; }' is not assignable to type 'FormSection'.
    Object literal may only specify known properties, and 'component' does not exist in type 'FormSection'.

158           component: <MediaUploader itemId={itemId} maxFiles={5} />,
              ~~~~~~~~~

src/pages/StoreItemsPage/StoreItemsPage.tsx:62:5 - error TS2322: Type 'ItemResponse[]' is not assignable to type 'Record<string, unknown>[]'.
  Type 'ItemResponse' is not assignable to type 'Record<string, unknown>'.
    Index signature for type 'string' is missing in type 'ItemResponse'.

62     items: items,
       ~~~~~

  src/hooks/usePaginatedList.ts:10:3
    10   items: T[]
         ~~~~~
    The expected type comes from property 'items' which is declared here on type 'UsePaginatedListOptions<Record<string, unknown>>'

src/pages/StoreItemsPage/StoreItemsPage.tsx:175:17 - error TS2322: Type 'unknown' is not assignable to type 'Key | null | undefined'.

175                 key={item.id}
                    ~~~

  ../../node_modules/.pnpm/@types+react@18.3.26/node_modules/@types/react/index.d.ts:262:9
    262         key?: Key | null | undefined;
                ~~~
    The expected type comes from property 'key' which is declared here on type 'IntrinsicAttributes & ItemCardProps'

src/pages/StoreItemsPage/StoreItemsPage.tsx:176:17 - error TS2322: Type 'Record<string, unknown>' is not assignable to type 'ItemResponse'.
  Type 'Record<string, unknown>' is missing the following properties from type 'ListItems200ResponseDataInner': storeId, store, title, description, and 17 more.

176                 item={item}
                    ~~~~

  src/pages/StoreItemsPage/StoreItemsPage.tsx:205:3
    205   item: ItemResponse
          ~~~~
    The expected type comes from property 'item' which is declared here on type 'IntrinsicAttributes & ItemCardProps'

src/pages/StoreItemsPage/StoreItemsPage.tsx:178:50 - error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.

178                 onDelete={() => handleDeleteItem(item.id, item.title)}
                                                     ~~~~~~~

src/pages/VendorDashboardPage/VendorDashboardPage.tsx:27:46 - error TS2552: Cannot find name 'Store'. Did you mean 'Storage'?

27   const stores = (storesData?.data ?? []) as Store[]
                                                ~~~~~

  ../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.dom.d.ts:31366:13
    31366 declare var Storage: {
                      ~~~~~~~
    'Storage' is declared here.

src/pages/VendorDashboardPage/VendorDashboardPage.tsx:146:19 - error TS2552: Cannot find name 'Store'. Did you mean 'Storage'?

146   readonly store: Store
                      ~~~~~

  ../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.dom.d.ts:31366:13
    31366 declare var Storage: {
                      ~~~~~~~
    'Storage' is declared here.

src/services/location.service.ts:295:7 - error TS2322: Type 'LocationData[] | undefined' is not assignable to type 'LocationData[]'.
  Type 'undefined' is not assignable to type 'LocationData[]'.

295       return this._cachedHistory
          ~~~~~~

src/utils/performance/memory-pool.ts:212:26 - error TS2345: Argument of type 'ObjectPool<T>' is not assignable to parameter of type 'ObjectPool<unknown>'.
  Types of property 'resetFn' are incompatible.
    Type '(obj: T) => void' is not assignable to type '(obj: unknown) => void'.
      Types of parameters 'obj' and 'obj' are incompatible.
        Type 'unknown' is not assignable to type 'T'.
          'T' could be instantiated with an arbitrary type which could be unrelated to 'unknown'.

212     this.pools.set(name, pool)
                             ~~~~

src/utils/performance/memory-pool.ts:216:5 - error TS2322: Type 'ObjectPool<unknown> | undefined' is not assignable to type 'ObjectPool<T> | undefined'.
  Type 'ObjectPool<unknown>' is not assignable to type 'ObjectPool<T>'.
    Types of property 'pool' are incompatible.
      Type 'unknown[]' is not assignable to type 'T[]'.
        Type 'unknown' is not assignable to type 'T'.
          'T' could be instantiated with an arbitrary type which could be unrelated to 'unknown'.

216     return this.pools.get(name)
        ~~~~~~

src/utils/type-transformers.ts:166:28 - error TS2339: Property 'street' does not exist on type 'object'.

166     addressStreet: address.street || address.addressStreet,
                               ~~~~~~

src/utils/type-transformers.ts:166:46 - error TS2339: Property 'addressStreet' does not exist on type 'object'.

166     addressStreet: address.street || address.addressStreet,
                                                 ~~~~~~~~~~~~~

src/utils/type-transformers.ts:167:26 - error TS2339: Property 'city' does not exist on type 'object'.

167     addressCity: address.city || address.addressCity,
                             ~~~~

src/utils/type-transformers.ts:167:42 - error TS2339: Property 'addressCity' does not exist on type 'object'.

167     addressCity: address.city || address.addressCity,
                                             ~~~~~~~~~~~

src/utils/type-transformers.ts:168:27 - error TS2339: Property 'state' does not exist on type 'object'.

168     addressState: address.state || address.addressState,
                              ~~~~~

src/utils/type-transformers.ts:168:44 - error TS2339: Property 'addressState' does not exist on type 'object'.

168     addressState: address.state || address.addressState,
                                               ~~~~~~~~~~~~

src/utils/type-transformers.ts:169:25 - error TS2339: Property 'zip' does not exist on type 'object'.

169     addressZip: address.zip || address.addressZip,
                            ~~~

src/utils/type-transformers.ts:169:40 - error TS2339: Property 'addressZip' does not exist on type 'object'.

169     addressZip: address.zip || address.addressZip,
                                           ~~~~~~~~~~

src/utils/type-transformers.ts:170:29 - error TS2339: Property 'country' does not exist on type 'object'.

170     addressCountry: address.country || address.addressCountry || 'US'
                                ~~~~~~~

src/utils/type-transformers.ts:170:48 - error TS2339: Property 'addressCountry' does not exist on type 'object'.

170     addressCountry: address.country || address.addressCountry || 'US'
                                                   ~~~~~~~~~~~~~~

src/utils/validation/config.ts:62:17 - error TS2304: Cannot find name 'defaultany'.

62     return { ...defaultany, ...testConfig }
                   ~~~~~~~~~~

src/utils/validation/config.ts:66:17 - error TS2304: Cannot find name 'defaultany'.

66     return { ...defaultany, ...productionConfig }
                   ~~~~~~~~~~

src/utils/validation/config.ts:70:17 - error TS2304: Cannot find name 'defaultany'.

70     return { ...defaultany, ...developmentConfig }
                   ~~~~~~~~~~

src/utils/validation/config.ts:73:10 - error TS2304: Cannot find name 'defaultany'.

73   return defaultany
            ~~~~~~~~~~


Found 47 errors in 22 files.

Errors  Files
     1  src/features/checkout/components/AddressCard/AddressCard.tsx:5
     2  src/features/search/utils/searchTransformers.ts:6
     3  src/features/stores/components/examples/CarouselExamples.tsx:31
     1  src/features/stores/components/FeaturedStores/FeaturedStores.tsx:13
     1  src/features/stores/components/NewestStores/NewestStores.tsx:13
     2  src/features/stores/components/StoreCarousel/StoreCarousel.tsx:17
     2  src/features/stores/components/StoreCategoryCarousels/StoreCategoryCarousels.tsx:25
     2  src/features/stores/components/StoreList/StoreList.tsx:44
     1  src/hooks/store/useAvailableLocations.ts:18
     2  src/hooks/useAuth.ts:24
     1  src/hooks/vendor/useVendorOrders.ts:46
     1  src/layouts/VendorLayout/VendorLayout.tsx:17
     1  src/pages/CheckoutPage/CheckoutPage.tsx:94
     1  src/pages/ErrorPage.tsx:51
     1  src/pages/examples/ModularWidgetsExample.tsx:169
     2  src/pages/ItemFormPage/ItemFormPage.tsx:149
     4  src/pages/StoreItemsPage/StoreItemsPage.tsx:62
     2  src/pages/VendorDashboardPage/VendorDashboardPage.tsx:27
     1  src/services/location.service.ts:295
     2  src/utils/performance/memory-pool.ts:212
    10  src/utils/type-transformers.ts:166
     4  src/utils/validation/config.ts:62