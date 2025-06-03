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
            temperature: 0.7,
            system: `You are writing a comment as if you are the user. Analyze their previous comments to understand their writing style, tone, and perspective. Then write a thoughtful comment that contributes meaningfully to the thread discussion while maintaining consistency with the user's voice. Keep the comment natural, engaging, and relevant to the thread topic.`,
            messages: [
            {
                role: "user",
                content: `
                Write a comment for this thread as if you are me. Base your writing style on my previous comments.
                
                THREAD TITLE: 
                ${thread.title}
                
                THREAD DISCUSSION:
                ${threadComments.map((comment: { content: any; }, index: number) => `Comment ${index + 1}: ${comment.content}`).join('\n\n')}
                
                MY PREVIOUS COMMENTS (to learn my writing style):
                ${userComments.map((comment: { content: any; }, index: number) => `${index + 1}. ${comment.content}`).join('\n\n')}
                
                Write a comment that adds value to the discussion while sounding like me.`
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