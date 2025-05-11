/**
 * Common types used across the application
 */

/**
 * Links for pagination and navigation
 */
export interface Links {
  Self: string;
  First?: string;
  Prev?: string;
  Next?: string;
  Last?: string;
}

/**
 * Meta information for API responses
 */
export interface Meta {
  TotalPages?: number;
  FirstAvailableDateTime?: string;
  LastAvailableDateTime?: string;
}

/**
 * Generic API response structure
 */
export interface ApiResponse<T> {
  Data: T;
  Links: Links;
  Meta: Meta;
}