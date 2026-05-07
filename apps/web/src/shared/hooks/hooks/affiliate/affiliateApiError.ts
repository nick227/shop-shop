export type AffiliateAccountStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED'

export class AffiliateApiError extends Error {
  readonly httpStatus: number
  readonly affiliateStatus?: AffiliateAccountStatus

  constructor(input: { message: string; httpStatus: number; affiliateStatus?: AffiliateAccountStatus }) {
    super(input.message)
    this.name = 'AffiliateApiError'
    this.httpStatus = input.httpStatus
    this.affiliateStatus = input.affiliateStatus
  }
}

