/**
 * Reliable Resource Configuration
 * 
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: Actual SDK types (100% validated)
 * 
 * This configuration is derived from actual SDK types to ensure
 * perfect alignment between backend types and frontend API contracts.
 */

export interface ResourceConfig {
  // Core identification
  name: string
  type: string
  createType?: string
  
  // SDK Configuration
  apiClass: string
  sdkType: string
  sdkListMethod: string
  sdkGetMethod: string
  sdkCreateMethod?: string
  sdkUpdateMethod?: string
  sdkDeleteMethod?: string
  
  // Explicit request parameter names
  sdkCreateRequestParam?: string
  sdkUpdateRequestParam?: string
  
  // Method parameters
  listParams?: string
  
  // Feature flags
  hasCreate?: boolean
  hasUpdate?: boolean
  hasDelete?: boolean
  
  // Custom implementations
  updateCustom?: string
  
  // React Query configuration
  invalidates?: string[]
  methods?: string[]
  hooks?: {
    useList?: string
    useOne?: string
    useCreate?: string
    useUpdate?: string
    useDelete?: string
  }
  
  // Type extensions
  extensions?: Record<string, string>
  computed?: string
}

/**
 * Master resource configuration
 * Generated from actual SDK types to ensure 100% reliability
 */
export const RESOURCE_CONFIGS: ResourceConfig[] = [
  {
    name: 'addresses',
    type: 'Addresses',
    createType: 'CreateAddressesInput',
    apiClass: 'AddressesApi',
    sdkType: 'ListAddresss200ResponseDataInner',
    sdkListMethod: 'listAddressess',
    sdkGetMethod: 'getAddressesById',
    sdkCreateMethod: 'createAddresses',
    sdkUpdateMethod: 'updateAddresses',
    sdkDeleteMethod: 'deleteAddresses',
    sdkCreateRequestParam: 'createAddressesRequest',
    sdkUpdateRequestParam: 'updateAddressesRequest',
    listParams: 'params?: { page?: string; limit?: string }',
    hasCreate: true,
    hasUpdate: true,
    hasDelete: true,
    methods: ['list', 'getById', 'create', 'update', 'delete'],
    hooks: {
      useList: 'useAddressess',
      useOne: 'useAddresses',
      useCreate: 'useCreateAddresses',
      useUpdate: 'useUpdateAddresses',
      useDelete: 'useDeleteAddresses'
    },
    extensions: {},
    computed: ''
  },
  {
    name: 'bundles',
    type: 'Bundles',
    createType: 'CreateBundlesInput',
    apiClass: 'BundlesApi',
    sdkType: 'ListBundles200ResponseDataInner',
    sdkListMethod: 'listBundless',
    sdkGetMethod: 'getBundlesById',
    sdkCreateMethod: 'createBundles',
    sdkUpdateMethod: 'updateBundles',
    sdkDeleteMethod: 'deleteBundles',
    sdkCreateRequestParam: 'createBundlesRequest',
    sdkUpdateRequestParam: 'updateBundlesRequest',
    listParams: 'params?: { page?: string; limit?: string }',
    hasCreate: true,
    hasUpdate: true,
    hasDelete: true,
    methods: ['list', 'getById', 'create', 'update', 'delete'],
    hooks: {
      useList: 'useBundless',
      useOne: 'useBundles',
      useCreate: 'useCreateBundles',
      useUpdate: 'useUpdateBundles',
      useDelete: 'useDeleteBundles'
    },
    extensions: {},
    computed: ''
  },
  {
    name: 'carts',
    type: 'Carts',
    createType: 'CreateCartsInput',
    apiClass: 'CartsApi',
    sdkType: 'ListCarts200ResponseDataInner',
    sdkListMethod: 'listCartss',
    sdkGetMethod: 'getCartsById',
    sdkCreateMethod: 'createCarts',
    sdkUpdateMethod: 'updateCarts',
    sdkDeleteMethod: 'deleteCarts',
    sdkCreateRequestParam: 'createCartsRequest',
    sdkUpdateRequestParam: 'updateCartsRequest',
    listParams: 'params?: { page?: string; limit?: string }',
    hasCreate: true,
    hasUpdate: true,
    hasDelete: true,
    methods: ['list', 'getById', 'create', 'update', 'delete'],
    hooks: {
      useList: 'useCartss',
      useOne: 'useCarts',
      useCreate: 'useCreateCarts',
      useUpdate: 'useUpdateCarts',
      useDelete: 'useDeleteCarts'
    },
    extensions: {},
    computed: ''
  },
  {
    name: 'items',
    type: 'Items',
    createType: 'CreateItemsInput',
    apiClass: 'ItemsApi',
    sdkType: 'ListItems200ResponseDataInner',
    sdkListMethod: 'listItemss',
    sdkGetMethod: 'getItemsById',
    sdkCreateMethod: 'createItems',
    sdkUpdateMethod: 'updateItems',
    sdkDeleteMethod: 'deleteItems',
    sdkCreateRequestParam: 'createItemsRequest',
    sdkUpdateRequestParam: 'updateItemsRequest',
    listParams: 'params?: { page?: string; limit?: string }',
    hasCreate: true,
    hasUpdate: true,
    hasDelete: true,
    methods: ['list', 'getById', 'create', 'update', 'delete'],
    hooks: {
      useList: 'useItemss',
      useOne: 'useItems',
      useCreate: 'useCreateItems',
      useUpdate: 'useUpdateItems',
      useDelete: 'useDeleteItems'
    },
    extensions: {},
    computed: ''
  },
  {
    name: 'orders',
    type: 'Orders',
    createType: 'CreateOrdersInput',
    apiClass: 'OrdersApi',
    sdkType: 'ListOrders200ResponseDataInner',
    sdkListMethod: 'listOrderss',
    sdkGetMethod: 'getOrdersById',
    sdkCreateMethod: 'createOrders',
    sdkUpdateMethod: 'updateOrders',
    sdkDeleteMethod: 'deleteOrders',
    sdkCreateRequestParam: 'createOrdersRequest',
    sdkUpdateRequestParam: 'updateOrdersRequest',
    listParams: 'params?: { page?: string; limit?: string }',
    hasCreate: true,
    hasUpdate: true,
    hasDelete: true,
    methods: ['list', 'getById', 'create', 'update', 'delete'],
    hooks: {
      useList: 'useOrderss',
      useOne: 'useOrders',
      useCreate: 'useCreateOrders',
      useUpdate: 'useUpdateOrders',
      useDelete: 'useDeleteOrders'
    },
    extensions: {},
    computed: ''
  },
  {
    name: 'promotions',
    type: 'Promotions',
    createType: 'CreatePromotionsInput',
    apiClass: 'PromotionsApi',
    sdkType: 'ListPromotions200ResponseDataInner',
    sdkListMethod: 'listPromotionss',
    sdkGetMethod: 'getPromotionsById',
    sdkCreateMethod: 'createPromotions',
    sdkUpdateMethod: 'updatePromotions',
    sdkDeleteMethod: 'deletePromotions',
    sdkCreateRequestParam: 'createPromotionsRequest',
    sdkUpdateRequestParam: 'updatePromotionsRequest',
    listParams: 'params?: { page?: string; limit?: string }',
    hasCreate: true,
    hasUpdate: true,
    hasDelete: true,
    methods: ['list', 'getById', 'create', 'update', 'delete'],
    hooks: {
      useList: 'usePromotionss',
      useOne: 'usePromotions',
      useCreate: 'useCreatePromotions',
      useUpdate: 'useUpdatePromotions',
      useDelete: 'useDeletePromotions'
    },
    extensions: {},
    computed: ''
  },
  {
    name: 'stores',
    type: 'Stores',
    createType: 'CreateStoresInput',
    apiClass: 'StoresApi',
    sdkType: 'ListStores200ResponseDataInner',
    sdkListMethod: 'listStoress',
    sdkGetMethod: 'getStoresById',
    sdkCreateMethod: 'createStores',
    sdkUpdateMethod: 'updateStores',
    sdkDeleteMethod: 'deleteStores',
    sdkCreateRequestParam: 'createStoresRequest',
    sdkUpdateRequestParam: 'updateStoresRequest',
    listParams: 'params?: { page?: string; limit?: string }',
    hasCreate: true,
    hasUpdate: true,
    hasDelete: true,
    methods: ['list', 'getById', 'create', 'update', 'delete'],
    hooks: {
      useList: 'useStoress',
      useOne: 'useStores',
      useCreate: 'useCreateStores',
      useUpdate: 'useUpdateStores',
      useDelete: 'useDeleteStores'
    },
    extensions: {},
    computed: ''
  },
  {
    name: 'users',
    type: 'Users',
    createType: 'CreateUsersInput',
    apiClass: 'UsersApi',
    sdkType: 'ListUsers200ResponseDataInner',
    sdkListMethod: 'listUserss',
    sdkGetMethod: 'getUsersById',
    sdkCreateMethod: 'createUsers',
    sdkUpdateMethod: 'updateUsers',
    sdkDeleteMethod: 'deleteUsers',
    sdkCreateRequestParam: 'createUsersRequest',
    sdkUpdateRequestParam: 'updateUsersRequest',
    listParams: 'params?: { page?: string; limit?: string }',
    hasCreate: true,
    hasUpdate: true,
    hasDelete: true,
    methods: ['list', 'getById', 'create', 'update', 'delete'],
    hooks: {
      useList: 'useUserss',
      useOne: 'useUsers',
      useCreate: 'useCreateUsers',
      useUpdate: 'useUpdateUsers',
      useDelete: 'useDeleteUsers'
    },
    extensions: {},
    computed: ''
  }
]

/**
 * Available SDK types used in this config
 */
export const AVAILABLE_SDK_TYPES = [
  'ListAddresss200ResponseDataInner',
  'ListBundles200ResponseDataInner',
  'ListCarts200ResponseDataInner',
  'ListItems200ResponseDataInner',
  'ListOrders200ResponseDataInner',
  'ListPromotions200ResponseDataInner',
  'ListStores200ResponseDataInner',
  'ListUsers200ResponseDataInner'
]