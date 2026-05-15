CREATE TABLE "funis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "funil_etapas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"funil_id" uuid NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"tipo" text DEFAULT 'texto' NOT NULL,
	"conteudo" text DEFAULT '' NOT NULL,
	"intervalo_antes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "funis" ADD CONSTRAINT "funis_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funil_etapas" ADD CONSTRAINT "funil_etapas_funil_id_funis_id_fk" FOREIGN KEY ("funil_id") REFERENCES "public"."funis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "funis_user_id_idx" ON "funis" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "funil_etapas_funil_id_idx" ON "funil_etapas" USING btree ("funil_id");
