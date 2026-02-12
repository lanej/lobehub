ALTER TABLE "async_tasks" ADD COLUMN IF NOT EXISTS "inference_id" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "async_tasks_inference_id_idx" ON "async_tasks" USING btree ("inference_id");
