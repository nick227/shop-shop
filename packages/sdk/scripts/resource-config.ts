/**
 * Resource Configuration
 *
 * Single source of truth for how each API resource maps to:
 *   - the real SDK method names (derived from actual SDK API files)
 *   - the frontend types in apps/web/src/api/backend-types
 *
 * When the OpenAPI spec is regenerated and SDK changes, update the
 * sdkListMethod / sdkGetMethod / etc. fields here to match, then
 * run `pnpm gen:wrapper` to rebuild apiWrapper.ts.
 */

export interface ResourceConfig {
  // Core identification
  name: string          // matches the apiClient accessor, e.g. 'stores' → apiClient.stores()
  type: string          // response type alias used in return types
  createType?: string   // input type for create
  updateType?: string   // input type for update (falls back to createType when omitted)

  // SDK method names (from the generated SDK API classes)
  apiClass: string
  sdkType: string
  sdkListMethod: string
  sdkGetMethod: string
  sdkCreateMethod?: string
  sdkUpdateMethod?: string
  sdkDeleteMethod?: string

  // Explicit request-body parameter names used by each SDK method
  sdkCreateRequestParam?: string
  sdkUpdateRequestParam?: string
  sdkGetIdParam?: string
  sdkDeleteIdParam?: string

  // Typed params for the list method, verbatim TypeScript (e.g. 'params?: { page?: string }')
  listParams?: string

  // Feature flags
  hasCreate?: boolean
  hasUpdate?: boolean
  hasDelete?: boolean

  // Drop in a full method body string to override the generated list block
  listCustom?: string

  // Drop in a full method body string to override the generated update block
  updateCustom?: string

  // React Query invalidation helpers (used by hook generator)
  invalidates?: string[]
  methods?: string[]
  hooks?: {
    useList?: string
    useOne?: string
    useCreate?: string
    useUpdate?: string
    useDelete?: string
  }

  extensions?: Record<string, string>
  computed?: string
}

/**
 * Master resource configuration.
 *
 * SDK method names are taken directly from the generated API classes under
 * packages/sdk/src/apis/*.ts.  Types come from apps/web/src/api/backend-types.ts.
 */
export const RESOURCE_CONFIGS: ResourceConfig[] = [
  // ── Addresses ────────────────────────────────────────────────────────────
  // SDK class: AddresssApi (double-s is an OpenAPI generator quirk for /addresss)
  {
    name: 'addresses',
    type: 'Address',
    createType: 'CreateAddressInput',
    updateType: 'UpdateAddressInput',
    apiClass: 'AddresssApi',
    sdkType: 'ListAddresss200ResponseDataInner',
    sdkListMethod: 'listAddresss',        // AddresssApi.listAddresss()
    sdkGetMethod: 'getAddressById',
    sdkCreateMethod: 'createAddress',
    sdkUpdateMethod: 'updateAddress',
    sdkDeleteMethod: 'deleteAddress',
    sdkCreateRequestParam: 'createAddressRequest',
    sdkUpdateRequestParam: 'updateAddressRequest',
    listParams: '',
    hasCreate: true,
    hasUpdate: true,
    hasDelete: true,
    methods: ['list', 'getById', 'create', 'update', 'delete'],
    hooks: {
      useList: 'useAddresses',
      useOne: 'useAddress',
      useCreate: 'useCreateAddress',
      useUpdate: 'useUpdateAddress',
      useDelete: 'useDeleteAddress',
    },
    extensions: {},
    computed: '',
  },

  // ── Bundles ───────────────────────────────────────────────────────────────
  {
    name: 'bundles',
    type: 'Bundle',
    createType: 'Partial<Bundle>',
    updateType: 'Partial<Bundle>',
    apiClass: 'BundlesApi',
    sdkType: 'ListBundles200ResponseDataInner',
    sdkListMethod: 'listBundles',
    sdkGetMethod: 'getBundleById',
    sdkCreateMethod: 'createBundle',
    sdkUpdateMethod: 'updateBundle',
    sdkDeleteMethod: 'deleteBundle',
    sdkCreateRequestParam: 'createBundleRequest',
    sdkUpdateRequestParam: 'updateBundleRequest',
    listParams: 'params?: { page?: string; limit?: string; storeId?: string; isActive?: boolean }',
    hasCreate: true,
    hasUpdate: true,
    hasDelete: true,
    methods: ['list', 'getById', 'create', 'update', 'delete'],
    hooks: {
      useList: 'useBundles',
      useOne: 'useBundle',
      useCreate: 'useCreateBundle',
      useUpdate: 'useUpdateBundle',
      useDelete: 'useDeleteBundle',
    },
    extensions: {},
    computed: '',
  },

  // ── Carts ─────────────────────────────────────────────────────────────────
  // NOTE: The SDK has no updateCart endpoint — the update stub rejects with
  // NOT_IMPLEMENTED until cart item management is added to the OpenAPI spec.
  {
    name: 'carts',
    type: 'CartWithTotals',
    createType: 'Partial<CartWithTotals>',
    apiClass: 'CartsApi',
    sdkType: 'ListCarts200ResponseDataInner',
    sdkListMethod: 'listCarts',
    sdkGetMethod: 'getCartById',
    sdkCreateMethod: 'createCart',
    sdkDeleteMethod: 'deleteCart',
    sdkCreateRequestParam: 'createCartRequest',
    listParams: '',
    hasCreate: true,
    hasUpdate: true,
    hasDelete: true,
    // Custom update: SDK has no updateCart — reject until spec covers it
    updateCustom: `  update: async (_id: string, _input: Partial<CartWithTotals>): Promise<CartWithTotals> => Promise.reject(
    new APIError('Cart update API not yet in OpenAPI spec', undefined, 'NOT_IMPLEMENTED')
  ),`,
    methods: ['list', 'getById', 'create', 'update', 'delete'],
    hooks: {
      useList: 'useCarts',
      useOne: 'useCart',
      useCreate: 'useCreateCart',
      useUpdate: 'useUpdateCart',
      useDelete: 'useDeleteCart',
    },
    extensions: {},
    computed: '',
  },

  // ── Items ─────────────────────────────────────────────────────────────────
  {
    name: 'items',
    type: 'Item',
    createType: 'CreateItemInput',
    updateType: 'UpdateItemInput',
    apiClass: 'ItemsApi',
    sdkType: 'ListItems200ResponseDataInner',
    sdkListMethod: 'listItems',
    sdkGetMethod: 'getItemById',
    sdkCreateMethod: 'createItem',
    sdkUpdateMethod: 'updateItem',
    sdkDeleteMethod: 'deleteItem',
    sdkCreateRequestParam: 'createItemRequest',
    sdkUpdateRequestParam: 'updateItemRequest',
    listParams: 'params?: { page?: string; limit?: string; storeId?: string }',
    hasCreate: true,
    hasUpdate: true,
    hasDelete: true,
    methods: ['list', 'getById', 'create', 'update', 'delete'],
    hooks: {
      useList: 'useItems',
      useOne: 'useItem',
      useCreate: 'useCreateItem',
      useUpdate: 'useUpdateItem',
      useDelete: 'useDeleteItem',
    },
    extensions: {},
    computed: '',
  },

  // ── Orders ────────────────────────────────────────────────────────────────
  {
    name: 'orders',
    type: 'Order',
    createType: 'unknown',
    updateType: 'UpdateOrderInput',
    apiClass: 'OrdersApi',
    sdkType: 'ListOrders200ResponseDataInner',
    sdkListMethod: 'listOrders',
    sdkGetMethod: 'getOrderById',
    sdkCreateMethod: 'createOrder',
    sdkUpdateMethod: 'updateOrder',
    sdkDeleteMethod: 'deleteOrder',
    sdkCreateRequestParam: 'createOrderRequest',
    sdkUpdateRequestParam: 'updateOrderRequest',
    listParams: 'params?: { page?: string; limit?: string }',
    hasCreate: true,
    hasUpdate: true,
    hasDelete: true,
    methods: ['list', 'getById', 'create', 'update', 'delete'],
    hooks: {
      useList: 'useOrders',
      useOne: 'useOrder',
      useCreate: 'useCreateOrder',
      useUpdate: 'useUpdateOrder',
      useDelete: 'useDeleteOrder',
    },
    extensions: {},
    computed: '',
  },

  // ── Promotions ────────────────────────────────────────────────────────────
  {
    name: 'promotions',
    type: 'Promotion',
    createType: 'CreatePromotionInput',
    updateType: 'UpdatePromotionInput',
    apiClass: 'PromotionsApi',
    sdkType: 'ListPromotions200ResponseDataInner',
    sdkListMethod: 'listPromotions',
    sdkGetMethod: 'getPromotionById',
    sdkCreateMethod: 'createPromotion',
    sdkUpdateMethod: 'updatePromotion',
    sdkDeleteMethod: 'deletePromotion',
    sdkCreateRequestParam: 'createPromotionRequest',
    sdkUpdateRequestParam: 'updatePromotionRequest',
    listParams: '',
    hasCreate: true,
    hasUpdate: true,
    hasDelete: true,
    methods: ['list', 'getById', 'create', 'update', 'delete'],
    hooks: {
      useList: 'usePromotions',
      useOne: 'usePromotion',
      useCreate: 'useCreatePromotion',
      useUpdate: 'useUpdatePromotion',
      useDelete: 'useDeletePromotion',
    },
    extensions: {},
    computed: '',
  },

  // ── Stores ────────────────────────────────────────────────────────────────
  // NOTE: The SDK's UpdateStoreRequest uses 'createStoreRequest' as the body
  // parameter name (OpenAPI spec naming quirk — the spec reuses CreateStoreRequest
  // for the update body).  sdkUpdateRequestParam reflects this.
  //
  // listCustom: The SDK's ListStoresRequest only has page/limit. The server also
  // accepts latitude/longitude/radiusMiles/isPublished/sortBy/order which are not
  // yet in the OpenAPI spec. Until the spec is updated, we bypass the SDK for
  // listing and use a direct fetch so those params can be forwarded.
  {
    name: 'stores',
    type: 'Store',
    createType: 'CreateStoreInput',
    updateType: 'UpdateStoreInput',
    apiClass: 'StoresApi',
    sdkType: 'ListStores200ResponseDataInner',
    sdkListMethod: 'listStores',
    sdkGetMethod: 'getStoreById',
    sdkCreateMethod: 'createStore',
    sdkUpdateMethod: 'updateStore',
    sdkDeleteMethod: 'deleteStore',
    sdkCreateRequestParam: 'createStoreRequest',
    sdkUpdateRequestParam: 'createStoreRequest', // SDK UpdateStoreRequest.createStoreRequest
    listParams: 'params?: { page?: string; limit?: string; latitude?: number; longitude?: number; radiusMiles?: number; isPublished?: string; sortBy?: string; order?: string }',
    listCustom: `  list: async (params?: { page?: string; limit?: string; latitude?: number; longitude?: number; radiusMiles?: number; isPublished?: string; sortBy?: string; order?: string }): Promise<Store[]> => {
    const response = await handleRequest(async () => {
      const searchParams = new URLSearchParams()
      const set = (key: string, value: string | number | undefined) => {
        if (value !== undefined) searchParams.set(key, String(value))
      }
      set('page', params?.page)
      set('limit', params?.limit)
      set('latitude', params?.latitude)
      set('longitude', params?.longitude)
      set('radiusMiles', params?.radiusMiles)
      set('isPublished', params?.isPublished)
      set('sortBy', params?.sortBy)
      set('order', params?.order)

      const query = searchParams.toString()
      const base = (import.meta.env.VITE_API_URL || 'http://localhost:3005').replace(/\\/$/, '')
      const url = \`\${base}/stores\${query ? \`?\${query}\` : ''}\`

      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new APIError(res.statusText || 'Request failed', res.status, 'HTTP_ERROR')
      return res.json() as Promise<unknown>
    })
    return unwrapData<Store[]>(response)
  },`,
    hasCreate: true,
    hasUpdate: true,
    hasDelete: true,
    methods: ['list', 'getById', 'create', 'update', 'delete'],
    hooks: {
      useList: 'useStores',
      useOne: 'useStore',
      useCreate: 'useCreateStore',
      useUpdate: 'useUpdateStore',
      useDelete: 'useDeleteStore',
    },
    extensions: {},
    computed: '',
  },

  // ── Users ─────────────────────────────────────────────────────────────────
  // NOTE: The SDK has no createUser or deleteUser endpoint — those stubs reject
  // with NOT_IMPLEMENTED.
  {
    name: 'users',
    type: 'User',
    createType: 'unknown',
    updateType: 'UpdateUserInput',
    apiClass: 'UsersApi',
    sdkType: 'ListUsers200ResponseDataInner',
    sdkListMethod: 'listUsers',
    sdkGetMethod: 'getUserById',
    sdkUpdateMethod: 'updateUser',
    sdkUpdateRequestParam: 'updateUserRequest',
    listParams: '',
    hasCreate: false,
    hasUpdate: true,
    hasDelete: false,
    methods: ['list', 'getById', 'update'],
    hooks: {
      useList: 'useUsers',
      useOne: 'useUser',
      useUpdate: 'useUpdateUser',
    },
    extensions: {},
    computed: '',
  },
]

export const AVAILABLE_SDK_TYPES = [
  'ListAddresss200ResponseDataInner',
  'ListBundles200ResponseDataInner',
  'ListCarts200ResponseDataInner',
  'ListItems200ResponseDataInner',
  'ListOrders200ResponseDataInner',
  'ListPromotions200ResponseDataInner',
  'ListStores200ResponseDataInner',
  'ListUsers200ResponseDataInner',
]
