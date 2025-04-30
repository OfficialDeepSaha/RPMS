/**
 * MAINTENANCE MODE CHECKER
 * Centralized, reliable function to check maintenance mode status
 */
import { storage } from "./storage";

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
    maintenanceModeEnabled = setting?.value === 'true';
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
    maintenanceModeEnabled = setting?.value === 'true';
    lastCheckTime = Date.now();
    console.log(`[REFRESH] Maintenance mode is now ${maintenanceModeEnabled ? 'ENABLED' : 'DISABLED'}`);
    return maintenanceModeEnabled;
  } catch (error) {
    console.error('Error refreshing maintenance mode:', error);
    return maintenanceModeEnabled;
  }
}

// Initialize on module load
refreshMaintenanceMode().catch(console.error);
