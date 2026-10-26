import { z } from 'zod';
import type { JourneyContext } from '@plantcare/domain';
import { vietnamLocations } from '../lib/vietnam-locations';

const normalized=(text:string)=>text.toLocaleLowerCase('vi').normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,' ').replace(/^(tp|thanh pho|tinh)\s+/,'').trim();
const localDay=(time:number)=>new Date(time+7*3600000).toISOString().slice(0,10);
const geoSchema=z.object({results:z.array(z.object({name:z.string().max(100),latitude:z.number().finite().min(-90).max(90),longitude:z.number().finite().min(-180).max(180),country_code:z.string(),feature_code:z.string().optional()})).optional()});
const forecastSchema=z.object({daily_units:z.object({temperature_2m_min:z.literal('°C'),temperature_2m_max:z.literal('°C')}),daily:z.object({time:z.array(z.string()),temperature_2m_min:z.array(z.number().finite().min(-80).max(80).nullable()),temperature_2m_max:z.array(z.number().finite().min(-80).max(80).nullable())})});
type Weather=NonNullable<JourneyContext['weather']>;
type Location=Weather['locations'][number];

async function json(url:URL,signal:AbortSignal){
  const response=await fetch(url,{signal,cache:'no-store',redirect:'error'});
  if(!response.ok)throw new Error('WEATHER_UNAVAILABLE');
  return response.json();
}

async function locate(address:string,signal:AbortSignal):Promise<Location>{
  const name=normalized(address);
  const province=vietnamLocations.filter(p=>(' '+name+' ').includes(' '+normalized(p.name)+' ')).sort((a,b)=>b.name.length-a.name.length)[0];
  // Street/ward input uses the named province's centre; no claim of street-level weather.
  const query=province?.name.replace(/^TP\.\s*/,'')||address.trim();
  const url=new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.search=new URLSearchParams({name:query,count:'5',language:'vi',countryCode:'VN'}).toString();
  const data=geoSchema.parse(await json(url,signal));
  const matches=(data.results||[]).filter(p=>p.country_code==='VN'&&normalized(p.name)===normalized(query));
  const point=matches.find(p=>['PPLC','PPLA','ADM1'].includes(p.feature_code||''))||matches[0];
  if(!point)throw new Error('LOCATION_NOT_FOUND');
  return {name:point.name,latitude:point.latitude,longitude:point.longitude};
}

async function forecast(location:Location,date:string,signal:AbortSignal){
  const url=new URL('https://api.open-meteo.com/v1/forecast');
  url.search=new URLSearchParams({latitude:String(location.latitude),longitude:String(location.longitude),daily:'temperature_2m_min,temperature_2m_max',temperature_unit:'celsius',timezone:'Asia/Ho_Chi_Minh',start_date:date,end_date:date}).toString();
  const {daily}=forecastSchema.parse(await json(url,signal)),at=daily.time.indexOf(date);
  const min=daily.temperature_2m_min[at],max=daily.temperature_2m_max[at];
  if(at<0||min==null||max==null||min>max)throw new Error('WEATHER_UNAVAILABLE');
  return {min,max};
}

/** Both endpoints on the Vietnamese departure date; no claim of conditions inside the package or along the route. */
export async function journeyWeather(origin:string,destination:string,departure:string,now=Date.now()):Promise<Pick<JourneyContext,'minTemp'|'maxTemp'|'source'|'seasonalFallback'|'weather'>>{
  const time=Date.parse(departure),date=Number.isFinite(time)?localDay(time):'',fetchedAt=new Date(now).toISOString();
  const base={provider:'OPEN_METEO' as const,date,fetchedAt,locations:[] as Location[]};
  try{
    const days=(Date.parse(date)-Date.parse(localDay(now)))/86400000;
    if(!Number.isFinite(days)||days<0||days>15)throw new Error('DATE_OUT_OF_RANGE');
    const signal=AbortSignal.timeout(8000);
    const locations=await Promise.all([locate(origin,signal),locate(destination,signal)]);
    const values=await Promise.all(locations.map(location=>forecast(location,date,signal)));
    return {minTemp:Math.min(...values.map(v=>v.min)),maxTemp:Math.max(...values.map(v=>v.max)),source:`Open-Meteo · ${date} · ${locations.map(p=>p.name).join(' / ')}. Min/max trong ngày gửi tại tâm tỉnh/thành nơi đi và nơi đến.`,seasonalFallback:false,weather:{...base,status:'FORECAST',locations}};
  }catch(error){
    const reason=error instanceof Error&&error.message==='DATE_OUT_OF_RANGE'?'Ngày gửi ngoài phạm vi dự báo 16 ngày.':error instanceof Error&&error.message==='LOCATION_NOT_FOUND'?'Chưa xác định được địa điểm.':'Không lấy được dự báo thời tiết.';
    return {minTemp:25,maxTemp:32,source:`Dữ liệu dự phòng 25–32°C. ${reason}`,seasonalFallback:true,weather:{...base,status:'FALLBACK',reason}};
  }
}
