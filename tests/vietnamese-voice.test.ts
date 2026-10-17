import { describe, it, expect } from 'vitest';
import { vietnameseVoice } from '../apps/web/src/lib/vietnamese-voice';
describe('strict Vietnamese speech', () => {
  it('does not choose a foreign default over Vietnamese', () => { expect(vietnameseVoice([{ lang: 'en-US', default: true }, { lang: 'vi-VN' }])?.lang).toBe('vi-VN'); });
  it('does not fall back to a foreign voice', () => { expect(vietnameseVoice([{ lang: 'en-US', default: true }, { lang: 'fr-FR' }])).toBeNull(); expect(vietnameseVoice([])).toBeNull(); });
  it('handles OS language formats and chooses a local Vietnamese voice', () => { expect(vietnameseVoice([{ lang: 'vi', localService: false }, { lang: 'vi_VN', localService: true }])?.lang).toBe('vi_VN'); });
  it('rejects unrelated language prefixes', () => { expect(vietnameseVoice([{ lang: 'vis' }])).toBeNull(); });
});
