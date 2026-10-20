import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import type { LiveStep } from '../lib/live-packing';
import { demoPhotoByPath } from '../lib/demo-packing';

export async function packingReferenceParts(step:LiveStep){
  const ref=step.reference_image;
  if(!ref)return [];
  // Exact immutable manifest membership, never a client URL or filesystem path.
  const photo=demoPhotoByPath.get(ref.path);
  if(!photo||photo.sha256!==ref.sha256)throw new Error('PACKING_REFERENCE_INVALID');
  const root=process.cwd().endsWith(path.join('apps','web'))?process.cwd():path.join(process.cwd(),'apps','web');
  const bytes=await readFile(path.join(root,'public',photo.image.slice(1)));
  if(createHash('sha256').update(bytes).digest('hex')!==ref.sha256)throw new Error('PACKING_REFERENCE_CHANGED');
  return [{text:'ẢNH MẪU THAM KHẢO của bước đang làm. Đây KHÔNG phải ảnh người dùng thực hiện, không dùng làm bằng chứng đạt.'},{inlineData:{mimeType:'image/webp',data:bytes.toString('base64')}}];
}
