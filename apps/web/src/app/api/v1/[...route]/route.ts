import { after, type NextRequest } from 'next/server';
import { handle } from '@/server/api';
import { runJobs } from '@/server/jobs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=300;
async function dispatch(req:NextRequest,context:{params:Promise<{route:string[]}>}){
  const route=(await context.params).route,response=await handle(req,route);
  if(process.env.VERCEL==='1'&&process.env.PLANTCARE_STORAGE==='postgres'&&response.ok&&route[0]!=='health')after(async()=>{try{await runJobs();}catch{console.error(JSON.stringify({event:'worker_unavailable'}));}});
  response.headers.set('Cache-Control','private, no-store');
  response.headers.set('x-vercel-enable-rewrite-caching','0');
  return response;
}
export { dispatch as GET, dispatch as POST, dispatch as PATCH, dispatch as DELETE };
