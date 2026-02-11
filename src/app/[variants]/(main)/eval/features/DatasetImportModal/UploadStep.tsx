'use client';

import { Icon } from '@lobehub/ui';
import { Upload } from 'antd';
import { FileUp } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

const { Dragger } = Upload;

interface UploadStepProps {
  loading: boolean;
  onFileSelect: (file: File) => void;
}

const UploadStep = memo<UploadStepProps>(({ onFileSelect, loading }) => {
  const { t } = useTranslation('eval');

  return (
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
  );
});

export default UploadStep;
