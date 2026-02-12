'use client';

import { Center, Flexbox, Icon } from '@lobehub/ui';
import { Alert, Upload } from 'antd';
import { cssVar } from 'antd-style';
import { FileUp } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { type DatasetPreset } from '../../config/datasetPresets';

const { Dragger } = Upload;

interface UploadStepProps {
  loading: boolean;
  onFileSelect: (file: File) => void;
  preset?: DatasetPreset;
}

const UploadStep = memo<UploadStepProps>(({ onFileSelect, loading, preset }) => {
  const { t } = useTranslation('eval');

  return (
    <Flexbox gap={16}>
      {preset && (
        <Alert
          message={
            <Flexbox gap={8}>
              <Flexbox horizontal align="center" gap={8}>
                <Center
                  flex="none"
                  height={32}
                  width={32}
                  style={{
                    border: `1px solid ${cssVar.colorFillTertiary}`,
                    borderRadius: cssVar.borderRadius,
                    background: cssVar.colorBgElevated,
                  }}
                >
                  <Icon icon={preset.icon} />
                </Center>
                <Flexbox flex={1}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{preset.name}</div>
                  <div style={{ fontSize: 12, color: cssVar.colorTextSecondary }}>
                    {preset.description}
                  </div>
                </Flexbox>
              </Flexbox>
              <div style={{ fontSize: 12, color: cssVar.colorTextDescription }}>
                {preset.formatDescription}
              </div>
              <div style={{ fontSize: 12, color: cssVar.colorTextTertiary }}>
                <strong>Required:</strong> {preset.requiredFields.join(', ')}
                {preset.optionalFields.length > 0 && (
                  <>
                    {' · '}
                    <strong>Optional:</strong> {preset.optionalFields.join(', ')}
                  </>
                )}
              </div>
            </Flexbox>
          }
          type="info"
        />
      )}

      <Dragger
        accept=".csv,.xlsx,.xls,.json,.jsonl"
        beforeUpload={(file) => {
          onFileSelect(file);
          return false;
        }}
        disabled={loading}
        maxCount={1}
        showUploadList={false}
        style={{ padding: '32px 0' }}
      >
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Icon icon={FileUp} size={40} style={{ color: 'var(--ant-color-primary)' }} />
          <p style={{ color: 'var(--ant-color-text)', fontSize: 14, margin: 0 }}>
            {loading ? t('dataset.import.uploading') : t('dataset.import.upload.text')}
          </p>
          <p style={{ color: 'var(--ant-color-text-tertiary)', fontSize: 12, margin: 0 }}>
            {t('dataset.import.upload.hint')}
          </p>
        </div>
      </Dragger>
    </Flexbox>
  );
});

export default UploadStep;
