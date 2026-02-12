'use client';

import { Input, Modal, type ModalProps, TextArea } from '@lobehub/ui';
import { App, Form } from 'antd';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { agentEvalService } from '@/services/agentEval';

interface DatasetEditModalProps extends ModalProps {
  dataset: {
    description?: string;
    id: string;
    name: string;
  };
  onSuccess?: () => void;
}

const DatasetEditModal = memo<DatasetEditModalProps>(
  ({ open, onCancel, dataset, onSuccess }) => {
    const { t } = useTranslation('eval');
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (open && dataset) {
        form.setFieldsValue({
          description: dataset.description || '',
          name: dataset.name,
        });
      }
    }, [open, dataset, form]);

    return (
      <Modal
        allowFullscreen
        destroyOnHidden
        okButtonProps={{ loading }}
        okText={t('common.edit')}
        onCancel={(e) => {
          form.resetFields();
          onCancel?.(e);
        }}
        onOk={async (e) => {
          try {
            const values = await form.validateFields();
            setLoading(true);

            await agentEvalService.updateDataset({
              id: dataset.id,
              name: values.name.trim(),
              description: values.description?.trim() || undefined,
            });
            message.success(t('dataset.edit.success'));
            form.resetFields();
            onCancel?.(e);
            onSuccess?.();
          } catch (error: any) {
            if (error?.errorFields) return;
            message.error(t('dataset.edit.error'));
          } finally {
            setLoading(false);
          }
        }}
        open={open}
        title={t('dataset.edit.title')}
        width={480}
      >
        <Form form={form} layout="vertical" style={{ paddingBlock: 16 }}>
          <Form.Item
            label={t('dataset.create.name.label')}
            name="name"
            rules={[{ message: t('dataset.create.nameRequired'), required: true }]}
          >
            <Input autoFocus placeholder={t('dataset.create.name.placeholder')} />
          </Form.Item>

          <Form.Item
            label={t('dataset.create.description.label')}
            name="description"
            style={{ marginBottom: 0 }}
          >
            <TextArea placeholder={t('dataset.create.description.placeholder')} rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    );
  },
);

export default DatasetEditModal;
