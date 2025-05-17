import { db } from '$lib/server/db';
import { usersTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const PUT = async ({ request, locals }) => {
    if (!locals.user) {
        return new Response(JSON.stringify({ success: false, message: 'User not authenticated' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const body = await request.json();
        const { displayName, avatar } = body;
        
        if (!displayName && !avatar) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'At least one field (displayName or avatar) must be provided for update'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const updateData: any = {};
        
        if (avatar) {
            updateData.avatar = avatar;
        }

        if (displayName) {
            updateData.displayName = displayName;
        }
        
        // Always update the updatedAt timestamp
        updateData.updatedAt = new Date();
        
        // Update the user record
        const updatedUser = await db.update(usersTable)
            .set(updateData)
            .where(eq(usersTable.id, Number(locals.user.id)))
            .returning({
                id: usersTable.id,
                username: usersTable.username,
                displayName: usersTable.displayName,
                avatar: usersTable.avatar,
                updatedAt: usersTable.updatedAt
            });
            
        if (!updatedUser || updatedUser.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                message: 'User not found or update failed'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return new Response(JSON.stringify({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser[0]
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        return new Response(JSON.stringify({
            success: false,
            message: 'Error updating profile',
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
