import type { SWRResponse } from 'swr';
import type { StateCreator } from 'zustand/vanilla';

import { mutate, useClientDataSWR } from '@/libs/swr';
import { agentEvalService } from '@/services/agentEval';
import type { EvalStore } from '@/store/eval/store';

const FETCH_TEST_CASES_KEY = 'FETCH_TEST_CASES';

export interface TestCaseAction {
  refreshTestCases: (datasetId: string) => Promise<void>;
  useFetchTestCases: (params: {
    datasetId: string;
    limit?: number;
    offset?: number;
  }) => SWRResponse;
}

export const createTestCaseSlice: StateCreator<
  EvalStore,
  [['zustand/devtools', never]],
  [],
  TestCaseAction
> = (set, get) => ({
  refreshTestCases: async (datasetId) => {
    await mutate([FETCH_TEST_CASES_KEY, datasetId]);
  },

  useFetchTestCases: (params) => {
    const { datasetId, limit, offset } = params;
    return useClientDataSWR(
      datasetId ? [FETCH_TEST_CASES_KEY, datasetId, limit, offset] : null,
      () => agentEvalService.listTestCases({ datasetId, limit, offset }),
      {
        onSuccess: (data: any) => {
          set(
            {
              isLoadingTestCases: false,
              testCaseList: data.data,
              testCaseTotal: data.total,
            },
            false,
            'useFetchTestCases/success',
          );
        },
      },
    );
  },
});
