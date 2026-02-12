ALTER TABLE "agent_eval_run_topics" ADD COLUMN "score" real;--> statement-breakpoint
ALTER TABLE "agent_eval_run_topics" ADD COLUMN "passed" boolean;--> statement-breakpoint
ALTER TABLE "agent_eval_run_topics" ADD COLUMN "eval_result" jsonb;--> statement-breakpoint
ALTER TABLE "agent_eval_benchmarks" DROP COLUMN IF EXISTS "pass_threshold";
