/* eslint-disable sort-keys-fix/sort-keys-fix  */
import { TRPCError } from '@trpc/server';
import { parseDataset } from '@lobechat/eval-dataset-parser';
import { z } from 'zod';

import {
  AgentEvalBenchmarkModel,
  AgentEvalDatasetModel,
  AgentEvalRunModel,
  AgentEvalRunTopicModel,
  AgentEvalTestCaseModel,
} from '@/database/models/agentEval';
import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { FileService } from '@/server/services/file';
import { AgentEvalRunWorkflow } from '@/server/workflows/agentEvalRun';

const agentEvalProcedure = authedProcedure.use(serverDatabase).use(async (opts) => {
  const { ctx } = opts;

  return opts.next({
    ctx: {
      benchmarkModel: new AgentEvalBenchmarkModel(ctx.serverDB, ctx.userId),
      datasetModel: new AgentEvalDatasetModel(ctx.serverDB, ctx.userId),
      runModel: new AgentEvalRunModel(ctx.serverDB, ctx.userId),
      runTopicModel: new AgentEvalRunTopicModel(ctx.serverDB, ctx.userId),
      testCaseModel: new AgentEvalTestCaseModel(ctx.serverDB, ctx.userId),
      fileService: new FileService(ctx.serverDB, ctx.userId),
    },
  });
});

export const agentEvalRouter = router({
  // ============================================
  // Benchmark Operations
  // ============================================
  createBenchmark: agentEvalProcedure
    .input(
      z.object({
        identifier: z.string(),
        name: z.string(),
        description: z.string().optional(),
        rubrics: z.array(z.any()).optional().default([]), // EvalBenchmarkRubric[]
        referenceUrl: z.string().optional(),
        metadata: z.record(z.unknown()).optional(),
        isSystem: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await ctx.benchmarkModel.create(input);
        if (!result) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create benchmark',
          });
        }
        return result;
      } catch (error: any) {
        // PostgreSQL errors might be in error.cause
        const pgError = error?.cause || error;

        // Check for unique constraint violation (Postgres error code 23505)
        if (pgError?.code === '23505' || pgError?.constraint?.includes('identifier')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `Benchmark with identifier "${input.identifier}" already exists`,
          });
        }
        throw error;
      }
    }),

  listBenchmarks: agentEvalProcedure
    .input(z.object({ includeSystem: z.boolean().default(true) }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.benchmarkModel.query(input?.includeSystem);
    }),

  getBenchmark: agentEvalProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const benchmark = await ctx.benchmarkModel.findById(input.id);
      if (!benchmark) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Benchmark not found' });
      }
      return benchmark;
    }),

  updateBenchmark: agentEvalProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        rubrics: z.array(z.any()).optional(),
        referenceUrl: z.string().optional(),
        metadata: z.record(z.unknown()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      const result = await ctx.benchmarkModel.update(id, data);
      if (!result) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Benchmark not found or cannot be updated',
        });
      }
      return result;
    }),

  deleteBenchmark: agentEvalProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await ctx.benchmarkModel.delete(input.id);
        // Check if any rows were affected
        if (result.rowCount === 0) {
          return {
            success: false,
            error: 'Benchmark not found or cannot be deleted (system benchmarks cannot be deleted)',
          };
        }
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to delete benchmark',
        };
      }
    }),

  // ============================================
  // Dataset Operations
  // ============================================
  createDataset: agentEvalProcedure
    .input(
      z.object({
        benchmarkId: z.string(),
        identifier: z.string(),
        name: z.string(),
        description: z.string().optional(),
        metadata: z.record(z.unknown()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await ctx.datasetModel.create(input);
        if (!result) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create dataset',
          });
        }
        return result;
      } catch (error: any) {
        // PostgreSQL errors might be in error.cause
        const pgError = error?.cause || error;

        // Check for unique constraint violation (Postgres error code 23505)
        if (pgError?.code === '23505' || pgError?.constraint?.includes('identifier')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `Dataset with identifier "${input.identifier}" already exists for this user`,
          });
        }
        // Check for foreign key violation (benchmark not found)
        if (pgError?.code === '23503' && pgError?.constraint?.includes('benchmark')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Benchmark with id "${input.benchmarkId}" not found`,
          });
        }
        throw error;
      }
    }),

  listDatasets: agentEvalProcedure
    .input(z.object({ benchmarkId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.datasetModel.query(input?.benchmarkId);
    }),

  getDataset: agentEvalProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const dataset = await ctx.datasetModel.findById(input.id);
      if (!dataset) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Dataset not found' });
      }
      return dataset;
    }),

  updateDataset: agentEvalProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        metadata: z.record(z.unknown()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      const result = await ctx.datasetModel.update(id, data);
      if (!result) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Dataset not found or cannot be updated',
        });
      }
      return result;
    }),

  deleteDataset: agentEvalProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await ctx.datasetModel.delete(input.id);
        // Check if any rows were affected
        if (result.rowCount === 0) {
          return {
            success: false,
            error: 'Dataset not found or you do not have permission to delete it',
          };
        }
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to delete dataset',
        };
      }
    }),

  parseDatasetFile: agentEvalProcedure
    .input(
      z.object({
        pathname: z.string(),
        format: z.enum(['json', 'jsonl', 'csv', 'xlsx']).optional(),
        filename: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const format = input.format || 'auto';
      const isXlsx = format === 'xlsx' || input.filename?.match(/\.xlsx?$/i);

      const content = isXlsx
        ? await ctx.fileService.getFileByteArray(input.pathname)
        : await ctx.fileService.getFileContent(input.pathname);

      try {
        const result = parseDataset(content, {
          filename: input.filename,
          format: format === 'auto' ? undefined : format,
          preview: 50,
        });

        return {
          headers: result.headers,
          preview: result.rows,
          totalCount: result.totalCount,
          format: result.format,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Failed to parse file: ${error.message}`,
        });
      }
    }),

  importDataset: agentEvalProcedure
    .input(
      z.object({
        datasetId: z.string(),
        pathname: z.string(),
        format: z.enum(['json', 'jsonl', 'csv', 'xlsx']).optional(),
        filename: z.string().optional(),
        fieldMapping: z.object({
          input: z.string(),
          expected: z.string().optional(),
          expectedDelimiter: z.string().optional(),
          choices: z.string().optional(),
          context: z.string().optional(),
          metadata: z.record(z.string()).optional(),
          sortOrder: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const format = input.format || 'auto';
      const isXlsx = format === 'xlsx' || input.filename?.match(/\.xlsx?$/i);

      const content = isXlsx
        ? await ctx.fileService.getFileByteArray(input.pathname)
        : await ctx.fileService.getFileContent(input.pathname);

      let parsed;
      try {
        parsed = parseDataset(content, {
          filename: input.filename,
          format: format === 'auto' ? undefined : format,
        });
      } catch (error: any) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Failed to parse file: ${error.message}`,
        });
      }

      const { fieldMapping } = input;

      const testCases = parsed.rows.map((row, index) => {
        let expectedStr: string | undefined;

        if (fieldMapping.expected) {
          const raw = row[fieldMapping.expected];
          if (raw != null) {
            // Split multi-candidate answers by delimiter
            if (fieldMapping.expectedDelimiter) {
              const candidates = String(raw)
                .split(fieldMapping.expectedDelimiter)
                .map((s: string) => s.trim())
                .filter(Boolean);
              expectedStr = candidates.length > 1 ? JSON.stringify(candidates) : String(raw);
            } else {
              expectedStr = String(raw);
            }
          }
        }

        // Handle choices field (array or JSON string)
        let choices: string[] | undefined;
        if (fieldMapping.choices) {
          const rawChoices = row[fieldMapping.choices];
          if (Array.isArray(rawChoices)) {
            choices = rawChoices.map(String);
          } else if (typeof rawChoices === 'string') {
            try {
              const parsed = JSON.parse(rawChoices);
              if (Array.isArray(parsed)) choices = parsed.map(String);
            } catch {
              // Not JSON, skip
            }
          }
        }

        return {
          datasetId: input.datasetId,
          content: {
            input: String(row[fieldMapping.input] ?? ''),
            expected: expectedStr,
            choices,
            context: fieldMapping.context ? row[fieldMapping.context] : undefined,
          },
          metadata: fieldMapping.metadata
            ? Object.fromEntries(
                Object.entries(fieldMapping.metadata).map(([key, col]) => [key, row[col as string]]),
              )
            : {},
          sortOrder: fieldMapping.sortOrder ? Number(row[fieldMapping.sortOrder]) || index : index,
        };
      });

      const result = await ctx.testCaseModel.batchCreate(testCases);
      return { count: result.length, data: result };
    }),

  // ============================================
  // TestCase Operations
  // ============================================
  createTestCase: agentEvalProcedure
    .input(
      z.object({
        datasetId: z.string(),
        content: z.object({
          input: z.string(),
          expected: z.string().optional(),
          choices: z.array(z.string()).optional(),
          context: z.record(z.unknown()).optional(),
        }),
        metadata: z.record(z.unknown()).optional(),
        sortOrder: z.number().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await ctx.testCaseModel.create(input);
        if (!result) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create test case',
          });
        }
        return result;
      } catch (error: any) {
        // PostgreSQL errors might be in error.cause
        const pgError = error?.cause || error;

        // Check for foreign key violation (dataset not found)
        if (pgError?.code === '23503' && pgError?.constraint?.includes('dataset')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Dataset with id "${input.datasetId}" not found`,
          });
        }
        throw error;
      }
    }),

  batchCreateTestCases: agentEvalProcedure
    .input(
      z.object({
        datasetId: z.string(),
        cases: z.array(
          z.object({
            content: z.object({
              input: z.string(),
              expected: z.string().optional(),
              choices: z.array(z.string()).optional(),
              context: z.record(z.unknown()).optional(),
            }),
            metadata: z.record(z.unknown()).optional(),
            sortOrder: z.number().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const testCases = input.cases.map((c) => ({
          ...c,
          datasetId: input.datasetId,
        }));
        const result = await ctx.testCaseModel.batchCreate(testCases);
        return { count: result.length, data: result };
      } catch (error: any) {
        // PostgreSQL errors might be in error.cause
        const pgError = error?.cause || error;

        // Check for foreign key violation (dataset not found)
        if (pgError?.code === '23503' && pgError?.constraint?.includes('dataset')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Dataset with id "${input.datasetId}" not found`,
          });
        }
        throw error;
      }
    }),

  updateTestCase: agentEvalProcedure
    .input(
      z.object({
        id: z.string(),
        content: z
          .object({
            input: z.string(),
            expected: z.string().optional(),
            context: z.record(z.unknown()).optional(),
          })
          .optional(),
        metadata: z.record(z.unknown()).optional(),
        sortOrder: z.number().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      const result = await ctx.testCaseModel.update(id, data);
      if (!result) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Test case not found',
        });
      }
      return result;
    }),

  deleteTestCase: agentEvalProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await ctx.testCaseModel.delete(input.id);
        // Check if any rows were affected
        if (result.rowCount === 0) {
          return {
            success: false,
            error: 'Test case not found',
          };
        }
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to delete test case',
        };
      }
    }),

  getTestCase: agentEvalProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const testCase = await ctx.testCaseModel.findById(input.id);
      if (!testCase) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Test case not found' });
      }
      return testCase;
    }),

  listTestCases: agentEvalProcedure
    .input(
      z.object({
        datasetId: z.string(),
        limit: z.number().min(1).max(100).default(50).optional(),
        offset: z.number().min(0).default(0).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [data, total] = await Promise.all([
        ctx.testCaseModel.findByDatasetId(input.datasetId, input.limit, input.offset),
        ctx.testCaseModel.countByDatasetId(input.datasetId),
      ]);
      return { data, total };
    }),

  // ============================================
  // Run Operations
  // ============================================
  createRun: agentEvalProcedure
    .input(
      z.object({
        datasetId: z.string(),
        targetAgentId: z.string().optional(),
        name: z.string().optional(),
        config: z
          .object({
            concurrency: z.number().min(1).max(10).default(5).optional(),
            timeout: z.number().min(30_000).max(600_000).default(300_000).optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await ctx.runModel.create(input);
        if (!result) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create run',
          });
        }
        return result;
      } catch (error: any) {
        const pgError = error?.cause || error;

        // Check for foreign key violation (dataset not found)
        if (pgError?.code === '23503' && pgError?.constraint?.includes('dataset')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Dataset with id "${input.datasetId}" not found`,
          });
        }
        throw error;
      }
    }),

  listRuns: agentEvalProcedure
    .input(
      z.object({
        datasetId: z.string().optional(),
        status: z.enum(['idle', 'pending', 'running', 'completed', 'failed', 'aborted']).optional(),
        limit: z.number().min(1).max(100).default(50).optional(),
        offset: z.number().min(0).default(0).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const data = await ctx.runModel.query({
        datasetId: input.datasetId,
        status: input.status,
        limit: input.limit,
        offset: input.offset,
      });

      // Get total count
      // Note: For now we return data length as total, in production should implement proper count
      const total = data.length;

      return { data, total };
    }),

  getRunDetails: agentEvalProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const run = await ctx.runModel.findById(input.id);
      if (!run) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Run not found' });
      }

      // Get dataset
      const dataset = await ctx.datasetModel.findById(run.datasetId);

      // Get run topics with test cases
      const runTopics = await ctx.runTopicModel.findByRunId(input.id);

      return {
        ...run,
        dataset,
        topics: runTopics.map((rt) => ({
          evalResult: rt.evalResult,
          passed: rt.passed,
          score: rt.score,
          testCase: rt.testCase,
          topic: rt.topic,
        })),
      };
    }),

  deleteRun: agentEvalProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await ctx.runModel.delete(input.id);
        // Check if any rows were affected
        if (result.rowCount === 0) {
          return {
            success: false,
            error: 'Run not found or you do not have permission to delete it',
          };
        }
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to delete run',
        };
      }
    }),

  // ============================================
  // Run Execution Operations
  // ============================================

  /**
   * Start executing a run
   * Transitions: idle/failed → pending → running
   */
  startRun: agentEvalProcedure
    .input(
      z.object({
        id: z.string(),
        force: z.boolean().default(false).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id: runId, force } = input;

      // Get run to validate ownership and status
      const run = await ctx.runModel.findById(runId);
      if (!run) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Run not found' });
      }

      // Check run status
      if (run.status === 'running' && !force) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Run is already running. Use force=true to restart.',
        });
      }

      // Trigger workflow
      await AgentEvalRunWorkflow.triggerRunBenchmark({ runId, force });

      return { success: true, runId };
    }),

  /**
   * Abort a running evaluation
   */
  abortRun: agentEvalProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const run = await ctx.runModel.findById(input.id);
      if (!run) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Run not found' });
      }

      if (run.status !== 'running' && run.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot abort run with status: ${run.status}`,
        });
      }

      // Update status to aborted
      await ctx.runModel.update(input.id, { status: 'aborted' });

      return { success: true };
    }),

  // /**
  //  * Retry a failed run
  //  */
  // retryRun: agentEvalProcedure
  //   .input(
  //     z.object({
  //       id: z.string(),
  //       retryFailedOnly: z.boolean().default(true).optional(),
  //     }),
  //   )
  //   .mutation(async ({ input, ctx }) => {
  //     // TODO: Implement retry logic
  //     throw new TRPCError({
  //       code: 'NOT_IMPLEMENTED',
  //       message: 'Run retry not implemented yet',
  //     });
  //   }),

  /**
   * Get real-time progress of a running evaluation
   */
  getRunProgress: agentEvalProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const run = await ctx.runModel.findById(input.id);
      if (!run) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Run not found' });
      }

      return {
        status: run.status,
        metrics: run.metrics,
        startedAt: run.createdAt,
        updatedAt: run.updatedAt,
      };
    }),

  /**
   * Get detailed results of test case executions
   */
  getRunResults: agentEvalProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['passed', 'failed', 'all']).default('all').optional(),
        limit: z.number().min(1).max(100).default(50).optional(),
        offset: z.number().min(0).default(0).optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const run = await ctx.runModel.findById(input.id);
      if (!run) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Run not found' });
      }

      // Get all run topics with test cases and topics
      const allRunTopics = await ctx.runTopicModel.findByRunId(input.id);

      // Filter by status
      const filtered = input.status === 'all' || !input.status
        ? allRunTopics
        : allRunTopics.filter((rt) =>
          input.status === 'passed' ? rt.passed === true : rt.passed === false,
        );

      // Pagination
      const offset = input.offset ?? 0;
      const limit = input.limit ?? 50;
      const paginated = filtered.slice(offset, offset + limit);

      return {
        runId: input.id,
        total: filtered.length,
        results: paginated.map((rt) => ({
          evalResult: rt.evalResult,
          passed: rt.passed,
          score: rt.score,
          testCase: rt.testCase,
          testCaseId: rt.testCaseId,
          topic: rt.topic,
          topicId: rt.topicId,
        })),
      };
    }),

  /**
   * Update run status (internal use)
   */
  updateRunStatus: agentEvalProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['idle', 'pending', 'running', 'completed', 'failed', 'aborted']),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, status } = input;

      const run = await ctx.runModel.findById(id);
      if (!run) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Run not found' });
      }

      const result = await ctx.runModel.update(id, { status });
      return result;
    }),

  /**
   * Update run metrics (internal use)
   */
  updateRunMetrics: agentEvalProcedure
    .input(
      z.object({
        id: z.string(),
        metrics: z.object({
          totalCases: z.number(),
          passedCases: z.number(),
          failedCases: z.number(),
          averageScore: z.number(),
          passRate: z.number(),
          duration: z.number().optional(),
          rubricScores: z.record(z.number()).optional(),
        }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, metrics } = input;

      const run = await ctx.runModel.findById(id);
      if (!run) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Run not found' });
      }

      const result = await ctx.runModel.update(id, { metrics });
      return result;
    }),
});
