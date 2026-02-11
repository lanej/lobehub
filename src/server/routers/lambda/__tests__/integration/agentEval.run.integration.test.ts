import { beforeEach, describe, expect, it } from 'vitest';

import { getTestDB } from '@/database/core/getTestDB';
import {
  AgentEvalBenchmarkModel,
  AgentEvalDatasetModel,
  AgentEvalRunModel,
  AgentEvalTestCaseModel,
} from '@/database/models/agentEval';
import {
  agentEvalBenchmarks,
  agentEvalDatasets,
  agentEvalRuns,
  agentEvalTestCases,
  users,
} from '@/database/schemas';

let serverDB = await getTestDB();

const userId = 'run-integration-test-user';

beforeEach(async () => {
  // Clean up
  await serverDB.delete(agentEvalRuns);
  await serverDB.delete(agentEvalTestCases);
  await serverDB.delete(agentEvalDatasets);
  await serverDB.delete(agentEvalBenchmarks);
  await serverDB.delete(users);

  // Create test user
  await serverDB.insert(users).values({ id: userId });
});

describe('AgentEval Run Workflow Integration', () => {
  describe('Run Execution Flow', () => {
    it('should create run with test data', async () => {
      // 1. Create benchmark
      const benchmarkModel = new AgentEvalBenchmarkModel(serverDB, userId);
      const benchmark = await benchmarkModel.create({
        identifier: 'test-benchmark',
        name: 'Test Benchmark',
        rubrics: [],

        isSystem: false,
      });

      // 2. Create dataset
      const datasetModel = new AgentEvalDatasetModel(serverDB, userId);
      const dataset = await datasetModel.create({
        benchmarkId: benchmark.id,
        identifier: 'test-dataset',
        name: 'Test Dataset',
      });

      // 3. Create test cases
      const testCaseModel = new AgentEvalTestCaseModel(serverDB, userId);
      const testCase1 = await testCaseModel.create({
        datasetId: dataset.id,
        content: { input: 'What is the capital of France?' },
        sortOrder: 1,
      });
      const testCase2 = await testCaseModel.create({
        datasetId: dataset.id,
        content: { input: 'What is 2 + 2?' },
        sortOrder: 2,
      });

      // 4. Create run
      const runModel = new AgentEvalRunModel(serverDB, userId);
      const run = await runModel.create({
        datasetId: dataset.id,
        name: 'Test Run',
        config: {
          concurrency: 5,
          timeout: 300000,
        },
      });

      expect(run).toBeDefined();
      expect(run.status).toBe('idle');
      expect(run.datasetId).toBe(dataset.id);

      console.log('\n📊 Test Data Created:');
      console.log(`  Benchmark: ${benchmark.id}`);
      console.log(`  Dataset: ${dataset.id}`);
      console.log(`  Test Cases: ${testCase1.id}, ${testCase2.id}`);
      console.log(`  Run: ${run.id}`);
      console.log('\n🧪 To test workflow execution, call:');
      console.log(`  startRun({ id: "${run.id}" })`);
    });

    it('should validate run status before execution', async () => {
      // Create test data
      const benchmarkModel = new AgentEvalBenchmarkModel(serverDB, userId);
      const benchmark = await benchmarkModel.create({
        identifier: 'test-benchmark-2',
        name: 'Test Benchmark 2',
        rubrics: [],

        isSystem: false,
      });

      const datasetModel = new AgentEvalDatasetModel(serverDB, userId);
      const dataset = await datasetModel.create({
        benchmarkId: benchmark.id,
        identifier: 'test-dataset-2',
        name: 'Test Dataset 2',
      });

      const testCaseModel = new AgentEvalTestCaseModel(serverDB, userId);
      await testCaseModel.create({
        datasetId: dataset.id,
        content: { input: 'Test question' },
        sortOrder: 1,
      });

      const runModel = new AgentEvalRunModel(serverDB, userId);
      const run = await runModel.create({
        datasetId: dataset.id,
        name: 'Test Run 2',
      });

      // Verify run is in idle state
      expect(run.status).toBe('idle');

      // Update to running (simulating workflow start)
      const updatedRun = await runModel.update(run.id, { status: 'running' });
      expect(updatedRun?.status).toBe('running');

      console.log('\n✅ Run status validation passed');
    });
  });

  describe('Run Results Query', () => {
    it('should query run with dataset info', async () => {
      // Setup test data
      const benchmarkModel = new AgentEvalBenchmarkModel(serverDB, userId);
      const benchmark = await benchmarkModel.create({
        identifier: 'query-test-benchmark',
        name: 'Query Test Benchmark',
        rubrics: [],

        isSystem: false,
      });

      const datasetModel = new AgentEvalDatasetModel(serverDB, userId);
      const dataset = await datasetModel.create({
        benchmarkId: benchmark.id,
        identifier: 'query-test-dataset',
        name: 'Query Test Dataset',
      });

      const runModel = new AgentEvalRunModel(serverDB, userId);
      const run = await runModel.create({
        datasetId: dataset.id,
        name: 'Query Test Run',
        metrics: {
          totalCases: 10,
          passedCases: 7,
          failedCases: 3,
          averageScore: 0.7,
          passRate: 0.7,
        },
      });

      // Query run
      const foundRun = await runModel.findById(run.id);
      expect(foundRun).toBeDefined();
      expect(foundRun?.datasetId).toBe(dataset.id);
      expect(foundRun?.metrics?.passRate).toBe(0.7);

      console.log('\n📈 Run Metrics:');
      console.log(`  Total Cases: ${foundRun?.metrics?.totalCases}`);
      console.log(`  Passed: ${foundRun?.metrics?.passedCases}`);
      console.log(`  Failed: ${foundRun?.metrics?.failedCases}`);
      console.log(`  Pass Rate: ${(foundRun?.metrics?.passRate || 0) * 100}%`);
    });
  });
});
