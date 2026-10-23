import sharp from 'sharp';
import reference from '../data/demo-plant-photo.json';
import succulentReference from '../data/demo-succulent-photo-v2.json';

/** Recognize copies of the supplied photo, not arbitrary plants with similar foliage. */
async function matchesPhoto(bytes:Buffer,reference:typeof succulentReference):Promise<boolean>{
  try{
    const image=sharp(bytes,{limitInputPixels:30000000}),meta=await image.metadata();
    if(!meta.width||!meta.height||(meta.pages||1)>1)return false;
    const rotated=!!meta.orientation&&meta.orientation>=5;
    const ratio=rotated?meta.height/meta.width:meta.width/meta.height;
    if(Math.abs(Math.log(ratio/(reference.width/reference.height)))>0.025)return false;
    const pixels=await image.rotate().flatten({background:'#ffffff'}).resize(reference.size,reference.size,{fit:'fill'}).removeAlpha().toColourspace('srgb').raw().toBuffer(),expected=Buffer.from(reference.pixelsBase64,'base64');
    if(pixels.length!==expected.length)return false;
    let total=0,outliers=0;for(let i=0;i<pixels.length;i++){const d=Math.abs(pixels[i]-expected[i]);total+=d;if(d>20)outliers++;}
    return total/pixels.length<=5&&outliers/pixels.length<=0.03;
  }catch{return false;}
}
export async function identifyDemoPlantPhoto(bytes:Buffer):Promise<string|null>{
  for(const photo of [reference,succulentReference])if(await matchesPhoto(bytes,photo))return photo.id;
  return null;
}
export async function matchesDemoPlantPhoto(bytes:Buffer):Promise<boolean>{
  return (await identifyDemoPlantPhoto(bytes))===reference.id;
}
