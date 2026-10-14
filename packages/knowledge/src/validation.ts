import { z } from 'zod';

export const ragSchema=z.object({
  answer:z.string().min(1).max(5000),
  claims:z.array(z.object({text:z.string().min(1).max(1000),citation_ids:z.array(z.string()).min(1).max(4)}).strict()).max(6),
  uncertainties:z.array(z.string().max(500)).max(8),
  needs_expert:z.boolean()
}).strict();

// Citation membership validates provenance, not whether the claim is true.
export function validateRagAnswer(raw:unknown,contextIds:string[]){
  const parsed=ragSchema.safeParse(raw);
  if(!parsed.success)throw new Error('AI_INVALID_OUTPUT');
  const allowed=new Set(contextIds);
  if(parsed.data.claims.some(c=>c.citation_ids.some(id=>!allowed.has(id))))throw new Error('AI_INVALID_CITATION');
  return {...parsed.data,needs_expert:true};
}
