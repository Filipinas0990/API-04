ALTER TABLE "disparos" ADD COLUMN "kanban_etapa" text;--> statement-breakpoint
ALTER TABLE "disparos" ADD COLUMN "funil_id" uuid;--> statement-breakpoint
ALTER TABLE "disparos" ADD COLUMN "intervalo_segundos" integer DEFAULT 60;
