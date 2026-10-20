import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';

// Delivery copies only: retain the complete image and caption; never edit originals.
const photos=[];
const manifest='apps/web/src/data/packing-demo-photos.json';
const previous=JSON.parse(await readFile(manifest,'utf8').catch(error=>{if(error.code==='ENOENT')return '[]';throw error;}));
for(const [alternative,count] of [['pa1',6],['pa2',8]]){
  const target=`apps/web/public/photos/packing-demo/v1/${alternative}`;
  await mkdir(target,{recursive:true});
  for(let step=1;step<=count;step++){
    const source=`source/${alternative}/bước ${step}.png`,original=await readFile(source);
    const sourceSha256=createHash('sha256').update(original).digest('hex'),old=previous.find(p=>p.source===source);
    if(old&&old.sourceSha256!==sourceSha256)throw new Error('Source changed: create a new asset version instead of overwriting v1.');
    const image=`/photos/packing-demo/v1/${alternative}/step-${step}.webp`;
    const bytes=await sharp(original).rotate().webp({quality:90,effort:6}).toBuffer();
    await writeFile(path.join(target,`step-${step}.webp`),bytes);
    photos.push({alternative:alternative.toUpperCase(),step,source,image,sourceSha256,sha256:createHash('sha256').update(bytes).digest('hex')});
  }
}
await writeFile(manifest,JSON.stringify(photos,null,2)+'\n');
console.log(`Prepared ${photos.length} full-frame demo photos.`);
