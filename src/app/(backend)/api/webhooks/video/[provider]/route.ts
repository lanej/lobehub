import { ModelRuntime } from '@lobechat/model-runtime';
import { AsyncTaskError, AsyncTaskErrorType, AsyncTaskStatus } from '@lobechat/types';
import debug from 'debug';
import { NextResponse } from 'next/server';

import { AsyncTaskModel } from '@/database/models/asyncTask';
import { GenerationModel } from '@/database/models/generation';
import { getServerDB } from '@/database/server';

const log = debug('lobe-video:webhook');

export const POST = async (req: Request, { params }: { params: Promise<{ provider: string }> }) => {
  const { provider } = await params;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  log('Received video webhook for provider: %s, body: %O', provider, body);

  try {
    // Parse webhook body using provider-specific handler
    const runtime = ModelRuntime.initializeWithProvider(provider, {});
    const result = await runtime.handleCreateVideoWebhook({ body });

    if (!result) {
      return NextResponse.json(
        { error: `Provider ${provider} does not support video webhook` },
        { status: 400 },
      );
    }

    // Skip intermediate statuses (e.g. queued, running)
    if (result.status === 'pending') {
      log('Skipping intermediate status for provider: %s', provider);
      return NextResponse.json({ success: true });
    }

    log('Webhook parse result: %O', result);

    const db = await getServerDB();
    const asyncTaskModel = new AsyncTaskModel(db, '');

    // Find asyncTask by inferenceId
    const asyncTask = await asyncTaskModel.findByInferenceId(result.inferenceId);
    if (!asyncTask) {
      log('AsyncTask not found for inferenceId: %s', result.inferenceId);
      return NextResponse.json(
        { error: `AsyncTask not found for inferenceId: ${result.inferenceId}` },
        { status: 404 },
      );
    }

    log(
      'Found asyncTask: %s, userId: %s, status: %s',
      asyncTask.id,
      asyncTask.userId,
      asyncTask.status,
    );

    // Idempotency: skip if already in terminal state (provider may retry callbacks)
    if (
      asyncTask.status === AsyncTaskStatus.Success ||
      asyncTask.status === AsyncTaskStatus.Error
    ) {
      log('AsyncTask %s already in terminal state: %s, skipping', asyncTask.id, asyncTask.status);
      return NextResponse.json({ success: true });
    }

    const generationModel = new GenerationModel(db, asyncTask.userId);

    // Find generation by asyncTaskId
    const generation = await generationModel.findByAsyncTaskId(asyncTask.id);
    if (!generation) {
      log('Generation not found for asyncTaskId: %s', asyncTask.id);
      return NextResponse.json(
        { error: `Generation not found for asyncTaskId: ${asyncTask.id}` },
        { status: 404 },
      );
    }

    log('Found generation: %s', generation.id);

    // Handle error result
    if (result.status === 'error') {
      log('Video generation failed: %s', result.error);
      await asyncTaskModel.update(asyncTask.id, {
        error: new AsyncTaskError(AsyncTaskErrorType.ServerError, result.error),
        status: AsyncTaskStatus.Error,
      });

      return NextResponse.json({ success: true });
    }

    // Handle success result
    // TODO: download video → upload S3 → createAssetAndFile
    await asyncTaskModel.update(asyncTask.id, {
      status: AsyncTaskStatus.Success,
    });

    log('Video webhook processing completed successfully for generation: %s', generation.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[video-webhook] Processing failed:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
};
