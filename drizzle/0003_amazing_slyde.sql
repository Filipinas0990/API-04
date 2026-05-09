CREATE INDEX "flows_user_id_idx" ON "automation_flows" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "flows_instance_status_idx" ON "automation_flows" USING btree ("instance_name","status");--> statement-breakpoint
CREATE INDEX "nodes_flow_id_idx" ON "automation_nodes" USING btree ("flow_id");--> statement-breakpoint
CREATE INDEX "sessions_lookup_idx" ON "automation_sessions" USING btree ("instance_name","phone","status");--> statement-breakpoint
CREATE INDEX "conversas_user_id_idx" ON "conversas" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "conversas_user_telefone_idx" ON "conversas" USING btree ("user_id","telefone");--> statement-breakpoint
CREATE INDEX "disparos_diarios_user_data_idx" ON "disparos_diarios" USING btree ("user_id","data");--> statement-breakpoint
CREATE INDEX "mensagens_conversa_id_idx" ON "mensagens" USING btree ("conversa_id");