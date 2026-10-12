import { PlantCareApp } from '@/components/app';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
export default async function Page({params}:{params:Promise<{path?:string[]}>}){
  const {path=[]}=await params;
  if(path.length&&!['app','admin','login','register','verify-phone','reset-password','shared','guides'].includes(path[0]))notFound();
  return <Suspense fallback={<main className="loading-screen">Đang mở PlantCare…</main>}><PlantCareApp/></Suspense>;
}
