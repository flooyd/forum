import { db } from '$lib/server/db';
import { commentsTable, usersTable, threadsTable } from '$lib/server/db/schema.js';
import { asc, eq } from 'drizzle-orm';

//GET function that uses locals and query param to get the comments associated with the thread

export const GET = async ({ locals, params }) => {
    // check if the user is authenticated
    if (!locals.user) {
        return new Response(JSON.stringify({ success: false, message: 'User not authenticated' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // get the threadId from the query params
    const threadId = params.threadId;

    // check if the threadId is valid
    if (!threadId) {
        return new Response(JSON.stringify({ success: false, message: 'Invalid threadId' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    //get the thread title
    const thread = await db.query.threadsTable.findFirst({
        where: eq(threadsTable.id, Number(threadId))
    });

    // check if the thread is found
    if (!thread) {
        return new Response(JSON.stringify({ success: false, message: 'Thread not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const threadTitle = thread.title;

    //fetch the comments from the database, joining with threads and users tables
    const comments = await db
        .select({
            id: commentsTable.id,
            content: commentsTable.content,
            createdAt: commentsTable.createdAt,
            updatedAt: commentsTable.updatedAt,
            userId: commentsTable.userId,
            threadId: commentsTable.threadId,
            displayName: usersTable.displayName,
            avatar: usersTable.avatar
        }).from(commentsTable)
        .innerJoin(usersTable, eq(commentsTable.userId, usersTable.id))
        .where(eq(commentsTable.threadId, Number(threadId)))
        .orderBy(asc(commentsTable.createdAt))

    // return the comments
    return new Response(JSON.stringify({ success: true, comments, threadTitle }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

// POST function that uses locals to create a comment associated with the thread
export const POST = async ({ locals, params, request }) => {
    //check if the user is authenticated
    if (!locals.user) {
        return new Response(JSON.stringify({ success: false, message: 'User not authenticated' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    //get the threadId from the query params
    const threadId = params.threadId;

    //check if the threadId is valid
    if (!threadId) {
        return new Response(JSON.stringify({ success: false, message: 'Invalid threadId' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Parse the request body
        const { content, quotedId } = await request.json();

        if (!content) {
            return new Response(JSON.stringify({ success: false, message: 'Content is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Insert the comment
        const comment = await db.insert(commentsTable).values({
            content: content,
            threadId: Number(threadId),
            userId: Number(locals.user.id),
            quotedId: quotedId ? Number(quotedId) : null,
            createdAt: new Date(),
            updatedAt: null,
            isEdited: 0,
            isDeleted: 0,
            isReported: 0
        }).returning();

        if (!comment) {
            return new Response(JSON.stringify({ success: false, message: 'Error creating comment' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            //update thread updatedAt
            await db.update(threadsTable).set({
                updatedAt: new Date()
            }).where(eq(threadsTable.id, Number(threadId)));
            
            return new Response(JSON.stringify({ success: true, comment }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (error) {
        console.error('Error creating comment:', error);
        return new Response(JSON.stringify({ success: false, message: 'Error creating comment' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export const PUT = async ({ locals, params, request }) => {
    if(!locals.user) {
        return new Response(JSON.stringify({ success: false, message: 'User not authenticated' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    //get the commentId from request json
    const { commentId, content } = await request.json();

    //check if user is the owner of the comment
    const comment = await db.query.commentsTable.findFirst({
        where: eq(commentsTable.id, Number(commentId))
    });

    if (!comment) {
        return new Response(JSON.stringify({ success: false, message: 'Comment not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (comment.userId !== Number(locals.user.id)) {
        return new Response(JSON.stringify({ success: false, message: 'User not authorized to edit this comment' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    //update the comment
    const updatedComments = await db.update(commentsTable).set({
        content: content,
        updatedAt: new Date(),
        isEdited: 1
    }).where(eq(commentsTable.id, Number(commentId))).returning();

    if (!updatedComments) {
        return new Response(JSON.stringify({ success: false, message: 'Error updating comment' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    } else {
        return new Response(JSON.stringify({ success: true, updatedComment: updatedComments[0] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export const DELETE = async ({ request, locals, params }) => {
    if(!locals.user) {
        return new Response(JSON.stringify({ success: false, message: 'User not authenticated' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    //get the commentId from request json
    const { commentId } = await request.json();

    //check if the commentId is valid
    if (!commentId) {
        return new Response(JSON.stringify({ success: false, message: 'Invalid commentId' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    //check if user is the owner of the comment
    const comment = await db.query.commentsTable.findFirst({
        where: eq(commentsTable.id, Number(commentId))
    });

    if (!comment) {
        return new Response(JSON.stringify({ success: false, message: 'Comment not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (comment.userId !== Number(locals.user.id)) {
        return new Response(JSON.stringify({ success: false, message: 'User not authorized to delete this comment' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    //delete the comment
    const deletedComment = await db.delete(commentsTable).where(eq(commentsTable.id, Number(commentId))).returning();

    if (!deletedComment) {
        return new Response(JSON.stringify({ success: false, message: 'Error deleting comment' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    } else {
        return new Response(JSON.stringify({ success: true, deletedComment }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}