import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { tagsTable, threadTagsTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// GET /tags - Get all tags
export const GET = async ({ locals }) => {
  // Check if the user is authenticated
  if (!locals.user) {
    return json({ error: 'User not authenticated' }, { status: 401 });
  }

  try {
    const tags = await db.select().from(tagsTable);
    return json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
};

// POST /tags - Create a new tag
export const POST = async ({ request, locals }) => {
  // Check if the user is authenticated
  if (!locals.user) {
    return json({ error: 'User not authenticated' }, { status: 401 });
  }

  try {
    const { name, description, color } = await request.json();
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return json({ error: 'Tag name is required' }, { status: 400 });
    }

    const now = new Date();
    const [tag] = await db.insert(tagsTable).values({
      name: name.trim(),
      description: description?.trim() || null,
      color: color?.trim() || null,
      createdAt: now,
      updatedAt: now
    }).returning();

    return json(tag, { status: 201 });  } catch (error: any) {
    console.error('Error creating tag:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505' && error.constraint === 'tags_name_unique') {
      return json({ error: 'A tag with this name already exists' }, { status: 409 });
    }
    
    return json({ error: 'Failed to create tag' }, { status: 500 });
  }
};

// PUT /tags - Update a tag
export const PUT = async ({ request, locals }) => {
  // Check if the user is authenticated
  if (!locals.user) {
    return json({ error: 'User not authenticated' }, { status: 401 });
  }

  try {
    const { id, name, description, color } = await request.json();
    
    if (!id || typeof id !== 'number') {
      return json({ error: 'Tag ID is required' }, { status: 400 });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return json({ error: 'Tag name is required' }, { status: 400 });
    }

    const [tag] = await db.update(tagsTable)
      .set({
        name: name.trim(),
        description: description?.trim() || null,
        color: color?.trim() || null,
        updatedAt: new Date()
      })
      .where(eq(tagsTable.id, id))
      .returning();

    if (!tag) {
      return json({ error: 'Tag not found' }, { status: 404 });
    }

    return json(tag);  } catch (error: any) {
    console.error('Error updating tag:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505' && error.constraint === 'tags_name_unique') {
      return json({ error: 'A tag with this name already exists' }, { status: 409 });
    }
    
    return json({ error: 'Failed to update tag' }, { status: 500 });
  }
};

// DELETE /tags - Delete a tag
export const DELETE = async ({ request, locals }) => {
  // Check if the user is authenticated
  if (!locals.user) {
    return json({ error: 'User not authenticated' }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    
    if (!id || typeof id !== 'number') {
      return json({ error: 'Tag ID is required' }, { status: 400 });
    }

    // First, delete all thread-tag associations for this tag
    await db.delete(threadTagsTable)
      .where(eq(threadTagsTable.tagId, id));

    // Then delete the tag itself
    const [deletedTag] = await db.delete(tagsTable)
      .where(eq(tagsTable.id, id))
      .returning();

    if (!deletedTag) {
      return json({ error: 'Tag not found' }, { status: 404 });
    }

    return json({ message: 'Tag deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting tag:', error);
    return json({ error: 'Failed to delete tag' }, { status: 500 });
  }
};
