import type { EvalBenchmarkRubric } from '@lobechat/types';
import { describe, expect, it } from 'vitest';

import { match } from '../src';

const rubric = (type: string, config: any = {}): EvalBenchmarkRubric => ({
  config,
  id: 'test',
  name: 'test',
  type: type as any,
  weight: 1,
});

describe('match - equals', () => {
  it('should pass on exact match (case-insensitive)', () => {
    expect(match('Hello', 'hello', rubric('equals')).passed).toBe(true);
  });

  it('should fail on mismatch', () => {
    expect(match('Hello', 'world', rubric('equals')).passed).toBe(false);
  });

  it('should trim whitespace', () => {
    expect(match('  answer  ', 'answer', rubric('equals')).passed).toBe(true);
  });
});

describe('match - contains', () => {
  it('should pass when actual contains expected', () => {
    expect(match('The answer is 42', '42', rubric('contains')).passed).toBe(true);
  });

  it('should fail when not contained', () => {
    expect(match('no match', '42', rubric('contains')).passed).toBe(false);
  });
});

describe('match - starts-with', () => {
  it('should pass when starts with expected', () => {
    expect(match('Hello world', 'hello', rubric('starts-with')).passed).toBe(true);
  });
});

describe('match - ends-with', () => {
  it('should pass when ends with expected', () => {
    expect(match('Hello world', 'world', rubric('ends-with')).passed).toBe(true);
  });
});

describe('match - regex', () => {
  it('should pass when pattern matches', () => {
    expect(match('answer: 42', undefined, rubric('regex', { pattern: '\\d+' })).passed).toBe(true);
  });

  it('should fail when no match', () => {
    expect(match('no numbers', undefined, rubric('regex', { pattern: '\\d+' })).passed).toBe(false);
  });
});

describe('match - any-of', () => {
  it('should pass when matching any candidate', () => {
    const r = rubric('any-of', { values: ['cat', 'dog', 'bird'] });
    expect(match('Dog', undefined, r).passed).toBe(true);
  });

  it('should fail when none match', () => {
    const r = rubric('any-of', { values: ['cat', 'dog'] });
    expect(match('fish', undefined, r).passed).toBe(false);
  });

  it('should respect caseSensitive flag', () => {
    const r = rubric('any-of', { values: ['Dog'], caseSensitive: true });
    expect(match('dog', undefined, r).passed).toBe(false);
    expect(match('Dog', undefined, r).passed).toBe(true);
  });
});

describe('match - numeric', () => {
  it('should pass within tolerance', () => {
    const r = rubric('numeric', { value: 42, tolerance: 0.5 });
    expect(match('42.3', '42', r).passed).toBe(true);
  });

  it('should fail outside tolerance', () => {
    const r = rubric('numeric', { value: 42, tolerance: 0.01 });
    expect(match('43', '42', r).passed).toBe(false);
  });

  it('should extract number from text', () => {
    const r = rubric('numeric', { value: 9, tolerance: 0.01 });
    expect(match('The answer is $9.00', '9', r).passed).toBe(true);
  });
});

describe('match - levenshtein', () => {
  it('should pass for similar strings', () => {
    const r = rubric('levenshtein', { threshold: 0.7 });
    expect(match('hello', 'helo', r).passed).toBe(true);
  });

  it('should fail for dissimilar strings', () => {
    const r = rubric('levenshtein', { threshold: 0.9 });
    expect(match('hello', 'world', r).passed).toBe(false);
  });

  it('should return similarity score', () => {
    const r = rubric('levenshtein', { threshold: 0 });
    const result = match('abc', 'abc', r);
    expect(result.score).toBe(1);
  });
});
