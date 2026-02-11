'use client';

import { Flexbox, Text } from '@lobehub/ui';
import { type ReactNode, memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useFetchAiVideoConfig } from '@/hooks/useFetchAiVideoConfig';
import { videoGenerationConfigSelectors } from '@/store/video/selectors';
import { useVideoStore } from '@/store/video/store';

import VideoConfigSkeleton from './VideoConfigSkeleton';
import FrameUpload from './components/FrameUpload';
import ModelSelect from './components/ModelSelect';

interface ConfigItemLayoutProps {
  children: ReactNode;
  label?: string;
}

const ConfigItemLayout = memo<ConfigItemLayoutProps>(({ label, children }) => {
  return (
    <Flexbox gap={8}>
      {label && <Text weight={500}>{label}</Text>}
      {children}
    </Flexbox>
  );
});

const isSupportedParamSelector = videoGenerationConfigSelectors.isSupportedParam;

const ConfigPanel = memo(() => {
  const { t } = useTranslation('video');

  // Initialize video configuration
  useFetchAiVideoConfig();

  const isInit = useVideoStore((s) => s.isInit);
  const isSupportImageUrl = useVideoStore(isSupportedParamSelector('imageUrl'));
  const isSupportEndImageUrl = useVideoStore(isSupportedParamSelector('endImageUrl'));

  // Show loading state if not initialized
  if (!isInit) {
    return <VideoConfigSkeleton />;
  }

  const imageUrlLabel = isSupportEndImageUrl
    ? t('config.imageUrl.label')
    : t('config.referenceImage.label');

  return (
    <Flexbox gap={16} padding={10}>
      <ConfigItemLayout>
        <ModelSelect />
      </ConfigItemLayout>

      {isSupportImageUrl && (
        <ConfigItemLayout label={imageUrlLabel}>
          <FrameUpload paramName="imageUrl" />
        </ConfigItemLayout>
      )}

      {isSupportEndImageUrl && (
        <ConfigItemLayout label={t('config.endImageUrl.label')}>
          <FrameUpload paramName="endImageUrl" />
        </ConfigItemLayout>
      )}
    </Flexbox>
  );
});

export default ConfigPanel;
