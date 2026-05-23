ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "plano" text DEFAULT 'basic';--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "plano_status" text DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "plano_expira_em" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "plano" text DEFAULT 'basic';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "plano_status" text DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "plano_expira_em" timestamp;
