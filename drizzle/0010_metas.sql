CREATE TABLE IF NOT EXISTS "metas" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "tipo" text NOT NULL,
    "valor_alvo" integer NOT NULL,
    "data_inicio" date NOT NULL,
    "data_fim" date NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);
