import type { EvalBenchmarkRubric } from '@lobechat/types';

import { normalize } from './normalize';

export interface MatchResult {
  passed: boolean;
  reason?: string;
  score: number;
}

/**
 * Run a single rubric matcher against actual vs expected
 */
export const match = (
  actual: string,
  expected: string | undefined,
  rubric: EvalBenchmarkRubric,
): MatchResult => {
  const { type, config } = rubric;

  switch (type) {
    case 'equals': {
      const a = normalize(actual);
      const e = normalize(expected ?? '');
      const passed = a === e;
      return { passed, score: passed ? 1 : 0 };
    }

    case 'contains': {
      const a = normalize(actual);
      const e = normalize(expected ?? '');
      const passed = a.includes(e);
      return { passed, score: passed ? 1 : 0 };
    }

    case 'starts-with': {
      const a = normalize(actual);
      const e = normalize(expected ?? '');
      const passed = a.startsWith(e);
      return { passed, score: passed ? 1 : 0 };
    }

    case 'ends-with': {
      const a = normalize(actual);
      const e = normalize(expected ?? '');
      const passed = a.endsWith(e);
      return { passed, score: passed ? 1 : 0 };
    }

    case 'regex': {
      const cfg = config as { pattern: string };
      const passed = new RegExp(cfg.pattern, 'i').test(actual);
      return { passed, score: passed ? 1 : 0 };
    }

    case 'any-of': {
      const cfg = config as { caseSensitive?: boolean; values: string[] };
      const candidates = cfg.values;
      const cs = cfg.caseSensitive ?? false;
      const a = normalize(actual, cs);
      const passed = candidates.some((c) => normalize(c, cs) === a);
      return { passed, score: passed ? 1 : 0 };
    }

    case 'numeric': {
      const cfg = config as { tolerance?: number; value: number };
      const actualNum = Number.parseFloat(actual.replaceAll(/[^.\-\d]/g, ''));
      if (Number.isNaN(actualNum)) {
        return { passed: false, reason: `Could not parse number from "${actual}"`, score: 0 };
      }
      const tolerance = cfg.tolerance ?? 0.01;
      const expectedNum = expected !== undefined ? Number.parseFloat(expected) : cfg.value;
      const passed = Math.abs(actualNum - expectedNum) <= tolerance;
      return { passed, score: passed ? 1 : 0 };
    }

    case 'levenshtein': {
      const cfg = config as { threshold?: number };
      const threshold = cfg.threshold ?? 0.8;
      const a = normalize(actual);
      const e = normalize(expected ?? '');
      const dist = levenshteinDistance(a, e);
      const maxLen = Math.max(a.length, e.length);
      const similarity = maxLen === 0 ? 1 : 1 - dist / maxLen;
      const passed = similarity >= threshold;
      return { passed, reason: `similarity=${similarity.toFixed(3)}`, score: similarity };
    }

    default: {
      return {
        passed: false,
        reason: `Unsupported rubric type: ${type}`,
        score: 0,
      };
    }
  }
};

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array.from({ length: n + 1 }, () => 0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}
