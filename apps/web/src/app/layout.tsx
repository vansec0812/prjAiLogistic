import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'PlantCare · Mỗi cây một hành trình',description:'Chuẩn bị cây, vật tư và hành trình. Tạo hướng dẫn đóng gói có hình, có giải thích và có lịch sử.',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi" data-scroll-behavior="smooth"><body>{children}</body></html>;}
