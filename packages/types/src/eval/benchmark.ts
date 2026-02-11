import type { AnswerExtractor, EvalBenchmarkRubric } from './rubric';

// ============================================
// Benchmark Presets
// ============================================

export interface BenchmarkPresetPromptTemplate {
  system?: string;
  user: string;
}

export interface BenchmarkPreset {
  defaultRubrics: EvalBenchmarkRubric[];
  description: string;
  extractor: AnswerExtractor;
  fieldMapping: BenchmarkPresetFieldMapping;
  id: string;
  name: string;
  promptTemplate: BenchmarkPresetPromptTemplate;
}

export interface BenchmarkPresetFieldMapping {
  choices?: string;
  context?: string;
  expected: string;
  input: string;
  metadata?: Record<string, string>;
}
