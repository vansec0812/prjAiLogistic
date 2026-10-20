import type { CaseInput, Group } from './index';

export type AlternativeId = 'PA1' | 'PA2';
export type ProfileField = 'name'|'group'|'height'|'length'|'width'|'potDiameter'|'potHeight'|'weight'|'fragility'|'potMaterial';
export interface FieldEvidence {source:'AI'|'USER'|'DEMO';confidence:number|null;status:'SUGGESTED'|'NEED_INPUT'|'CONFIRMED';evidence:string;}
export interface CatalogMaterial {id:string;name:string;unit:string;price:number|null;image:string;active:boolean;}
export interface MvpStep {id:string;title:string;instruction:string;speech:string;manual:string;remedy:string;image:string;mode:'manual'|'visual';criteria:{id:string;visible_pass:string;visible_fail:string}[];}
export interface MvpConfig {
  version:string;status:'DRAFT'|'APPROVED';author:string;createdAt:string;effectiveAt:string;reason:string;
  expertReview:{by:string;at:string;note:string}|null;
  confidenceThreshold:number;groups:Group[];
  plants:{name:string;group:Group;fragility:'LOW'|'MEDIUM'|'HIGH';thorns:boolean;lightSensitive:boolean}[];
  limits:{potBands:number[];weightBands:number[];minTemp:number;maxTemp:number;maxDuration:number;costMaxWeight:number;costMaxPot:number;costMaxDuration:number};
  channels:{id:string;label:string;nearHours:number;farHours:number}[];
  seasons:{months:number[];minTemp:number;maxTemp:number;label:string}[];
  materials:CatalogMaterial[];
  alternatives:{id:AlternativeId;title:string;description:string;bom:{materialId:string;quantity:number}[];steps:MvpStep[]}[];
}
export interface JourneyContext {distanceKm:number|null;distanceKind:'STRAIGHT_LINE'|'USER';duration:number|null;minTemp:number|null;maxTemp:number|null;source:string;seasonalFallback:boolean;configVersion:string;}
export interface MvpAlternative {id:AlternativeId;title:string;description:string;bom:(CatalogMaterial&{quantity:number;subtotal:number|null})[];cost:{known:number;total:number|null};steps:MvpStep[];ruleIds:string[];notes:string[];}
export interface MvpBundle {id:string;caseId:string;inputHash:string;snapshot:CaseInput;configVersion:string;createdAt:string;developmentOnly:boolean;demo?:boolean;confidenceThreshold?:number;outcome:'READY'|'NEED_INPUT'|'NEEDS_EXPERT';missing:string[];alternatives:MvpAlternative[];suppressed:{id:AlternativeId;reason:string}[];trace:{id:string;reason:string}[];}
export interface MvpSelection {id:string;caseId:string;bundleId:string;alternativeId:AlternativeId;revision:number;started:boolean;}
export interface PostCheckItem {id:string;title:string;status:'passed'|'needs_adjustment'|'unverifiable';reason:string;remedy:string;source:'AI'|'USER'|'PENDING';}
export interface MvpPostCheck {id:string;caseId:string;bundleId:string;alternativeId:AlternativeId;guidanceId:string;revision:number;items:PostCheckItem[];completedAt:string|null;updatedAt:string;}
export const profileFields:ProfileField[]=['name','group','height','length','width','potDiameter','potHeight','weight','fragility','potMaterial'];
