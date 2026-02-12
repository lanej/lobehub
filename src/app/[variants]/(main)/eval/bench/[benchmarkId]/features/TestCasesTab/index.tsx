'use client';

import { Button, Flexbox, Input } from '@lobehub/ui';
import { Badge, Card, Modal, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { createStaticStyles } from 'antd-style';
import { Eye, Search } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useEvalStore } from '@/store/eval';

const styles = createStaticStyles(({ css, cssVar }) => ({
  card: css`
    .ant-card-body {
      padding: 0;
    }
  `,
  filterButton: css`
    padding: 4px 10px;

    font-size: 11px;
    font-weight: 500;
    text-transform: capitalize;

    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.2s;

    &[data-active='true'] {
      color: ${cssVar.colorText};
      background: ${cssVar.colorFillSecondary};
    }

    &[data-active='false'] {
      color: ${cssVar.colorTextTertiary};

      &:hover {
        color: ${cssVar.colorText};
      }
    }

    &:not(:first-child) {
      border-left: 1px solid ${cssVar.colorBorderSecondary};
    }
  `,
  filterContainer: css`
    display: flex;
    overflow: hidden;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 6px;
  `,
  header: css`
    padding: 12px 16px;
    border-bottom: 1px solid ${cssVar.colorBorderSecondary};
  `,
  modalContent: css`
    .ant-modal-content {
      padding: 24px;
    }
  `,
  searchInput: css`
    width: 192px;
  `,
  table: css`
    .ant-table {
      font-size: 14px;
    }

    .ant-table-thead > tr > th {
      font-size: 12px;
      font-weight: 500;
      color: ${cssVar.colorTextTertiary};
      background: ${cssVar.colorFillQuaternary};
    }

    .ant-table-tbody > tr {
      &:hover {
        background: ${cssVar.colorFillQuaternary};
      }
    }
  `,
}));

interface TestCasesTabProps {
  datasetId: string;
}

const TestCasesTab = memo<TestCasesTabProps>(({ datasetId }) => {
  const { t } = useTranslation('eval');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 8 });
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [previewCase, setPreviewCase] = useState<any | null>(null);

  const useFetchTestCases = useEvalStore((s) => s.useFetchTestCases);
  const data = useEvalStore((s) => s.testCaseList);
  const total = useEvalStore((s) => s.testCaseTotal);
  const loading = useEvalStore((s) => s.isLoadingTestCases);

  useFetchTestCases({
    datasetId,
    limit: pagination.pageSize,
    offset: (pagination.current - 1) * pagination.pageSize,
  });

  // Client-side filtering
  const filteredData = data.filter((c) => {
    if (diffFilter !== 'all' && c.metadata?.difficulty !== diffFilter) return false;
    if (search && !c.content?.input?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getDifficultyBadge = (difficulty: string) => {
    const config: Record<string, { bg: string; color: string }> = {
      easy: {
        bg: 'var(--ant-color-success-bg)',
        color: 'var(--ant-color-success)',
      },
      hard: {
        bg: 'var(--ant-color-error-bg)',
        color: 'var(--ant-color-error)',
      },
      medium: {
        bg: 'var(--ant-color-warning-bg)',
        color: 'var(--ant-color-warning)',
      },
    };

    const c = config[difficulty] || config.easy;
    return (
      <Badge
        style={{
          backgroundColor: c.bg,
          borderColor: c.color + '30',
          color: c.color,
          fontSize: 11,
          textTransform: 'capitalize',
        }}
      >
        {difficulty}
      </Badge>
    );
  };

  const columns: ColumnsType<any> = [
    {
      dataIndex: 'id',
      key: 'index',
      render: (_: any, __: any, index: number) => (
        <span
          style={{
            color: 'var(--ant-color-text-tertiary)',
            fontFamily: 'monospace',
            fontSize: 12,
          }}
        >
          {(pagination.current - 1) * pagination.pageSize + index + 1}
        </span>
      ),
      title: '#',
      width: 64,
    },
    {
      dataIndex: ['content', 'input'],
      ellipsis: true,
      key: 'input',
      render: (text: string) => (
        <p
          style={{
            color: 'var(--ant-color-text)',
            margin: 0,
            maxWidth: 400,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {text}
        </p>
      ),
      title: t('table.columns.input'),
    },
    {
      dataIndex: ['metadata', 'difficulty'],
      key: 'difficulty',
      render: (difficulty: string) =>
        difficulty ? getDifficultyBadge(difficulty) : '-',
      title: t('table.columns.difficulty'),
      width: 96,
    },
    {
      dataIndex: ['metadata', 'tags'],
      key: 'tags',
      render: (tags: string[]) =>
        tags?.length > 0 ? (
          <Flexbox gap={4} horizontal>
            {tags.slice(0, 1).map((tag) => (
              <Badge
                key={tag}
                style={{
                  backgroundColor: 'transparent',
                  borderColor: 'var(--ant-color-border)',
                  color: 'var(--ant-color-text-tertiary)',
                  fontSize: 10,
                }}
              >
                {tag}
              </Badge>
            ))}
          </Flexbox>
        ) : (
          '-'
        ),
      title: t('table.columns.tags'),
      width: 112,
    },
    {
      key: 'actions',
      render: (_: any, record: any) => (
        <Button
          icon={Eye}
          onClick={() => setPreviewCase(record)}
          size="small"
          style={{
            color: 'var(--ant-color-text-tertiary)',
            height: 28,
            padding: 0,
            width: 28,
          }}
          variant="text"
        />
      ),
      width: 64,
    },
  ];

  return (
    <>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Flexbox align="center" horizontal justify="space-between">
            <span
              style={{
                color: 'var(--ant-color-text)',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {t('benchmark.detail.tabs.data')}
            </span>
            <Flexbox align="center" gap={12} horizontal>
              <div style={{ position: 'relative' }}>
                <Search
                  size={14}
                  style={{
                    color: 'var(--ant-color-text-tertiary)',
                    left: 10,
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
                <Input
                  className={styles.searchInput}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPagination({ ...pagination, current: 1 });
                  }}
                  placeholder={t('testCase.search.placeholder')}
                  size="small"
                  style={{
                    fontSize: 12,
                    paddingLeft: 32,
                  }}
                  value={search}
                />
              </div>
              <div className={styles.filterContainer}>
                {(['all', 'easy', 'medium', 'hard'] as const).map((f) => (
                  <button
                    key={f}
                    className={styles.filterButton}
                    data-active={diffFilter === f}
                    onClick={() => {
                      setDiffFilter(f);
                      setPagination({ ...pagination, current: 1 });
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </Flexbox>
          </Flexbox>
        </div>

        <div className={styles.table}>
          <Table
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            pagination={{
              current: pagination.current,
              onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
              pageSize: pagination.pageSize,
              showSizeChanger: false,
              total: filteredData.length,
            }}
            rowKey="id"
            size="middle"
          />
        </div>
      </Card>

      {/* Preview Modal */}
      <Modal
        className={styles.modalContent}
        footer={null}
        onCancel={() => setPreviewCase(null)}
        open={!!previewCase}
        title={t('testCase.preview.title')}
        width={600}
      >
        {previewCase && (
          <Flexbox gap={16}>
            <Flexbox gap={4}>
              <p
                style={{
                  color: 'var(--ant-color-text-tertiary)',
                  fontSize: 12,
                  fontWeight: 500,
                  margin: 0,
                  textTransform: 'uppercase',
                }}
              >
                {t('testCase.preview.input')}
              </p>
              <div
                style={{
                  background: 'var(--ant-color-fill-secondary)',
                  borderRadius: 8,
                  color: 'var(--ant-color-text)',
                  fontSize: 14,
                  lineHeight: 1.6,
                  padding: 12,
                }}
              >
                {previewCase.content?.input}
              </div>
            </Flexbox>
            <Flexbox gap={4}>
              <p
                style={{
                  color: 'var(--ant-color-text-tertiary)',
                  fontSize: 12,
                  fontWeight: 500,
                  margin: 0,
                  textTransform: 'uppercase',
                }}
              >
                {t('testCase.preview.expected')}
              </p>
              <div
                style={{
                  background: 'var(--ant-color-fill-secondary)',
                  borderRadius: 8,
                  color: 'var(--ant-color-text)',
                  fontSize: 14,
                  lineHeight: 1.6,
                  padding: 12,
                }}
              >
                {previewCase.content?.expectedOutput || '-'}
              </div>
            </Flexbox>
            <Flexbox align="center" gap={8} horizontal>
              {previewCase.metadata?.difficulty &&
                getDifficultyBadge(previewCase.metadata.difficulty)}
              {previewCase.metadata?.tags?.map((tag: string) => (
                <Badge
                  key={tag}
                  style={{
                    backgroundColor: 'transparent',
                    borderColor: 'var(--ant-color-border)',
                    color: 'var(--ant-color-text-tertiary)',
                    fontSize: 12,
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </Flexbox>
          </Flexbox>
        )}
      </Modal>
    </>
  );
});

export default TestCasesTab;
