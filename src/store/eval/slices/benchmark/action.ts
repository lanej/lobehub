import type { SWRResponse } from 'swr';
import type { StateCreator } from 'zustand/vanilla';

import { mutate, useClientDataSWR } from '@/libs/swr';
import { agentEvalService } from '@/services/agentEval';
import type { EvalStore } from '@/store/eval/store';

const FETCH_BENCHMARKS_KEY = 'FETCH_BENCHMARKS';
const FETCH_BENCHMARK_DETAIL_KEY = 'FETCH_BENCHMARK_DETAIL';

export interface BenchmarkAction {
  createBenchmark: (params: {
    description?: string;
    identifier: string;
    metadata?: Record<string, unknown>;
    name: string;
    rubrics?: any[];
    tags?: string[];
  }) => Promise<any>;
  deleteBenchmark: (id: string) => Promise<void>;
  refreshBenchmarkDetail: (id: string) => Promise<void>;
  refreshBenchmarks: () => Promise<void>;
  updateBenchmark: (params: {
    description?: string;
    id: string;
    identifier: string;
    metadata?: Record<string, unknown>;
    name: string;
    tags?: string[];
  }) => Promise<void>;
  useFetchBenchmarkDetail: (id?: string) => SWRResponse;
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
      const result = await agentEvalService.createBenchmark({
        identifier: params.identifier,
        name: params.name,
        description: params.description,
        metadata: params.metadata,
        rubrics: params.rubrics ?? [],
        tags: params.tags,
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
      await agentEvalService.deleteBenchmark(id);
      await get().refreshBenchmarks();
    } finally {
      set({ isDeletingBenchmark: false }, false, 'deleteBenchmark/end');
    }
  },

  refreshBenchmarkDetail: async (id) => {
    await mutate([FETCH_BENCHMARK_DETAIL_KEY, id]);
  },

  refreshBenchmarks: async () => {
    await mutate(FETCH_BENCHMARKS_KEY);
  },

  updateBenchmark: async (params) => {
    set({ isUpdatingBenchmark: true }, false, 'updateBenchmark/start');
    try {
      await agentEvalService.updateBenchmark({
        id: params.id,
        identifier: params.identifier,
        name: params.name,
        description: params.description,
        metadata: params.metadata,
        tags: params.tags,
      });
      await get().refreshBenchmarks();
    } finally {
      set({ isUpdatingBenchmark: false }, false, 'updateBenchmark/end');
    }
  },

  useFetchBenchmarkDetail: (id) => {
    return useClientDataSWR(
      id ? [FETCH_BENCHMARK_DETAIL_KEY, id] : null,
      () => agentEvalService.getBenchmark(id!),
      {
        onSuccess: (data: any) => {
          set(
            {
              benchmarkDetail: data,
              isLoadingBenchmarkDetail: false,
            },
            false,
            'useFetchBenchmarkDetail/success',
          );
        },
      },
    );
  },

  useFetchBenchmarks: () => {
    return useClientDataSWR(
      FETCH_BENCHMARKS_KEY,
      () => agentEvalService.listBenchmarks(),
      {
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
