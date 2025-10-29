/**
 * Generic Resource Hook Factory;
 * Automatically creates useList, useOne, useCreate, useUpdate, useDelete hooks;
 * 
 * Eliminates 90% of repetitive hook code by providing a standard pattern;
 * for CRUD operations with React Query + automatic validation;
 * 
 * @example;
 * const storesHooks = createResourceHooks('stores', api.stores)
 * export const useStores = storesHooks.useList;
 * export const useStore = storesHooks.useOne;
 */
import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  type UseQueryOptions,
  type UseMutationOptions
} from '@tanstack/react-query'
import { handleApiError } from '../api/errors'

// ============================================
// Types;
// ============================================

interface ResourceAPI<T, TCreate = Partial<T>, TUpdate = Partial<T>, TParams = Record<string, unknown>> {
  list?: (params?: TParams) => Promise<T[]>
  getById?: (id: string) => Promise<T>
  create?: (input: TCreate) => Promise<T>
  update?: (id: string, input: TUpdate) => Promise<T>
  delete?: (id: string) => Promise<void>
}

interface ResourceHookOptions<TParams = Record<string, unknown>> {
  /** Related resources to invalidate on mutations (e.g. ['orders', 'cart']) */
  invalidates?: string[]
  /** Custom query key generator */
  getQueryKey?: (resource: string, params?: TParams) => unknown[]
}

// ============================================
// Generic Hook Factory;
// ============================================

export function createResourceHooks<T, TCreate = Partial<T>, TUpdate = Partial<T>, TParams = Record<string, unknown>>(
  resourceName: string,
  api: ResourceAPI<T, TCreate, TUpdate, TParams>,
  options: ResourceHookOptions<TParams> = {}
) {
  const {
    invalidates = [resourceName],
    getQueryKey = (resource, params) => params ? [resource, params] : [resource]} = options;
  return {
    /**
     * useList - Fetch list of resources;
     * @example const { data: stores, isLoading } = useStores(params)
     */
    useList: (
      params?: TParams, 
      queryOptions?: Omit<UseQueryOptions<T[], Error>, 'queryKey' | 'queryFn'>
    ) => {
      return useQuery<T[], Error>({
        queryKey: getQueryKey(resourceName, params),
        queryFn: async () => {
          if (!api.list) {
            throw new Error('' + resourceName + '.list not implemented in API wrapper')
          }
          try {
            return await api.list(params)
          } catch (error: any) {
            throw await handleApiError(error)
          }
        },
        ...queryOptions})
    },

    /**
     * useOne - Fetch single resource by ID;
     * @example const { data: store } = useStore(id)
     */
    useOne: (
      id: string, 
      queryOptions?: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn' | 'enabled'>
    ) => {
      return useQuery<T, Error>({
        queryKey: [resourceName, id],
        queryFn: async () => {
          if (!api.getById) {
            throw new Error('' + resourceName + '.getById not implemented in API wrapper')
          }
          try {
            return await api.getById(id)
          } catch (error: any) {
            throw await handleApiError(error)
          }
        },
        enabled: Boolean(id),
        ...queryOptions})
    },

    /**
     * useCreate - Create new resource;
     * @example const { mutate: createStore } = useCreateStore()
     * createStore(newStore, { onSuccess: () => navigate('/stores') })
     */
    useCreate: (
      mutationOptions?: Omit<UseMutationOptions<T, Error, TCreate>, 'mutationFn'>
    ) => {
      const queryClient = useQueryClient()
      
      return useMutation<T, Error, TCreate>({
        mutationFn: async (input) => {
          if (!api.create) {
            throw new Error('' + resourceName + '.create not implemented in API wrapper')
          }
          try {
            return await api.create(input)
          } catch (error: any) {
            throw await handleApiError(error)
          }
        },
        onSuccess: (...args) => {
          // Invalidate related queries;
          for (const key of invalidates) {
            queryClient.invalidateQueries({ queryKey: [key] })
          }
          // Call user's onSuccess if provided;
          mutationOptions?.onSuccess?.(...args)
        },
        ...mutationOptions})
    },

    /**
     * useUpdate - Update existing resource;
     * @example const { mutate: updateStore } = useUpdateStore()
     * updateStore({ id: '123', input: updates })
     */
    useUpdate: (
      mutationOptions?: Omit<UseMutationOptions<T, Error, { id: string; input: TUpdate }>, 'mutationFn'>
    ) => {
      const queryClient = useQueryClient()
      
      return useMutation<T, Error, { id: string; input: TUpdate }>({
        mutationFn: async ({ id, input }) => {
          if (!api.update) {
            throw new Error('' + resourceName + '.update not implemented in API wrapper')
          }
          try {
            return await api.update(id, input)
          } catch (error: any) {
            throw await handleApiError(error)
          }
        },
        onSuccess: (...args) => {
          const [, variables] = args;
          // Invalidate list queries;
          queryClient.invalidateQueries({ queryKey: [resourceName] })
          // Invalidate specific item query;
          queryClient.invalidateQueries({ queryKey: [resourceName, variables.id] })
          // Call user's onSuccess if provided;
          mutationOptions?.onSuccess?.(...args)
        },
        ...mutationOptions})
    },

    /**
     * useDelete - Delete resource;
     * @example const { mutate: deleteStore } = useDeleteStore()
     * deleteStore(id, { onSuccess: () => toast.success('Deleted!') })
     */
    useDelete: (
      mutationOptions?: Omit<UseMutationOptions<void, Error, string>, 'mutationFn'>
    ) => {
      const queryClient = useQueryClient()
      
      return useMutation<void, Error, string>({
        mutationFn: async (id) => {
          if (!api.delete) {
            throw new Error('' + resourceName + '.delete not implemented in API wrapper')
          }
          try {
            return await api.delete(id)
          } catch (error: any) {
            throw await handleApiError(error)
          }
        },
        onSuccess: (...args) => {
          // Invalidate related queries;
          for (const key of invalidates) {
            queryClient.invalidateQueries({ queryKey: [key] })
          }
          // Call user's onSuccess if provided;
          mutationOptions?.onSuccess?.(...args)
        },
        ...mutationOptions})
    }}
}

