import type { SWRResponse } from 'swr';
import type { StateCreator } from 'zustand/vanilla';

import { mutate, useClientDataSWR } from '@/libs/swr';
import { agentEvalService } from '@/services/agentEval';
import type { EvalStore } from '@/store/eval/store';

const FETCH_DATASETS_KEY = 'FETCH_DATASETS';
const FETCH_DATASET_DETAIL_KEY = 'FETCH_DATASET_DETAIL';

export interface DatasetAction {
  refreshDatasetDetail: (id: string) => Promise<void>;
  refreshDatasets: (benchmarkId: string) => Promise<void>;
  useFetchDatasetDetail: (id?: string) => SWRResponse;
  useFetchDatasets: (benchmarkId?: string) => SWRResponse;
}

export const createDatasetSlice: StateCreator<
  EvalStore,
  [['zustand/devtools', never]],
  [],
  DatasetAction
> = (set, get) => ({
  refreshDatasetDetail: async (id) => {
    await mutate([FETCH_DATASET_DETAIL_KEY, id]);
  },

  refreshDatasets: async (benchmarkId) => {
    await mutate([FETCH_DATASETS_KEY, benchmarkId]);
  },

  useFetchDatasetDetail: (id) => {
    return useClientDataSWR(
      id ? [FETCH_DATASET_DETAIL_KEY, id] : null,
      () => agentEvalService.getDataset(id!),
      {
        onSuccess: (data: any) => {
          set(
            {
              datasetDetail: data,
              isLoadingDatasetDetail: false,
            },
            false,
            'useFetchDatasetDetail/success',
          );
        },
      },
    );
  },

  useFetchDatasets: (benchmarkId) => {
    return useClientDataSWR(
      benchmarkId ? [FETCH_DATASETS_KEY, benchmarkId] : null,
      () => agentEvalService.listDatasets(benchmarkId!),
      {
        onSuccess: (data: any) => {
          set(
            {
              datasetList: data,
              isLoadingDatasets: false,
            },
            false,
            'useFetchDatasets/success',
          );
        },
      },
    );
  },
});
