export type Group = 'FOLIAGE' | 'FLOWERING' | 'SUCCULENT' | 'UNKNOWN';
export type Outcome = 'PASS' | 'WARN_ACK' | 'FAIL' | 'NEEDS_INPUT' | 'NEEDS_EXPERT';
export interface PlantInput {
  name: string; group: Group; height: number | null; length: number | null; width: number | null;
  potDiameter: number | null; potHeight: number | null; weight: number | null;
  fragility: 'LOW'|'MEDIUM'|'HIGH'|'UNKNOWN'; potMaterial: string; confirmed: boolean;
  fieldEvidence?:Partial<Record<import('./mvp').ProfileField,import('./mvp').FieldEvidence>>;
}
export interface MaterialInput {
  id: string; name: string; category: 'BOX'|'PADDING'|'FIXING'|'TAPE'|'LABEL';
  quantity: number; unit: string; price: number | null; weight: number | null;
  length: number | null; width: number | null; height: number | null; maxLoad: number | null;
  confirmed: boolean; reusable: boolean; condition: 'GOOD'|'UNKNOWN'|'DAMAGED'; inventoryId?: string;
}
export interface ShipmentInput {
  origin: string; destination: string; departure: string; duration: number | null;
  mode: string; carrier: string; orientation: 'UPRIGHT'|'UNKNOWN';
  minTemp: number | null; maxTemp: number | null; weatherSource: string;
  confirmed: boolean; observedAt: string; coverage: 'ENDPOINTS'|'DECLARED_ROUTE';
  channel?:string;distanceKm?:number|null;context?:import('./mvp').JourneyContext;
}
export interface CaseInput {plant: PlantInput; materials: MaterialInput[]; shipment: ShipmentInput; priority:'SAFETY'|'COST'|'REUSE';}
export interface Step {
  id: string; order: number; code: string; title: string; instruction: string;
  check: string; warning: string; ruleIds: string[]; illustration: string;
  schematic?:string; illustrationKind?:'AI_PHOTOREALISTIC'|'SCHEMATIC'; illustrationNotice?:string;
  goal?:string; actions?:string[]; checkpoints?:string[]; stopConditions?:string[];
  materialIds?:string[]; tools?:string[]; evidenceIds?:string[]; expectedResult?:string;
}
export interface EvidenceReference {id:string;title:string;url:string;scope:string;limitation:string;reviewStatus:'UNREVIEWED';}
export interface PackingReport {
  schemaVersion:'packing-report-v2';knowledgeVersion:string;generationMode:'DETERMINISTIC_RULE_TEMPLATE';
  summary:string;preflight:{label:string;value:string;status:'KNOWN'|'UNKNOWN'}[];
  materials:{id:string;category:MaterialInput['category'];name:string;quantity:number;unit:string;unitPrice:number|null;subtotal:number|null;weight:number|null}[];
  assumptions:string[];stopConditions:string[];handover:string[];recipientChecks:string[];
  references:EvidenceReference[];limits:string[];
}
export interface RuleTrace {ruleId:string;version:string;name:string;outcome:string;reason:string;source:string;}
export interface RulePack {
  id:string; version:string; status:'DRAFT'|'PUBLISHED'; approvedBy:string|null;
  source:string; groups:Group[]; paddingCm:number; templateVersion:string;
}
export interface Plan {
  outcome:Outcome; risk:'LOW'|'MEDIUM'|'HIGH'|'UNKNOWN'; warnings:{code:string;text:string;acknowledgeable:boolean}[];
  missingFields:string[]; missingMaterials:string[]; trace:RuleTrace[]; steps:Step[];
  boxId:string|null; usedMaterialIds:string[]; package:{length:number|null;width:number|null;height:number|null;weight:number|null};
  cost:{known:number;completeness:'FULL'|'PARTIAL'|'UNKNOWN'}; ruleVersion:string; templateVersion:string;
  developmentOnly:boolean;
  report?:PackingReport;
}
export interface CaseRecord {id:string;name:string;version:number;status:string;input:CaseInput;updatedAt:string;createdAt:string;selectedVersion:string|null;demo:boolean;flow?:'MVP';}
export interface PlanVersion {id:string;caseId:string;number:number;inputHash:string;snapshot:CaseInput;plan:Plan;createdAt:string;stale:boolean;}
export const emptyInput = (): CaseInput => ({
  plant:{name:'',group:'UNKNOWN',height:null,length:null,width:null,potDiameter:null,potHeight:null,weight:null,fragility:'UNKNOWN',potMaterial:'Nhựa',confirmed:false},
  materials:[], shipment:{origin:'',destination:'',departure:'',duration:null,mode:'Xe tải thường',carrier:'',orientation:'UPRIGHT',minTemp:null,maxTemp:null,weatherSource:'',confirmed:false,observedAt:'',coverage:'ENDPOINTS'},priority:'SAFETY'
});
export const blankMaterial = (id:string,category:MaterialInput['category']='BOX'):MaterialInput => ({id,category,name:category==='BOX'?'Hộp carton':'Vật tư mới',quantity:1,unit:'cái',price:null,weight:null,length:null,width:null,height:null,maxLoad:null,confirmed:false,reusable:false,condition:'GOOD'});
export { getReadiness, type ReadinessItem } from './readiness';
export * from './mvp';
