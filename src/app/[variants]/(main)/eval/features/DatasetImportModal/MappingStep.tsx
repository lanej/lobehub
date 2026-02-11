'use client';

import { Flexbox } from '@lobehub/ui';
import { Input, Select, Table } from 'antd';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

// Known candidate names for auto-inference
const INPUT_CANDIDATES = new Set([
  'input',
  'question',
  'prompt',
  'query',
  'text',
  'instruction',
  'problem',
]);
const EXPECTED_CANDIDATES = new Set([
  'expected',
  'answer',
  'ideal',
  'target',
  'output',
  'response',
  'label',
  'ground_truth',
  'groundtruth',
]);
const CONTEXT_CANDIDATES = new Set(['context', 'reference', 'passage', 'document']);
const CHOICES_CANDIDATES = new Set(['choices', 'options', 'alternatives', 'candidates']);

type MappingTarget = 'choices' | 'context' | 'expected' | 'ignore' | 'input' | 'metadata' | 'sortOrder';

export interface FieldMappingValue {
  choices?: string;
  context?: string;
  expected?: string;
  expectedDelimiter?: string;
  input: string;
  metadata?: Record<string, string>;
  sortOrder?: string;
}

interface MappingStepProps {
  headers: string[];
  mapping: Record<string, MappingTarget>;
  onDelimiterChange: (delimiter: string) => void;
  onMappingChange: (mapping: Record<string, MappingTarget>) => void;
  preview: Record<string, any>[];
  delimiter: string;
}

const autoInferMapping = (headers: string[]): Record<string, MappingTarget> => {
  const result: Record<string, MappingTarget> = {};
  let inputFound = false;
  let expectedFound = false;
  let contextFound = false;
  let choicesFound = false;

  for (const h of headers) {
    const lower = h.toLowerCase().trim();
    if (!inputFound && INPUT_CANDIDATES.has(lower)) {
      result[h] = 'input';
      inputFound = true;
    } else if (!expectedFound && EXPECTED_CANDIDATES.has(lower)) {
      result[h] = 'expected';
      expectedFound = true;
    } else if (!choicesFound && CHOICES_CANDIDATES.has(lower)) {
      result[h] = 'choices';
      choicesFound = true;
    } else if (!contextFound && CONTEXT_CANDIDATES.has(lower)) {
      result[h] = 'context';
      contextFound = true;
    } else {
      result[h] = 'metadata';
    }
  }

  // Fallback: if no input matched, use first column
  if (!inputFound && headers.length > 0) {
    result[headers[0]] = 'input';
  }

  return result;
};

export { autoInferMapping };

const MappingStep = memo<MappingStepProps>(
  ({ headers, mapping, onMappingChange, preview, delimiter, onDelimiterChange }) => {
    const { t } = useTranslation('eval');

    const targetOptions = [
      { label: t('dataset.import.input'), value: 'input' },
      { label: t('dataset.import.expected'), value: 'expected' },
      { label: t('dataset.import.choices'), value: 'choices' },
      { label: t('dataset.import.context'), value: 'context' },
      { label: t('dataset.import.sortOrder'), value: 'sortOrder' },
      { label: t('dataset.import.metadata'), value: 'metadata' },
      { label: t('dataset.import.ignore'), value: 'ignore' },
    ];

    const hasExpected = Object.values(mapping).includes('expected');

    const columns = useMemo(
      () =>
        headers.map((h) => ({
          dataIndex: h,
          ellipsis: true,
          title: (
            <Flexbox gap={4}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{h}</span>
              <Select
                onChange={(val: MappingTarget) => {
                  const newMapping = { ...mapping };

                  // Ensure single assignment for input/expected/context/sortOrder
                  if (val !== 'metadata' && val !== 'ignore') {
                    for (const [k, v] of Object.entries(newMapping)) {
                      if (v === val) newMapping[k] = 'metadata';
                    }
                  }

                  newMapping[h] = val;
                  onMappingChange(newMapping);
                }}
                options={targetOptions}
                popupMatchSelectWidth={false}
                size="small"
                style={{ width: '100%' }}
                value={mapping[h]}
              />
            </Flexbox>
          ),
          width: 160,
        })),
      [headers, mapping, onMappingChange],
    );

    return (
      <Flexbox gap={16}>
        <p style={{ color: 'var(--ant-color-text-tertiary)', fontSize: 13, margin: 0 }}>
          {t('dataset.import.fieldMapping.desc')}
        </p>

        <Table
          columns={columns}
          dataSource={preview.map((row, i) => ({ ...row, _key: i }))}
          pagination={false}
          rowKey="_key"
          scroll={{ x: headers.length * 160 }}
          size="small"
        />

        {hasExpected && (
          <Flexbox gap={4}>
            <span style={{ color: 'var(--ant-color-text-secondary)', fontSize: 13 }}>
              {t('dataset.import.expectedDelimiter.desc')}
            </span>
            <Input
              onChange={(e) => onDelimiterChange(e.target.value)}
              placeholder={t('dataset.import.expectedDelimiter.placeholder')}
              style={{ width: 200 }}
              value={delimiter}
            />
          </Flexbox>
        )}
      </Flexbox>
    );
  },
);

export default MappingStep;
