import type { NextRequest } from 'next/server';
import { handle } from '@/server/api';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function dispatch(req:NextRequest,context:{params:Promise<{route:string[]}>}){return handle(req,(await context.params).route);}
export { dispatch as GET, dispatch as POST, dispatch as PATCH, dispatch as DELETE };
