//import db
import { db } from '$lib/server/db';
import { usersTable, threadsTable, commentsTable, tagsTable, threadTagsTable } from '$lib/server/db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';

export const POST = async ({ request, locals }) => {
    // Check if the user is authenticated
    if (!locals.user) {
        return new Response(JSON.stringify({ success: false, message: 'User not authenticated' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Fetch the user from the database
    const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, Number(locals.user!.id))
    });


    //create thread
    if (!user) {
        return new Response(JSON.stringify({ success: false, message: 'User not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    } else {
        try {
            const { title } = await request.json();
            const thread = await db.insert(threadsTable).values({
                title: title,
                userId: user.id,
                createdAt: new Date(),
                updatedAt: new Date()
            }).returning();
            return new Response(JSON.stringify({ success: true, thread }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Error creating thread:', error);
            return new Response(JSON.stringify({ success: false, message: 'Error creating thread' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
}

export const GET = async ({ locals }) => {
    // Check if the user is authenticated
    if (!locals.user) {
        return new Response(JSON.stringify({ success: false, message: 'User not authenticated' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const threadsWithUsersAndCounts = await db
            .select({
                id: threadsTable.id,
                title: threadsTable.title,
                userId: threadsTable.userId,
                createdAt: threadsTable.createdAt,
                updatedAt: threadsTable.updatedAt,
                displayName: usersTable.displayName,
                avatar: usersTable.avatar,
                commentCount: sql`COUNT(DISTINCT ${commentsTable.id})`
            })
            .from(threadsTable)
            .innerJoin(usersTable,
                eq(usersTable.id, threadsTable.userId)
            )
            .leftJoin(commentsTable,
                eq(commentsTable.threadId, threadsTable.id)
            )
            .groupBy(threadsTable.id, usersTable.displayName, usersTable.avatar)
            .orderBy(desc(threadsTable.updatedAt));        // Fetch tags for each thread
        const threadsWithTags = await Promise.all(
            threadsWithUsersAndCounts.map(async (thread: any) => {
                const tags = await db
                    .select({
                        id: tagsTable.id,
                        name: tagsTable.name,
                        description: tagsTable.description,
                        color: tagsTable.color
                    })
                    .from(threadTagsTable)
                    .innerJoin(tagsTable, eq(threadTagsTable.tagId, tagsTable.id))
                    .where(eq(threadTagsTable.threadId, thread.id));

                return {
                    ...thread,
                    tags
                };
            })
        ); return new Response(JSON.stringify({ success: true, threads: threadsWithTags }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error fetching threads:', error);
        return new Response(JSON.stringify({ success: false, message: 'Error fetching threads' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export const DELETE = async ({ request, locals }) => {
    // Check if the user is authenticated
    if (!locals.user) {
        return new Response(JSON.stringify({ success: false, message: 'User not authenticated' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { threadId } = await request.json();

        // Verify the thread exists and belongs to the user
        const thread = await db.query.threadsTable.findFirst({
            where: eq(threadsTable.id, Number(threadId))
        });

        if (!thread) {
            return new Response(JSON.stringify({ success: false, message: 'Thread not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (thread.userId !== Number(locals.user.id)) {
            return new Response(JSON.stringify({ success: false, message: 'Unauthorized to delete this thread' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Delete associated thread tags first (foreign key constraint)
        await db.delete(threadTagsTable).where(eq(threadTagsTable.threadId, Number(threadId)));

        // Delete associated comments
        await db.delete(commentsTable).where(eq(commentsTable.threadId, Number(threadId)));

        // Delete the thread
        await db.delete(threadsTable).where(eq(threadsTable.id, Number(threadId)));

        return new Response(JSON.stringify({ success: true, message: 'Thread deleted successfully' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error deleting thread:', error);
        return new Response(JSON.stringify({ success: false, message: 'Error deleting thread' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

