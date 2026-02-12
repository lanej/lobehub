'use client';

import { Center, Flexbox, Icon, Tag } from '@lobehub/ui';
import { Divider, Upload } from 'antd';
import { cssVar } from 'antd-style';
import { FileUp } from 'lucide-react';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { type DatasetPreset } from '../../config/datasetPresets';
import { ROLE_COLORS } from './const';

const { Dragger } = Upload;

interface UploadStepProps {
  loading: boolean;
  onFileSelect: (file: File) => void;
  preset?: DatasetPreset;
}

type FieldRole = 'choices' | 'context' | 'expected' | 'input' | 'sortOrder';

const FIELD_ROLE_KEYS: FieldRole[] = ['input', 'expected', 'choices', 'context', 'sortOrder'];

const getFieldRole = (fieldName: string, fieldInference: DatasetPreset['fieldInference']): FieldRole | undefined => {
  const lower = fieldName.toLowerCase();
  for (const role of FIELD_ROLE_KEYS) {
    const candidates = fieldInference[role];
    if (candidates?.some((f) => f.toLowerCase() === lower)) {
      return role;
    }
  }
};

const UploadStep = memo<UploadStepProps>(({ onFileSelect, loading, preset }) => {
  const { t } = useTranslation('eval');

  const fields = useMemo(() => {
    if (!preset) return [];

    const required = preset.requiredFields.map((name) => ({
      name,
      required: true,
      role: getFieldRole(name, preset.fieldInference),
    }));

    const optional = preset.optionalFields.map((name) => ({
      name,
      required: false,
      role: getFieldRole(name, preset.fieldInference),
    }));

    return [...required, ...optional];
  }, [preset]);

  return (
    <Flexbox gap={16}>
      {preset && (
        <div
          style={{
            border: `1px solid ${cssVar.colorFillTertiary}`,
            borderRadius: cssVar.borderRadiusLG,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Flexbox horizontal align="center" gap={8} padding={12}>
            <Center
              flex="none"
              height={36}
              width={36}
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
              <div style={{ color: cssVar.colorTextSecondary, fontSize: 12 }}>
                {preset.description}
              </div>
            </Flexbox>
          </Flexbox>

          <Divider style={{ margin: 0 }} />

          {/* Body */}
          <Flexbox gap={12} padding={12}>
            {preset.formatDescription && (
              <div style={{ color: cssVar.colorTextDescription, fontSize: 12 }}>
                {preset.formatDescription}
              </div>
            )}

            {/* Fields */}
            <Flexbox gap={8} horizontal style={{ flexWrap: 'wrap' }}>
              {fields.map((field) => {
                const color = field.role ? ROLE_COLORS[field.role] : undefined;
                return (
                  <Flexbox align="center" gap={2} key={field.name}>
                    <Tag style={color ? { background: `color-mix(in srgb, ${color} 15%, transparent)`, borderColor: 'transparent', color } : undefined}>
                      {field.name}
                      {field.required && ' *'}
                    </Tag>
                    {field.role && (
                      <div style={{ color: color || cssVar.colorTextTertiary, fontSize: 10 }}>
                        {field.role}
                      </div>
                    )}
                  </Flexbox>
                );
              })}
            </Flexbox>
          </Flexbox>
        </div>
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
