'use client';

import { Button, Empty, Flexbox, Input } from '@lobehub/ui';
import { App, Badge, Card, Modal, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { createStaticStyles } from 'antd-style';
import { ChevronRight, Database, Eye, FileUp, Plus, Search } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import NeuralNetworkLoading from '@/components/NeuralNetworkLoading';
import { lambdaClient } from '@/libs/trpc/client';

import DatasetCreateModal from '../../../../features/DatasetCreateModal';
import DatasetImportModal from '../../../../features/DatasetImportModal';
import TestCaseCreateModal from '../../../../features/TestCaseCreateModal';

const styles = createStaticStyles(({ css, cssVar }) => ({
  card: css`
    .ant-card-body {
      padding: 0;
    }
  `,
  datasetHeader: css`
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 16px;

    text-align: left;

    background: transparent;
    border: none;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: ${cssVar.colorFillQuaternary};
    }
  `,
  datasetIcon: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;

    width: 32px;
    height: 32px;

    background: ${cssVar.colorPrimaryBg};
    border-radius: 8px;
  `,
  emptyCard: css`
    .ant-card-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
    }
  `,
  emptyIcon: css`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 48px;
    height: 48px;
    margin-bottom: 12px;

    background: ${cssVar.colorFillSecondary};
    border-radius: 50%;
  `,
  expandedSection: css`
    border-top: 1px solid ${cssVar.colorBorderSecondary};
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
  filtersRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;

    border-bottom: 1px solid ${cssVar.colorBorderSecondary};
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

interface DatasetsTabProps {
  benchmarkId: string;
  datasets: any[];
  onImport: () => void;
  onRefresh: () => void;
}

const DatasetsTab = memo<DatasetsTabProps>(({ benchmarkId, datasets, onImport, onRefresh }) => {
  const { t } = useTranslation('eval');
  const { modal } = App.useApp();
  const [expandedDs, setExpandedDs] = useState<string | null>(null);
  const [testCases, setTestCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 6 });
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [previewCase, setPreviewCase] = useState<any | null>(null);

  // Create and Import modals
  const [createOpen, setCreateOpen] = useState(false);
  const [importDatasetId, setImportDatasetId] = useState<string | null>(null);
  const [addCaseDatasetId, setAddCaseDatasetId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshTestCases = useCallback(() => {
    setRefreshKey((k) => k + 1);
    onRefresh();
  }, [onRefresh]);

  useEffect(() => {
    if (!expandedDs) return;

    const fetchCases = async () => {
      setLoading(true);
      try {
        const result = await lambdaClient.agentEval.listTestCases.query({
          datasetId: expandedDs,
          limit: pagination.pageSize,
          offset: (pagination.current - 1) * pagination.pageSize,
        });
        setTestCases(result.data);
        setTotal(result.total);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [expandedDs, pagination.current, pagination.pageSize, refreshKey]);

  const filteredCases = testCases.filter((c) => {
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
      width: 48,
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
      render: (difficulty: string) => (difficulty ? getDifficultyBadge(difficulty) : '-'),
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
      width: 96,
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
      width: 48,
    },
  ];

  return (
    <>
      <Flexbox gap={16}>
        <Flexbox align="center" horizontal justify="space-between">
          <p style={{ color: 'var(--ant-color-text-tertiary)', fontSize: 14, margin: 0 }}>
            {t('benchmark.detail.datasetCount', { count: datasets.length })}
          </p>
          <Button icon={Plus} onClick={() => setCreateOpen(true)} size="small" type="primary">
            {t('dataset.actions.addDataset')}
          </Button>
        </Flexbox>

        {datasets.length === 0 ? (
          <Card className={styles.emptyCard}>
            <div className={styles.emptyIcon}>
              <Database size={20} style={{ color: 'var(--ant-color-text-tertiary)' }} />
            </div>
            <Empty
              description={
                <Flexbox gap={4}>
                  <p
                    style={{
                      color: 'var(--ant-color-text)',
                      fontSize: 14,
                      fontWeight: 500,
                      margin: 0,
                    }}
                  >
                    {t('dataset.empty.title')}
                  </p>
                  <p
                    style={{
                      color: 'var(--ant-color-text-tertiary)',
                      fontSize: 12,
                      margin: 0,
                    }}
                  >
                    {t('dataset.empty.description')}
                  </p>
                </Flexbox>
              }
              icon={Database}
            >
              <Button
                icon={Plus}
                onClick={() => setCreateOpen(true)}
                size="small"
                style={{ marginTop: 16 }}
                type="primary"
              >
                {t('dataset.actions.addDataset')}
              </Button>
            </Empty>
          </Card>
        ) : (
          <Flexbox gap={12}>
            {datasets.map((ds) => {
              const isExpanded = expandedDs === ds.id;

              return (
                <Card key={ds.id} className={styles.card}>
                  <button
                    className={styles.datasetHeader}
                    onClick={() => {
                      setExpandedDs(isExpanded ? null : ds.id);
                      setPagination({ current: 1, pageSize: 6 });
                      setSearch('');
                      setDiffFilter('all');
                    }}
                  >
                    <div className={styles.datasetIcon}>
                      <Database size={16} style={{ color: 'var(--ant-color-primary)' }} />
                    </div>
                    <Flexbox flex={1} gap={2} style={{ minWidth: 0 }}>
                      <p
                        style={{
                          color: 'var(--ant-color-text)',
                          fontSize: 14,
                          fontWeight: 500,
                          margin: 0,
                        }}
                      >
                        {ds.name}
                      </p>
                      {ds.description && (
                        <p
                          style={{
                            color: 'var(--ant-color-text-tertiary)',
                            fontSize: 12,
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ds.description}
                        </p>
                      )}
                    </Flexbox>
                    <span
                      style={{
                        color: 'var(--ant-color-text-tertiary)',
                        fontSize: 12,
                      }}
                    >
                      {ds.testCaseCount || 0} {t('benchmark.detail.stats.cases').toLowerCase()}
                    </span>
                    <ChevronRight
                      size={16}
                      style={{
                        color: 'var(--ant-color-text-tertiary)',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                      }}
                    />
                  </button>

                  {isExpanded && (
                    <div className={styles.expandedSection}>
                      {loading ? (
                        <Flexbox
                          align="center"
                          justify="center"
                          style={{ padding: '48px 24px' }}
                        >
                          <NeuralNetworkLoading size={48} />
                        </Flexbox>
                      ) : total === 0 ? (
                        <Flexbox
                          align="center"
                          gap={8}
                          justify="center"
                          style={{ padding: '48px 24px' }}
                        >
                          <div className={styles.emptyIcon}>
                            <Database
                              size={20}
                              style={{ color: 'var(--ant-color-text-tertiary)' }}
                            />
                          </div>
                          <p
                            style={{
                              color: 'var(--ant-color-text)',
                              fontSize: 14,
                              fontWeight: 500,
                              margin: 0,
                            }}
                          >
                            {t('testCase.empty.title')}
                          </p>
                          <p
                            style={{
                              color: 'var(--ant-color-text-tertiary)',
                              fontSize: 12,
                              margin: 0,
                            }}
                          >
                            {t('testCase.empty.description')}
                          </p>
                          <Flexbox gap={8} horizontal style={{ marginTop: 8 }}>
                            <Button
                              icon={FileUp}
                              onClick={() => setImportDatasetId(ds.id)}
                              size="small"
                            >
                              {t('testCase.actions.import')}
                            </Button>
                            <Button
                              icon={Plus}
                              onClick={() => setAddCaseDatasetId(ds.id)}
                              size="small"
                              type="primary"
                            >
                              {t('testCase.actions.add')}
                            </Button>
                          </Flexbox>
                        </Flexbox>
                      ) : (
                        <>
                          <div className={styles.filtersRow}>
                            <Flexbox align="center" gap={8} horizontal>
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
                                  onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPagination({ ...pagination, current: 1 });
                                  }}
                                  placeholder={t('testCase.search.placeholder')}
                                  size="small"
                                  style={{
                                    fontSize: 12,
                                    paddingLeft: 32,
                                    width: 192,
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
                            <Flexbox gap={8} horizontal>
                              <Button
                                icon={FileUp}
                                onClick={() => setImportDatasetId(ds.id)}
                                size="small"
                              >
                                {t('testCase.actions.import')}
                              </Button>
                              <Button
                                icon={Plus}
                                onClick={() => setAddCaseDatasetId(ds.id)}
                                size="small"
                                type="primary"
                              >
                                {t('testCase.actions.add')}
                              </Button>
                            </Flexbox>
                          </div>
                          <div className={styles.table}>
                            <Table
                              columns={columns}
                              dataSource={filteredCases}
                              pagination={{
                                current: pagination.current,
                                onChange: (page, pageSize) =>
                                  setPagination({ current: page, pageSize }),
                                pageSize: pagination.pageSize,
                                showSizeChanger: false,
                                total: filteredCases.length,
                              }}
                              rowKey="id"
                              size="small"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </Flexbox>
        )}
      </Flexbox>

      {/* Preview Modal */}
      <Modal
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

      {/* Create Dataset Modal */}
      <DatasetCreateModal
        benchmarkId={benchmarkId}
        onClose={() => setCreateOpen(false)}
        onSuccess={(dataset) => {
          onRefresh();
          // Ask if user wants to import data immediately
          modal.success({
            cancelText: t('common.later'),
            content: t('dataset.create.importNow'),
            okCancel: true,
            okText: t('dataset.actions.import'),
            onOk: () => {
              setImportDatasetId(dataset.id);
            },
            title: t('dataset.create.successTitle'),
          });
        }}
        open={createOpen}
      />

      {/* Import Dataset Modal */}
      <DatasetImportModal
        datasetId={importDatasetId!}
        onClose={() => setImportDatasetId(null)}
        onSuccess={refreshTestCases}
        open={!!importDatasetId}
      />

      {/* Add Test Case Modal */}
      <TestCaseCreateModal
        datasetId={addCaseDatasetId!}
        onClose={() => setAddCaseDatasetId(null)}
        onSuccess={refreshTestCases}
        open={!!addCaseDatasetId}
      />
    </>
  );
});

export default DatasetsTab;
