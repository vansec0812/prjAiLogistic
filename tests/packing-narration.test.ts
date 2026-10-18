import { describe, it, expect } from 'vitest';
import { packingNarration } from '../apps/web/src/lib/packing-narration';
import { selectSop, sopCatalog } from '../apps/web/src/lib/live-packing';

describe('fixed SOP narration', () => {
  it('reads the selected step in order and preserves its exact supplied instruction', () => {
    for (const sop of sopCatalog.sops) for (const [i, step] of sop.steps.entries()) {
      const text = packingNarration(sop, i);
      expect(text.startsWith(`Bước ${i + 1} trên ${sop.steps.length}. ${step.title}. ${step.speech_vi}`)).toBe(true);
      expect(text).not.toContain('Xin chào');
      expect(text.length).toBeLessThanOrEqual(3000);
      if (step.mode === 'visual') expect(text).toContain(step.camera_prompt_vi);
      else { expect(text).toContain('Bước này cần kiểm tra trực tiếp'); expect(text).not.toContain('nhấn nút Kiểm tra'); }
    }
  });
  it('replays deterministically without changing progress or checklist data', () => {
    const sop = selectSop('succulent', 'POTTED'), before = JSON.stringify(sop);
    expect(packingNarration(sop, 2)).toBe(packingNarration(sop, 2));
    expect(packingNarration(sop, 2)).not.toBe(packingNarration(sop, 3));
    expect(JSON.stringify(sop)).toBe(before);
  });
  it.each([-1, .5, 99, NaN])('rejects invalid step index %s', index => expect(() => packingNarration(selectSop('cactus', 'POTTED'), index)).toThrow('INVALID_NARRATION_STEP'));
});
