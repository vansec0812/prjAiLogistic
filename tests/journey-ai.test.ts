import { describe, it, expect } from 'vitest';
import { estimateJourneyWithAi } from '../apps/web/src/server/journey-ai';

describe('Journey AI estimation', () => {
  it('falls back to rule engine when offline or no API key', async () => {
    // With dummy invalid key or without key, it gracefully returns rule-based fallback
    const result = await estimateJourneyWithAi(
      'Hà Nội',
      'Bắc Ninh',
      '2026-11-01T00:00:00.000Z',
      'DIRECT'
    );

    expect(result).toBeDefined();
    expect(result.distanceKm).toBeGreaterThan(0);
    expect(result.duration).toBeGreaterThan(0);
    expect(typeof result.minTemp).toBe('number');
    expect(typeof result.maxTemp).toBe('number');
    expect(result.distanceKind).toBe('STRAIGHT_LINE');
    expect(typeof result.source).toBe('string');
  });

  it('handles unknown locations gracefully with fallback', async () => {
    const result = await estimateJourneyWithAi(
      'Tỉnh Chưa Biết',
      'Huyện Chưa Biết',
      '2026-11-01T00:00:00.000Z',
      'OTHER'
    );

    expect(result).toBeDefined();
    expect(result.distanceKind).toBe('STRAIGHT_LINE');
  });
});

