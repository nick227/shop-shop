export interface AccountCapabilities {
  platformRole: 'USER' | 'ADMIN'
  vendorEnrollment: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  vendorAccessRevoked: boolean
  canAccessVendorPortal: boolean
  canCreateStore: boolean
  canAdministerStores: boolean
}

