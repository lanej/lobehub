export interface DatasetSliceState {
  datasetDetail: any | null;
  datasetList: any[];
  isLoadingDatasetDetail: boolean;
  isLoadingDatasets: boolean;
}

export const datasetInitialState: DatasetSliceState = {
  datasetDetail: null,
  datasetList: [],
  isLoadingDatasetDetail: false,
  isLoadingDatasets: false,
};
