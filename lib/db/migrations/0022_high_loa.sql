ALTER TABLE "accounts" ALTER COLUMN "provider" SET DEFAULT 'google';--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "selected_agent" SET DEFAULT 'ollama';--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "max_duration" SET DEFAULT 300;--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "keep_alive";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "sandbox_id";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "sandbox_url";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "preview_url";