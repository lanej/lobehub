export interface TestCaseSliceState {
  isLoadingTestCases: boolean;
  testCaseList: any[];
  testCaseTotal: number;
}

export const testCaseInitialState: TestCaseSliceState = {
  isLoadingTestCases: false,
  testCaseList: [],
  testCaseTotal: 0,
};
