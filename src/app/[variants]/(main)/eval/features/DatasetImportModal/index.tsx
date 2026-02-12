'use client';

import { Modal } from '@lobehub/ui';
import { App } from 'antd';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { agentEvalService } from '@/services/agentEval';
import { uploadService } from '@/services/upload';

import { getPresetById } from '../../config/datasetPresets';
import MappingStep, { autoInferMapping,type FieldMappingValue } from './MappingStep';
import PreviewStep from './PreviewStep';
import UploadStep from './UploadStep';

type MappingTarget =
  | 'choices'
  | 'context'
  | 'expected'
  | 'ignore'
  | 'input'
  | 'metadata'
  | 'sortOrder';

interface DatasetImportModalProps {
  datasetId: string;
  onClose: () => void;
  onSuccess?: () => void;
  open: boolean;
  presetId?: string;
}

const DatasetImportModal = memo<DatasetImportModalProps>(
  ({ open, onClose, datasetId, onSuccess, presetId }) => {
    const { t } = useTranslation('eval');
    const { message } = App.useApp();

    const [step, setStep] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [importing, setImporting] = useState(false);

    // Upload result
    const [pathname, setPathname] = useState('');
    const [filename, setFilename] = useState('');

    // Parse result
    const [headers, setHeaders] = useState<string[]>([]);
    const [preview, setPreview] = useState<Record<string, any>[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [format, setFormat] = useState<string>();

    // Mapping state
    const [mapping, setMapping] = useState<Record<string, MappingTarget>>({});
    const [delimiter, setDelimiter] = useState('');

    const preset = useMemo(() => (presetId ? getPresetById(presetId) : undefined), [presetId]);

    const reset = useCallback(() => {
      setStep(0);
      setUploading(false);
      setImporting(false);
      setPathname('');
      setFilename('');
      setHeaders([]);
      setPreview([]);
      setTotalCount(0);
      setFormat(undefined);
      setMapping({});
      setDelimiter('');
    }, []);

    const handleClose = useCallback(() => {
      reset();
      onClose();
    }, [onClose, reset]);

    const handleFileSelect = useCallback(
      async (file: File) => {
        setUploading(true);
        try {
          // 1. Upload to S3
          const metadata = await uploadService.uploadToServerS3(file, {
            directory: 'eval-datasets',
          });

          setPathname(metadata.path);
          setFilename(file.name);

          // 2. Parse the file on server
          const result = await agentEvalService.parseDatasetFile({
            pathname: metadata.path,
          });

          setHeaders(result.headers);
          setPreview(result.preview);
          setTotalCount(result.totalCount);
          setFormat(result.format);

          // 3. Auto-infer field mapping using preset
          const inferred = autoInferMapping(result.headers, preset);
          setMapping(inferred);

          // 4. Advance to mapping step
          setStep(1);
        } catch {
          message.error(t('dataset.import.parseError'));
        } finally {
          setUploading(false);
        }
      },
      [message, preset, t],
    );

    const buildFieldMapping = useCallback((): FieldMappingValue | null => {
      const inputCol = Object.entries(mapping).find(([, v]) => v === 'input')?.[0];
      if (!inputCol) return null;

      const expectedCol = Object.entries(mapping).find(([, v]) => v === 'expected')?.[0];
      const choicesCol = Object.entries(mapping).find(([, v]) => v === 'choices')?.[0];
      const contextCol = Object.entries(mapping).find(([, v]) => v === 'context')?.[0];
      const sortOrderCol = Object.entries(mapping).find(([, v]) => v === 'sortOrder')?.[0];

      const metadataCols = Object.entries(mapping).filter(([, v]) => v === 'metadata');
      const metadataMap =
        metadataCols.length > 0
          ? Object.fromEntries(metadataCols.map(([col]) => [col, col]))
          : undefined;

      return {
        choices: choicesCol,
        context: contextCol,
        expected: expectedCol,
        expectedDelimiter: delimiter || undefined,
        input: inputCol,
        metadata: metadataMap,
        sortOrder: sortOrderCol,
      };
    }, [mapping, delimiter]);

    const handleImport = useCallback(async () => {
      const fieldMapping = buildFieldMapping();
      if (!fieldMapping) return;

      setImporting(true);
      try {
        const result = await agentEvalService.importDataset({
          datasetId,
          pathname,
          input: fieldMapping.input,
          expected: fieldMapping.expected,
          expectedDelimiter: fieldMapping.expectedDelimiter,
          choices: fieldMapping.choices,
          context: fieldMapping.context,
          sortOrder: fieldMapping.sortOrder,
          metadata: fieldMapping.metadata ? JSON.stringify(fieldMapping.metadata) : undefined,
        });
        message.success(t('dataset.import.success', { count: result.count }));
        handleClose();
        onSuccess?.();
      } catch {
        message.error(t('dataset.import.error'));
      } finally {
        setImporting(false);
      }
    }, [
      buildFieldMapping,
      datasetId,
      filename,
      format,
      handleClose,
      message,
      onSuccess,
      pathname,
      t,
    ]);

    const hasInputMapping = Object.values(mapping).includes('input');

    const fieldMapping = buildFieldMapping();

    const okText =
      step === 0 ? undefined : step === 1 ? t('dataset.import.next') : t('dataset.import.confirm');

    const onOk = step === 0 ? undefined : step === 1 ? () => setStep(2) : handleImport;

    return (
      <Modal
        allowFullscreen
        destroyOnHidden
        cancelText={step > 0 ? t('dataset.import.prev') : undefined}
        footer={step === 0 ? null : undefined}
        okText={okText}
        open={open}
        title={t('dataset.import.title')}
        width={720}
        okButtonProps={{
          disabled: step === 1 && !hasInputMapping,
          loading: importing,
        }}
        onCancel={step > 0 ? () => setStep(step - 1) : handleClose}
        onOk={onOk}
      >
        <div style={{ paddingBlock: 16 }}>
          {step === 0 && (
            <UploadStep loading={uploading} preset={preset} onFileSelect={handleFileSelect} />
          )}

          {step === 1 && (
            <MappingStep
              delimiter={delimiter}
              headers={headers}
              mapping={mapping}
              preview={preview}
              onDelimiterChange={setDelimiter}
              onMappingChange={setMapping}
            />
          )}

          {step === 2 && fieldMapping && (
            <PreviewStep fieldMapping={fieldMapping} preview={preview} totalCount={totalCount} />
          )}
        </div>
      </Modal>
    );
  },
);

export default DatasetImportModal;
