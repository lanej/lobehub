import { evaluate } from '@lobechat/eval-rubric';
import type { EvalRunMetrics, EvalRunTopicResult } from '@lobechat/types';
import { serve } from '@upstash/workflow/nextjs';

import {
  AgentEvalBenchmarkModel,
  AgentEvalDatasetModel,
  AgentEvalRunModel,
  AgentEvalRunTopicModel,
} from '@/database/models/agentEval';
import { MessageModel } from '@/database/models/message';
import { getServerDB } from '@/database/server';
import { type FinalizeRunPayload } from '@/server/workflows/agentEvalRun';

/**
 * Finalize run workflow - evaluates agent outputs and updates run metrics
 *
 * 1. Get run details + benchmark rubrics
 * 2. Get all RunTopics for this run
 * 3. For each RunTopic:
 *    a. Get the last assistant message as actual output
 *    b. Evaluate output against test case using rubrics
 *    c. Write score/passed/evalResult to RunTopic
 * 4. Aggregate metrics across all RunTopics
 * 5. Update run status to 'completed'
 */
export const { POST } = serve<FinalizeRunPayload>(
  async (context) => {
    const { runId } = context.requestPayload ?? {};

    console.log('[agent-eval-run:finalize-run] Starting:', { runId });

    if (!runId) {
      return { error: 'Missing runId', success: false };
    }

    const db = await getServerDB();

    // Step 1: Get run details
    const run = await context.run('agent-eval-run:get-run', async () => {
      const runModel = new AgentEvalRunModel(db, '');
      return runModel.findById(runId);
    });

    if (!run) {
      return { error: 'Run not found', success: false };
    }

    // Step 2: Get benchmark rubrics via dataset → benchmark chain
    const benchmark = await context.run('agent-eval-run:get-benchmark', async () => {
      const datasetModel = new AgentEvalDatasetModel(db, run.userId);
      const dataset = await datasetModel.findById(run.datasetId);
      if (!dataset) return null;

      const benchmarkModel = new AgentEvalBenchmarkModel(db, run.userId);
      return benchmarkModel.findById(dataset.benchmarkId);
    });

    if (!benchmark) {
      // No benchmark found — mark run as failed
      await context.run('agent-eval-run:mark-failed', async () => {
        const runModel = new AgentEvalRunModel(db, '');
        return runModel.update(runId, { status: 'failed' });
      });
      return { error: 'Benchmark not found for dataset', success: false };
    }

    const rubrics = benchmark.rubrics;
    const passThreshold = (run.config?.passThreshold as number) ?? 0.6;

    console.log('[agent-eval-run:finalize-run] Using benchmark:', {
      benchmarkId: benchmark.id,
      passThreshold,
      rubricCount: rubrics.length,
    });

    // Step 3: Get all RunTopics
    const runTopics = await context.run('agent-eval-run:get-run-topics', async () => {
      const runTopicModel = new AgentEvalRunTopicModel(db, '');
      return runTopicModel.findByRunId(runId);
    });

    console.log('[agent-eval-run:finalize-run] Total RunTopics:', runTopics.length);

    // Step 4: Evaluate each RunTopic
    const metrics = await context.run('agent-eval-run:evaluate-and-score', async () => {
      const messageModel = new MessageModel(db, '');
      const runTopicModel = new AgentEvalRunTopicModel(db, '');

      let passedCases = 0;
      let failedCases = 0;
      let totalScore = 0;
      const rubricScoreAcc: Record<string, { sum: number; count: number }> = {};

      for (const runTopic of runTopics) {
        // Get messages for this topic
        const messages = await messageModel.query({ topicId: runTopic.topicId });

        // Find the last assistant message
        const assistantMessages = messages.filter(
          (m: { role: string }) => m.role === 'assistant',
        );
        const lastAssistantMsg = assistantMessages[assistantMessages.length - 1];

        if (!lastAssistantMsg || !lastAssistantMsg.content) {
          // No assistant output — mark as failed
          failedCases++;
          await runTopicModel.updateByRunAndTopic(runTopic.runId, runTopic.topicId, {
            evalResult: { error: 'No assistant output', rubricScores: [] },
            passed: false,
            score: 0,
          });
          continue;
        }

        const testCase = runTopic.testCase;

        // Run evaluation
        const result = evaluate(lastAssistantMsg.content, testCase.content, rubrics, {
          passThreshold,
        });

        const evalResult: EvalRunTopicResult = {
          rubricScores: result.rubricResults.map((r) => ({
            reason: r.reason,
            rubricId: r.rubricId,
            score: r.score,
          })),
        };

        // Write results to RunTopic
        await runTopicModel.updateByRunAndTopic(runTopic.runId, runTopic.topicId, {
          evalResult,
          passed: result.passed,
          score: result.score,
        });

        // Accumulate metrics
        totalScore += result.score;
        if (result.passed) {
          passedCases++;
        } else {
          failedCases++;
        }

        // Accumulate per-rubric scores
        for (const rr of result.rubricResults) {
          if (!rubricScoreAcc[rr.rubricId]) {
            rubricScoreAcc[rr.rubricId] = { count: 0, sum: 0 };
          }
          rubricScoreAcc[rr.rubricId].sum += rr.score;
          rubricScoreAcc[rr.rubricId].count++;
        }
      }

      const totalCases = runTopics.length;
      const rubricScores: Record<string, number> = {};
      for (const [rubricId, acc] of Object.entries(rubricScoreAcc)) {
        rubricScores[rubricId] = acc.count > 0 ? acc.sum / acc.count : 0;
      }

      return {
        averageScore: totalCases > 0 ? totalScore / totalCases : 0,
        failedCases,
        passRate: totalCases > 0 ? passedCases / totalCases : 0,
        passedCases,
        rubricScores,
        totalCases,
      } satisfies EvalRunMetrics;
    });

    console.log('[agent-eval-run:finalize-run] Metrics:', metrics);

    // Step 5: Update run status
    await context.run('agent-eval-run:update-run', async () => {
      const runModel = new AgentEvalRunModel(db, '');
      return runModel.update(runId, {
        metrics,
        status: 'completed',
      });
    });

    console.log('[agent-eval-run:finalize-run] Run completed:', { runId });

    return {
      metrics,
      runId,
      success: true,
    };
  },
  {
    flowControl: {
      key: 'agent-eval-run.finalize-run',
      parallelism: 1,
      ratePerSecond: 1,
    },
  },
);
