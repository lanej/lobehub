/* eslint-disable typescript-sort-keys/interface */
import { RuntimeVideoGenParams } from 'model-bank';

export type CreateVideoPayload = {
  callbackUrl?: string;
  model: string;
  params: RuntimeVideoGenParams;
};

export type CreateVideoResponse = {
  inferenceId: string;
};

export type HandleCreateVideoWebhookPayload = {
  body: unknown;
  headers?: Record<string, string>;
};

export type HandleCreateVideoWebhookResult =
  | { inferenceId: string; status: 'success'; videoUrl: string }
  | { inferenceId: string; status: 'error'; error: string };
