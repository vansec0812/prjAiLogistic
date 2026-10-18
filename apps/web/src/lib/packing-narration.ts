import type { LiveSop } from './live-packing';

/** Fixed narration only: never ask a language model to rewrite a SOP instruction. */
export function packingNarration(sop: LiveSop, index: number): string {
  if (!Number.isInteger(index) || index < 0 || index >= sop.steps.length) throw new Error('INVALID_NARRATION_STEP');
  const step = sop.steps[index];
  const next = step.mode === 'manual'
    ? 'Bước này cần kiểm tra trực tiếp. Sau khi tự kiểm theo mục kiểm tra tay, nói tôi đã kiểm tra trực tiếp hoặc tích ô xác nhận. Trong chế độ Bắt đầu, tôi sẽ sang bước tiếp theo. Câu nói đã xong chỉ yêu cầu kiểm tra.'
    : `${step.camera_prompt_vi} Khi đã sẵn sàng, nói đã xong, PlantMove, kiểm tra, hoặc nhấn nút Kiểm tra. Ảnh đạt và phần kiểm tay được bạn xác nhận thì chế độ Bắt đầu tự sang bước tiếp theo.`;
  return `Bước ${index + 1} trên ${sop.steps.length}. ${step.title}. ${step.speech_vi} ${next}`;
}
