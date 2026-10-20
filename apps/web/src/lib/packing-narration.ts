import type { LiveSop } from './live-packing';

/** Fixed narration only: never ask a language model to rewrite a SOP instruction. */
export function packingNarration(sop: LiveSop, index: number): string {
  if (!Number.isInteger(index) || index < 0 || index >= sop.steps.length) throw new Error('INVALID_NARRATION_STEP');
  const step = sop.steps[index];
  return `Bước ${index + 1}. ${step.speech_vi}`;
}
