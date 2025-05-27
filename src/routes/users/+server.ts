import { db } from '$lib/server/db';
import { usersTable } from '$lib/server/db/schema.js';
import { eq, ilike, or } from 'drizzle-orm';

export const GET = async ({ url, locals }) => {
    // Check if the user is authenticated and is an admin
    if (!locals.user) {
        return new Response(JSON.stringify({ success: false, message: 'User not authenticated' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Verify the user is an admin
    const currentUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, Number(locals.user.id))
    });

    if (!currentUser || !currentUser.isAdmin) {
        return new Response(JSON.stringify({ success: false, message: 'Unauthorized. Admin access required.' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const searchTerm = url.searchParams.get('search') || '';
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        let users;
        
        if (searchTerm) {
            // Search users by username, displayName, or email
            users = await db
                .select({
                    id: usersTable.id,
                    username: usersTable.username,
                    displayName: usersTable.displayName,
                    email: usersTable.email,
                    createdAt: usersTable.createdAt,
                    lastOnline: usersTable.lastOnline,
                    isOnline: usersTable.isOnline,
                    isAdmin: usersTable.isAdmin,
                    avatar: usersTable.avatar
                })
                .from(usersTable)
                .where(
                    or(
                        ilike(usersTable.username, `%${searchTerm}%`),
                        ilike(usersTable.displayName, `%${searchTerm}%`),
                        ilike(usersTable.email, `%${searchTerm}%`)
                    )
                )
                .limit(limit)
                .offset(offset);
        } else {
            // Get all users with pagination
            users = await db
                .select({
                    id: usersTable.id,
                    username: usersTable.username,
                    displayName: usersTable.displayName,
                    email: usersTable.email,
                    createdAt: usersTable.createdAt,
                    lastOnline: usersTable.lastOnline,
                    isOnline: usersTable.isOnline,
                    isAdmin: usersTable.isAdmin,
                    avatar: usersTable.avatar
                })
                .from(usersTable)
                .limit(limit)
                .offset(offset);
        }

        // Get total count for pagination
        const totalUsers = await db.select().from(usersTable);
        const totalCount = totalUsers.length;

        return new Response(JSON.stringify({ 
            success: true, 
            users,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return new Response(JSON.stringify({ success: false, message: 'Error fetching users' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const PATCH = async ({ request, locals }) => {
    // Check if the user is authenticated and is an admin
    if (!locals.user) {
        return new Response(JSON.stringify({ success: false, message: 'User not authenticated' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Verify the user is an admin
    const currentUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, Number(locals.user.id))
    });

    if (!currentUser || !currentUser.isAdmin) {
        return new Response(JSON.stringify({ success: false, message: 'Unauthorized. Admin access required.' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { userId, updates } = await request.json();

        if (!userId) {
            return new Response(JSON.stringify({ success: false, message: 'User ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if target user exists
        const targetUser = await db.query.usersTable.findFirst({
            where: eq(usersTable.id, Number(userId))
        });

        if (!targetUser) {
            return new Response(JSON.stringify({ success: false, message: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Prevent admin from removing their own admin status (safety measure)
        if (Number(userId) === Number(locals.user.id) && updates.isAdmin === 0) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Cannot remove admin status from yourself' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate updates object - only allow specific fields
        const allowedFields = ['isAdmin', 'displayName', 'email'];
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

        // Add updatedAt timestamp
        sanitizedUpdates.updatedAt = new Date();

        // Update the user
        const updatedUser = await db
            .update(usersTable)
            .set(sanitizedUpdates)
            .where(eq(usersTable.id, Number(userId)))
            .returning();

        if (updatedUser.length === 0) {
            return new Response(JSON.stringify({ success: false, message: 'Failed to update user' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Return updated user (without password)
        const { password, ...userWithoutPassword } = updatedUser[0];

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'User updated successfully',
            user: userWithoutPassword
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        return new Response(JSON.stringify({ success: false, message: 'Error updating user' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const DELETE = async ({ request, locals }) => {
    // Check if the user is authenticated and is an admin
    if (!locals.user) {
        return new Response(JSON.stringify({ success: false, message: 'User not authenticated' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Verify the user is an admin
    const currentUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, Number(locals.user.id))
    });

    if (!currentUser || !currentUser.isAdmin) {
        return new Response(JSON.stringify({ success: false, message: 'Unauthorized. Admin access required.' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { userId } = await request.json();

        if (!userId) {
            return new Response(JSON.stringify({ success: false, message: 'User ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Prevent admin from deleting themselves
        if (Number(userId) === Number(locals.user.id)) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Cannot delete your own account' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if target user exists
        const targetUser = await db.query.usersTable.findFirst({
            where: eq(usersTable.id, Number(userId))
        });

        if (!targetUser) {
            return new Response(JSON.stringify({ success: false, message: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // TODO: In a production environment, you might want to:
        // 1. Soft delete (mark as deleted) instead of hard delete
        // 2. Handle cascading deletions for user's threads, comments, etc.
        // 3. Archive user data before deletion
        
        // For now, we'll implement a simple hard delete
        // Note: This might fail if there are foreign key constraints
        // In that case, you'd need to handle cascading deletions first

        const deletedUser = await db
            .delete(usersTable)
            .where(eq(usersTable.id, Number(userId)))
            .returning();

        if (deletedUser.length === 0) {
            return new Response(JSON.stringify({ success: false, message: 'Failed to delete user' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'User deleted successfully'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error deleting user:', error);
          // Check if it's a foreign key constraint error
        if (error instanceof Error && 'code' in error && error.code === '23503') {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Cannot delete user. User has associated data (threads, comments, etc.). Please delete or reassign user data first.' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ success: false, message: 'Error deleting user' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
