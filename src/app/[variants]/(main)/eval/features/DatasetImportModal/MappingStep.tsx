'use client';

import { Flexbox } from '@lobehub/ui';
import { Checkbox, Input, Select, Table } from 'antd';
import { cssVar } from 'antd-style';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { type DatasetPreset } from '../../config/datasetPresets';
import { ROLE_COLORS } from './const';

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

type MappingTarget =
  | 'choices'
  | 'context'
  | 'expected'
  | 'ignore'
  | 'input'
  | 'metadata'
  | 'sortOrder';

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
  delimiter: string;
  headers: string[];
  mapping: Record<string, MappingTarget>;
  onDelimiterChange: (delimiter: string) => void;
  onMappingChange: (mapping: Record<string, MappingTarget>) => void;
  preview: Record<string, any>[];
  totalCount: number;
}

const SORT_ORDER_CANDIDATES = new Set(['id', 'number', 'index', 'no', 'order', 'sort_order']);

const autoInferMapping = (
  headers: string[],
  preset?: DatasetPreset,
): Record<string, MappingTarget> => {
  const result: Record<string, MappingTarget> = {};
  let inputFound = false;
  let expectedFound = false;
  let contextFound = false;
  let choicesFound = false;
  let sortOrderFound = false;

  // Use preset's fieldInference if available, otherwise use default candidates
  const inputCandidates = preset
    ? new Set(preset.fieldInference.input.map((s) => s.toLowerCase()))
    : INPUT_CANDIDATES;
  const expectedCandidates = preset
    ? new Set(preset.fieldInference.expected.map((s) => s.toLowerCase()))
    : EXPECTED_CANDIDATES;
  const choicesCandidates = preset
    ? new Set(preset.fieldInference.choices.map((s) => s.toLowerCase()))
    : CHOICES_CANDIDATES;
  const contextCandidates = preset
    ? new Set(preset.fieldInference.context.map((s) => s.toLowerCase()))
    : CONTEXT_CANDIDATES;
  const sortOrderCandidates = preset?.fieldInference.sortOrder
    ? new Set(preset.fieldInference.sortOrder.map((s) => s.toLowerCase()))
    : SORT_ORDER_CANDIDATES;

  for (const h of headers) {
    const lower = h.toLowerCase().trim();
    if (!inputFound && inputCandidates.has(lower)) {
      result[h] = 'input';
      inputFound = true;
    } else if (!expectedFound && expectedCandidates.has(lower)) {
      result[h] = 'expected';
      expectedFound = true;
    } else if (!choicesFound && choicesCandidates.has(lower)) {
      result[h] = 'choices';
      choicesFound = true;
    } else if (!contextFound && contextCandidates.has(lower)) {
      result[h] = 'context';
      contextFound = true;
    } else if (!sortOrderFound && sortOrderCandidates.has(lower)) {
      result[h] = 'sortOrder';
      sortOrderFound = true;
    } else {
      result[h] = 'ignore';
    }
  }

  // Fallback: if no input matched, use first column
  if (!inputFound && headers.length > 0) {
    result[headers[0]] = 'input';
  }

  return result;
};

export { autoInferMapping };

const COL_WIDTHS: Record<MappingTarget, number> = {
  choices: 200,
  context: 240,
  expected: 300,
  ignore: 100,
  input: 800,
  metadata: 160,
  sortOrder: 120,
};

const WRAP_ROLES = new Set<MappingTarget>(['input', 'expected']);

const MappingStep = memo<MappingStepProps>(
  ({ headers, mapping, onMappingChange, preview, delimiter, onDelimiterChange, totalCount }) => {
    const { t } = useTranslation('eval');
    const [hideSkipped, setHideSkipped] = useState(true);

    const hasExpected = Object.values(mapping).includes('expected');
    const hasIgnored = Object.values(mapping).includes('ignore');

    const visibleHeaders = useMemo(
      () => (hideSkipped ? headers.filter((h) => mapping[h] !== 'ignore') : headers),
      [headers, mapping, hideSkipped],
    );

    const roleDescColor = (role: MappingTarget) => ROLE_COLORS[role] || cssVar.colorTextTertiary;

    const targetOptions: { label: React.ReactNode; value: MappingTarget }[] = [
      { desc: 'inputDesc', label: 'input', value: 'input' },
      { desc: 'expectedDesc', label: 'expected', value: 'expected' },
      { desc: 'choicesDesc', label: 'choices', value: 'choices' },
      { desc: 'contextDesc', label: 'context', value: 'context' },
      { desc: 'sortOrderDesc', label: 'sortOrder', value: 'sortOrder' },
      { desc: 'metadataDesc', label: 'metadata', value: 'metadata' },
      { desc: 'ignoreDesc', label: 'ignore', value: 'ignore' },
    ].map(({ desc, label, value }) => ({
      label: (
        <Flexbox gap={2}>
          <span style={{ fontSize: 11 }}>{t(`dataset.import.${label}`)}</span>
          <span style={{ color: roleDescColor(value as MappingTarget), fontSize: 11 }}>
            {t(`dataset.import.${desc}`)}
          </span>
        </Flexbox>
      ),
      value: value as MappingTarget,
    }));

    const columns = useMemo(
      () =>
        visibleHeaders.map((h) => {
          const role = mapping[h];
          const isIgnored = role === 'ignore';
          const allowWrap = WRAP_ROLES.has(role);

          return {
            dataIndex: h,
            ellipsis: !allowWrap,
            onCell: isIgnored
              ? () => ({ style: { color: cssVar.colorTextQuaternary } })
              : allowWrap
                ? () => ({
                    style: {
                      verticalAlign: 'top',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    },
                  })
                : undefined,
            title: (
              <Flexbox gap={4}>
                <Select
                  onChange={(val: MappingTarget) => {
                    const newMapping = { ...mapping };

                    // Ensure single assignment for input/expected/context/sortOrder
                    if (val !== 'metadata' && val !== 'ignore') {
                      for (const [k, v] of Object.entries(newMapping)) {
                        if (v === val) newMapping[k] = 'ignore';
                      }
                    }

                    newMapping[h] = val;
                    onMappingChange(newMapping);
                  }}
                  options={targetOptions}
                  popupMatchSelectWidth={200}
                  // size="small"
                  variant={'filled'}
                  style={{ width: '100%' }}
                  value={role}
                />
                <span style={{ fontSize:15 }}>{h}</span>
              </Flexbox>
            ),
            width: COL_WIDTHS[role],
          };
        }),
      [visibleHeaders, mapping, onMappingChange],
    );

    const scrollX = useMemo(
      () => visibleHeaders.reduce((sum, h) => sum + COL_WIDTHS[mapping[h]], 0),
      [visibleHeaders, mapping],
    );

    return (
      <Flexbox gap={12}>
        <Flexbox align="center" horizontal justify="space-between">
          <Flexbox align="center" gap={16} horizontal>
            <span style={{ color: cssVar.colorTextTertiary, fontSize: 13 }}>
              {t('dataset.import.fieldMapping.desc')}
            </span>
            <span style={{ color: cssVar.colorTextQuaternary, fontSize: 12 }}>
              {t('dataset.import.preview.rows', { count: totalCount })}
            </span>
            {hasIgnored && (
              <Checkbox checked={hideSkipped} onChange={(e) => setHideSkipped(e.target.checked)}>
                <span style={{ color: cssVar.colorTextSecondary, fontSize: 12 }}>
                  {t('dataset.import.hideSkipped')}
                </span>
              </Checkbox>
            )}
          </Flexbox>
          {hasExpected && (
            <Flexbox align="center" gap={8} horizontal>
              <span
                style={{ color: cssVar.colorTextSecondary, fontSize: 12, whiteSpace: 'nowrap' }}
              >
                {t('dataset.import.expectedDelimiter.desc')}
              </span>
              <Input
                onChange={(e) => onDelimiterChange(e.target.value)}
                placeholder={t('dataset.import.expectedDelimiter.placeholder')}
                size="small"
                style={{ width: 120 }}
                value={delimiter}
              />
            </Flexbox>
          )}
        </Flexbox>

        <Table
          columns={columns}
          dataSource={preview.map((row, i) => ({ ...row, _key: i }))}
          pagination={false}
          rowKey="_key"
          scroll={{ x: scrollX, y: 'calc(95vh - 280px)' }}
          size="small"
        />
      </Flexbox>
    );
  },
);

export default MappingStep;
