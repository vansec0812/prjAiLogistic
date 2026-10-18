import type { LiveSop } from './live-packing';

/** Fixed narration only: never ask a language model to rewrite a SOP instruction. */
export function packingNarration(sop: LiveSop, index: number): string {
  if (!Number.isInteger(index) || index < 0 || index >= sop.steps.length) throw new Error('INVALID_NARRATION_STEP');
  const step = sop.steps[index];
  const next = step.mode === 'manual'
    ? 'Bước này cần kiểm tra trực tiếp. Làm và kiểm tra xong, nói đã xong bước này để tiếp tục.'
    : `${step.camera_prompt_vi} Kiểm tra trực tiếp xong, nói đã xong bước này. Tôi sẽ kiểm ảnh trước khi chuyển bước. Nếu không dùng camera, nói tôi đã kiểm tra trực tiếp. Nếu gặp lỗi, nói tôi gặp lỗi.`;
  return `Bước ${index + 1} trên ${sop.steps.length}. ${step.title}. ${step.speech_vi} ${step.manual} ${next}`;
}
