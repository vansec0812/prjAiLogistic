import type { LiveSop } from './live-packing';

/** Fixed narration only: never ask a language model to rewrite a SOP instruction. */
export function packingNarration(sop: LiveSop, index: number): string {
  if (!Number.isInteger(index) || index < 0 || index >= sop.steps.length) throw new Error('INVALID_NARRATION_STEP');
  const step = sop.steps[index];
  const next = step.mode === 'manual'
    ? 'Bước này cần kiểm tra trực tiếp. Kiểm xong, nói đồng ý hoặc tôi đã kiểm tra trực tiếp để xác nhận và chuyển bước. Bạn cũng có thể dùng ô kiểm tay và nút Bước tiếp.'
    : `${step.camera_prompt_vi} Khi đã sẵn sàng, nói kiểm tra hoặc đã xong để tôi kiểm một ảnh. Sau khi ảnh đạt và bạn kiểm trực tiếp xong, nói đồng ý để xác nhận và chuyển bước.`;
  return `Bước ${index + 1} trên ${sop.steps.length}. ${step.title}. ${step.speech_vi} ${step.manual} ${next}`;
}
