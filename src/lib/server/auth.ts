import { db } from './db';
import { usersTable } from './db/schema.js';
import { eq } from 'drizzle-orm';

// Cache for admin status to reduce database queries
// Using Map with user ID as key and { isAdmin: boolean, timestamp: number } as value
const adminCache = new Map<number, { isAdmin: boolean; timestamp: number }>();

// Cache duration: 5 minutes (300,000 ms)
// This balances performance with ensuring admin status is relatively fresh
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Checks if a user is an admin with caching to reduce database queries
 * @param userId - The user ID to check
 * @returns Promise<boolean> - Whether the user is an admin
 */
export async function isUserAdmin(userId: number): Promise<boolean> {
    const now = Date.now();
    const cached = adminCache.get(userId);
    
    // Return cached result if it's still valid
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        return cached.isAdmin;
    }
    
    try {
        // Query database for current admin status
        const user = await db.query.usersTable.findFirst({
            where: eq(usersTable.id, userId),
            columns: { isAdmin: true }
        });
        
        const isAdmin = user?.isAdmin || false;
        
        // Update cache
        adminCache.set(userId, { isAdmin, timestamp: now });
        
        return isAdmin;
    } catch (error) {
        console.error('Error checking admin status:', error);
        // Return false on error to be safe
        return false;
    }
}

/**
 * Clears the admin cache for a specific user
 * Call this when a user's admin status changes
 * @param userId - The user ID to clear from cache
 */
export function clearAdminCache(userId: number): void {
    adminCache.delete(userId);
}

/**
 * Clears the entire admin cache
 * Call this sparingly, only when needed (e.g., bulk admin changes)
 */
export function clearAllAdminCache(): void {
    adminCache.clear();
}

/**
 * Middleware helper for checking admin authentication
 * @param locals - SvelteKit locals object containing user info
 * @returns Promise<{ isAuthenticated: boolean; isAdmin: boolean; userId?: number }>
 */
export async function checkAdminAuth(locals: any): Promise<{
    isAuthenticated: boolean;
    isAdmin: boolean;
    userId?: number;
}> {
    // Check if user is authenticated
    if (!locals.user) {
        return { isAuthenticated: false, isAdmin: false };
    }
    
    const userId = Number(locals.user.id);
    
    // Check if user is admin
    const isAdmin = await isUserAdmin(userId);
    
    return {
        isAuthenticated: true,
        isAdmin,
        userId
    };
}

/**
 * Creates a standardized unauthorized response
 * @param message - Custom error message
 * @param status - HTTP status code (401 for unauthenticated, 403 for unauthorized)
 * @returns Response object
 */
export function createUnauthorizedResponse(
    message: string = 'Unauthorized',
    status: number = 403
): Response {
    return new Response(
        JSON.stringify({ success: false, message }),
        {
            status,
            headers: { 'Content-Type': 'application/json' }
        }
    );
}
