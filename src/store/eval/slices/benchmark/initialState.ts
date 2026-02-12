import  { type AgentEvalBenchmark, type AgentEvalBenchmarkListItem } from '@lobechat/types';

export interface BenchmarkSliceState {
  benchmarkDetailMap: Record<string, AgentEvalBenchmark>;
  benchmarkList: AgentEvalBenchmarkListItem[];
  benchmarkListInit: boolean;
  isCreatingBenchmark: boolean;
  isDeletingBenchmark: boolean;
  isUpdatingBenchmark: boolean;
  loadingBenchmarkDetailIds: string[];
}

export const benchmarkInitialState: BenchmarkSliceState = {
  benchmarkDetailMap: {},
  benchmarkList: [],
  benchmarkListInit: false,
  isCreatingBenchmark: false,
  isDeletingBenchmark: false,
  isUpdatingBenchmark: false,
  loadingBenchmarkDetailIds: [],
};
