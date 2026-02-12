import createDebug from 'debug';

import {
  HandleCreateVideoWebhookPayload,
  HandleCreateVideoWebhookResult,
} from '../../../types/video';

const log = createDebug('lobe-video:volcengine:webhook');

interface VolcengineVideoWebhookBody {
  content?: {
    video_url?: string;
  };
  error?: {
    code?: string;
    message?: string;
  };
  id?: string;
  status?: string;
}

export async function handleVolcengineVideoWebhook(
  payload: HandleCreateVideoWebhookPayload,
): Promise<HandleCreateVideoWebhookResult> {
  const body = payload.body as VolcengineVideoWebhookBody;

  log('Received Volcengine video webhook: %O', body);

  const status = body.status;

  // Skip intermediate statuses
  if (status === 'queued' || status === 'running') {
    log('Skipping intermediate status: %s', status);
    return { status: 'pending' };
  }

  const inferenceId = body.id;
  if (!inferenceId) {
    throw new Error('Missing task id in webhook body');
  }

  if (status === 'succeeded') {
    const videoUrl = body.content?.video_url;
    if (!videoUrl) {
      throw new Error('Missing video_url in succeeded webhook body');
    }

    log('Video generation succeeded: %s, videoUrl: %s', inferenceId, videoUrl);

    return { inferenceId, status: 'success', videoUrl };
  }

  // failed / expired
  const errorMessage =
    body.error?.message ||
    (status === 'expired' ? 'Video generation task expired' : 'Unknown error');

  log('Video generation failed: %s, error: %s', inferenceId, errorMessage);

  return { error: errorMessage, inferenceId, status: 'error' };
}
