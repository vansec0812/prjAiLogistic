import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
const root='apps/web/public/photos',assets=[];
for(const name of ['hero',...Array.from({length:6},(_,i)=>'step-'+(i+1))]){
  const original=fs.readFileSync(path.join(root,name+'-v2.png'));
  const display=await sharp(original).resize({width:1536,withoutEnlargement:true}).webp({quality:86}).toBuffer();
  fs.writeFileSync(path.join(root,name+'-v2.webp'),display);
  assets.push({id:name+'-v2',originalPath:'/photos/'+name+'-v2.png',displayPath:'/photos/'+name+'-v2.webp',originalSha256:createHash('sha256').update(original).digest('hex'),displaySha256:createHash('sha256').update(display).digest('hex'),displayBytes:display.length,provenance:'GENERATED_WITH_BUILT_IN_IMAGEGEN',modelId:'NOT_EXPOSED_BY_TOOL',createdAt:'2026-10-15',style:'PHOTOREALISTIC',depictedPlant:'Generic golden pothos / Epipremnum aureum',scope:'FOLIAGE_REFERENCE_ONLY',expertApproval:'UNREVIEWED',isShipmentEvidence:false});
}
fs.writeFileSync(path.join(root,'manifest-v2.json'),JSON.stringify({version:'photo-library-20261015-v2',notice:'AI-generated generic demonstration; not actual user plant/parcel and not technical approval.',assets},null,2)+'\n');
console.log('Seven originals retained; display WebP total '+assets.reduce((sum,a)=>sum+a.displayBytes,0)+' bytes.');
