/**
 * Common types used across the application
 */

/**
 * Links relevant to the payload
 */
export interface Links {
  Self: string;
  First?: string;
  Prev?: string;
  Next?: string;
  Last?: string;
}

/**
 * Meta Data relevant to the payload
 */
export interface Meta {
  TotalPages: number;
  FirstAvailableDateTime?: string;
  LastAvailableDateTime?: string;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  ErrorCode: string;
  ErrorMessage: string;
  Path?: string;
  Url?: string;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  Data: T;
  Links: Links;
  Meta?: Meta;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * Date range parameters
 */
export interface DateRangeParams {
  fromDate?: string;
  toDate?: string;
}