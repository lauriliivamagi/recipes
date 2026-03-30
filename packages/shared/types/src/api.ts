/**
 * Standard API request wrapper.
 * Extend for specific endpoint request shapes.
 */
export interface ApiRequest<T = unknown> {
  data: T;
}

/**
 * Standard API success response.
 */
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
}

/**
 * Standard API error response.
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}
