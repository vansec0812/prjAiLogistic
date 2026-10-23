import Decimal from 'decimal.js';
import type { AlternativeId, MvpAlternative, MvpBundle } from '@plantcare/domain';

export const demoPricingVersion='demo-material-prices-2026.10.22-v1';
export const demoPricingReason='Giá vật liệu bao gói cố định do người dùng cung cấp ngày 22/10/2026: PA1 3.400đ, PA2 900đ.';
const materials:Record<AlternativeId,{id:string;name:string;price:number;imageStep:number}[]>={
  PA1:[
    {id:'foam',name:'Thùng xốp',price:2000,imageStep:1},
    {id:'padding',name:'Vật liệu chèn lót',price:1000,imageStep:1},
    {id:'wrap',name:'Màng bọc',price:200,imageStep:0},
    {id:'tape',name:'Băng keo',price:200,imageStep:2}
  ],
  PA2:[
    {id:'carton',name:'Bìa carton',price:500,imageStep:3},
    {id:'wrap',name:'Màng bọc',price:200,imageStep:0},
    {id:'tape',name:'Băng keo',price:200,imageStep:5}
  ]
};

export function withDemoMaterialPricing(alternative:MvpAlternative):MvpAlternative{
  const bom=materials[alternative.id].map(({imageStep,...material})=>({...material,image:alternative.steps[imageStep]?.image||alternative.steps[0]?.image||'',unit:'bộ',active:true,quantity:1,subtotal:material.price}));
  const total=bom.reduce((sum,material)=>sum.plus(material.subtotal),new Decimal(0)).toNumber();
  return {...alternative,bom,cost:{known:total,total}};
}

/** Supply the requested prices for old, unpriced demos without rewriting their snapshots. */
export function withDemoBundlePricing<T extends MvpBundle>(bundle:T):T{
  if(!bundle.demo||bundle.configVersion!=='packing-photos-2026.10.20-v1'||!bundle.alternatives.some(alternative=>alternative.cost.total===null))return bundle;
  return {...bundle,alternatives:bundle.alternatives.map(alternative=>alternative.cost.total===null?withDemoMaterialPricing(alternative):alternative),trace:[...bundle.trace.filter(item=>item.id!==demoPricingVersion),{id:demoPricingVersion,reason:demoPricingReason}]};
}
