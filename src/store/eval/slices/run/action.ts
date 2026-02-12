import type { SWRResponse } from 'swr';
import type { StateCreator } from 'zustand/vanilla';

import { mutate, useClientDataSWR } from '@/libs/swr';
import { agentEvalService } from '@/services/agentEval';
import type { EvalStore } from '@/store/eval/store';

const FETCH_RUNS_KEY = 'FETCH_EVAL_RUNS';
const FETCH_RUN_DETAIL_KEY = 'FETCH_EVAL_RUN_DETAIL';
const FETCH_RUN_RESULTS_KEY = 'FETCH_EVAL_RUN_RESULTS';

export interface RunAction {
  abortRun: (id: string) => Promise<void>;
  createRun: (params: {
    config?: { concurrency?: number; timeout?: number };
    datasetId: string;
    name?: string;
    targetAgentId?: string;
  }) => Promise<any>;
  deleteRun: (id: string) => Promise<void>;
  refreshRunDetail: (id: string) => Promise<void>;
  refreshRuns: () => Promise<void>;
  startRun: (id: string, force?: boolean) => Promise<void>;
  useFetchRunDetail: (id: string) => SWRResponse;
  useFetchRunResults: (id: string) => SWRResponse;
  useFetchRuns: (datasetId?: string) => SWRResponse;
}

export const createRunSlice: StateCreator<
  EvalStore,
  [['zustand/devtools', never]],
  [],
  RunAction
> = (set, get) => ({
  abortRun: async (id) => {
    await agentEvalService.abortRun(id);
    await get().refreshRunDetail(id);
  },

  createRun: async (params) => {
    set({ isCreatingRun: true }, false, 'createRun/start');
    try {
      const result = await agentEvalService.createRun(params);
      await get().refreshRuns();
      return result;
    } finally {
      set({ isCreatingRun: false }, false, 'createRun/end');
    }
  },

  deleteRun: async (id) => {
    await agentEvalService.deleteRun(id);
    await get().refreshRuns();
  },

  refreshRunDetail: async (id) => {
    await mutate([FETCH_RUN_DETAIL_KEY, id]);
  },

  refreshRuns: async () => {
    await mutate(FETCH_RUNS_KEY);
  },

  startRun: async (id, force) => {
    await agentEvalService.startRun(id, force);
    await get().refreshRunDetail(id);
  },

  useFetchRunDetail: (id) => {
    return useClientDataSWR(
      id ? [FETCH_RUN_DETAIL_KEY, id] : null,
      () => agentEvalService.getRunDetails(id),
      {
        onSuccess: (data: any) => {
          set({ isLoadingRunDetail: false, runDetail: data }, false, 'useFetchRunDetail/success');
        },
      },
    );
  },

  useFetchRunResults: (id) => {
    return useClientDataSWR(
      id ? [FETCH_RUN_RESULTS_KEY, id] : null,
      () => agentEvalService.getRunResults(id),
      {
        onSuccess: (data: any) => {
          set(
            { isLoadingRunResults: false, runResults: data },
            false,
            'useFetchRunResults/success',
          );
        },
      },
    );
  },

  useFetchRuns: (datasetId) => {
    return useClientDataSWR(
      [FETCH_RUNS_KEY, datasetId],
      () => agentEvalService.listRuns(datasetId!),
      {
        onSuccess: (data: any) => {
          set({ isLoadingRuns: false, runList: data.data }, false, 'useFetchRuns/success');
        },
      },
    );
  },
});
