import { type RuntimeVideoGenParams, type RuntimeVideoGenParamsKeys } from 'model-bank';
import { useCallback, useMemo } from 'react';

import { useVideoStore } from '../../store';
import { videoGenerationConfigSelectors } from './selectors';

export function useVideoGenerationConfigParam<
  N extends RuntimeVideoGenParamsKeys,
  V extends RuntimeVideoGenParams[N],
>(paramName: N) {
  const parameters = useVideoStore(videoGenerationConfigSelectors.parameters);
  const parametersSchema = useVideoStore(videoGenerationConfigSelectors.parametersSchema);

  const paramValue = parameters?.[paramName] as V;
  const setParamsValue = useVideoStore((s) => s.setParamOnInput<N>);
  const setValue = useCallback(
    (value: V) => {
      setParamsValue(paramName, value);
    },
    [paramName, setParamsValue],
  );

  const paramConfig = parametersSchema?.[paramName];
  const paramConstraints = useMemo(() => {
    const maxFileSize =
      paramConfig && typeof paramConfig === 'object' && 'maxFileSize' in paramConfig
        ? paramConfig.maxFileSize
        : undefined;

    return { maxFileSize };
  }, [paramConfig]);

  return {
    setValue,
    value: paramValue as V,
    ...paramConstraints,
  };
}
