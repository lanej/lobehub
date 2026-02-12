import { type CreateVideoState, initialCreateVideoState } from './slices/createVideo/initialState';
import {
  type VideoGenerationConfigState,
  initialGenerationConfigState,
} from './slices/generationConfig/initialState';
import {
  type GenerationTopicState,
  initialGenerationTopicState,
} from './slices/generationTopic/initialState';

export type VideoStoreState = VideoGenerationConfigState & GenerationTopicState & CreateVideoState;

export const initialState: VideoStoreState = {
  ...initialGenerationConfigState,
  ...initialGenerationTopicState,
  ...initialCreateVideoState,
};
