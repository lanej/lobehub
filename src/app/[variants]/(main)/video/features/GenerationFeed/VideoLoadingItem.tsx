'use client';

import { LoadingOutlined } from '@ant-design/icons';
import { Block, Center } from '@lobehub/ui';
import { Spin } from 'antd';
import { memo } from 'react';

import { ElapsedTime } from '@/app/[variants]/(main)/image/features/GenerationFeed/GenerationItem/ElapsedTime';
import { AsyncTaskStatus } from '@/types/asyncTask';
import { type Generation } from '@/types/generation';

interface VideoLoadingItemProps {
  aspectRatio?: string;
  generation: Generation;
}

const VideoLoadingItem = memo<VideoLoadingItemProps>(({ generation, aspectRatio }) => {
  const isGenerating =
    generation.task.status === AsyncTaskStatus.Processing ||
    generation.task.status === AsyncTaskStatus.Pending;

  return (
    <Block
      align={'center'}
      justify={'center'}
      style={{
        aspectRatio: aspectRatio?.includes('/') ? aspectRatio : '16/9',
      }}
      variant={'filled'}
    >
      <Center gap={8}>
        <Spin indicator={<LoadingOutlined spin />} />
        <ElapsedTime generationId={generation.id} isActive={isGenerating} />
      </Center>
    </Block>
  );
});

VideoLoadingItem.displayName = 'VideoLoadingItem';

export default VideoLoadingItem;
