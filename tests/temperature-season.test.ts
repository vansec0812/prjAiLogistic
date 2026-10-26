import { describe, expect, it } from 'vitest';
import { temperatureSeason } from '../apps/web/src/lib/temperature-season';

describe('Temperature context label',()=>{
  it.each([
    [-5,10,'Mùa lạnh'],[10,20,'Mùa mát'],[20,30,'Mùa ấm'],[25,35,'Mùa nóng'],
    [10,25,'Mùa mát'],[25,32,'Mùa ấm'],[0,40,'Mùa mát']
  ] as const)('classifies %s–%s °C using both temperatures', (min,max,label)=>{
    expect(temperatureSeason(min,max)).toBe(label);
  });
  it('requires a complete, finite, ordered range',()=>{
    for(const [min,max] of [[null,25],[20,null],[null,null],[30,20],[NaN,25],[20,Infinity]])
      expect(temperatureSeason(min,max)).toBe('');
  });
});
