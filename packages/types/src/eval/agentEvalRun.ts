import  { type EvalRunConfig, type EvalRunMetrics } from './agentEval';

// ============================================
// Run Entity Types
// ============================================

export type AgentEvalRunStatus =
  | 'aborted'
  | 'completed'
  | 'failed'
  | 'idle'
  | 'pending'
  | 'running';

/**
 * Full run entity (for detail pages)
 * Contains all fields including heavy data like config and metrics
 */
export interface AgentEvalRun {
  config?: EvalRunConfig | null;
  createdAt: Date;
  datasetId: string;
  id: string;
  metrics?: EvalRunMetrics | null;
  name?: string | null;
  status: AgentEvalRunStatus;
  targetAgentId?: string | null;
  updatedAt: Date;
  userId: string;
}

/**
 * Lightweight run item (for list display)
 * Excludes heavy fields like full config, may include summary metrics
 */
export interface AgentEvalRunListItem {
  // Summary metrics for UI (not full metrics object)
  averageScore?: number;
  createdAt: Date;
  datasetId: string;
  id: string;
  name?: string | null;
  passRate?: number;
  status: AgentEvalRunStatus;

  targetAgentId?: string | null;
  totalCases?: number;
  updatedAt: Date;
}
