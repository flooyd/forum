import { db } from '$lib/server/db';
import { usersTable, threadsTable, commentsTable } from '$lib/server/db/schema.js';
import { eq, sql, count } from 'drizzle-orm';
import { checkAdminAuth, createUnauthorizedResponse, clearAdminCache } from '$lib/server/auth';

export const GET = async ({ url, locals }) => {
    // Check authentication and admin status
    const auth = await checkAdminAuth(locals);
    
    if (!auth.isAuthenticated) {
        return createUnauthorizedResponse('User not authenticated', 401);
    }
    
    if (!auth.isAdmin) {
        return createUnauthorizedResponse('Unauthorized. Admin access required.');
    }

    try {
        const action = url.searchParams.get('action');

        switch (action) {
            case 'stats':
                return await getSystemStats();
            case 'recent-activity':
                return await getRecentActivity();
            default:
                return new Response(JSON.stringify({ 
                    success: false, 
                    message: 'Invalid action. Available actions: stats, recent-activity' 
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
        }
    } catch (error) {
        console.error('Error in admin endpoint:', error);
        return new Response(JSON.stringify({ success: false, message: 'Error processing admin request' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

async function getSystemStats() {
    try {
        // Get total counts
        const [totalUsersResult] = await db.select({ count: count() }).from(usersTable);
        const [totalThreadsResult] = await db.select({ count: count() }).from(threadsTable);
        const [totalCommentsResult] = await db.select({ count: count() }).from(commentsTable);

        // Get admin count
        const [adminCountResult] = await db
            .select({ count: count() })
            .from(usersTable)
            .where(eq(usersTable.isAdmin, 1));

        // Get online users count
        const [onlineUsersResult] = await db
            .select({ count: count() })
            .from(usersTable)
            .where(eq(usersTable.isOnline, 1));

        // Get recent registrations (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const [recentRegistrationsResult] = await db
            .select({ count: count() })
            .from(usersTable)
            .where(sql`${usersTable.createdAt} >= ${sevenDaysAgo}`);

        // Get recent threads (last 7 days)
        const [recentThreadsResult] = await db
            .select({ count: count() })
            .from(threadsTable)
            .where(sql`${threadsTable.createdAt} >= ${sevenDaysAgo}`);

        // Get recent comments (last 7 days)
        const [recentCommentsResult] = await db
            .select({ count: count() })
            .from(commentsTable)
            .where(sql`${commentsTable.createdAt} >= ${sevenDaysAgo}`);

        const stats = {
            totalUsers: totalUsersResult.count,
            totalThreads: totalThreadsResult.count,
            totalComments: totalCommentsResult.count,
            adminCount: adminCountResult.count,
            onlineUsers: onlineUsersResult.count,
            recentActivity: {
                newUsers: recentRegistrationsResult.count,
                newThreads: recentThreadsResult.count,
                newComments: recentCommentsResult.count
            }
        };

        return new Response(JSON.stringify({ 
            success: true, 
            stats 
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error getting system stats:', error);
        throw error;
    }
}

async function getRecentActivity() {
    try {
        // Get recent users (last 10)
        const recentUsers = await db
            .select({
                id: usersTable.id,
                username: usersTable.username,
                displayName: usersTable.displayName,
                createdAt: usersTable.createdAt,
                isAdmin: usersTable.isAdmin
            })
            .from(usersTable)
            .orderBy(sql`${usersTable.createdAt} DESC`)
            .limit(10);

        // Get recent threads (last 10)
        const recentThreads = await db
            .select({
                id: threadsTable.id,
                title: threadsTable.title,
                createdAt: threadsTable.createdAt,
                username: usersTable.username,
                displayName: usersTable.displayName
            })
            .from(threadsTable)
            .innerJoin(usersTable, eq(threadsTable.userId, usersTable.id))
            .orderBy(sql`${threadsTable.createdAt} DESC`)
            .limit(10);

        // Get recent comments (last 10)
        const recentComments = await db
            .select({
                id: commentsTable.id,
                content: sql`LEFT(${commentsTable.content}, 100)`.as('content'), // Truncate content
                createdAt: commentsTable.createdAt,
                threadId: commentsTable.threadId,
                threadTitle: threadsTable.title,
                username: usersTable.username,
                displayName: usersTable.displayName
            })
            .from(commentsTable)
            .innerJoin(usersTable, eq(commentsTable.userId, usersTable.id))
            .innerJoin(threadsTable, eq(commentsTable.threadId, threadsTable.id))
            .orderBy(sql`${commentsTable.createdAt} DESC`)
            .limit(10);

        const activity = {
            recentUsers,
            recentThreads,
            recentComments
        };

        return new Response(JSON.stringify({ 
            success: true, 
            activity 
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error getting recent activity:', error);
        throw error;
    }
}

export const POST = async ({ request, locals }) => {
    // Check authentication and admin status
    const auth = await checkAdminAuth(locals);
    
    if (!auth.isAuthenticated) {
        return createUnauthorizedResponse('User not authenticated', 401);
    }
    
    if (!auth.isAdmin) {
        return createUnauthorizedResponse('Unauthorized. Admin access required.');
    }

    try {
        const { action, data } = await request.json();

        switch (action) {
            case 'bulk-update-users':
                return await bulkUpdateUsers(data);
            case 'promote-user':
                return await promoteUser(data.userId);
            case 'demote-user':
                return await demoteUser(data.userId, auth.userId!);
            default:
                return new Response(JSON.stringify({ 
                    success: false, 
                    message: 'Invalid action. Available actions: bulk-update-users, promote-user, demote-user' 
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
        }
    } catch (error) {
        console.error('Error in admin POST endpoint:', error);
        return new Response(JSON.stringify({ success: false, message: 'Error processing admin request' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

async function promoteUser(userId: number) {
    try {
        if (!userId) {
            return new Response(JSON.stringify({ success: false, message: 'User ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if user exists
        const user = await db.query.usersTable.findFirst({
            where: eq(usersTable.id, Number(userId))
        });

        if (!user) {
            return new Response(JSON.stringify({ success: false, message: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (user.isAdmin === 1) {
            return new Response(JSON.stringify({ success: false, message: 'User is already an admin' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }        // Promote user to admin
        const updatedUser = await db
            .update(usersTable)
            .set({ 
                isAdmin: 1,
                updatedAt: new Date()
            })
            .where(eq(usersTable.id, Number(userId)))
            .returning();

        // Clear admin cache for this user since status changed
        clearAdminCache(Number(userId));

        return new Response(JSON.stringify({ 
            success: true, 
            message: `User ${user.displayName} has been promoted to admin`,
            user: updatedUser[0]
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error promoting user:', error);
        throw error;
    }
}

async function demoteUser(userId: number, currentUserId: number) {
    try {
        if (!userId) {
            return new Response(JSON.stringify({ success: false, message: 'User ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Prevent admin from demoting themselves
        if (Number(userId) === currentUserId) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Cannot demote yourself' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if user exists
        const user = await db.query.usersTable.findFirst({
            where: eq(usersTable.id, Number(userId))
        });

        if (!user) {
            return new Response(JSON.stringify({ success: false, message: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (user.isAdmin !== 1) {
            return new Response(JSON.stringify({ success: false, message: 'User is not an admin' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }        // Demote user from admin
        const updatedUser = await db
            .update(usersTable)
            .set({ 
                isAdmin: 0,
                updatedAt: new Date()
            })
            .where(eq(usersTable.id, Number(userId)))
            .returning();

        // Clear admin cache for this user since status changed
        clearAdminCache(Number(userId));

        return new Response(JSON.stringify({ 
            success: true, 
            message: `User ${user.displayName} has been demoted from admin`,
            user: updatedUser[0]
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error demoting user:', error);
        throw error;
    }
}

async function bulkUpdateUsers(data: { userIds: number[], updates: any }) {
    try {
        const { userIds, updates } = data;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return new Response(JSON.stringify({ success: false, message: 'User IDs array is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate updates object - only allow specific fields
        const allowedFields = ['isAdmin'];
        const sanitizedUpdates: any = {};

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                sanitizedUpdates[key] = value;
            }
        }

        if (Object.keys(sanitizedUpdates).length === 0) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'No valid fields to update' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        sanitizedUpdates.updatedAt = new Date();        // Perform bulk update
        const results = [];
        for (const userId of userIds) {
            try {
                const updatedUser = await db
                    .update(usersTable)
                    .set(sanitizedUpdates)
                    .where(eq(usersTable.id, Number(userId)))
                    .returning();
                
                if (updatedUser.length > 0) {
                    // Clear admin cache if isAdmin field was updated
                    if ('isAdmin' in sanitizedUpdates) {
                        clearAdminCache(Number(userId));
                    }
                    results.push({ userId, success: true, user: updatedUser[0] });
                } else {
                    results.push({ userId, success: false, error: 'User not found' });
                }} catch (error) {
                results.push({ userId, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        return new Response(JSON.stringify({ 
            success: true, 
            message: `Bulk update completed. ${successCount} successful, ${failureCount} failed.`,
            results
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error in bulk update:', error);
        throw error;
    }
}
