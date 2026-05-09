ALTER TABLE "visitas" ADD COLUMN "nome_cliente" text;--> statement-breakpoint
ALTER TABLE "visitas" ADD COLUMN "telefone_cliente" text;--> statement-breakpoint
ALTER TABLE "visitas" ADD COLUMN "lembrete_enviado_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "visitas" ADD COLUMN "confirmada" boolean;--> statement-breakpoint
ALTER TABLE "visitas" ADD COLUMN "lembrete_respondido_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "visitas" ADD COLUMN "tarefa_lembrete_criada" boolean DEFAULT false;