export const PRONUNCIATION_VERSION='vi-sop-20261018-v1';
const digits=['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín'];
/** Deterministic speech rendering; SOP text and numeric values remain unchanged. */
export function vietnameseSpeechText(value:string):string{
  return value.normalize('NFC')
    .replace(/(\d)\s*[–—]\s*(?=-?\d)/g,'$1 đến ')
    .replace(/(\d)\s*-\s*(?=-?\d)/g,'$1 đến ')
    .replace(/(^|[\s(])-(?=\d)/g,'$1âm ')
    .replace(/(\d)[.,](\d+)/g,(_,whole:string,fraction:string)=>whole+' phẩy '+[...fraction].map(d=>digits[Number(d)]).join(' '))
    .replace(/≤\s*(?=\d)/g,'nhỏ hơn hoặc bằng ').replace(/≥\s*(?=\d)/g,'lớn hơn hoặc bằng ')
    .replace(/<\s*(?=\d)/g,'nhỏ hơn ').replace(/>\s*(?=\d)/g,'lớn hơn ')
    .replace(/(\d)\s*[×x]\s*(?=\d)/g,'$1 nhân ')
    .replace(/\bcm\b/g,'xen ti mét').replace(/\bmm\b/g,'mi li mét').replace(/\bkg\b/g,'ki lô gam')
    .replace(/°\s*C\b/g,'độ C').replace(/\bSOP\b/g,'quy trình').replace(/\bAI\b/g,'trợ lý')
    .replace(/\s+/g,' ').trim();
}
