'use client';

import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';

import { useFetchAiVideoConfig } from '@/hooks/useFetchAiVideoConfig';
import { useVideoStore } from '@/store/video/store';

import VideoConfigSkeleton from './VideoConfigSkeleton';
import ModelSelect from './components/ModelSelect';

const ConfigPanel = memo(() => {
  // Initialize video configuration
  useFetchAiVideoConfig();

  const isInit = useVideoStore((s) => s.isInit);

  // Show loading state if not initialized
  if (!isInit) {
    return <VideoConfigSkeleton />;
  }

  return (
    <Flexbox gap={16} padding={10}>
      <Flexbox gap={8}>
        <ModelSelect />
      </Flexbox>
    </Flexbox>
  );
});

export default ConfigPanel;
