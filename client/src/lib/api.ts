import { API_BASE_URL } from '../config';

/**
 * Helper function to build API URLs
 * @param endpoint The API endpoint without leading slash
 * @returns The full API URL
 */
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Ensure API_BASE_URL has a trailing slash if it's not empty and doesn't already have one
  const baseUrl = API_BASE_URL ? 
    (API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`) : 
    '/api/';
  
  return `${baseUrl}${cleanEndpoint}`;
};

/**
 * Fetch data from the API
 * @param endpoint The API endpoint without leading slash
 * @param options Fetch options
 * @returns Promise with the response data
 */
export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = buildApiUrl(endpoint);
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }
  
  return response.json();
}

/**
 * Post data to the API
 * @param endpoint The API endpoint without leading slash
 * @param data The data to send in the request body
 * @param options Additional fetch options
 * @returns Promise with the response data
 */
export async function postApi<T, R>(endpoint: string, data: T, options?: RequestInit): Promise<R> {
  const url = buildApiUrl(endpoint);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    ...options,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }
  
  return response.json();
}

/**
 * Update data via the API
 * @param endpoint The API endpoint without leading slash
 * @param data The data to send in the request body
 * @param options Additional fetch options
 * @returns Promise with the response data
 */
export async function putApi<T, R>(endpoint: string, data: T, options?: RequestInit): Promise<R> {
  const url = buildApiUrl(endpoint);
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    ...options,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }
  
  return response.json();
}

/**
 * Delete a resource via the API
 * @param endpoint The API endpoint without leading slash
 * @param options Additional fetch options
 * @returns Promise with the response data
 */
export async function deleteApi<R>(endpoint: string, options?: RequestInit): Promise<R> {
  const url = buildApiUrl(endpoint);
  
  const response = await fetch(url, {
    method: 'DELETE',
    ...options,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }
  
  return response.json();
}
