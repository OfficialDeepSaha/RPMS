/**
 * Client-side configuration
 * 
 * This file contains configuration variables that are used throughout the client application.
 * Values can be overridden via environment variables during build time.
 */

// API Base URL - defaults to /api if not specified
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Other client-side configuration variables can be added here
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
