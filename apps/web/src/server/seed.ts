import { randomUUID } from 'node:crypto';
import { hashSync } from 'bcryptjs';
import type { CaseInput, CaseRecord, MaterialInput } from '@plantcare/domain';
import { emptyInput } from '@plantcare/domain';
import { db, doc, insertDoc, development } from './db';
import type { User } from './security';

export const sampleInput=():CaseInput=>({
  plant:{name:'Trầu bà xanh',group:'FOLIAGE',height:55,length:30,width:30,potDiameter:18,potHeight:16,weight:3.2,fragility:'MEDIUM',potMaterial:'Nhựa',confirmed:true},
  materials:[
    {id:'box',name:'Hộp carton 40 × 40 × 65',category:'BOX',quantity:1,unit:'cái',price:25000,weight:0.5,length:40,width:40,height:65,maxLoad:10,confirmed:true,reusable:false,condition:'GOOD'},
    {id:'padding',name:'Giấy chèn',category:'PADDING',quantity:1,unit:'phần',price:5000,weight:0.15,length:null,width:null,height:null,maxLoad:null,confirmed:true,reusable:true,condition:'GOOD'},
    {id:'fixing',name:'Tấm cố định chậu',category:'FIXING',quantity:1,unit:'cái',price:8000,weight:0.1,length:null,width:null,height:null,maxLoad:null,confirmed:true,reusable:true,condition:'GOOD'},
    {id:'tape',name:'Băng keo',category:'TAPE',quantity:1,unit:'phần',price:null,weight:0.05,length:null,width:null,height:null,maxLoad:null,confirmed:true,reusable:false,condition:'GOOD'},
    {id:'label',name:'Nhãn hướng kiện',category:'LABEL',quantity:1,unit:'cái',price:1000,weight:0.01,length:null,width:null,height:null,maxLoad:null,confirmed:true,reusable:false,condition:'GOOD'}
  ],shipment:{origin:'Hà Nội',destination:'Đà Nẵng',departure:new Date(Date.now()+86400000).toISOString(),duration:36,mode:'Xe tải thường',carrier:'',orientation:'UPRIGHT',minTemp:24,maxTemp:31,weatherSource:'Dữ liệu mẫu phát triển, không phải dự báo thật',confirmed:true,observedAt:new Date().toISOString(),coverage:'ENDPOINTS'},priority:'SAFETY'
});
export function demoUser():User{
  const exists=db().prepare('SELECT id,username,phone,name,status,role FROM users WHERE id=?').get('local-demo') as unknown as User|undefined;
  if(exists)return exists;
  const user={id:'local-demo',username:'local_demo',phone:'+84000000000',name:'Vườn của bạn',status:'ACTIVE',role:'MEMBER'};
  db().prepare('INSERT INTO users VALUES(?,?,?,?,?,?,?,?)').run(user.id,user.username,user.phone,user.name,hashSync(randomUUID()+randomUUID(),12),user.status,user.role,new Date().toISOString());
  const input=sampleInput();
  const plants=[['Trầu bà gửi Đà Nẵng',input],['Sen đá chậu nhỏ',{...emptyInput(),plant:{...emptyInput().plant,name:'Sen đá',group:'SUCCULENT'}}],['Lan hồ điệp cần kiểm tra',{...input,plant:{...input.plant,name:'Lan hồ điệp',group:'FLOWERING',fragility:'HIGH'}}]] as [string,CaseInput][];
  for(const [name,caseInput] of plants){const now=new Date().toISOString(),id=randomUUID();const c:CaseRecord={id,name,version:1,status:'DRAFT',input:caseInput,updatedAt:now,createdAt:now,selectedVersion:null,demo:true};insertDoc('case',id,user.id,c,'DRAFT');}
  for(const material of input.materials){const id=randomUUID();insertDoc('material',id,user.id,{...material,id,stock:6,version:1,updatedAt:new Date().toISOString()} satisfies MaterialInput&{stock:number;version:number;updatedAt:string});}
  return user;
}
