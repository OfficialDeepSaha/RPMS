/**
 * MAINTENANCE MODE CHECKER
 * Centralized, reliable function to check maintenance mode status
 */
import { storage } from "./storage";

// Cache the maintenance mode status but refresh it regularly
let maintenanceModeEnabled = false;
let lastCheckTime = 0;
const CACHE_DURATION = 5000; // 5 seconds

// Admin username constant
export const ADMIN_USERNAME = 'admin';

/**
 * Check if maintenance mode is enabled - with caching for performance
 */
export async function isMaintenanceModeEnabled(): Promise<boolean> {
  const now = Date.now();
  
  // If we've recently checked, use the cached value
  if (now - lastCheckTime < CACHE_DURATION) {
    return maintenanceModeEnabled;
  }
  
  try {
    console.log("Checking maintenance mode setting from database...");
    const setting = await storage.getSetting('maintenanceMode');
    // Interpret maintenance flag stored as boolean
    maintenanceModeEnabled = setting?.value === true;
    lastCheckTime = now;
    
    console.log(`Maintenance mode is ${maintenanceModeEnabled ? 'ENABLED' : 'DISABLED'}`);
    return maintenanceModeEnabled;
  } catch (error) {
    console.error('Error checking maintenance mode:', error);
    // On error, default to previous value
    return maintenanceModeEnabled;
  }
}

/**
 * Force refresh the maintenance mode status
 */
export async function refreshMaintenanceMode(): Promise<boolean> {
  try {
    const setting = await storage.getSetting('maintenanceMode');
    // Refresh and interpret maintenance flag stored as boolean
    maintenanceModeEnabled = setting?.value === true;
    lastCheckTime = Date.now();
    console.log(`[REFRESH] Maintenance mode is now ${maintenanceModeEnabled ? 'ENABLED' : 'DISABLED'}`);
    return maintenanceModeEnabled;
  } catch (error) {
    console.error('Error refreshing maintenance mode:', error);
    return maintenanceModeEnabled;
  }
}

/**
 * Toggle maintenance mode on or off
 * @param enabled - Whether to enable or disable maintenance mode
 * @param userId - ID of the user making the change
 * @returns The new maintenance mode state
 */
export async function setMaintenanceMode(enabled: boolean, userId: number): Promise<boolean> {
  try {
    console.log(`Attempting to set maintenance mode to ${enabled ? 'ENABLED' : 'DISABLED'} by user ID ${userId}`);
    
    // Update the setting in the database
    const updatedSetting = await storage.updateSetting('maintenanceMode', enabled, userId);
    
    if (!updatedSetting) {
      console.error('Failed to update maintenance mode setting: Setting not found or database error');
      throw new Error('Failed to update maintenance mode setting');
    }
    
    // Update the cached value
    maintenanceModeEnabled = enabled;
    lastCheckTime = Date.now();
    
    console.log(`[TOGGLE] Maintenance mode is now ${enabled ? 'ENABLED' : 'DISABLED'} by user ID ${userId}`);
    return maintenanceModeEnabled;
  } catch (error) {
    console.error('Error setting maintenance mode:', error);
    // Re-fetch the current status to ensure cached value is correct
    await refreshMaintenanceMode();
    throw error;
  }
}

/**
 * Check if a user is an administrator (allowed during maintenance)
 * @param username - Username to check
 * @returns Whether the user is an administrator
 */
export function isAdministratorUser(username: string): boolean {
  // Basic check for admin username
  return username === ADMIN_USERNAME;
}

// Initialize on module load
refreshMaintenanceMode().catch(console.error);
