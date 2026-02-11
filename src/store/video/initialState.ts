import {
  type VideoGenerationConfigState,
  initialGenerationConfigState,
} from './slices/generationConfig/initialState';

export type VideoStoreState = VideoGenerationConfigState;

export const initialState: VideoStoreState = {
  ...initialGenerationConfigState,
};
