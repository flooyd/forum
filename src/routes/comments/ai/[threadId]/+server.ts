import { db } from '$lib/server/db';
import { commentsTable, usersTable, threadsTable } from '$lib/server/db/schema.js';
import { asc, desc, eq } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// POST function that uses locals to create a comment associated with the thread
export const GET = async ({ locals, params, request }) => {
    //check if the user is authenticated
    if (!locals.user) {
        return new Response(JSON.stringify({ success: false, message: 'User not authenticated' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const threadId = params.threadId;

    const thread = await db.query.threadsTable.findFirst({
        where: eq(threadsTable.id, Number(threadId))
    });

    if (!thread) {
        return new Response(JSON.stringify({ success: false, message: 'Thread not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Fetch the comments for the thread
    try {
        const threadComments = await db.select({
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
            .orderBy(desc(commentsTable.createdAt));

        const userComments = await db.select({
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
            .where(eq(commentsTable.userId, Number(locals.user.id)))
            .limit(10)
            .offset(0)
            .orderBy(desc(commentsTable.createdAt));

        const msg = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            temperature: .5,
            system: "Impersonate the user and add a comment to the thread. Prioritize thread comments over user comments.",
            messages: [
                {
                    role: "user",
                    content: `
                    ---THREAD TITLE--- 
                    ${thread.title}
                    ---THREAD COMMENTS--- 
                    ${threadComments.map((comment: { content: any; }) => comment.content).join('\n')}
                    ---USER COMMENTS--- 
                    ${userComments.map((comment: { content: any; }) => comment.content).join('\n')}`
                }
            ]
        });
        console.log(msg);

        return new Response(JSON.stringify({
            success: true,
            aiComment: msg.content[0].type === 'text' ? msg.content[0].text : '',
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        return new Response(JSON.stringify({ success: false, message: 'Error fetching comments' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}