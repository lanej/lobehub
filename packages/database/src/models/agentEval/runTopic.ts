import { and, eq } from 'drizzle-orm';

import {
  type AgentEvalRunTopicItem,
  type NewAgentEvalRunTopic,
  agentEvalRunTopics,
} from '../../schemas';
import { LobeChatDatabase } from '../../type';

export class AgentEvalRunTopicModel {
  private userId: string;
  private db: LobeChatDatabase;

  constructor(db: LobeChatDatabase, userId: string) {
    this.db = db;
    this.userId = userId;
  }

  /**
   * Batch create run-topic associations
   */
  batchCreate = async (items: NewAgentEvalRunTopic[]) => {
    if (items.length === 0) return [];
    return this.db.insert(agentEvalRunTopics).values(items).returning();
  };

  /**
   * Find all topics for a run (with TestCase and Topic details)
   */
  findByRunId = async (runId: string) => {
    return this.db.query.agentEvalRunTopics.findMany({
      orderBy: (runTopics, { asc }) => [asc(runTopics.createdAt)],
      where: eq(agentEvalRunTopics.runId, runId),
      with: {
        testCase: true,
        topic: true,
      },
    });
  };

  /**
   * Delete all run-topic associations for a run
   */
  deleteByRunId = async (runId: string) => {
    return this.db.delete(agentEvalRunTopics).where(eq(agentEvalRunTopics.runId, runId));
  };

  /**
   * Find all runs that used a specific test case
   */
  findByTestCaseId = async (testCaseId: string) => {
    return this.db.query.agentEvalRunTopics.findMany({
      orderBy: (runTopics, { desc }) => [desc(runTopics.createdAt)],
      where: eq(agentEvalRunTopics.testCaseId, testCaseId),
      with: {
        run: true,
        topic: true,
      },
    });
  };

  /**
   * Find a specific run-topic association by run and test case
   */
  findByRunAndTestCase = async (runId: string, testCaseId: string) => {
    return this.db.query.agentEvalRunTopics.findFirst({
      where: and(
        eq(agentEvalRunTopics.runId, runId),
        eq(agentEvalRunTopics.testCaseId, testCaseId),
      ),
      with: {
        testCase: true,
        topic: true,
      },
    });
  };

  /**
   * Update a RunTopic by composite key (runId + topicId)
   */
  updateByRunAndTopic = async (
    runId: string,
    topicId: string,
    value: Pick<Partial<AgentEvalRunTopicItem>, 'evalResult' | 'passed' | 'score'>,
  ) => {
    const [result] = await this.db
      .update(agentEvalRunTopics)
      .set(value)
      .where(
        and(eq(agentEvalRunTopics.runId, runId), eq(agentEvalRunTopics.topicId, topicId)),
      )
      .returning();
    return result;
  };
}
