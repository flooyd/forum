CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"created_at" integer NOT NULL,
	"updated_at" integer NOT NULL,
	"last_online" integer NOT NULL,
	"is_online" integer NOT NULL
);
