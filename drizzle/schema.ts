import { pgTable, serial, text, integer, timestamp, foreignKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: text().notNull(),
	displayName: text("display_name").notNull(),
	email: text().notNull(),
	password: text().notNull(),
	isOnline: integer("is_online").notNull(),
	avatar: text(),
	isAdmin: integer("is_admin"),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	lastOnline: timestamp("last_online", { mode: 'string' }).notNull(),
});

export const comments = pgTable("comments", {
	id: serial().primaryKey().notNull(),
	threadId: integer("thread_id").notNull(),
	userId: integer("user_id").notNull(),
	quotedId: integer("quoted_id"),
	content: text().notNull(),
	isEdited: integer("is_edited").notNull(),
	isDeleted: integer("is_deleted").notNull(),
	isReported: integer("is_reported").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.threadId],
			foreignColumns: [threads.id],
			name: "comments_thread_id_threads_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "comments_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.quotedId],
			foreignColumns: [table.id],
			name: "comments_quoted_id_comments_id_fk"
		}),
]);

export const threads = pgTable("threads", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	userId: integer("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "threads_user_id_users_id_fk"
		}),
]);
