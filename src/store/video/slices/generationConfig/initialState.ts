/* eslint-disable sort-keys-fix/sort-keys-fix, typescript-sort-keys/interface */
import {
  type VideoModelParamsSchema,
  ModelProvider,
  type RuntimeVideoGenParams,
  extractVideoDefaultValues,
} from 'model-bank';

export const DEFAULT_AI_VIDEO_PROVIDER = ModelProvider.LobeHub;
export const DEFAULT_AI_VIDEO_MODEL = 'doubao-seedance-1-5-pro-251215';

const DEFAULT_VIDEO_PARAMS_SCHEMA: VideoModelParamsSchema = {
  prompt: { default: '' },
};

export interface VideoGenerationConfigState {
  parameters: RuntimeVideoGenParams;
  parametersSchema: VideoModelParamsSchema;

  provider: string;
  model: string;

  /**
   * Marks whether the configuration has been initialized (including restoration from memory)
   */
  isInit: boolean;
}

export const DEFAULT_VIDEO_GENERATION_PARAMETERS: RuntimeVideoGenParams =
  extractVideoDefaultValues(DEFAULT_VIDEO_PARAMS_SCHEMA);

export const initialGenerationConfigState: VideoGenerationConfigState = {
  model: DEFAULT_AI_VIDEO_MODEL,
  provider: DEFAULT_AI_VIDEO_PROVIDER,
  parameters: DEFAULT_VIDEO_GENERATION_PARAMETERS,
  parametersSchema: DEFAULT_VIDEO_PARAMS_SCHEMA,
  isInit: false,
};
