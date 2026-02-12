export interface BenchmarkSliceState {
  benchmarkDetail: any | null;
  benchmarkList: any[];
  benchmarkListInit: boolean;
  isCreatingBenchmark: boolean;
  isDeletingBenchmark: boolean;
  isLoadingBenchmarkDetail: boolean;
  isLoadingBenchmarkList: boolean;
  isUpdatingBenchmark: boolean;
}

export const benchmarkInitialState: BenchmarkSliceState = {
  benchmarkDetail: null,
  benchmarkList: [],
  benchmarkListInit: false,
  isCreatingBenchmark: false,
  isDeletingBenchmark: false,
  isLoadingBenchmarkDetail: false,
  isLoadingBenchmarkList: false,
  isUpdatingBenchmark: false,
};
