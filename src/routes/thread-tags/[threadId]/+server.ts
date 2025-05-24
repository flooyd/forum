import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { threadTagsTable, tagsTable, threadsTable } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /thread-tags/[threadId] - Get tags for a specific thread
export const GET = async ({ params, locals }) => {
  // Check if the user is authenticated
  if (!locals.user) {
    return json({ error: 'User not authenticated' }, { status: 401 });
  }

  try {
    const threadId = parseInt(params.threadId);
    
    if (isNaN(threadId)) {
      return json({ error: 'Invalid thread ID' }, { status: 400 });
    }

    const threadTags = await db
      .select({
        id: tagsTable.id,
        name: tagsTable.name,
        description: tagsTable.description,
        color: tagsTable.color,
        createdAt: threadTagsTable.createdAt
      })
      .from(threadTagsTable)
      .innerJoin(tagsTable, eq(threadTagsTable.tagId, tagsTable.id))
      .where(eq(threadTagsTable.threadId, threadId));

    return json(threadTags);
  } catch (error) {
    console.error('Error fetching thread tags:', error);
    return json({ error: 'Failed to fetch thread tags' }, { status: 500 });
  }
};

// POST /thread-tags/[threadId] - Add a tag to a thread
export const POST = async ({ params, request, locals }) => {
  // Check if the user is authenticated
  if (!locals.user) {
    return json({ error: 'User not authenticated' }, { status: 401 });
  }

  try {
    const threadId = parseInt(params.threadId);
    const { tagId } = await request.json();
    
    if (isNaN(threadId)) {
      return json({ error: 'Invalid thread ID' }, { status: 400 });
    }

    if (!tagId || typeof tagId !== 'number') {
      return json({ error: 'Tag ID is required' }, { status: 400 });
    }

    // Check if the association already exists
    const existing = await db
      .select()
      .from(threadTagsTable)
      .where(
        and(
          eq(threadTagsTable.threadId, threadId),
          eq(threadTagsTable.tagId, tagId)
        )
      );

    if (existing.length > 0) {
      return json({ error: 'Tag is already associated with this thread' }, { status: 409 });
    }

    const [threadTag] = await db.insert(threadTagsTable).values({
      threadId,
      tagId,
      createdAt: new Date()
    }).returning();

    // Return the tag details along with the association
    const [tagDetails] = await db
      .select()
      .from(tagsTable)
      .where(eq(tagsTable.id, tagId));

    return json({
      ...threadTag,
      tag: tagDetails
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding tag to thread:', error);
    return json({ error: 'Failed to add tag to thread' }, { status: 500 });
  }
};

// DELETE /thread-tags/[threadId] - Remove a tag from a thread
export const DELETE = async ({ params, request, locals }) => {
  // Check if the user is authenticated
  if (!locals.user) {
    return json({ error: 'User not authenticated' }, { status: 401 });
  }

  try {
    const threadId = parseInt(params.threadId);
    const { tagId } = await request.json();
    
    if (isNaN(threadId)) {
      return json({ error: 'Invalid thread ID' }, { status: 400 });
    }

    if (!tagId || typeof tagId !== 'number') {
      return json({ error: 'Tag ID is required' }, { status: 400 });
    }

    const [deletedAssociation] = await db
      .delete(threadTagsTable)
      .where(
        and(
          eq(threadTagsTable.threadId, threadId),
          eq(threadTagsTable.tagId, tagId)
        )
      )
      .returning();

    if (!deletedAssociation) {
      return json({ error: 'Tag association not found' }, { status: 404 });
    }

    return json({ message: 'Tag removed from thread successfully' });
  } catch (error) {
    console.error('Error removing tag from thread:', error);
    return json({ error: 'Failed to remove tag from thread' }, { status: 500 });
  }
};
