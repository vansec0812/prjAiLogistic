import { activeMvpConfig } from './mvp';
import { inferJourney } from '../../../../packages/rule-engine/src/mvp';
import type { JourneyContext } from '../../../../packages/domain/src/index';
import { journeyWeather } from './journey-weather';

/** Route/ETA stay rule-based; temperatures come from Open-Meteo independently of Gemini. */
export async function estimateJourneyWithAi(origin:string,destination:string,departure:string,channel:string):Promise<JourneyContext>{
  const route=inferJourney(origin,destination,departure,channel,activeMvpConfig());
  return {...route,...await journeyWeather(origin,destination,departure)};
}
