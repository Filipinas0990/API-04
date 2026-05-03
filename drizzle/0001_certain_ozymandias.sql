CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"email" varchar(200) NOT NULL,
	"password" varchar(300) NOT NULL,
	"phone" varchar(20),
	"creci" varchar(50),
	"avatar_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "imoveis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"titulo" text NOT NULL,
	"descricao" text,
	"tipo" text,
	"status" text DEFAULT 'Ativo',
	"fase_obra" text DEFAULT 'Sem fase definida',
	"classificacao" text,
	"construtora" text,
	"preco" numeric(14, 2),
	"preco_varia" boolean DEFAULT false,
	"sob_consulta" boolean DEFAULT false,
	"iptu" numeric(14, 2),
	"condominio" numeric(14, 2),
	"renda_ideal" numeric(14, 2),
	"entrada" numeric(14, 2),
	"parcelas" integer,
	"taxa_juros" numeric(6, 4),
	"fgts" boolean DEFAULT false,
	"deposito" numeric(14, 2),
	"periodo_aluguel" text DEFAULT 'Mensal',
	"quartos" integer,
	"banheiros" integer,
	"vagas_garagem" integer DEFAULT 0,
	"area" numeric(10, 2),
	"area_minima" numeric(10, 2),
	"area_maxima" numeric(10, 2),
	"unidades_disponiveis" integer DEFAULT 0,
	"mobiliado" boolean DEFAULT false,
	"aceita_pets" boolean DEFAULT false,
	"endereco" text,
	"complemento" text,
	"bairro" text,
	"cidade" text,
	"estado" text,
	"cep" text,
	"foto_path" text,
	"foto_url" text,
	"id_canal_pro" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lead_id" uuid,
	"imovel_id" uuid,
	"tipo" text DEFAULT 'Venda',
	"status" text DEFAULT 'Em negociação',
	"valor" numeric(14, 2) NOT NULL,
	"data_venda" date,
	"observacoes" text,
	"construtora" text,
	"base_calculo_tipo" text DEFAULT 'Base do cálculo porcentagem',
	"base_calculo_pct" numeric(6, 2) DEFAULT '4.00',
	"percentual_imposto" numeric(6, 2) DEFAULT '0.00',
	"valor_indicacao" numeric(14, 2) DEFAULT '0.00',
	"premiacao_venda" numeric(14, 2) DEFAULT '0.00',
	"data_prev_comissao" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tarefas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lead_id" uuid,
	"tipo" text DEFAULT 'tarefa',
	"titulo" text NOT NULL,
	"descricao" text,
	"anotacoes" text,
	"pessoa" text,
	"telefone" text,
	"email" text,
	"organizacao" text,
	"prioridade" text DEFAULT 'normal',
	"status" text DEFAULT 'PENDENTE',
	"concluido" boolean DEFAULT false,
	"data_inicio" timestamp,
	"data_fim" timestamp,
	"concluida_em" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "visitas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lead_id" uuid,
	"imovel_id" uuid,
	"data" timestamp NOT NULL,
	"anotacoes" text,
	"status" text DEFAULT 'agendada',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fluxo_caixa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"imovel_id" uuid,
	"descricao" text NOT NULL,
	"valor" numeric(14, 2) NOT NULL,
	"data" date NOT NULL,
	"categoria" text,
	"tipo" text NOT NULL,
	"status" text DEFAULT 'confirmado',
	"recorrente" boolean DEFAULT false,
	"periodicidade" text,
	"dia_vencimento" integer,
	"descricao_despesas" text,
	"valor_despesas" numeric(14, 2),
	"categoria_despesas" text,
	"forma_pagamento_despesas" text,
	"status_despesas" text,
	"observacoes_despesas" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "automation_flows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"instance_name" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'rascunho',
	"trigger_type" text DEFAULT 'always',
	"off_hours_start" text DEFAULT '18:00:00',
	"off_hours_end" text DEFAULT '08:00:00',
	"restart_after_hours" integer DEFAULT 24,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "automation_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flow_id" uuid NOT NULL,
	"type" text NOT NULL,
	"label" text,
	"message" text,
	"order_index" integer DEFAULT 0,
	"next_node_id" uuid,
	"x" integer DEFAULT 0,
	"y" integer DEFAULT 0,
	"delay_seconds" integer DEFAULT 0,
	"node_data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "automation_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instance_name" text NOT NULL,
	"phone" text NOT NULL,
	"flow_id" uuid,
	"current_node_id" uuid,
	"status" text DEFAULT 'active',
	"variables" jsonb DEFAULT '{}'::jsonb,
	"waiting_for_input" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lead_id" uuid,
	"telefone" text NOT NULL,
	"nome" text,
	"status" text DEFAULT 'pendente',
	"ultima_msg" text,
	"ultima_msg_em" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "disparo_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lead_id" uuid,
	"lead_name" text,
	"phone" text NOT NULL,
	"success" boolean DEFAULT false,
	"message_preview" text,
	"sent_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "disparos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mensagem" text NOT NULL,
	"template" text,
	"total" integer DEFAULT 0,
	"enviados" integer DEFAULT 0,
	"falhas" integer DEFAULT 0,
	"status" text DEFAULT 'pendente',
	"leads_ids" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "disparos_diarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"data" text NOT NULL,
	"quantidade" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "mensagens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"conversa_id" uuid,
	"telefone" text NOT NULL,
	"direcao" text NOT NULL,
	"conteudo" text NOT NULL,
	"tipo" text DEFAULT 'texto',
	"wam_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "leads" DROP CONSTRAINT "leads_email_unique";--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "temperatura" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "temperatura" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "telefone" text NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "gestor_responsavel" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "interesse" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "observacoes" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "status" text DEFAULT 'novo_cliente';--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imoveis" ADD CONSTRAINT "imoveis_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_imovel_id_imoveis_id_fk" FOREIGN KEY ("imovel_id") REFERENCES "public"."imoveis"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_imovel_id_imoveis_id_fk" FOREIGN KEY ("imovel_id") REFERENCES "public"."imoveis"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fluxo_caixa" ADD CONSTRAINT "fluxo_caixa_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fluxo_caixa" ADD CONSTRAINT "fluxo_caixa_imovel_id_imoveis_id_fk" FOREIGN KEY ("imovel_id") REFERENCES "public"."imoveis"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_flows" ADD CONSTRAINT "automation_flows_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_nodes" ADD CONSTRAINT "automation_nodes_flow_id_automation_flows_id_fk" FOREIGN KEY ("flow_id") REFERENCES "public"."automation_flows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_sessions" ADD CONSTRAINT "automation_sessions_flow_id_automation_flows_id_fk" FOREIGN KEY ("flow_id") REFERENCES "public"."automation_flows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversas" ADD CONSTRAINT "conversas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversas" ADD CONSTRAINT "conversas_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disparo_logs" ADD CONSTRAINT "disparo_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disparo_logs" ADD CONSTRAINT "disparo_logs_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disparos" ADD CONSTRAINT "disparos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disparos_diarios" ADD CONSTRAINT "disparos_diarios_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_conversa_id_conversas_id_fk" FOREIGN KEY ("conversa_id") REFERENCES "public"."conversas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" DROP COLUMN "gestor_responsalvel";--> statement-breakpoint
ALTER TABLE "leads" DROP COLUMN "interrese_lead";--> statement-breakpoint
ALTER TABLE "leads" DROP COLUMN "observacao";--> statement-breakpoint
ALTER TABLE "leads" DROP COLUMN "data_criacao";