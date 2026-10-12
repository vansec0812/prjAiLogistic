import type { NextConfig } from 'next';
import path from 'node:path';
const config: NextConfig = {
  distDir: process.env.PLANTCARE_BUILD_DIR || '.next',
  devIndicators: false,
  turbopack: { root: path.resolve(__dirname, '../..') },
  serverExternalPackages: ['sharp', 'bcryptjs', 'pdf-lib', '@pdf-lib/fontkit'],
  async headers() {
    return [{source:'/(.*)',headers:[
      {key:'X-Content-Type-Options',value:'nosniff'},
      {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
      {key:'X-Frame-Options',value:'DENY'},
      {key:'Permissions-Policy',value:'camera=(self), microphone=(), geolocation=()'},
      {key:'Content-Security-Policy',value:`default-src 'self'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV==='production'?'':" 'unsafe-eval'"}; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'`}
    ]}];
  }
};
export default config;
