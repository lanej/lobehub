import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getTestDB } from '../../../core/getTestDB';
import {
  agentEvalBenchmarks,
  agentEvalDatasets,
  agentEvalRunTopics,
  agentEvalRuns,
  agentEvalTestCases,
  topics,
  users,
} from '../../../schemas';
import { AgentEvalRunTopicModel } from '../runTopic';

let serverDB = await getTestDB();

const userId = 'run-topic-test-user';
const runTopicModel = new AgentEvalRunTopicModel(serverDB, userId);

let benchmarkId: string;
let datasetId: string;
let runId: string;
let testCaseId1: string;
let testCaseId2: string;
let topicId1: string;
let topicId2: string;

beforeEach(async () => {
  await serverDB.delete(agentEvalRunTopics);
  await serverDB.delete(topics);
  await serverDB.delete(agentEvalRuns);
  await serverDB.delete(agentEvalTestCases);
  await serverDB.delete(agentEvalDatasets);
  await serverDB.delete(agentEvalBenchmarks);
  await serverDB.delete(users);

  // Create test user
  await serverDB.insert(users).values({ id: userId });

  // Create test benchmark
  const [benchmark] = await serverDB
    .insert(agentEvalBenchmarks)
    .values({
      identifier: 'test-benchmark',
      name: 'Test Benchmark',
      rubrics: [],
      isSystem: false,
    })
    .returning();
  benchmarkId = benchmark.id;

  // Create test dataset
  const [dataset] = await serverDB
    .insert(agentEvalDatasets)
    .values({
      benchmarkId,
      identifier: 'test-dataset',
      name: 'Test Dataset',
      userId,
    })
    .returning();
  datasetId = dataset.id;

  // Create test cases
  const [testCase1, testCase2] = await serverDB
    .insert(agentEvalTestCases)
    .values([
      {
        datasetId,
        content: { input: 'Test question 1' },
        sortOrder: 1,
      },
      {
        datasetId,
        content: { input: 'Test question 2' },
        sortOrder: 2,
      },
    ])
    .returning();
  testCaseId1 = testCase1.id;
  testCaseId2 = testCase2.id;

  // Create test run
  const [run] = await serverDB
    .insert(agentEvalRuns)
    .values({
      datasetId,
      userId,
      name: 'Test Run',
      status: 'idle',
    })
    .returning();
  runId = run.id;

  // Create topics
  const [topic1, topic2] = await serverDB
    .insert(topics)
    .values([
      {
        userId,
        title: 'Topic 1',
        trigger: 'eval',
        mode: 'test',
      },
      {
        userId,
        title: 'Topic 2',
        trigger: 'eval',
        mode: 'test',
      },
    ])
    .returning();
  topicId1 = topic1.id;
  topicId2 = topic2.id;
});

afterEach(async () => {
  await serverDB.delete(agentEvalRunTopics);
  await serverDB.delete(topics);
  await serverDB.delete(agentEvalRuns);
  await serverDB.delete(agentEvalTestCases);
  await serverDB.delete(agentEvalDatasets);
  await serverDB.delete(agentEvalBenchmarks);
  await serverDB.delete(users);
});

describe('AgentEvalRunTopicModel', () => {
  describe('batchCreate', () => {
    it('should create multiple run topics', async () => {
      const params = [
        {
          runId,
          topicId: topicId1,
          testCaseId: testCaseId1,
        },
        {
          runId,
          topicId: topicId2,
          testCaseId: testCaseId2,
        },
      ];

      const results = await runTopicModel.batchCreate(params);

      expect(results).toHaveLength(2);
      expect(results[0].runId).toBe(runId);
      expect(results[0].topicId).toBe(topicId1);
      expect(results[0].testCaseId).toBe(testCaseId1);
      expect(results[0].createdAt).toBeDefined();

      expect(results[1].runId).toBe(runId);
      expect(results[1].topicId).toBe(topicId2);
      expect(results[1].testCaseId).toBe(testCaseId2);
    });

    it('should handle empty array', async () => {
      const results = await runTopicModel.batchCreate([]);

      expect(results).toHaveLength(0);
    });
  });

  describe('findByRunId', () => {
    beforeEach(async () => {
      await serverDB.insert(agentEvalRunTopics).values([
        {
          runId,
          topicId: topicId1,
          testCaseId: testCaseId1,
        },
        {
          runId,
          topicId: topicId2,
          testCaseId: testCaseId2,
        },
      ]);
    });

    it('should find run topics with relations', async () => {
      const results = await runTopicModel.findByRunId(runId);

      expect(results).toHaveLength(2);
      expect(results[0].runId).toBe(runId);
      expect(results[0].topic).toBeDefined();
      expect((results[0].topic as any).id).toBe(topicId1);
      expect((results[0].topic as any).title).toBe('Topic 1');
      expect(results[0].testCase).toBeDefined();
      expect((results[0].testCase as any).id).toBe(testCaseId1);
    });

    it('should order by createdAt ascending', async () => {
      const results = await runTopicModel.findByRunId(runId);

      expect(results.length).toBe(2);
      // First created should be first
      expect(results[0].topicId).toBe(topicId1);
      expect(results[1].topicId).toBe(topicId2);
    });

    it('should return empty array when no topics exist', async () => {
      const [emptyRun] = await serverDB
        .insert(agentEvalRuns)
        .values({
          datasetId,
          userId,
          status: 'idle',
        })
        .returning();

      const results = await runTopicModel.findByRunId(emptyRun.id);

      expect(results).toHaveLength(0);
    });
  });

  describe('deleteByRunId', () => {
    beforeEach(async () => {
      await serverDB.insert(agentEvalRunTopics).values([
        {
          runId,
          topicId: topicId1,
          testCaseId: testCaseId1,
        },
        {
          runId,
          topicId: topicId2,
          testCaseId: testCaseId2,
        },
      ]);
    });

    it('should delete all topics for a run', async () => {
      await runTopicModel.deleteByRunId(runId);

      const remaining = await serverDB.query.agentEvalRunTopics.findMany({
        where: eq(agentEvalRunTopics.runId, runId),
      });

      expect(remaining).toHaveLength(0);
    });

    it('should not affect other runs', async () => {
      // Create another run with topics
      const [otherRun] = await serverDB
        .insert(agentEvalRuns)
        .values({
          datasetId,
          userId,
          status: 'idle',
        })
        .returning();

      const [otherTopic] = await serverDB
        .insert(topics)
        .values({
          userId,
          title: 'Other Topic',
          trigger: 'eval',
        })
        .returning();

      await serverDB.insert(agentEvalRunTopics).values({
        runId: otherRun.id,
        topicId: otherTopic.id,
        testCaseId: testCaseId1,
      });

      await runTopicModel.deleteByRunId(runId);

      const otherRunTopics = await serverDB.query.agentEvalRunTopics.findMany({
        where: eq(agentEvalRunTopics.runId, otherRun.id),
      });

      expect(otherRunTopics).toHaveLength(1);
    });
  });

  describe('findByTestCaseId', () => {
    beforeEach(async () => {
      await serverDB.insert(agentEvalRunTopics).values([
        {
          runId,
          topicId: topicId1,
          testCaseId: testCaseId1,
        },
        {
          runId,
          topicId: topicId2,
          testCaseId: testCaseId2,
        },
      ]);
    });

    it('should find topics by test case id', async () => {
      const results = await runTopicModel.findByTestCaseId(testCaseId1);

      expect(results).toHaveLength(1);
      expect(results[0].testCaseId).toBe(testCaseId1);
      expect(results[0].topicId).toBe(topicId1);
    });

    it('should return empty array when no topics exist for test case', async () => {
      const [newTestCase] = await serverDB
        .insert(agentEvalTestCases)
        .values({
          datasetId,
          content: { input: 'Unused test case' },
          sortOrder: 3,
        })
        .returning();

      const results = await runTopicModel.findByTestCaseId(newTestCase.id);

      expect(results).toHaveLength(0);
    });
  });

  describe('findByRunAndTestCase', () => {
    beforeEach(async () => {
      await serverDB.insert(agentEvalRunTopics).values([
        {
          runId,
          topicId: topicId1,
          testCaseId: testCaseId1,
        },
        {
          runId,
          topicId: topicId2,
          testCaseId: testCaseId2,
        },
      ]);
    });

    it('should find specific run-testcase combination', async () => {
      const result = await runTopicModel.findByRunAndTestCase(runId, testCaseId1);

      expect(result).toBeDefined();
      expect(result?.runId).toBe(runId);
      expect(result?.testCaseId).toBe(testCaseId1);
      expect(result?.topicId).toBe(topicId1);
    });

    it('should return undefined when combination not found', async () => {
      const [otherRun] = await serverDB
        .insert(agentEvalRuns)
        .values({
          datasetId,
          userId,
          status: 'idle',
        })
        .returning();

      const result = await runTopicModel.findByRunAndTestCase(otherRun.id, testCaseId1);

      expect(result).toBeUndefined();
    });
  });

  describe('cascade deletion', () => {
    beforeEach(async () => {
      await serverDB.insert(agentEvalRunTopics).values({
        runId,
        topicId: topicId1,
        testCaseId: testCaseId1,
      });
    });

    it('should cascade delete when run is deleted', async () => {
      await serverDB.delete(agentEvalRuns).where(eq(agentEvalRuns.id, runId));

      const remaining = await serverDB.query.agentEvalRunTopics.findMany({
        where: eq(agentEvalRunTopics.runId, runId),
      });

      expect(remaining).toHaveLength(0);
    });

    it('should cascade delete when topic is deleted', async () => {
      await serverDB.delete(topics).where(eq(topics.id, topicId1));

      const remaining = await serverDB.query.agentEvalRunTopics.findMany({
        where: eq(agentEvalRunTopics.topicId, topicId1),
      });

      expect(remaining).toHaveLength(0);
    });

    it('should cascade delete when test case is deleted', async () => {
      await serverDB.delete(agentEvalTestCases).where(eq(agentEvalTestCases.id, testCaseId1));

      const remaining = await serverDB.query.agentEvalRunTopics.findMany({
        where: eq(agentEvalRunTopics.testCaseId, testCaseId1),
      });

      expect(remaining).toHaveLength(0);
    });
  });
});
