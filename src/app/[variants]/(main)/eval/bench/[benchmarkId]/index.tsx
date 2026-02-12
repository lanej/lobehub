'use client';

import { Flexbox } from '@lobehub/ui';
import { Badge, Card } from 'antd';
import { createStaticStyles } from 'antd-style';
import {
  Activity,
  Award,
  BarChart3,
  CheckCircle2,
  Database,
  FlaskConical,
  Gauge,
  LoaderPinwheel,
  Server,
  Target,
  TrendingUp,
  Trophy,
  Volleyball,
  Zap,
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { lambdaClient } from '@/libs/trpc/client';
import { useEvalStore } from '@/store/eval';

import DatasetImportModal from '../../features/DatasetImportModal';
import BenchmarkHeader from './features/BenchmarkHeader';
import DatasetsTab from './features/DatasetsTab';
import RunsTab from './features/RunsTab';

const SYSTEM_ICONS = [
  LoaderPinwheel,
  Volleyball,
  Server,
  Target,
  Award,
  Trophy,
  Activity,
  BarChart3,
  TrendingUp,
  Gauge,
  Zap,
];

const getSystemIcon = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return SYSTEM_ICONS[hash % SYSTEM_ICONS.length];
};

const styles = createStaticStyles(({ css, cssVar }) => ({
  container: css`
    overflow-y: auto;
    padding: 24px 32px;
  `,
  statCard: css`
    .ant-card-body {
      padding: 16px;
    }
  `,
  statIcon: css`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 36px;
    height: 36px;

    border-radius: 8px;
  `,
  tabButton: css`
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;

    font-size: 14px;
    font-weight: 500;

    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s;

    &[data-active='true'] {
      color: ${cssVar.colorText};
      border-bottom-color: ${cssVar.colorPrimary};
    }

    &[data-active='false'] {
      color: ${cssVar.colorTextTertiary};

      &:hover {
        color: ${cssVar.colorText};
      }
    }
  `,
  tabBadge: css`
    padding: 2px 6px;
    font-size: 10px;
    border-radius: 10px;
  `,
  tabsContainer: css`
    display: flex;
    gap: 4px;
    border-bottom: 1px solid ${cssVar.colorBorderSecondary};
  `,
}));

const BenchmarkDetail = memo(() => {
  const { t } = useTranslation('eval');
  const { benchmarkId } = useParams<{ benchmarkId: string }>();
  const [activeTab, setActiveTab] = useState<'datasets' | 'runs'>('datasets');
  const [importOpen, setImportOpen] = useState(false);

  const systemIcon = useMemo(
    () => (benchmarkId ? getSystemIcon(benchmarkId) : Server),
    [benchmarkId],
  );

  const useFetchBenchmarkDetail = useEvalStore((s) => s.useFetchBenchmarkDetail);
  const benchmark = useEvalStore((s) => s.benchmarkDetail);
  const useFetchDatasets = useEvalStore((s) => s.useFetchDatasets);
  const datasets = useEvalStore((s) => s.datasetList);
  const refreshDatasets = useEvalStore((s) => s.refreshDatasets);
  const useFetchRuns = useEvalStore((s) => s.useFetchRuns);
  const runList = useEvalStore((s) => s.runList);

  useFetchBenchmarkDetail(benchmarkId);
  useFetchDatasets(benchmarkId);

  const handleRefreshDatasets = useCallback(async () => {
    if (benchmarkId) {
      await refreshDatasets(benchmarkId);
    }
  }, [benchmarkId, refreshDatasets]);
  // Fetch all runs for this benchmark (pass undefined to get all)
  useFetchRuns(undefined);

  const completedRuns = runList.filter((r: any) => r.status === 'completed');
  const bestScore =
    completedRuns.length > 0 ? Math.max(...completedRuns.map((r: any) => r.metrics?.score || 0)) : null;

  if (!benchmark) return null;

  const totalCases = datasets.reduce((sum, ds) => sum + (ds.testCaseCount || 0), 0);

  const handleBenchmarkUpdate = useCallback(
    async (updatedBenchmark: any) => {
      if (benchmarkId) {
        await refreshDatasets(benchmarkId);
      }
    },
    [benchmarkId, refreshDatasets],
  );

  return (
    <Flexbox className={styles.container} gap={24} height="100%" width="100%">
      {/* Header */}
      <BenchmarkHeader
        benchmark={benchmark}
        onBenchmarkUpdate={handleBenchmarkUpdate}
        systemIcon={systemIcon}
      />

      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        }}
      >
        <Card className={styles.statCard}>
          <Flexbox align="center" gap={12} horizontal>
            <div
              className={styles.statIcon}
              style={{ background: 'var(--ant-color-primary-bg)' }}
            >
              <Database
                size={16}
                style={{ color: 'var(--ant-color-primary)' }}
              />
            </div>
            <Flexbox gap={2}>
              <p
                style={{
                  color: 'var(--ant-color-text-tertiary)',
                  fontSize: 12,
                  margin: 0,
                }}
              >
                {t('benchmark.detail.stats.datasets')}
              </p>
              <p
                style={{
                  color: 'var(--ant-color-text)',
                  fontSize: 20,
                  fontWeight: 'bold',
                  margin: 0,
                }}
              >
                {datasets.length}
              </p>
            </Flexbox>
          </Flexbox>
        </Card>

        <Card className={styles.statCard}>
          <Flexbox align="center" gap={12} horizontal>
            <div
              className={styles.statIcon}
              style={{ background: 'var(--ant-color-primary-bg)' }}
            >
              <FlaskConical
                size={16}
                style={{ color: 'var(--ant-color-primary)' }}
              />
            </div>
            <Flexbox gap={2}>
              <p
                style={{
                  color: 'var(--ant-color-text-tertiary)',
                  fontSize: 12,
                  margin: 0,
                }}
              >
                {t('benchmark.detail.stats.totalCases')}
              </p>
              <p
                style={{
                  color: 'var(--ant-color-text)',
                  fontSize: 20,
                  fontWeight: 'bold',
                  margin: 0,
                }}
              >
                {totalCases}
              </p>
            </Flexbox>
          </Flexbox>
        </Card>

        <Card className={styles.statCard}>
          <Flexbox align="center" gap={12} horizontal>
            <div
              className={styles.statIcon}
              style={{ background: 'var(--ant-color-primary-bg)' }}
            >
              <Activity
                size={16}
                style={{ color: 'var(--ant-color-primary)' }}
              />
            </div>
            <Flexbox gap={2}>
              <p
                style={{
                  color: 'var(--ant-color-text-tertiary)',
                  fontSize: 12,
                  margin: 0,
                }}
              >
                {t('benchmark.detail.stats.runs')}
              </p>
              <p
                style={{
                  color: 'var(--ant-color-text)',
                  fontSize: 20,
                  fontWeight: 'bold',
                  margin: 0,
                }}
              >
                {runList.length}
              </p>
            </Flexbox>
          </Flexbox>
        </Card>

        <Card className={styles.statCard}>
          <Flexbox align="center" gap={12} horizontal>
            <div
              className={styles.statIcon}
              style={{ background: 'var(--ant-color-success-bg)' }}
            >
              <CheckCircle2
                size={16}
                style={{ color: 'var(--ant-color-success)' }}
              />
            </div>
            <Flexbox gap={2}>
              <p
                style={{
                  color: 'var(--ant-color-text-tertiary)',
                  fontSize: 12,
                  margin: 0,
                }}
              >
                {t('benchmark.detail.stats.bestScore')}
              </p>
              <p
                style={{
                  color: 'var(--ant-color-text)',
                  fontSize: 20,
                  fontWeight: 'bold',
                  margin: 0,
                }}
              >
                {bestScore !== null ? bestScore.toFixed(1) : '--'}
              </p>
            </Flexbox>
          </Flexbox>
        </Card>
      </div>

      {/* Tags */}
      {benchmark.tags && benchmark.tags.length > 0 && (
        <Flexbox gap={6} horizontal style={{ flexWrap: 'wrap' }}>
          {benchmark.tags.map((tag: string) => (
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
      )}

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button
          className={styles.tabButton}
          data-active={activeTab === 'datasets'}
          onClick={() => setActiveTab('datasets')}
        >
          {t('benchmark.detail.tabs.datasets')}
          <span
            className={styles.tabBadge}
            style={{
              backgroundColor:
                activeTab === 'datasets'
                  ? 'var(--ant-color-primary-bg)'
                  : 'var(--ant-color-fill-secondary)',
              color:
                activeTab === 'datasets'
                  ? 'var(--ant-color-primary)'
                  : 'var(--ant-color-text-tertiary)',
            }}
          >
            {datasets.length}
          </span>
        </button>
        <button
          className={styles.tabButton}
          data-active={activeTab === 'runs'}
          onClick={() => setActiveTab('runs')}
        >
          {t('benchmark.detail.tabs.runs')}
          <span
            className={styles.tabBadge}
            style={{
              backgroundColor:
                activeTab === 'runs'
                  ? 'var(--ant-color-primary-bg)'
                  : 'var(--ant-color-fill-secondary)',
              color:
                activeTab === 'runs'
                  ? 'var(--ant-color-primary)'
                  : 'var(--ant-color-text-tertiary)',
            }}
          >
            {runList.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'datasets' ? (
        <DatasetsTab
          benchmarkId={benchmarkId!}
          datasets={datasets}
          onImport={() => setImportOpen(true)}
          onRefresh={handleRefreshDatasets}
        />
      ) : (
        <RunsTab benchmarkId={benchmarkId!} />
      )}

      <DatasetImportModal
        benchmarkId={benchmarkId!}
        onClose={() => setImportOpen(false)}
        onSuccess={handleRefreshDatasets}
        open={importOpen}
      />
    </Flexbox>
  );
});

export default BenchmarkDetail;
