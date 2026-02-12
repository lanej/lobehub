'use client';

import { Modal } from '@lobehub/ui';
import { App, Form, Input, Select } from 'antd';
import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { agentEvalService } from '@/services/agentEval';

interface TestCaseCreateModalProps {
  datasetId: string;
  onClose: () => void;
  onSuccess?: () => void;
  open: boolean;
}

const TestCaseCreateModal = memo<TestCaseCreateModalProps>(
  ({ open, onClose, datasetId, onSuccess }) => {
    const { t } = useTranslation('eval');
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleClose = useCallback(() => {
      form.resetFields();
      onClose();
    }, [form, onClose]);

    const handleSubmit = useCallback(async () => {
      const values = await form.validateFields();
      setLoading(true);
      try {
        const tags = values.tags
          ? values.tags
              .split(',')
              .map((t: string) => t.trim())
              .filter(Boolean)
          : undefined;

        await agentEvalService.createTestCase({
          content: {
            expectedOutput: values.expected || undefined,
            input: values.input,
          },
          datasetId,
          metadata: {
            ...(values.difficulty ? { difficulty: values.difficulty } : {}),
            ...(tags ? { tags } : {}),
          },
        });

        message.success(t('testCase.create.success'));
        handleClose();
        onSuccess?.();
      } catch {
        message.error(t('testCase.create.error'));
      } finally {
        setLoading(false);
      }
    }, [datasetId, form, handleClose, message, onSuccess, t]);

    return (
      <Modal
        destroyOnHidden
        okButtonProps={{ loading }}
        okText={t('common.create')}
        onCancel={handleClose}
        onOk={handleSubmit}
        open={open}
        title={t('testCase.create.title')}
        width={520}
      >
        <Form form={form} layout="vertical" style={{ paddingTop: 16 }}>
          <Form.Item
            label={t('testCase.create.input.label')}
            name="input"
            rules={[{ required: true }]}
          >
            <Input.TextArea
              autoSize={{ maxRows: 6, minRows: 3 }}
              placeholder={t('testCase.create.input.placeholder')}
            />
          </Form.Item>
          <Form.Item label={t('testCase.create.expected.label')} name="expected">
            <Input.TextArea
              autoSize={{ maxRows: 6, minRows: 2 }}
              placeholder={t('testCase.create.expected.placeholder')}
            />
          </Form.Item>
          <Form.Item label={t('testCase.create.difficulty.label')} name="difficulty">
            <Select
              allowClear
              options={[
                { label: t('difficulty.easy'), value: 'easy' },
                { label: t('difficulty.medium'), value: 'medium' },
                { label: t('difficulty.hard'), value: 'hard' },
              ]}
              placeholder={t('testCase.create.difficulty.label')}
            />
          </Form.Item>
          <Form.Item label={t('testCase.create.tags.label')} name="tags">
            <Input placeholder={t('testCase.create.tags.placeholder')} />
          </Form.Item>
        </Form>
      </Modal>
    );
  },
);

export default TestCaseCreateModal;
