import type { NextRequest } from 'next/server';
import { handle } from '@/server/api';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function dispatch(req:NextRequest,context:{params:Promise<{route:string[]}>}){
  const response=await handle(req,(await context.params).route);
  response.headers.set('Cache-Control','private, no-store');
  response.headers.set('x-vercel-enable-rewrite-caching','0');
  return response;
}
export { dispatch as GET, dispatch as POST, dispatch as PATCH, dispatch as DELETE };
