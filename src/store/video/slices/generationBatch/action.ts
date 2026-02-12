import { isEqual } from 'es-toolkit/compat';
import type { SWRResponse } from 'swr';
import { type StateCreator } from 'zustand';

import { mutate, useClientDataSWR } from '@/libs/swr';
import { generationBatchService } from '@/services/generationBatch';
import { type GenerationBatch } from '@/types/generation';
import { setNamespace } from '@/utils/storeDebug';

import { type VideoStore } from '../../store';
import { type GenerationBatchDispatch, generationBatchReducer } from './reducer';

const n = setNamespace('generationBatch');

// ====== SWR key ====== //
const SWR_USE_FETCH_GENERATION_BATCHES = 'SWR_USE_FETCH_VIDEO_GENERATION_BATCHES';

// ====== action interface ====== //

export interface GenerationBatchAction {
  internal_dispatchGenerationBatch: (
    topicId: string,
    payload: GenerationBatchDispatch,
    action?: string,
  ) => void;
  refreshGenerationBatches: () => Promise<void>;
  setTopicBatchLoaded: (topicId: string) => void;
  useFetchGenerationBatches: (topicId?: string | null) => SWRResponse<GenerationBatch[]>;
}

// ====== action implementation ====== //

export const createGenerationBatchSlice: StateCreator<
  VideoStore,
  [['zustand/devtools', never]],
  [],
  GenerationBatchAction
> = (set, get) => ({
  internal_dispatchGenerationBatch: (topicId, payload, action) => {
    const currentBatches = get().generationBatchesMap[topicId] || [];
    const nextBatches = generationBatchReducer(currentBatches, payload);

    const nextMap = {
      ...get().generationBatchesMap,
      [topicId]: nextBatches,
    };

    if (isEqual(nextMap, get().generationBatchesMap)) return;

    set(
      {
        generationBatchesMap: nextMap,
      },
      false,
      action ?? n(`dispatchGenerationBatch/${payload.type}`),
    );
  },

  refreshGenerationBatches: async () => {
    const { activeGenerationTopicId } = get();
    if (activeGenerationTopicId) {
      await mutate([SWR_USE_FETCH_GENERATION_BATCHES, activeGenerationTopicId]);
    }
  },

  setTopicBatchLoaded: (topicId: string) => {
    const nextMap = {
      ...get().generationBatchesMap,
      [topicId]: [],
    };

    if (isEqual(nextMap, get().generationBatchesMap)) return;

    set(
      {
        generationBatchesMap: nextMap,
      },
      false,
      n('setTopicBatchLoaded'),
    );
  },

  useFetchGenerationBatches: (topicId) =>
    useClientDataSWR<GenerationBatch[]>(
      topicId ? [SWR_USE_FETCH_GENERATION_BATCHES, topicId] : null,
      async ([, topicId]: [string, string]) => {
        return generationBatchService.getGenerationBatches(topicId);
      },
      {
        onSuccess: (data) => {
          const nextMap = {
            ...get().generationBatchesMap,
            [topicId!]: data,
          };

          if (isEqual(nextMap, get().generationBatchesMap)) return;

          set(
            {
              generationBatchesMap: nextMap,
            },
            false,
            n('useFetchGenerationBatches(success)', { topicId }),
          );
        },
      },
    ),
});
