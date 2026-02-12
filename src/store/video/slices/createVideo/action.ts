import { ENABLE_BUSINESS_FEATURES } from '@lobechat/business-const';
import { type StateCreator } from 'zustand';

import { markUserValidAction } from '@/business/client/markUserValidAction';
import { videoService } from '@/services/video';

import { type VideoStore } from '../../store';
import { videoGenerationConfigSelectors } from '../generationConfig/selectors';
import { generationTopicSelectors } from '../generationTopic';

// ====== action interface ====== //

export interface CreateVideoAction {
  createVideo: () => Promise<void>;
}

// ====== action implementation ====== //

export const createCreateVideoSlice: StateCreator<
  VideoStore,
  [['zustand/devtools', never]],
  [],
  CreateVideoAction
> = (set, get) => ({
  async createVideo() {
    set({ isCreating: true }, false, 'createVideo/startCreateVideo');

    const store = get();
    const parameters = videoGenerationConfigSelectors.parameters(store);
    const provider = videoGenerationConfigSelectors.provider(store);
    const model = videoGenerationConfigSelectors.model(store);
    const activeGenerationTopicId = generationTopicSelectors.activeGenerationTopicId(store);
    const { createGenerationTopic, switchGenerationTopic } = store;

    if (!parameters) {
      throw new TypeError('parameters is not initialized');
    }

    if (!parameters.prompt) {
      throw new TypeError('prompt is empty');
    }

    let finalTopicId = activeGenerationTopicId;

    // 1. Create generation topic if not exists
    let generationTopicId = activeGenerationTopicId;
    let isNewTopic = false;

    if (!generationTopicId) {
      isNewTopic = true;
      const prompts = [parameters.prompt];
      const newGenerationTopicId = await createGenerationTopic(prompts);
      finalTopicId = newGenerationTopicId;

      // 2. Switch to the new topic
      switchGenerationTopic(newGenerationTopicId);
    }

    try {
      // 3. If it's a new topic, set the creating state after topic creation
      if (isNewTopic) {
        set({ isCreatingWithNewTopic: true }, false, 'createVideo/startCreateVideoWithNewTopic');
      }

      if (ENABLE_BUSINESS_FEATURES) {
        markUserValidAction();
      }

      // 4. Create video via service
      await videoService.createVideo({
        generationTopicId: finalTopicId!,
        model,
        params: parameters as any,
        provider,
      });

      // 5. Clear the prompt input after successful video creation
      set(
        (state) => ({
          parameters: { ...state.parameters, prompt: '' },
        }),
        false,
        'createVideo/clearPrompt',
      );
    } finally {
      // 6. Reset all creating states
      if (isNewTopic) {
        set(
          { isCreating: false, isCreatingWithNewTopic: false },
          false,
          'createVideo/endCreateVideoWithNewTopic',
        );
      } else {
        set({ isCreating: false }, false, 'createVideo/endCreateVideo');
      }
    }
  },
});
