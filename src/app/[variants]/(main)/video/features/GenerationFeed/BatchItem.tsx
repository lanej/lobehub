'use client';

import { ModelTag } from '@lobehub/icons';
import { Block, Flexbox, Markdown, Text } from '@lobehub/ui';
import dayjs from 'dayjs';
import { memo, useMemo } from 'react';

import { type GenerationBatch } from '@/types/generation';

import VideoLoadingItem from './VideoLoadingItem';

interface VideoGenerationBatchItemProps {
  batch: GenerationBatch;
}

export const VideoGenerationBatchItem = memo<VideoGenerationBatchItemProps>(({ batch }) => {
  const time = useMemo(() => {
    return dayjs(batch.createdAt).format('YYYY-MM-DD HH:mm:ss');
  }, [batch.createdAt]);

  const generation = batch.generations[0];
  if (!generation) {
    return null;
  }

  return (
    <Block gap={8} variant={'borderless'}>
      <Markdown variant={'chat'}>{batch.prompt}</Markdown>
      <Flexbox gap={4} horizontal style={{ marginBottom: 10 }}>
        <ModelTag model={batch.model} />
      </Flexbox>
      <VideoLoadingItem aspectRatio={batch.config?.aspectRatio} generation={generation} />
      <Text as={'time'} fontSize={12} type={'secondary'}>
        {time}
      </Text>
    </Block>
  );
});

VideoGenerationBatchItem.displayName = 'VideoGenerationBatchItem';
