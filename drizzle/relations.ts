import { relations } from "drizzle-orm/relations";
import { threads, comments, users } from "./schema";

export const commentsRelations = relations(comments, ({one, many}) => ({
	thread: one(threads, {
		fields: [comments.threadId],
		references: [threads.id]
	}),
	user: one(users, {
		fields: [comments.userId],
		references: [users.id]
	}),
	comment: one(comments, {
		fields: [comments.quotedId],
		references: [comments.id],
		relationName: "comments_quotedId_comments_id"
	}),
	comments: many(comments, {
		relationName: "comments_quotedId_comments_id"
	}),
}));

export const threadsRelations = relations(threads, ({one, many}) => ({
	comments: many(comments),
	user: one(users, {
		fields: [threads.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	comments: many(comments),
	threads: many(threads),
}));