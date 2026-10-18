import type { NextConfig } from 'next';
import path from 'node:path';
const {backendOrigin}=require(path.join(__dirname,'deployment.cjs')) as typeof import('./deployment.cjs');
const upstream=backendOrigin(process.env);
const config: NextConfig = {
  distDir: process.env.PLANTCARE_BUILD_DIR || '.next',
  devIndicators: false,
  turbopack: { root: path.resolve(__dirname, '../..') },
  serverExternalPackages: ['sharp', 'bcryptjs', 'pdf-lib', '@pdf-lib/fontkit'],
  async rewrites(){return {beforeFiles:upstream?[{source:'/api/v1/:path*',destination:upstream+'/api/v1/:path*'}]:[],afterFiles:[],fallback:[]};},
  async headers() {
    return [{source:'/api/v1/:path*',headers:[{key:'Cache-Control',value:'private, no-store'},{key:'x-vercel-enable-rewrite-caching',value:'0'}]},{source:'/(.*)',headers:[
      {key:'X-Content-Type-Options',value:'nosniff'},
      {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
      {key:'X-Frame-Options',value:'DENY'},
      {key:'Permissions-Policy',value:'camera=(self), microphone=(self), geolocation=()'},
      {key:'Content-Security-Policy',value:`default-src 'self'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV==='production'?'':" 'unsafe-eval'"}; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'`}
    ]}];
  }
};
export default config;
