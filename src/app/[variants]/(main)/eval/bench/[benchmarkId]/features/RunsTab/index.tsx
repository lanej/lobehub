'use client';

import { Button, Empty, Flexbox } from '@lobehub/ui';
import { Badge, Card, Progress } from 'antd';
import { createStaticStyles } from 'antd-style';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Play,
  Plus,
  XCircle,
} from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useEvalStore } from '@/store/eval';

import RunCreateModal from '../RunCreateModal';

const styles = createStaticStyles(({ css, cssVar }) => ({
  emptyCard: css`
    .ant-card-body {
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
  runCard: css`
    .ant-card-body {
      padding: 20px;
    }

    transition: all 0.2s;

    &:hover {
      border-color: ${cssVar.colorPrimaryBorder};
      background: ${cssVar.colorFillQuaternary};
    }
  `,
}));

interface RunsTabProps {
  benchmarkId: string;
}

const RunsTab = memo<RunsTabProps>(({ benchmarkId }) => {
  const { t } = useTranslation('eval');
  const [createRunOpen, setCreateRunOpen] = useState(false);
  const useFetchRuns = useEvalStore((s) => s.useFetchRuns);
  const runList = useEvalStore((s) => s.runList);
  useFetchRuns(undefined);

  const sortedRuns = [...runList].sort(
    (a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; bg: string; label: string; animate?: boolean }> =
      {
        completed: {
          bg: 'var(--ant-color-success-bg)',
          color: 'var(--ant-color-success)',
          label: t('run.status.completed'),
        },
        failed: {
          bg: 'var(--ant-color-error-bg)',
          color: 'var(--ant-color-error)',
          label: t('run.status.failed'),
        },
        pending: {
          bg: 'var(--ant-color-warning-bg)',
          color: 'var(--ant-color-warning)',
          label: t('run.status.pending'),
        },
        running: {
          animate: true,
          bg: 'var(--ant-color-primary-bg)',
          color: 'var(--ant-color-primary)',
          label: t('run.status.running'),
        },
      };

    const c = config[status] || config.pending;
    return (
      <Badge
        style={{
          animation: c.animate ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : undefined,
          backgroundColor: c.bg,
          borderColor: c.color + '30',
          color: c.color,
          fontSize: 11,
        }}
      >
        {c.label}
      </Badge>
    );
  };

  return (
    <Flexbox gap={16}>
      <Flexbox align="center" horizontal justify="space-between">
        <p style={{ color: 'var(--ant-color-text-tertiary)', fontSize: 14, margin: 0 }}>
          {t('benchmark.detail.runCount', { count: runList.length })}
        </p>
        <Button icon={Plus} onClick={() => setCreateRunOpen(true)} size="small" type="primary">
          {t('run.actions.create')}
        </Button>
      </Flexbox>

      {runList.length === 0 ? (
        <Card className={styles.emptyCard}>
          <Flexbox align="center">
            <div className={styles.emptyIcon}>
              <Activity size={20} style={{ color: 'var(--ant-color-text-tertiary)' }} />
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
                    {t('run.empty.title')}
                  </p>
                  <p
                    style={{
                      color: 'var(--ant-color-text-tertiary)',
                      fontSize: 12,
                      margin: 0,
                    }}
                  >
                    {t('run.empty.descriptionBenchmark')}
                  </p>
                </Flexbox>
              }
              icon={Play}
            >
              <Button
                icon={Plus}
                onClick={() => setCreateRunOpen(true)}
                size="small"
                style={{ marginTop: 16 }}
                type="primary"
              >
                {t('run.actions.create')}
              </Button>
            </Empty>
          </Flexbox>
        </Card>
      ) : (
        <Flexbox gap={12}>
          {sortedRuns.map((run: any) => {
            const progress = run.totalCases > 0 ? (run.completedCases / run.totalCases) * 100 : 0;
            const passRate =
              run.completedCases > 0 ? (run.passCount / run.completedCases) * 100 : 0;

            return (
              <Link
                key={run.id}
                style={{ textDecoration: 'none' }}
                to={`/eval/bench/${benchmarkId}/runs/${run.id}`}
              >
                <Card className={styles.runCard}>
                  <Flexbox align="center" gap={16} horizontal>
                    {/* Left: Info */}
                    <Flexbox flex={1} gap={4} style={{ minWidth: 0 }}>
                      <Flexbox align="center" gap={8} horizontal>
                        <span
                          style={{
                            color: 'var(--ant-color-text)',
                            fontSize: 14,
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {run.name}
                        </span>
                        {getStatusBadge(run.status)}
                      </Flexbox>
                      <Flexbox align="center" gap={12} horizontal>
                        <span
                          style={{
                            color: 'var(--ant-color-text-tertiary)',
                            fontSize: 12,
                          }}
                        >
                          {run.agentName}
                        </span>
                        <span style={{ color: 'var(--ant-color-border)' }}>|</span>
                        <span
                          style={{
                            color: 'var(--ant-color-text-tertiary)',
                            fontFamily: 'monospace',
                            fontSize: 12,
                          }}
                        >
                          {run.model}
                        </span>
                        <span style={{ color: 'var(--ant-color-border)' }}>|</span>
                        <span
                          style={{
                            color: 'var(--ant-color-text-tertiary)',
                            fontSize: 12,
                          }}
                        >
                          T={run.temperature}
                        </span>
                        <span style={{ color: 'var(--ant-color-border)' }}>|</span>
                        <span
                          style={{
                            color: 'var(--ant-color-text-tertiary)',
                            fontSize: 12,
                          }}
                        >
                          {new Date(run.createdAt).toLocaleDateString()}
                        </span>
                      </Flexbox>
                    </Flexbox>

                    {/* Center: Progress */}
                    <Flexbox gap={4} style={{ display: 'none', width: 144 }} className="md:flex">
                      <Flexbox
                        align="center"
                        horizontal
                        justify="space-between"
                        style={{ marginBottom: 4 }}
                      >
                        <span
                          style={{
                            color: 'var(--ant-color-text-tertiary)',
                            fontSize: 12,
                          }}
                        >
                          {run.completedCases}/{run.totalCases}
                        </span>
                        <span
                          style={{
                            color: 'var(--ant-color-text-tertiary)',
                            fontSize: 12,
                          }}
                        >
                          {progress.toFixed(0)}%
                        </span>
                      </Flexbox>
                      <Progress percent={progress} showInfo={false} size="small" />
                    </Flexbox>

                    {/* Right: Stats */}
                    {(run.status === 'completed' || run.status === 'running') &&
                      run.completedCases > 0 && (
                        <Flexbox
                          align="center"
                          gap={16}
                          horizontal
                          style={{ display: 'none', fontSize: 14 }}
                          className="lg:flex"
                        >
                          <span
                            style={{
                              alignItems: 'center',
                              color: 'var(--ant-color-success)',
                              display: 'flex',
                              gap: 4,
                            }}
                          >
                            <CheckCircle2 size={14} />
                            {run.passCount}
                          </span>
                          <span
                            style={{
                              alignItems: 'center',
                              color: 'var(--ant-color-error)',
                              display: 'flex',
                              gap: 4,
                            }}
                          >
                            <XCircle size={14} />
                            {run.failCount}
                          </span>
                          {run.errorCount > 0 && (
                            <span
                              style={{
                                alignItems: 'center',
                                color: 'var(--ant-color-warning)',
                                display: 'flex',
                                gap: 4,
                              }}
                            >
                              <AlertTriangle size={14} />
                              {run.errorCount}
                            </span>
                          )}
                          <Flexbox gap={2} style={{ minWidth: 60, textAlign: 'right' }}>
                            <p
                              style={{
                                color: 'var(--ant-color-text)',
                                fontFamily: 'monospace',
                                fontSize: 14,
                                fontWeight: 600,
                                margin: 0,
                              }}
                            >
                              {(run.metrics?.score || 0).toFixed(1)}
                            </p>
                            <p
                              style={{
                                color: 'var(--ant-color-text-tertiary)',
                                fontSize: 10,
                                margin: 0,
                              }}
                            >
                              {passRate.toFixed(0)}% pass
                            </p>
                          </Flexbox>
                        </Flexbox>
                      )}

                    {run.status === 'completed' && (
                      <Flexbox
                        align="center"
                        gap={12}
                        horizontal
                        style={{ display: 'none', fontSize: 12 }}
                        className="xl:flex"
                      >
                        <span
                          style={{
                            alignItems: 'center',
                            color: 'var(--ant-color-text-tertiary)',
                            display: 'flex',
                            gap: 4,
                          }}
                        >
                          <Clock size={12} />
                          {((run.totalDuration || 0) / 60).toFixed(1)}m
                        </span>
                        <span
                          style={{
                            alignItems: 'center',
                            color: 'var(--ant-color-text-tertiary)',
                            display: 'flex',
                            gap: 4,
                          }}
                        >
                          <DollarSign size={12} />$
                          {(run.totalCost || 0).toFixed(2)}
                        </span>
                      </Flexbox>
                    )}

                    <ArrowRight
                      size={16}
                      style={{ color: 'var(--ant-color-text-tertiary)' }}
                    />
                  </Flexbox>
                </Card>
              </Link>
            );
          })}
        </Flexbox>
      )}

      <RunCreateModal
        benchmarkId={benchmarkId}
        onClose={() => setCreateRunOpen(false)}
        open={createRunOpen}
      />
    </Flexbox>
  );
});

export default RunsTab;
