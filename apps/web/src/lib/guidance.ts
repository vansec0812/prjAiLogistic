import type { CheckpointResult, SopContext, StepRecord, LiveStep, LiveSop } from './live-packing';
import { guidedDecision } from './guided-packing';

export interface GuidanceSession {
  id:string;caseId:string;inputHash:string;sopId:string;sopVersion:string;context:SopContext;mode?:'TRIAL'|'REFERENCE'|'MVP';
  bundleId?:string;alternativeId?:'PA1'|'PA2';boundSop?:LiveSop;executionState?:'READY'|'RUNNING'|'PAUSED'|'ENDED';
  confidenceThreshold?:number;
  revision:number;index:number;status:'ACTIVE'|'FINISHED'|'REVIEW_REQUIRED';records:Record<string,StepRecord>;
  checks:Record<string,CheckpointResult>;createdAt:string;updatedAt:string;stale?:boolean;
  currentIssue?:{stepId:string;note:string;at:string};
}

export function confirmationDecision(step:LiveStep,record:StepRecord|undefined):'CONFIRM'|'CHECK'|'REPAIR'{
  if(step.mode==='manual')return 'CONFIRM';
  if(!record)return 'CHECK';
  if(record.kind==='ai'&&guidedDecision(step,record.result,true)==='advance')return 'CONFIRM';
  if(record.kind==='manual'&&(record.note?.trim().length||0)>=10)return 'CONFIRM';
  return 'REPAIR';
}
