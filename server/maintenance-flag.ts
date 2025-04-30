/**
 * MAINTENANCE MODE SERVICE
 * 
 * This file provides functions to check if maintenance mode is enabled
 * by reading the setting from the database.
 * When enabled, only the admin user can log in.
 */

import { storage } from './storage';

// Admin username constant
export const ADMIN_USERNAME = 'admin';

/**
 * Checks if maintenance mode is enabled by reading from the database
 * @returns Promise<boolean> Whether maintenance mode is enabled
 */
export async function isMaintenanceModeEnabled(): Promise<boolean> {
  try {
    const setting = await storage.getSetting('maintenanceMode');
    return setting?.value === 'true';
  } catch (error) {
    console.error('Error checking maintenance mode setting:', error);
    // Default to false if we can't check
    return false;
  }
}
