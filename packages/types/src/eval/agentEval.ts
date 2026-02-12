/**
 * Agent Evaluation Types
 * Defines test cases, run configurations, and metadata for agent evaluation
 */

/**
 * Test case content structure
 */
export interface EvalTestCaseContent {
  choices?: string[];
  context?: Record<string, unknown>;
  expected?: string;
  input: string;
}

/**
 * Test case metadata
 */
export interface EvalTestCaseMetadata {
  [key: string]: unknown;
  difficulty?: 'easy' | 'hard' | 'medium';
  source?: string;
  tags?: string[];
}

/**
 * Evaluation run status
 */
export type EvalRunStatus = 'aborted' | 'completed' | 'failed' | 'pending' | 'running';

/**
 * Evaluation run configuration
 */
export interface EvalRunConfig {
  [key: string]: unknown;
  judgeModel?: string;
  judgeProvider?: string;
  /**
   * Number of times to execute each test case (for pass@K, pass^K metrics)
   * @default 1
   */
  k?: number;
  maxConcurrency?: number;
  /**
   * Score threshold for a test case to be considered "passed"
   * @default 0.6
   */
  passThreshold?: number;
  promptTemplate?: {
    system?: string;
    user: string;
  };
  timeout?: number;
}

/**
 * Evaluation run metrics/statistics
 */
export interface EvalRunMetrics {
  [key: string]: unknown;
  averageScore: number;
  duration?: number;
  failedCases: number;
  passRate: number;
  passedCases: number;
  rubricScores?: Record<string, number>;
  totalCases: number;
}

/**
 * Field mapping configuration for dataset import
 */
export interface ImportFieldMapping {
  choices?: string;
  context?: string;
  expected?: string;
  expectedDelimiter?: string;
  input: string;
  metadata?: Record<string, string>;
  sortOrder?: string;
}

/**
 * Evaluation topic metadata extension
 */
export interface EvalTopicMetadata {
  benchmarkId: string;
  datasetId: string;
  evalRunId: string;
  testCaseId: string;
}

/**
 * Individual rubric score result
 */
export interface EvalRubricScore {
  reason?: string;
  rubricId: string;
  score: number;
}

/**
 * Evaluation result stored on RunTopic after scoring
 */
export interface EvalRunTopicResult {
  error?: string;
  extractedAnswer?: string;
  rubricScores: EvalRubricScore[];
}

/**
 * Evaluation thread metadata extension
 */
export interface EvalThreadMetadata {
  completedAt?: string;
  duration?: number;
  error?: string;
  passed?: boolean;
  scores?: EvalRubricScore[];
  testCaseId: string;
  totalScore?: number;
}
