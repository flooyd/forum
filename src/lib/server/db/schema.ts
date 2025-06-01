import { pgTable, serial, text, integer, PgColumn, timestamp, bigint } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
    id: serial('id').primaryKey(),
    username: text('username').notNull(),
    displayName: text('display_name').notNull(),
    email: text('email').notNull(),
    password: text('password').notNull(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at'),
    lastOnline: timestamp('last_online').notNull(),
    isOnline: integer('is_online').notNull(),
    avatar: text('avatar'),
    isAdmin: integer('is_admin')
});

export const threadsTable = pgTable('threads', {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    userId: integer('user_id').notNull().references(() => usersTable.id),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at')
});

export const commentsTable = pgTable('comments', {
    id: serial('id').primaryKey(),
    threadId: integer('thread_id').notNull().references(() => threadsTable.id),
    userId: integer('user_id').notNull().references(() => usersTable.id),
    quotedId: integer('quoted_id').references((): PgColumn => commentsTable.id),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at'),
	isEdited: integer('is_edited').notNull(),
	isDeleted: integer('is_deleted').notNull(),
	isReported: integer('is_reported').notNull(),
});

export const tagsTable = pgTable('tags', {
    id: serial('id').primaryKey(),
    name: text('name').notNull().unique(),
    description: text('description'),
    color: text('color'), // Hex color code for tag styling
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at')
});

export const threadTagsTable = pgTable('thread_tags', {
    id: serial('id').primaryKey(),
    threadId: integer('thread_id').notNull().references(() => threadsTable.id),
    tagId: integer('tag_id').notNull().references(() => tagsTable.id),
    createdAt: timestamp('created_at').notNull()
});

export const imagesTable = pgTable('images', {
    id: serial('id').primaryKey(),
    filename: text('filename').notNull(), // Original filename
    storedFilename: text('stored_filename').notNull(), // UUID filename or Vercel Blob URL
    mimeType: text('mime_type').notNull(),
    size: bigint('size', { mode: 'number' }).notNull(), // File size in bytes
    uploadedBy: integer('uploaded_by').notNull().references(() => usersTable.id),
    threadId: integer('thread_id').references(() => threadsTable.id), // If attached to a thread
    commentId: integer('comment_id').references(() => commentsTable.id), // If attached to a comment
    alt: text('alt'), // Alt text for accessibility
    createdAt: timestamp('created_at').notNull(),
    isDeleted: integer('is_deleted').notNull().default(0)
});


