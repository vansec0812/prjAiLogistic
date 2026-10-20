import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
const source='source/cayphuquy.jpg',target='apps/web/src/data/demo-plant-photo.json',bytes=await readFile(source),metadata=await sharp(bytes).rotate().metadata(),sourceSha256=createHash('sha256').update(bytes).digest('hex');
const previous=JSON.parse(await readFile(target,'utf8').catch(error=>{if(error.code==='ENOENT')return 'null';throw error;}));
if(previous&&previous.sourceSha256!==sourceSha256)throw new Error('Demo photo changed: create a new sample version.');
const pixels=await sharp(bytes).rotate().flatten({background:'#ffffff'}).resize(24,24,{fit:'fill'}).removeAlpha().toColourspace('srgb').raw().toBuffer();
await writeFile(target,JSON.stringify({id:'phu-quy-red-20261020-v1',source,sourceSha256,width:metadata.width,height:metadata.height,size:24,pixelsBase64:pixels.toString('base64')},null,2)+'\n');
console.log('Prepared Phu quy demo fingerprint; original unchanged.');
