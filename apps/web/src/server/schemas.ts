import { z } from 'zod';
import { ApiError } from './security';
const number=z.number().finite().min(0).max(100000).nullable();
export const inputSchema=z.object({
  plant:z.object({name:z.string().max(100),group:z.enum(['FOLIAGE','FLOWERING','SUCCULENT','UNKNOWN']),height:number,length:number,width:number,potDiameter:number,potHeight:number,weight:number,fragility:z.enum(['LOW','MEDIUM','HIGH','UNKNOWN']),potMaterial:z.string().max(50),confirmed:z.boolean()}),
  materials:z.array(z.object({id:z.string().min(1).max(80),name:z.string().min(1).max(100),category:z.enum(['BOX','PADDING','FIXING','TAPE','LABEL']),quantity:z.number().min(0).max(100000),unit:z.string().min(1).max(20),price:z.number().min(0).max(1000000000).nullable(),weight:number,length:number,width:number,height:number,maxLoad:number,confirmed:z.boolean(),reusable:z.boolean(),condition:z.enum(['GOOD','UNKNOWN','DAMAGED']),inventoryId:z.string().max(80).optional()})).max(50).refine(items=>new Set(items.map(m=>m.id)).size===items.length,'Mỗi vật tư phải có mã riêng.'),
  shipment:z.object({origin:z.string().max(100),destination:z.string().max(100),departure:z.string().max(40),duration:number,mode:z.string().max(60),carrier:z.string().max(100),orientation:z.enum(['UPRIGHT','UNKNOWN']),minTemp:z.number().min(-80).max(80).nullable(),maxTemp:z.number().min(-80).max(80).nullable(),weatherSource:z.string().max(300),confirmed:z.boolean(),observedAt:z.string().max(40),coverage:z.enum(['ENDPOINTS','DECLARED_ROUTE'])}),
  priority:z.enum(['SAFETY','COST','REUSE'])
}).strict();
export function parse<T>(schema:z.ZodType<T>,body:unknown):T{
  const result=schema.safeParse(body);if(!result.success){const errors:Record<string,string>={};for(const issue of result.error.issues)errors[issue.path.join('.')]=issue.message;throw new ApiError(422,'VALIDATION','Kiểm tra thông tin trong biểu mẫu.',errors);}return result.data;
}
export const registerSchema=z.object({name:z.string().trim().min(2).max(80),phone:z.string().regex(/^\+[1-9]\d{8,14}$/),username:z.string().regex(/^[a-z0-9._]{4,30}$/),password:z.string().min(12).max(128),terms:z.literal(true)});
