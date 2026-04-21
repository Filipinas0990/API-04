CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"gestor_responsalvel" text,
	"temperatura" text,
	"interrese_lead" text,
	"observacao" text,
	"data_criacao" timestamp DEFAULT now(),
	CONSTRAINT "leads_email_unique" UNIQUE("email")
);
