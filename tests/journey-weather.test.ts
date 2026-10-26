import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { journeyWeather } from '../apps/web/src/server/journey-weather';
const now=Date.parse('2026-10-25T06:00:00Z'),departure='2026-10-25T18:00:00Z',date='2026-10-26';
const fetchMock=vi.fn();
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
function provider(url:URL){
  if(url.hostname==='geocoding-api.open-meteo.com'){
    const name=url.searchParams.get('name');
    return reply({results:[{name,latitude:name==='Hà Nội'?21.02:21.18,longitude:105.85,country_code:'VN',feature_code:'PPLA'}]});
  }
  const from=url.searchParams.get('latitude')==='21.02';
  return reply({daily_units:{temperature_2m_min:'°C',temperature_2m_max:'°C'},daily:{time:[date],temperature_2m_min:[from?10.6:17.1],temperature_2m_max:[from?23.2:29.4]}});
}
beforeEach(()=>{vi.stubGlobal('fetch',fetchMock);fetchMock.mockReset().mockImplementation(provider);});
afterEach(()=>vi.unstubAllGlobals());

describe('Open-Meteo departure-day weather',()=>{
  it('takes extremes across both endpoint forecasts using Vietnam date, preserving decimals and source',async()=>{
    const value=await journeyWeather('Hoàng Hoa Thám - Hà Nội','Từ Sơn - Bắc Ninh',departure,now);
    expect(value).toMatchObject({minTemp:10.6,maxTemp:29.4,seasonalFallback:false,weather:{status:'FORECAST',date,fetchedAt:new Date(now).toISOString()}});
    expect(value.weather?.locations).toHaveLength(2);expect(value.source).toContain('Open-Meteo');
    const urls=fetchMock.mock.calls.map(call=>call[0] as URL);
    expect(urls.filter(u=>u.hostname==='geocoding-api.open-meteo.com').map(u=>u.searchParams.get('name'))).toEqual(['Hà Nội','Bắc Ninh']);
    for(const u of urls.filter(u=>u.hostname==='api.open-meteo.com'))expect(Object.fromEntries(u.searchParams)).toMatchObject({timezone:'Asia/Ho_Chi_Minh',start_date:date,end_date:date,temperature_unit:'celsius'});
  });
  it('uses explicit 25–32 fallback on network failure, without pretending it is a forecast',async()=>{
    fetchMock.mockRejectedValue(new DOMException('Timeout','TimeoutError'));
    const value=await journeyWeather('Hà Nội','Bắc Ninh',departure,now);
    expect(value).toMatchObject({minTemp:25,maxTemp:32,seasonalFallback:true,weather:{status:'FALLBACK',locations:[]}});expect(value.source).toContain('Dữ liệu dự phòng');
  });
  it('does not use a partial forecast when one endpoint is unavailable',async()=>{
    fetchMock.mockImplementation((u:URL)=>u.hostname==='api.open-meteo.com'&&u.searchParams.get('latitude')!=='21.02'?reply({error:true},503):provider(u));
    expect(await journeyWeather('Hà Nội','Bắc Ninh',departure,now)).toMatchObject({minTemp:25,maxTemp:32,weather:{status:'FALLBACK'}});
  });
  it.each([
    {time:[date],temperature_2m_min:[null],temperature_2m_max:[30]},
    {time:[date],temperature_2m_min:[35],temperature_2m_max:[30]},
    {time:['2026-10-27'],temperature_2m_min:[20],temperature_2m_max:[30]}
  ])('rejects missing, inverted or wrong-date temperature data',async daily=>{
    fetchMock.mockImplementation((u:URL)=>u.hostname==='api.open-meteo.com'?reply({daily_units:{temperature_2m_min:'°C',temperature_2m_max:'°C'},daily}):provider(u));
    expect((await journeyWeather('Hà Nội','Bắc Ninh',departure,now)).weather?.status).toBe('FALLBACK');
  });
  it('does not replace unknown locations with arbitrary geocoding results',async()=>{
    fetchMock.mockImplementation(()=>reply({results:[{name:'Hà Nội',latitude:21,longitude:105,country_code:'VN'}]}));
    expect((await journeyWeather('Chưa rõ địa danh','Chưa biết địa điểm',departure,now)).weather?.reason).toContain('địa điểm');
  });
  it('falls back outside the forecast horizon without requesting unrelated dates',async()=>{
    const value=await journeyWeather('Hà Nội','Bắc Ninh','2026-11-20T06:00:00Z',now);
    expect(value.weather).toMatchObject({status:'FALLBACK',date:'2026-11-20'});expect(value.source).toContain('16 ngày');expect(fetchMock).not.toHaveBeenCalled();
  });
});
