'use client';

import { Flexbox, Skeleton } from '@lobehub/ui';
import { memo } from 'react';

const VideoConfigSkeleton = memo(() => {
  return (
    <Flexbox gap={32} padding="12px 12px 0 12px" style={{ height: '100%' }}>
      {/* Model Selection */}
      <Flexbox gap={8}>
        <Skeleton.Button active size="small" style={{ width: 100 }} />
        <Skeleton.Button active size="large" style={{ width: '100%' }} />
      </Flexbox>
    </Flexbox>
  );
});

VideoConfigSkeleton.displayName = 'VideoConfigSkeleton';

export default VideoConfigSkeleton;
