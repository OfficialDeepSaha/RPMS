/**
 * MAINTENANCE MODE CHECKER
 * Centralized, reliable function to check maintenance mode status
 */
import { storage } from "./storage";

// Admin username constant
export const ADMIN_USERNAME = 'admin';

// Admin role name constant
export const ADMIN_ROLE_NAME = 'Administrator';

// Cache the maintenance mode status but refresh it regularly
let maintenanceModeEnabled = false;
let lastCheckTime = 0;
const CACHE_DURATION = 5000; // 5 seconds

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
    
    // Ensure boolean type and convert to string "true"/"false" for database compatibility
    // Many NoSQL databases store values as strings, so we'll try both formats
    const boolEnabled = Boolean(enabled);
    const stringEnabled = boolEnabled ? "true" : "false";
    
    // Try multiple formats to handle different database schema expectations
    let updatedSetting = null;
    let retries = 0;
    const maxRetries = 3;
    
    while (!updatedSetting && retries < maxRetries) {
      try {
        // First try with boolean value
        updatedSetting = await storage.updateSetting('maintenanceMode', boolEnabled, userId);
        
        // If that fails, try with string value
        if (!updatedSetting) {
          console.log('Boolean value failed, trying string format...');
          updatedSetting = await storage.updateSetting('maintenanceMode', stringEnabled, userId);
        }
        
        // If we get a result, break out of the loop
        if (updatedSetting) break;
      } catch (retryError) {
        console.error(`Retry ${retries + 1}/${maxRetries} failed:`, retryError);
        
        // Try alternative format on failure
        if (retries === 0) {
          try {
            console.log('Initial attempt failed, trying alternative format...');
            updatedSetting = await storage.updateSetting('maintenanceMode', stringEnabled, userId);
            if (updatedSetting) break;
          } catch (altError) {
            console.error('Alternative format also failed:', altError);
          }
        }
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, retries)));
      retries++;
    }
    
    // Last resort - try to create the setting if it doesn't exist
    if (!updatedSetting && retries >= maxRetries) {
      console.log('All updates failed, attempting to create setting...');
      try {
        // Check if setting exists
        const existingSetting = await storage.getSetting('maintenanceMode');
        
        if (!existingSetting) {
          // If setting doesn't exist, create it
          console.log('Maintenance mode setting not found, creating it...');
          // This would require a createSetting method in storage
          // As a fallback, we can try to reset the settings instead
          await storage.resetSettings('general', userId);
          
          // Try update again after reset
          updatedSetting = await storage.updateSetting('maintenanceMode', boolEnabled, userId);
        }
      } catch (createError) {
        console.error('Failed to create/initialize maintenance setting:', createError);
      }
    }
    
    if (!updatedSetting) {
      console.error('Failed to update maintenance mode setting after multiple retries');
      throw new Error('Failed to update maintenance mode setting');
    }
    
    // Update the cached value
    maintenanceModeEnabled = boolEnabled;
    lastCheckTime = Date.now();
    
    console.log(`[TOGGLE] Maintenance mode is now ${boolEnabled ? 'ENABLED' : 'DISABLED'} by user ID ${userId}`);
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
 * @returns Whether the user is an administrator by username
 */
export function isAdministratorUser(username: string): boolean {
  // Basic check for admin username
  return username === ADMIN_USERNAME;
}

/**
 * More thorough check if a user is an administrator by checking roles
 * @param userId - User ID to check
 * @returns Promise that resolves to whether the user has admin role
 */
export async function isAdministratorByRole(userId: number): Promise<boolean> {
  try {
    // Get user roles from storage
    const userRoles = await storage.getUserRoles(userId);
    
    // Check if any role is the Administrator role
    return userRoles.some(role => role.name === ADMIN_ROLE_NAME);
  } catch (error) {
    console.error('Error checking admin role:', error);
    return false;
  }
}

// Initialize on module load
refreshMaintenanceMode().catch(console.error);
