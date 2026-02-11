import {
  PRESET_VIDEO_ASPECT_RATIOS,
  PRESET_VIDEO_RESOLUTIONS,
  VideoModelParamsSchema,
} from '../../standard-parameters/video';
import { AIVideoModelCard } from '../../types/aiModel';

const seedance15ProParams: VideoModelParamsSchema = {
  aspectRatio: {
    default: '16:9',
    enum: PRESET_VIDEO_ASPECT_RATIOS,
  },
  cameraFixed: { default: false },
  duration: { default: 5, max: 12, min: 4 },
  endImageUrl: { default: null, maxFileSize: 30 * 1024 * 1024 },
  generateAudio: { default: true },
  imageUrl: { default: null, maxFileSize: 30 * 1024 * 1024 },
  prompt: { default: '' },
  resolution: {
    default: '720p',
    enum: PRESET_VIDEO_RESOLUTIONS,
  },
  seed: { default: null },
};

export const lobehubVideoModels: AIVideoModelCard[] = [
  {
    description:
      'Seedance 1.5 Pro by ByteDance supports text-to-video, image-to-video (first frame, first+last frame), and audio generation synchronized with visuals.',
    displayName: 'Seedance 1.5 Pro',
    enabled: true,
    id: 'doubao-seedance-1-5-pro-251215',
    organization: 'ByteDance',
    parameters: seedance15ProParams,
    pricing: {
      units: [{ name: 'videoGeneration', rate: 0, strategy: 'fixed', unit: 'second' }],
    },
    releasedAt: '2025-12-15',
    type: 'video',
  },
];
