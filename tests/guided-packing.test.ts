import { describe, expect, it } from 'vitest';
import { guidedDecision } from '../apps/web/src/lib/guided-packing';
import { selectSop, type CheckpointResult } from '../apps/web/src/lib/live-packing';
import { packingCommand } from '../apps/web/src/lib/packing-voice-commands';

const sop = selectSop('succulent', 'POTTED'), visual = sop.steps[2];
const result = (status: CheckpointResult['status']): CheckpointResult => ({ step_id: visual.id, status, observed: 'Test fixture', reason: 'Test fixture', manual_check_required: true, criterion_results: [{ criterion_id: visual.criteria[0].id, status, observation: 'Test fixture' }] });
describe('guided automatic progress', () => {
  it('advances only when both the image and human physical checks are complete', () => {
    expect(guidedDecision(visual, result('passed'), true)).toBe('advance');
    expect(guidedDecision(visual, result('passed'), false)).toBe('await_manual');
  });
  it.each(['needs_adjustment', 'unverifiable'] as const)('stays on %s even with a human physical check', status => {
    expect(guidedDecision(visual, result(status), true)).toBe('retry');
  });
  it('never advances on missing response or another step result', () => {
    expect(guidedDecision(visual, undefined, true)).toBe('retry');
    expect(guidedDecision(visual, { ...result('passed'), step_id: 'old-step' }, true)).toBe('retry');
  });
  it('manual-only step advances on explicit human confirmation without claiming image verification', () => {
    expect(guidedDecision(sop.steps[0], undefined, false)).toBe('await_manual');
    expect(guidedDecision(sop.steps[0], undefined, true)).toBe('advance');
  });
  it('distinguishes done from a physical-check confirmation and rejects negation', () => {
    expect(packingCommand('đã xong')).toBe('check');
    expect(packingCommand('Tôi đã kiểm tra trực tiếp')).toBe('confirm_manual');
    expect(packingCommand('đã xong và đã kiểm tra trực tiếp')).toBe('confirm_manual');
    expect(packingCommand('tôi chưa kiểm tra trực tiếp')).toBeNull();
    expect(packingCommand('chưa xong')).toBeNull();
  });
});
