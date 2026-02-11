import type { SWRResponse } from 'swr';
import type { StateCreator } from 'zustand/vanilla';

import { lambdaClient } from '@/libs/trpc/client';
import { mutate, useClientDataSWR } from '@/libs/swr';
import type { EvalStore } from '@/store/eval/store';

const FETCH_BENCHMARKS_KEY = 'FETCH_BENCHMARKS';

export interface BenchmarkAction {
  createBenchmark: (params: {
    description?: string;
    identifier: string;
    metadata?: Record<string, unknown>;
    name: string;
    rubrics?: any[];
  }) => Promise<any>;
  deleteBenchmark: (id: string) => Promise<void>;
  refreshBenchmarks: () => Promise<void>;
  useFetchBenchmarks: () => SWRResponse;
}

export const createBenchmarkSlice: StateCreator<
  EvalStore,
  [['zustand/devtools', never]],
  [],
  BenchmarkAction
> = (set, get) => ({
  createBenchmark: async (params) => {
    set({ isCreatingBenchmark: true }, false, 'createBenchmark/start');
    try {
      const result = await lambdaClient.agentEval.createBenchmark.mutate({
        identifier: params.identifier,
        name: params.name,
        description: params.description,
        metadata: params.metadata,
        rubrics: params.rubrics ?? [],
      });
      await get().refreshBenchmarks();
      return result;
    } finally {
      set({ isCreatingBenchmark: false }, false, 'createBenchmark/end');
    }
  },

  deleteBenchmark: async (id) => {
    set({ isDeletingBenchmark: true }, false, 'deleteBenchmark/start');
    try {
      await lambdaClient.agentEval.deleteBenchmark.mutate({ id });
      await get().refreshBenchmarks();
    } finally {
      set({ isDeletingBenchmark: false }, false, 'deleteBenchmark/end');
    }
  },

  refreshBenchmarks: async () => {
    await mutate(FETCH_BENCHMARKS_KEY);
  },

  useFetchBenchmarks: () => {
    return useClientDataSWR(FETCH_BENCHMARKS_KEY, () =>
      lambdaClient.agentEval.listBenchmarks.query(), {
        onSuccess: (data: any) => {
          set(
            { benchmarkList: data, benchmarkListInit: true, isLoadingBenchmarkList: false },
            false,
            'useFetchBenchmarks/success',
          );
        },
      },
    );
  },
});
