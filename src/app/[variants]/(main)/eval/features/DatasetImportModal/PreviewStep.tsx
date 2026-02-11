'use client';

import { Flexbox } from '@lobehub/ui';
import { Table, Tag } from 'antd';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { FieldMappingValue } from './MappingStep';

interface PreviewStepProps {
  fieldMapping: FieldMappingValue;
  preview: Record<string, any>[];
  totalCount: number;
}

const PreviewStep = memo<PreviewStepProps>(({ preview, totalCount, fieldMapping }) => {
  const { t } = useTranslation('eval');

  const previewData = useMemo(() => {
    return preview.map((row, i) => ({
      _key: i,
      context: fieldMapping.context ? row[fieldMapping.context] : undefined,
      expected: fieldMapping.expected ? row[fieldMapping.expected] : undefined,
      input: row[fieldMapping.input] ?? '',
      metadata: fieldMapping.metadata
        ? Object.fromEntries(
            Object.entries(fieldMapping.metadata).map(([key, col]) => [key, row[col]]),
          )
        : undefined,
    }));
  }, [preview, fieldMapping]);

  const columns = useMemo(() => {
    const cols: any[] = [
      {
        dataIndex: 'input',
        ellipsis: true,
        title: t('dataset.import.input'),
        width: 200,
      },
    ];

    if (fieldMapping.expected) {
      cols.push({
        dataIndex: 'expected',
        ellipsis: true,
        title: t('dataset.import.expected'),
        width: 200,
      });
    }

    if (fieldMapping.context) {
      cols.push({
        dataIndex: 'context',
        ellipsis: true,
        title: t('dataset.import.context'),
        width: 160,
      });
    }

    if (fieldMapping.metadata && Object.keys(fieldMapping.metadata).length > 0) {
      cols.push({
        dataIndex: 'metadata',
        render: (val: Record<string, any>) =>
          val
            ? Object.entries(val).map(([k, v]) => (
                <Tag key={k} style={{ fontSize: 11 }}>
                  {k}: {String(v)}
                </Tag>
              ))
            : null,
        title: t('dataset.import.metadata'),
        width: 200,
      });
    }

    return cols;
  }, [fieldMapping, t]);

  return (
    <Flexbox gap={16}>
      <p style={{ color: 'var(--ant-color-text-tertiary)', fontSize: 13, margin: 0 }}>
        {t('dataset.import.preview.desc')}
        {' '}
        <strong>{t('dataset.import.preview.rows', { count: totalCount })}</strong>
      </p>

      <Table
        columns={columns}
        dataSource={previewData}
        pagination={false}
        rowKey="_key"
        scroll={{ x: columns.length * 180 }}
        size="small"
      />
    </Flexbox>
  );
});

export default PreviewStep;
