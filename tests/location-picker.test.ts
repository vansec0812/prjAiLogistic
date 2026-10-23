import { describe, it, expect } from 'vitest';
import { vietnamLocations, popularProvinces, normalizeVietnamese } from '../apps/web/src/lib/vietnam-locations';

describe('Vietnam location data and helpers', () => {
  it('contains major provinces including Ha Noi and Bac Ninh', () => {
    const hanoi = vietnamLocations.find(p => p.name === 'Hà Nội');
    expect(hanoi).toBeDefined();
    expect(hanoi!.districts.some(d => d.name === 'Quận Ba Đình')).toBe(true);

    const badinh = hanoi!.districts.find(d => d.name === 'Quận Ba Đình');
    expect(badinh!.wards).toContain('Phường Trúc Bạch');

    const bacninh = vietnamLocations.find(p => p.name === 'Bắc Ninh');
    expect(bacninh).toBeDefined();
    expect(bacninh!.districts.some(d => d.name === 'TP. Bắc Ninh')).toBe(true);

    const tpBacNinh = bacninh!.districts.find(d => d.name === 'TP. Bắc Ninh');
    expect(tpBacNinh!.wards).toContain('Phường Suối Hoa');
  });

  it('normalizes Vietnamese text without diacritics for search', () => {
    expect(normalizeVietnamese('Phường Suối Hoa')).toBe('phuong suoi hoa');
    expect(normalizeVietnamese('Hà Nội')).toBe('ha noi');
    expect(normalizeVietnamese('Đà Nẵng')).toBe('da nang');
    expect(normalizeVietnamese('Bắc Ninh')).toBe('bac ninh');
  });

  it('includes popular provinces in the quick-select list', () => {
    expect(popularProvinces).toContain('Hà Nội');
    expect(popularProvinces).toContain('TP. Hồ Chí Minh');
    expect(popularProvinces).toContain('Bắc Ninh');
    expect(popularProvinces).toContain('Đà Nẵng');
  });
});

