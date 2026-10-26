import { afterEach, describe, it, expect, vi } from 'vitest';
import { estimateJourneyWithAi } from '../apps/web/src/server/journey-ai';
vi.mock('../apps/web/src/server/mvp',async()=>{const {defaultMvpConfig}=await import('../apps/web/src/lib/mvp-config');return {activeMvpConfig:()=>defaultMvpConfig};});
vi.mock('../apps/web/src/server/journey-weather',()=>({journeyWeather:vi.fn(async()=>({minTemp:18,maxTemp:27,source:'Open-Meteo',seasonalFallback:false}))}));
afterEach(()=>vi.unstubAllGlobals());
describe('Journey route and weather integration',()=>{
  it('keeps route estimates and uses weather temperatures without Gemini calls',async()=>{
    const network=vi.fn();vi.stubGlobal('fetch',network);
    const result=await estimateJourneyWithAi('Hà Nội','Bắc Ninh','2026-11-01T00:00:00Z','DIRECT');
    expect(result.distanceKm).toBeGreaterThan(0);expect(result.duration).toBe(12);
    expect(result).toMatchObject({minTemp:18,maxTemp:27,source:'Open-Meteo',seasonalFallback:false,distanceKind:'STRAIGHT_LINE'});
    expect(network).not.toHaveBeenCalled();
  });
  it('keeps distance unknown for unknown places',async()=>{
    expect((await estimateJourneyWithAi('Chưa rõ','Chưa biết','2026-11-01T00:00:00Z','OTHER')).distanceKm).toBeNull();
  });
});
