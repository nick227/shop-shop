/**
 * API Contract Types - Single Source of Truth
 * All API responses should conform to these contracts
 */

export interface ApiSuccess<T> {
  data: T
}

export interface ApiError {
  error: string
  message: string
  status: number
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError
