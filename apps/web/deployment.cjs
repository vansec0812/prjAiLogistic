function backendOrigin(env){
  const raw=env.PLANTCARE_BACKEND_URL;
  if(!raw){if(env.VERCEL==='1')throw new Error('PLANTCARE_BACKEND_URL is required on Vercel.');return null;}
  const url=new URL(raw),loopback=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  if(url.username||url.password||url.pathname!=='/'||url.search||url.hash||!(url.protocol==='https:'||url.protocol==='http:'&&loopback&&env.NODE_ENV!=='production'))throw new Error('Backend must be a trusted HTTPS origin without path or credentials.');
  if(env.APP_ORIGIN&&new URL(env.APP_ORIGIN).origin===url.origin)throw new Error('Frontend and backend origins must differ.');
  return url.origin;
}

module.exports={backendOrigin};
