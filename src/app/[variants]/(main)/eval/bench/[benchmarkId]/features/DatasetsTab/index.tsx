'use client';

import { Button, Empty, Flexbox, Input, Tag } from '@lobehub/ui';
import { App, Badge, Card, Dropdown, Modal, Table } from 'antd';
import { type ColumnsType } from 'antd/es/table';
import { createStaticStyles, cssVar } from 'antd-style';
import {
  ChevronRight,
  Database,
  Ellipsis,
  Eye,
  FileUp,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import NeuralNetworkLoading from '@/components/NeuralNetworkLoading';
import { agentEvalService } from '@/services/agentEval';
import { useEvalStore } from '@/store/eval';

import { DATASET_PRESETS } from '../../../../config/datasetPresets';
import DatasetCreateModal from '../../../../features/DatasetCreateModal';
import DatasetEditModal from '../../../../features/DatasetEditModal';
import DatasetImportModal from '../../../../features/DatasetImportModal';
import TestCaseCreateModal from '../../../../features/TestCaseCreateModal';

const styles = createStaticStyles(({ css, cssVar }) => ({
  card: css`
    .ant-card-body {
      padding: 0;
    }
  `,
  datasetHeader: css`
    cursor: pointer;

    display: flex;
    gap: 12px;
    align-items: center;

    width: 100%;
    padding: 16px;
    border: none;

    text-align: start;

    background: transparent;

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
    border-radius: 8px;

    background: ${cssVar.colorPrimaryBg};
  `,
  emptyCard: css`
    .ant-card-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      padding-block: 64px;
      padding-inline: 24px;
    }
  `,
  emptyIcon: css`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 48px;
    height: 48px;
    margin-block-end: 12px;
    border-radius: 50%;

    background: ${cssVar.colorFillSecondary};
  `,
  expandedSection: css`
    border-block-start: 1px solid ${cssVar.colorBorderSecondary};
  `,
  filterButton: css`
    cursor: pointer;

    padding-block: 4px;
    padding-inline: 10px;
    border: none;

    font-size: 11px;
    font-weight: 500;
    text-transform: capitalize;

    background: transparent;

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
      border-inline-start: 1px solid ${cssVar.colorBorderSecondary};
    }
  `,
  filterContainer: css`
    overflow: hidden;
    display: flex;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 6px;
  `,
  filtersRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;

    padding-block: 12px;
    padding-inline: 16px;
    border-block-end: 1px solid ${cssVar.colorBorderSecondary};
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
  const { modal, message } = App.useApp();
  const [expandedDs, setExpandedDs] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 6 });
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [previewCase, setPreviewCase] = useState<any | null>(null);

  // Create, Edit, and Import modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editDataset, setEditDataset] = useState<any | null>(null);
  const [importDatasetId, setImportDatasetId] = useState<string | null>(null);
  const [addCaseDatasetId, setAddCaseDatasetId] = useState<string | null>(null);

  const useFetchTestCases = useEvalStore((s) => s.useFetchTestCases);
  const testCases = useEvalStore((s) => s.testCaseList);
  const total = useEvalStore((s) => s.testCaseTotal);
  const loading = useEvalStore((s) => s.isLoadingTestCases);
  const refreshTestCases = useEvalStore((s) => s.refreshTestCases);

  useFetchTestCases(
    expandedDs
      ? {
          datasetId: expandedDs,
          limit: pagination.pageSize,
          offset: (pagination.current - 1) * pagination.pageSize,
        }
      : { datasetId: '', limit: 0, offset: 0 },
  );

  const handleRefreshTestCases = useCallback(async () => {
    if (expandedDs) {
      await refreshTestCases(expandedDs);
    }
    onRefresh();
  }, [expandedDs, refreshTestCases, onRefresh]);

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
          <Flexbox horizontal gap={4}>
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
          size="small"
          variant="text"
          style={{
            color: 'var(--ant-color-text-tertiary)',
            height: 28,
            padding: 0,
            width: 28,
          }}
          onClick={() => setPreviewCase(record)}
        />
      ),
      width: 48,
    },
  ];

  return (
    <>
      <Flexbox gap={16}>
        <Flexbox horizontal align="center" justify="space-between">
          <p style={{ color: 'var(--ant-color-text-tertiary)', fontSize: 14, margin: 0 }}>
            {t('benchmark.detail.datasetCount', { count: datasets.length })}
          </p>
          <Button icon={Plus} size="small" type="primary" onClick={() => setCreateOpen(true)}>
            {t('dataset.actions.addDataset')}
          </Button>
        </Flexbox>

        {datasets.length === 0 ? (
          <Card className={styles.emptyCard}>
            <div className={styles.emptyIcon}>
              <Database size={20} style={{ color: 'var(--ant-color-text-tertiary)' }} />
            </div>
            <Empty
              icon={Database}
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
            >
              <Button
                icon={Plus}
                size="small"
                style={{ marginTop: 16 }}
                type="primary"
                onClick={() => setCreateOpen(true)}
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
                <Card className={styles.card} key={ds.id}>
                  <div
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
                      <Flexbox horizontal align="center" gap={8}>
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
                        {ds.metadata?.preset && DATASET_PRESETS[ds.metadata.preset] && (
                          <Tag style={{ fontSize: 10 }}>
                            {DATASET_PRESETS[ds.metadata.preset].name}
                          </Tag>
                        )}
                      </Flexbox>
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
                    <Dropdown
                      trigger={['click']}
                      menu={{
                        items: [
                          {
                            icon: <Pencil size={14} />,
                            key: 'edit',
                            label: t('common.edit'),
                            onClick: () => setEditDataset(ds),
                          },
                          { type: 'divider' },
                          {
                            danger: true,
                            icon: <Trash2 size={14} />,
                            key: 'delete',
                            label: t('common.delete'),
                            onClick: () => {
                              modal.confirm({
                                content: t('dataset.delete.confirm'),
                                okButtonProps: { danger: true },
                                okText: t('common.delete'),
                                onOk: async () => {
                                  try {
                                    await agentEvalService.deleteDataset(ds.id);
                                    message.success(t('dataset.delete.success'));
                                    onRefresh();
                                  } catch {
                                    message.error(t('dataset.delete.error'));
                                  }
                                },
                                title: t('common.delete'),
                              });
                            },
                          },
                        ],
                      }}
                    >
                      <Button
                        icon={Ellipsis}
                        size="small"
                        variant="text"
                        style={{
                          color: cssVar.colorTextTertiary,
                          height: 28,
                          padding: 0,
                          width: 28,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Dropdown>
                    <ChevronRight
                      size={16}
                      style={{
                        color: 'var(--ant-color-text-tertiary)',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                      }}
                    />
                  </div>

                  {isExpanded && (
                    <div className={styles.expandedSection}>
                      {loading ? (
                        <Flexbox align="center" justify="center" style={{ padding: '48px 24px' }}>
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
                          <Flexbox horizontal gap={8} style={{ marginTop: 8 }}>
                            <Button
                              icon={Plus}
                              size="small"
                              onClick={() => setAddCaseDatasetId(ds.id)}
                            >
                              {t('testCase.actions.add')}
                            </Button>
                            <Button
                              icon={FileUp}
                              size="small"
                              type="primary"
                              onClick={() => setImportDatasetId(ds.id)}
                            >
                              {t('testCase.actions.import')}
                            </Button>
                          </Flexbox>
                        </Flexbox>
                      ) : (
                        <>
                          <div className={styles.filtersRow}>
                            <Flexbox horizontal align="center" gap={8}>
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
                                  placeholder={t('testCase.search.placeholder')}
                                  size="small"
                                  value={search}
                                  style={{
                                    fontSize: 12,
                                    paddingLeft: 32,
                                    width: 192,
                                  }}
                                  onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPagination({ ...pagination, current: 1 });
                                  }}
                                />
                              </div>
                              <div className={styles.filterContainer}>
                                {(['all', 'easy', 'medium', 'hard'] as const).map((f) => (
                                  <button
                                    className={styles.filterButton}
                                    data-active={diffFilter === f}
                                    key={f}
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
                            <Flexbox horizontal gap={8}>
                              <Button
                                icon={Plus}
                                size="small"
                                onClick={() => setAddCaseDatasetId(ds.id)}
                              >
                                {t('testCase.actions.add')}
                              </Button>
                              <Button
                                icon={FileUp}
                                size="small"
                                type="primary"
                                onClick={() => setImportDatasetId(ds.id)}
                              >
                                {t('testCase.actions.import')}
                              </Button>
                            </Flexbox>
                          </div>
                          <div className={styles.table}>
                            <Table
                              columns={columns}
                              dataSource={filteredCases}
                              rowKey="id"
                              size="small"
                              pagination={{
                                current: pagination.current,
                                onChange: (page, pageSize) =>
                                  setPagination({ current: page, pageSize }),
                                pageSize: pagination.pageSize,
                                showSizeChanger: false,
                                total: filteredCases.length,
                              }}
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
        open={!!previewCase}
        title={t('testCase.preview.title')}
        width={600}
        onCancel={() => setPreviewCase(null)}
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
            <Flexbox horizontal align="center" gap={8}>
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

      {/* Edit Dataset Modal */}
      {editDataset && (
        <DatasetEditModal
          dataset={editDataset}
          open={!!editDataset}
          onCancel={() => setEditDataset(null)}
          onSuccess={onRefresh}
        />
      )}

      {/* Create Dataset Modal */}
      <DatasetCreateModal
        benchmarkId={benchmarkId}
        open={createOpen}
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
      />

      {/* Import Dataset Modal */}
      <DatasetImportModal
        datasetId={importDatasetId!}
        open={!!importDatasetId}
        presetId={datasets.find((ds) => ds.id === importDatasetId)?.metadata?.preset}
        onClose={() => setImportDatasetId(null)}
        onSuccess={handleRefreshTestCases}
      />

      {/* Add Test Case Modal */}
      <TestCaseCreateModal
        datasetId={addCaseDatasetId!}
        open={!!addCaseDatasetId}
        onClose={() => setAddCaseDatasetId(null)}
        onSuccess={handleRefreshTestCases}
      />
    </>
  );
});

export default DatasetsTab;
