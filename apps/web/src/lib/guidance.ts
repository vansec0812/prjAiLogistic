import type { CheckpointResult, SopContext, StepRecord } from './live-packing';

export interface GuidanceSession {
  id:string;caseId:string;inputHash:string;sopId:string;sopVersion:string;context:SopContext;
  revision:number;index:number;status:'ACTIVE'|'FINISHED'|'REVIEW_REQUIRED';records:Record<string,StepRecord>;
  checks:Record<string,CheckpointResult>;createdAt:string;updatedAt:string;stale?:boolean;
}

export function confirmationDecision(mode:'manual'|'visual',record:StepRecord|undefined):'CONFIRM'|'CHECK'|'REPAIR'{
  if(mode==='manual')return 'CONFIRM';
  if(!record)return 'CHECK';
  if(record.kind==='ai'&&record.result?.status==='passed')return 'CONFIRM';
  if(record.kind==='manual'&&(record.note?.trim().length||0)>=10)return 'CONFIRM';
  return 'REPAIR';
}
