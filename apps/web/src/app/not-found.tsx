import Link from 'next/link';
export default function NotFound(){return <main className="empty" style={{minHeight:'100vh',justifyContent:'center'}}><span className="eyebrow">PLANTCARE · 404</span><h1>Trang này chưa có.</h1><p>Đường dẫn có thể đã thay đổi. Mở lại trang chủ để tiếp tục.</p><Link className="button primary" href="/">Về trang chủ</Link></main>;}
