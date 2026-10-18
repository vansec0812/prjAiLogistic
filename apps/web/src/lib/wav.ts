/** Parse playable PCM WAV structure, including optional chunks. */
export function validWav(bytes:Uint8Array):boolean{
  if(bytes.byteLength<46)return false;const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),tag=(p:number)=>String.fromCharCode(...bytes.subarray(p,p+4));
  if(tag(0)!=='RIFF'||tag(8)!=='WAVE'||view.getUint32(4,true)+8>bytes.byteLength)return false;
  let format=false,data=false,block=0;
  for(let at=12;at+8<=bytes.byteLength;){const size=view.getUint32(at+4,true),end=at+8+size;if(end>bytes.byteLength)return false;
    if(tag(at)==='fmt '){if(size<16)return false;const code=view.getUint16(at+8,true),channels=view.getUint16(at+10,true),rate=view.getUint32(at+12,true),bits=view.getUint16(at+22,true);block=view.getUint16(at+20,true);if(code!==1||channels<1||channels>2||rate<8000||rate>96000||![8,16,24,32].includes(bits)||block!==channels*bits/8||view.getUint32(at+16,true)!==rate*block)return false;format=true;}
    if(tag(at)==='data'){if(!format||size<block||size%block!==0)return false;data=true;}
    at=end+(size%2);
  }return format&&data;
}
