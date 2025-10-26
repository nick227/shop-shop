/**
 * API Factory - Follows OCP and DIP
 * Open for extension, closed for modification
 * Depends on abstractions, not concretions
 */

import type { 
  Configuration} from '@packages/sdk';
import {
  AuthApi,
  StoresApi,
  ItemsApi,
  CartsApi,
  OrdersApi,
  AddresssApi,
  PromotionsApi,
  PaymentsApi,
  UsersApi,
  PostsApi,
  MediasApi
} from '@packages/sdk'

export interface ApiInstanceFactory<T> {
  create(config: Configuration): T
}

export class AuthApiFactory implements ApiInstanceFactory<any> {
  create(config: Configuration): any {
    try {
      return new AuthApi(config)
    } catch (error: any) {
      throw new Error('Failed to create AuthApi: ' + ((error as any) instanceof Error ? error.message : 'Unknown error'))
    }
  }
}

export class StoresApiFactory implements ApiInstanceFactory<any> {
  create(config: Configuration): any {
    try {
      return new StoresApi(config)
    } catch (error: any) {
      throw new Error('Failed to create StoresApi: ' + ((error as any) instanceof Error ? error.message : 'Unknown error'))
    }
  }
}

export class ItemsApiFactory implements ApiInstanceFactory<any> {
  create(config: Configuration): any {
    try {
      return new ItemsApi(config)
    } catch (error: any) {
      throw new Error('Failed to create ItemsApi: ' + ((error as any) instanceof Error ? error.message : 'Unknown error'))
    }
  }
}

export class CartsApiFactory implements ApiInstanceFactory<any> {
  create(config: Configuration): any {
    try {
      return new CartsApi(config)
    } catch (error: any) {
      throw new Error('Failed to create CartsApi: ' + ((error as any) instanceof Error ? error.message : 'Unknown error'))
    }
  }
}

export class OrdersApiFactory implements ApiInstanceFactory<any> {
  create(config: Configuration): any {
    try {
      return new OrdersApi(config)
    } catch (error: any) {
      throw new Error('Failed to create OrdersApi: ' + ((error as any) instanceof Error ? error.message : 'Unknown error'))
    }
  }
}

export class AddressesApiFactory implements ApiInstanceFactory<any> {
  create(config: Configuration): any {
    try {
      return new AddresssApi(config)
    } catch (error: any) {
      throw new Error('Failed to create AddressesApi: ' + ((error as any) instanceof Error ? error.message : 'Unknown error'))
    }
  }
}

export class PromotionsApiFactory implements ApiInstanceFactory<any> {
  create(config: Configuration): any {
    try {
      return new PromotionsApi(config)
    } catch (error: any) {
      throw new Error('Failed to create PromotionsApi: ' + ((error as any) instanceof Error ? error.message : 'Unknown error'))
    }
  }
}

export class PaymentsApiFactory implements ApiInstanceFactory<any> {
  create(config: Configuration): any {
    try {
      return new PaymentsApi(config)
    } catch (error: any) {
      throw new Error('Failed to create PaymentsApi: ' + ((error as any) instanceof Error ? error.message : 'Unknown error'))
    }
  }
}

export class UsersApiFactory implements ApiInstanceFactory<any> {
  create(config: Configuration): any {
    try {
      return new UsersApi(config)
    } catch (error: any) {
      throw new Error('Failed to create UsersApi: ' + ((error as any) instanceof Error ? error.message : 'Unknown error'))
    }
  }
}

export class PostsApiFactory implements ApiInstanceFactory<any> {
  create(config: Configuration): any {
    try {
      return new PostsApi(config)
    } catch (error: any) {
      throw new Error('Failed to create PostsApi: ' + ((error as any) instanceof Error ? error.message : 'Unknown error'))
    }
  }
}

export class MediasApiFactory implements ApiInstanceFactory<any> {
  create(config: Configuration): any {
    try {
      return new MediasApi(config)
    } catch (error: any) {
      throw new Error('Failed to create MediasApi: ' + ((error as any) instanceof Error ? error.message : 'Unknown error'))
    }
  }
}
