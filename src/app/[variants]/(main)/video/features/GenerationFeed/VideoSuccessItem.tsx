'use client';

import { Block } from '@lobehub/ui';
import { memo } from 'react';

import { ActionButtons } from '@/app/[variants]/(main)/image/features/GenerationFeed/GenerationItem/ActionButtons';
import { styles } from '@/app/[variants]/(main)/image/features/GenerationFeed/GenerationItem/styles';
import { type Generation, type VideoGenerationAsset } from '@/types/generation';

interface VideoSuccessItemProps {
  generation: Generation;
  onDelete: () => void;
  onDownload: () => void;
}

const VideoSuccessItem = memo<VideoSuccessItemProps>(({ generation, onDelete, onDownload }) => {
  const asset = generation.asset as VideoGenerationAsset;

  return (
    <Block className={styles.imageContainer} style={{ width: '100%' }} variant={'filled'}>
      <video
        controls
        poster={asset.coverUrl || asset.thumbnailUrl}
        src={asset.url}
        style={{ display: 'block', width: '100%' }}
      />
      <ActionButtons onDelete={onDelete} onDownload={onDownload} showDownload />
    </Block>
  );
});

VideoSuccessItem.displayName = 'VideoSuccessItem';

export default VideoSuccessItem;
