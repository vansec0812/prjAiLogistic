import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const previous=async file=>JSON.parse(await readFile(file,'utf8').catch(error=>{if(error.code==='ENOENT')return 'null';throw error;}));
const source='source/sen-da/plant.png',target='apps/web/src/data/demo-succulent-photo-v2.json',bytes=await readFile(source),metadata=await sharp(bytes).metadata(),old=await previous(target);
if(old&&old.sourceSha256!==hash(bytes))throw new Error('Plant photo changed: create a new sample version.');
const pixels=await sharp(bytes).rotate().flatten({background:'#ffffff'}).resize(24,24,{fit:'fill'}).removeAlpha().toColourspace('srgb').raw().toBuffer();
await writeFile(target,JSON.stringify({id:'sen-da-20261023-v2',source,sourceSha256:hash(bytes),width:metadata.width,height:metadata.height,size:24,pixelsBase64:pixels.toString('base64')},null,2)+'\n');
const manifest='apps/web/src/data/succulent-demo-photos.json',existing=await previous(manifest)||[],photos=[];
for(const alternative of ['pa1','pa2']){
  const folder=`apps/web/public/photos/packing-demo/sen-da/v1/${alternative}`;
  await mkdir(folder,{recursive:true});
  for(let step=1;step<=4;step++){
    const source=`source/sen-da/${alternative}/${step}.png`,original=await readFile(source),old=existing.find(p=>p.source===source);
    if(old&&old.sourceSha256!==hash(original))throw new Error('Packing photo changed: create a new asset version.');
    const image=`/photos/packing-demo/sen-da/v1/${alternative}/step-${step}.webp`,delivery=await sharp(original).rotate().webp({quality:90,effort:6}).toBuffer();
    await writeFile(`apps/web/public${image}`,delivery);
    photos.push({alternative:alternative.toUpperCase(),step,source,image,sourceSha256:hash(original),sha256:hash(delivery)});
  }
}
await writeFile(manifest,JSON.stringify(photos,null,2)+'\n');
console.log('Prepared succulent fingerprint and eight full-frame packing photos.');
