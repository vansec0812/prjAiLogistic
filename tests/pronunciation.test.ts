import { describe, expect, it } from 'vitest';
import { vietnameseSpeechText } from '../apps/web/src/lib/vietnamese-pronunciation';
import { waveFixture } from './fixtures/wave';
import { validWav } from '../apps/web/src/lib/wav';

describe('Vietnamese SOP speech rendering',()=>{
  it('preserves decimal precision, ranges, negative values and comparison meaning',()=>{
    expect(vietnameseSpeechText('SOP: 5,08–10,16 cm; < 1.36077711 kg; -5 °C.')).toBe('quy trình: 5 phẩy không tám đến 10 phẩy một sáu xen ti mét; nhỏ hơn 1 phẩy ba sáu không bảy bảy bảy một một ki lô gam; âm 5 độ C.');
    expect(vietnameseSpeechText('≤ 20 cm; ≥ 3 kg; 2 × 3 cm')).toBe('nhỏ hơn hoặc bằng 20 xen ti mét; lớn hơn hoặc bằng 3 ki lô gam; 2 nhân 3 xen ti mét');
  });
  it('is stable when client and server normalize the same text',()=>{const text='Bọc chậu bằng 2–3 vòng giấy.';expect(vietnameseSpeechText(vietnameseSpeechText(text))).toBe(vietnameseSpeechText(text));});
  it('requires playable PCM chunks rather than only RIFF/WAVE markers',()=>{expect(validWav(waveFixture())).toBe(true);const fake=Buffer.alloc(46);fake.write('RIFF');fake.write('WAVE',8);expect(validWav(fake)).toBe(false);const broken=waveFixture();broken.writeUInt32LE(9000,40);expect(validWav(broken)).toBe(false);});
});
