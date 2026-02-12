'use client';

import { Button, Flexbox, Icon } from '@lobehub/ui';
import { App, Dropdown } from 'antd';
import { createStaticStyles } from 'antd-style';
import { ArrowLeft, Edit, EllipsisVertical, Server, Trash2, User } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { useEvalStore } from '@/store/eval';

import BenchmarkEditModal from '../../../../features/BenchmarkEditModal';

const styles = createStaticStyles(({ css, cssVar }) => ({
  iconBox: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;

    width: 40px;
    height: 40px;

    border-radius: 10px;
  `,
  title: css`
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: ${cssVar.colorText};
  `,
}));

interface BenchmarkHeaderProps {
  benchmark: any;
  onRefresh?: () => void;
  systemIcon?: LucideIcon;
}

const BenchmarkHeader = memo<BenchmarkHeaderProps>(
  ({ benchmark, onRefresh, systemIcon = Server }) => {
    const { t } = useTranslation('eval');
    const { modal } = App.useApp();
    const navigate = useNavigate();
    const deleteBenchmark = useEvalStore((s) => s.deleteBenchmark);
    const refreshBenchmarks = useEvalStore((s) => s.refreshBenchmarks);
    const [editOpen, setEditOpen] = useState(false);

  const handleDelete = () => {
    modal.confirm({
      title: t('benchmark.actions.delete'),
      content: t('benchmark.actions.delete.confirm'),
      okText: t('benchmark.actions.delete'),
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteBenchmark(benchmark.id);
        navigate('/eval');
      },
    });
  };

  const menuItems = [
    {
      key: 'delete',
      label: t('common.delete'),
      icon: <Trash2 size={16} />,
      danger: true,
      onClick: handleDelete,
    },
  ];

  return (
    <>
      <Flexbox gap={16}>
        <Link
          style={{
            alignItems: 'center',
            color: 'var(--ant-color-text-tertiary)',
            display: 'inline-flex',
            fontSize: 14,
            gap: 4,
            textDecoration: 'none',
            transition: 'color 0.2s',
          }}
          to="/eval"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--ant-color-text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--ant-color-text-tertiary)';
          }}
        >
          <ArrowLeft size={16} />
          {t('benchmark.detail.backToOverview')}
        </Link>

        <Flexbox align="start" horizontal justify="space-between">
          <Flexbox align="start" gap={12} horizontal>
            <div
              className={styles.iconBox}
              style={{
                background:
                  benchmark.source === 'user'
                    ? 'var(--ant-color-success-bg)'
                    : 'var(--ant-color-primary-bg)',
              }}
            >
              <Icon
                icon={benchmark.source === 'user' ? User : systemIcon}
                size={20}
                style={{
                  color:
                    benchmark.source === 'user'
                      ? 'var(--ant-color-success)'
                      : 'var(--ant-color-primary)',
                }}
              />
            </div>
            <Flexbox gap={4}>
              <h1 className={styles.title}>{benchmark.name}</h1>
              {benchmark.description && (
                <p
                  style={{
                    color: 'var(--ant-color-text-tertiary)',
                    fontSize: 14,
                    margin: 0,
                    marginTop: 2,
                  }}
                >
                  {benchmark.description}
                </p>
              )}
            </Flexbox>
          </Flexbox>

          <Flexbox gap={8} horizontal>
            <Button icon={Edit} onClick={() => setEditOpen(true)} size="small" variant="outlined">
              {t('common.edit')}
            </Button>
            <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
              <Button icon={EllipsisVertical} size="small" variant="outlined" />
            </Dropdown>
          </Flexbox>
        </Flexbox>
      </Flexbox>

      <BenchmarkEditModal
        benchmark={benchmark}
        onCancel={() => setEditOpen(false)}
        onSuccess={() => {
          refreshBenchmarks();
          onRefresh?.();
        }}
        open={editOpen}
      />
    </>
  );
},
);

export default BenchmarkHeader;
