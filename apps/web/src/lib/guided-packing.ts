import type { CheckpointResult, LiveStep } from './live-packing';

export function guidedDecision(step: LiveStep, result: CheckpointResult | undefined, manualConfirmed: boolean) {
  if (step.mode === 'manual') return manualConfirmed ? 'advance' : 'await_manual';
  if (!result || result.step_id !== step.id || result.status !== 'passed') return 'retry';
  return manualConfirmed ? 'advance' : 'await_manual';
}
