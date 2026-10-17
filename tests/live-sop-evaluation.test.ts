import { describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
// @ts-expect-error Local JavaScript CLI exports are exercised with Vitest.
import { evaluate, measure } from '../scripts/evaluate-live-sop.mjs';
const sopCatalog = JSON.parse(readFileSync(path.resolve('apps/web/src/data/live-sops.json'), 'utf8'));

describe('evaluation calculations (synthetic test records, not botanical evidence)', () => {
  it('reports false passes, missed errors and unknown without inventing accuracy for empty data', () => {
    expect(measure([]).exact_match_rate).toBeNull();
    const m = measure([
      { expected: 'needs_adjustment', predicted: 'passed' },
      { expected: 'needs_adjustment', predicted: 'unverifiable' },
      { expected: 'needs_adjustment', predicted: 'needs_adjustment' },
      { expected: 'unverifiable', predicted: 'passed' },
      { expected: 'passed', predicted: 'passed' }
    ]);
    expect(m.false_pass_count).toBe(2); expect(m.false_pass_fraction_of_passes).toBeCloseTo(2/3);
    expect(m.missed_error_rate).toBeCloseTo(2/3); expect(m.error_to_pass_rate).toBeCloseTo(1/3); expect(m.abstention_rate).toBe(.2);
  });
  it('states explicitly that no real images means no evaluation', () => {
    expect(evaluate({ samples: [] }, [], sopCatalog, '.')).toMatchObject({ status: 'NOT_RUN_NO_REAL_LABELED_IMAGES', metrics: null, samples: 0 });
  });
  it('checks label provenance, file hashes and split leakage before measuring', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'plantmove-eval-'));
    try {
      const bytes = Buffer.from('UNIT TEST ONLY: this fixture is not a real plant photograph'); writeFileSync(path.join(dir, 'fixture.bin'), bytes);
      const sample = { id: 'one', origin: 'real_photo', image_path: 'fixture.bin', image_sha256: createHash('sha256').update(bytes).digest('hex'), plant_session_id: 'plant1', split: 'evaluation', reviewer: 'test fixture', labeled_at: '2026-10-16', sop_id: 'SUCCULENT-POTTED-ES', sop_version: '2026.10-trial.1', step_id: 'ESP-03', criterion_labels: { 'ESP-03-C1': 'needs_adjustment' } };
      const prediction = { sample_id: sample.id, image_sha256: sample.image_sha256, sop_id: sample.sop_id, sop_version: sample.sop_version, model: 'test-only', prompt_version: 'test-only', result: { step_id: sample.step_id, criterion_results: [{ criterion_id: 'ESP-03-C1', status: 'passed' }] } };
      expect(evaluate({ samples: [sample] }, [prediction], sopCatalog, dir).metrics.false_pass_count).toBe(1);
      expect(() => evaluate({ samples: [{ ...sample, origin: 'ai_generated' }] }, [prediction], sopCatalog, dir)).toThrow('REAL_PHOTO_LABEL_REQUIRED');
      expect(() => evaluate({ samples: [{ ...sample, image_sha256: 'wrong' }] }, [prediction], sopCatalog, dir)).toThrow('IMAGE_HASH_MISMATCH');
      expect(() => evaluate({ samples: [sample, { ...sample, id: 'two', split: 'tuning' }] }, [prediction], sopCatalog, dir)).toThrow('PLANT_SESSION_LEAKAGE');
      expect(() => evaluate({ samples: [sample] }, [{ ...prediction, sop_version: 'old' }], sopCatalog, dir)).toThrow('PREDICTION_CONTEXT_MISMATCH');
      expect(() => evaluate({ samples: [sample] }, [], sopCatalog, dir)).toThrow('MISSING_OR_DUPLICATE_PREDICTION');
    } finally {
      if (!path.resolve(dir).startsWith(path.resolve(tmpdir()) + path.sep) || !path.basename(dir).startsWith('plantmove-eval-')) throw new Error('UNSAFE_TEST_CLEANUP');
      rmSync(dir, { recursive: true });
    }
  });
});
