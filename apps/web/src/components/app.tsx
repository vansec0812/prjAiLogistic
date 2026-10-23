'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, LayoutDashboard, Plus, Clock3, Package, Bookmark, Bell, LifeBuoy, Settings, LogOut, Search, Menu, ChevronRight, ArrowUpRight, ArrowRight, Leaf, ShieldCheck, Sprout, Check, Sun, Camera, Ruler, Truck, X } from 'lucide-react';
import { SessionContext, type Session, api, Logo, Spinner, Alert, useSession, useLoad, PageHeading, Badge, date, ArrowLink } from './common';
import type { CaseRecord } from '@plantcare/domain';
import { AuthPage } from './auth';
import { KnowledgePage } from './knowledge';
import { MvpWizard, MvpResults } from './mvp-flow';
import { MvpPostCheckPage } from './mvp-postcheck';
import { MvpAdmin } from './mvp-admin';
import { CaseGuidedPacking } from './live-packing';
import { Wizard, JobPage, PlanPage, SharedPage } from './packing';
import { HistoryPage, MaterialsPage, TemplatesPage, NotificationsPage, SupportPage, SettingsPage, GuidesPage, AdminPage } from './secondary';

const menu=[
  {href:'/app',label:'Tổng quan',icon:LayoutDashboard},
  {href:'/app/new',label:'Tạo hồ sơ',icon:Camera},
  {href:'/app/history',label:'Lịch sử',icon:Clock3},
  {href:'/app/materials',label:'Kho vật tư',icon:Package},
  {href:'/app/templates',label:'Mẫu đóng gói',icon:Bookmark},
  {href:'/app/knowledge',label:'Tri thức có nguồn',icon:BookOpen}
];
export function PlantCareApp(){
  const [session,setSession]=useState<Session>({user:null,csrf:null,development:false,aiConfigured:false}),[ready,setReady]=useState(false),[message,setMessage]=useState('');const pathname=usePathname();
  const refresh=async()=>{try{setSession(await api<Session>('session'));}finally{setReady(true);}};
  useEffect(()=>{void refresh();},[]);useEffect(()=>{if(!message)return;const t=setTimeout(()=>setMessage(''),5000);return()=>clearTimeout(t);},[message]);
  let content:ReactNode;
  if(pathname.startsWith('/shared/'))content=<SharedPage token={pathname.split('/')[2]}/>;
  else if(['/login','/register','/verify-phone','/reset-password'].includes(pathname))content=<AuthPage key={pathname}/>;
  else if(pathname.startsWith('/guides'))content=<GuidesPage slug={pathname.split('/')[2]}/>;
  else if(pathname.startsWith('/app')||pathname.startsWith('/admin')){
    if(!ready)content=<Spinner/>;
    else if(!session.user)content=<AuthPage/>;
    else content=<Shell><AppRoute pathname={pathname}/></Shell>;
  }else content=<Landing/>;
  return <SessionContext.Provider value={{session,refresh,toast:setMessage}}>{content}{message&&<div className="toast" role="status"><Check size={19}/>{message}<button aria-label="Đóng thông báo" onClick={()=>setMessage('')}><X size={16}/></button></div>}</SessionContext.Provider>;
}
function AppRoute({pathname}:{pathname:string}){
  if(pathname==='/app/live-packing')return <NewCase/>;
  const p=pathname.split('/').filter(Boolean);
  if(pathname==='/admin/mvp')return <MvpAdmin/>;
  if(pathname.startsWith('/admin'))return <AdminPage section={p[1]||'rules'}/>;
  if(p[1]==='new')return <NewCase/>;
  if(p[1]==='knowledge')return <KnowledgePage/>;
  if(p[1]==='cases'){
    if(['instructions','options'].includes(p[3]))return <MvpResults key={p[2]} caseId={p[2]}/>;
    if(p[3]==='postcheck')return <MvpPostCheckPage key={p[2]} caseId={p[2]}/>;
    if(['plant','shipment','materials','review'].includes(p[3])||!p[3])return <MvpWizard key={p[2]} caseId={p[2]} stage={p[3]==='plant'||!p[3]?'plant':'shipment'}/>;
    if(p[3]==='guide')return <CaseGuidedPacking key={p[2]} caseId={p[2]}/>;
    if(p[3]==='compare')return <MvpResults key={p[2]} caseId={p[2]}/>;
    if(['plans','steps','checklist','versions','compare'].includes(p[3]))return <PlanPage key={pathname} caseId={p[2]} mode={p[3]}/>;
    return <Wizard key={p[2]} caseId={p[2]} stage={p[3]||'plant'}/>;
  }
  if(p[1]==='jobs')return <JobPage id={p[2]}/>;
  if(p[1]==='history')return <HistoryPage/>;
  if(p[1]==='materials')return <MaterialsPage/>;
  if(p[1]==='templates')return <TemplatesPage/>;
  if(p[1]==='notifications')return <NotificationsPage/>;
  if(p[1]==='support')return <SupportPage/>;
  if(p[1]==='settings')return <SettingsPage/>;
  return <Dashboard/>;
}
function Shell({children}:{children:ReactNode}){
  const {session,refresh}=useSession(),router=useRouter(),pathname=usePathname();const [open,setOpen]=useState(false),[q,setQ]=useState('');
  useEffect(()=>setOpen(false),[pathname]);
  const nav=(item:typeof menu[number])=><Link key={item.href} href={item.href} className={`nav-item ${pathname===item.href||(item.href==='/app/new'&&pathname.includes('/cases/')&&!pathname.includes('/plans'))?'active':''}`}><item.icon size={19} strokeWidth={1.7}/>{item.label}{item.href==='/app/new'&&<span className="nav-plus">+</span>}</Link>;
  return <div className="app-shell">
    {open&&<div className="sidebar-scrim" onClick={()=>setOpen(false)}/>}
    <aside className={`sidebar ${open?'open':''}`}><Logo/><span className="workspace-label">KHÔNG GIAN NHÀ VƯỜN</span><nav>{menu.map(nav)}</nav><div className="nav-divider"/><nav>
      {nav({href:'/app/notifications',label:'Thông báo',icon:Bell})}{nav({href:'/app/support',label:'Hỗ trợ',icon:LifeBuoy})}{nav({href:'/app/settings',label:'Tài khoản',icon:Settings})}
      {['ADMIN','EXPERT'].includes(session.user?.role||'')&&nav({href:'/admin/mvp',label:'Cấu hình MVP',icon:ShieldCheck})}
      {session.user?.role==='ADMIN'&&nav({href:'/admin',label:'Quản trị',icon:ShieldCheck})}
    </nav>
    <div className="sidebar-bottom"><div className="garden-note"><span><Sprout size={19}/> Chăm chút từng hành trình</span><p>Một hướng dẫn rõ ràng giúp bạn chuẩn bị tốt hơn.</p><Link href="/guides">Khám phá thư viện <ArrowUpRight size={15}/></Link></div><button className="logout" onClick={async()=>{await api('auth/logout',{method:'POST',body:'{}'},session.csrf);await refresh();router.push('/');}}><LogOut size={17}/>Đăng xuất</button><div className="sidebar-foot"><span className="live-dot"/> PlantCare</div></div></aside>
    <div className="workspace"><header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" aria-label="Mở menu" onClick={()=>setOpen(!open)}><Menu size={22}/></button><Leaf size={17}/><span>Không gian của bạn</span><ChevronRight size={14}/><strong>{menu.find(m=>m.href===pathname)?.label||'Hồ sơ đóng gói'}</strong></div><div className="top-actions"><form className="top-search" onSubmit={e=>{e.preventDefault();router.push('/app/history?q='+encodeURIComponent(q));}}><Search size={16}/><input aria-label="Tìm hồ sơ" placeholder="Tìm hồ sơ của bạn…" value={q} onChange={e=>setQ(e.target.value)}/><kbd>↵</kbd></form><Link href="/app/notifications" className="icon-button bell-button" aria-label="Thông báo"><Bell size={19}/></Link><Link href="/app/settings" className="avatar" aria-label="Tài khoản">{session.user?.name.charAt(0).toUpperCase()}</Link></div></header>

    <main className="main-content" id="main">{children}</main><footer className="app-footer"><span>© 2026 PlantCare</span><span><ShieldCheck size={13}/>Hồ sơ và ảnh của bạn được lưu riêng tư</span><Link href="/guides">Hướng dẫn sử dụng <ArrowUpRight size={13}/></Link></footer></div>
  </div>;
}
export function PublicHeader(){return <header className="public-header"><Logo/><nav><Link href="/#how-it-works">Cách sử dụng</Link><Link href="/guides">Thư viện</Link><Link href="/login">Đăng nhập</Link><Link className="button primary small" href="/app/new">Tạo hồ sơ <ArrowUpRight size={16}/></Link></nav></header>;}
function Landing(){
  const {session,refresh}=useSession(),router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const demo=async()=>{setBusy(true);try{await api('auth/dev',{method:'POST',body:'{}'});await refresh();router.push('/app');}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  return <div className="landing"><PublicHeader/><main>
    <section className="landing-hero"><div className="landing-copy"><span className="pill"><span className="live-dot"/>DÀNH CHO NHÀ VƯỜN & NGƯỜI BÁN CÂY</span><h1>Gửi một chút xanh.<br/><span>Trao một chút an tâm.</span></h1><p>Mỗi cây có một hành trình riêng. Chuẩn bị đúng dữ liệu, chọn vật tư phù hợp và đóng gói từng bước với PlantCare.</p><div className="button-row"><Link href="/app/new" className="button primary">Bắt đầu đóng gói <ArrowUpRight size={19}/></Link><Link href="/guides" className="button subtle">Khám phá hướng dẫn <ArrowRight size={17}/></Link></div><div className="landing-assurances"><span><Check size={16}/>Hướng dẫn có hình</span><span><Check size={16}/>Dữ liệu riêng tư</span><span><Check size={16}/>Có thể nhập tay</span></div>{(!session.user||session.development)&&<button className="demo-link" disabled={busy} onClick={demo}>{busy?'Đang mở…':'Khám phá bản dùng thử trực tiếp'} <ArrowRight size={15}/></button>}{error&&<Alert kind="error">{error}</Alert>}</div><div className="landing-art"><div className="hero-orbit"/><img src="/photos/hero-v2.webp" alt="Ảnh minh họa AI cây trong chậu và hộp chuẩn bị cho hành trình"/><div className="floating-note note-top"><ShieldCheck size={22}/><div><strong>Chuẩn bị có cơ sở</strong><span>Dữ liệu thực · quy tắc rõ ràng</span></div></div><div className="floating-note note-bottom"><span className="mini-leaf"><Leaf size={20}/></span><div><strong>Từng bước, từng chút xanh</strong><span>Ảnh minh họa AI · checklist</span></div></div></div></section>
    <section className="trust-band"><span>MỘT HÀNH TRÌNH ĐƯỢC CHUẨN BỊ TỐT</span><div><Ruler size={19}/>Số đo bạn xác nhận</div><div><Package size={19}/>Hai phương án từ danh mục</div><div><Truck size={19}/>Bối cảnh bạn khai báo</div><div><ShieldCheck size={19}/>Quy tắc có giải thích</div></section>
    <section className="how-section" id="how-it-works"><div className="section-title"><div><span className="eyebrow">TỪ VƯỜN ĐẾN MỘT NƠI MỚI</span><h2>Đóng gói rõ ràng hơn,<br/>chỉ qua ba bước.</h2></div><p>PlantCare giúp bạn biến thông tin cây, vật tư và hành trình thành hướng dẫn dễ thực hiện.</p></div><div className="how-grid">{[
      {icon:Camera,title:'Chụp ảnh & xác nhận',text:'Chụp hoặc nhập tay. Đo và cân thực tế để xác nhận thông tin cây, chậu.'},
      {icon:Package,title:'Nhập hành trình & chọn phương án',text:'Xác nhận hành trình, so sánh vật tư và chi phí của hai phương án.'},
      {icon:Check,title:'Làm theo từng bước',text:'Xem hình, làm theo hướng dẫn, hậu kiểm rồi lưu hồ sơ.'}
    ].map((item,i)=><article key={item.title}><span className="how-number">0{i+1}</span><div className="feature-icon"><item.icon size={27}/></div><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></section>
    <section className="landing-guides"><div className="section-title"><div><span className="eyebrow">THƯ VIỆN PLANTCARE</span><h2>Một chút chuẩn bị,<br/>rất nhiều khác biệt.</h2></div><ArrowLink href="/guides">Xem tất cả hướng dẫn</ArrowLink></div><GuideCards/></section>
    <section className="landing-cta"><div><Leaf size={30}/><h2>Sẵn sàng cho hành trình của cây?</h2><p>Bắt đầu bằng một hồ sơ. Lưu nháp và bổ sung khi bạn đã sẵn sàng.</p></div><Link href="/app/new" className="button cream">Tạo hồ sơ đầu tiên <ArrowUpRight size={18}/></Link></section>
  </main><footer className="public-footer"><Logo/><p>Hướng dẫn tham khảo. Luôn kiểm tra yêu cầu của nhà vận chuyển.</p><span>© 2026 PlantCare</span></footer></div>;
}
export function GuideCards(){return <div className="guide-grid">{[{slug:'cach-do-cay-va-chau',title:'Đo đúng, đóng gói phù hợp',category:'CHUẨN BỊ',step:1},{slug:'kiem-tra-hop',title:'Chiếc hộp vừa vặn cho cây',category:'VẬT TƯ',step:4},{slug:'hieu-boi-canh-hanh-trinh',title:'Hiểu bối cảnh hành trình',category:'HÀNH TRÌNH',step:6}].map(a=><Link key={a.slug} className="guide-card" href={'/guides/'+a.slug}><div className="guide-image"><img src={`/illustrations/step-${a.step}.svg`} alt="Sơ đồ minh họa hướng dẫn"/><span className="guide-arrow"><ArrowUpRight size={19}/></span></div><div><span className="eyebrow">{a.category}</span><h3>{a.title}</h3><p>Đọc hướng dẫn <ArrowRight size={15}/></p></div></Link>)}</div>;}
function Dashboard(){
  const {data,error,loading}=useLoad<{items:CaseRecord[];total:number}>('cases?page_size=100');const cases=data?.items||[];
  const ready=cases.filter(c=>['PLAN_READY','PACKING','PACKED','SHIPPED','RECEIVED'].includes(c.status)).length,drafts=cases.filter(c=>c.status==='DRAFT').length,needs=cases.filter(c=>['NEEDS_INPUT','NEEDS_EXPERT'].includes(c.status)).length;
  return <>
    <PageHeading eyebrow="CHÀO NGÀY MỚI, NHÀ VƯỜN" title="Hôm nay, bạn gửi cây gì?" description="Chăm chút từ khâu chuẩn bị, để mỗi hành trình bắt đầu tốt hơn." action={<span className="today"><Sun size={18}/>{new Intl.DateTimeFormat('vi-VN',{dateStyle:'long',timeZone:'Asia/Ho_Chi_Minh'}).format(new Date())}</span>}/>
    <section className="dashboard-hero"><div><span className="eyebrow">MỘT HỒ SƠ · MỘT CÂY · MỘT HÀNH TRÌNH</span><h2>Gửi một chút xanh,<br/>đến một nơi mới.</h2><p>Chuẩn bị cây, vật tư và hành trình.<br/>PlantCare đồng hành cùng bạn ở từng bước.</p><Link className="button cream" href="/app/new"><Plus size={18}/>Tạo hồ sơ mới <ArrowUpRight size={18}/></Link></div><img src="/photos/hero-v2.webp" alt="Ảnh minh họa AI cây xanh được chuẩn bị bên hộp đóng gói"/><div className="hero-label"><span className="hero-label-icon"><Leaf size={19}/></span>Chuẩn bị tốt hơn<br/><small>Ảnh minh họa AI</small></div></section>
    <div className="stats-grid">{[{title:'Nháp đang làm',value:drafts,icon:Bookmark,detail:'Tiếp tục khi bạn sẵn sàng',class:'sage'},{title:'Đã có phương án',value:ready,icon:Package,detail:'Hướng dẫn lưu trong hồ sơ',class:'green'},{title:'Cần bổ sung / kiểm tra',value:needs,icon:ShieldCheck,detail:'Hoàn thiện dữ liệu trước khi đóng gói',class:'sand'}].map(stat=><div className="stat-card" key={stat.title}><div><p>{stat.title}</p><strong>{loading?'—':String(stat.value).padStart(2,'0')}</strong><span>{stat.detail}</span></div><span className={`stat-icon ${stat.class}`}><stat.icon size={22}/></span></div>)}</div>
    <div className="dashboard-grid"><section className="panel recent-panel"><div className="panel-heading"><div><h2>Hồ sơ gần đây</h2><p>Một nơi cho mọi hành trình của cây.</p></div><ArrowLink href="/app/history">Xem tất cả</ArrowLink></div>{error&&<Alert kind="error">{error}</Alert>}{loading?<Spinner/>:cases.length?<CaseTable cases={cases.slice(0,5)}/>:<div className="onboarding-empty"><Sprout size={35}/><h3>Hành trình đầu tiên bắt đầu tại đây</h3><p>Tạo hồ sơ để chuẩn bị cây và chọn hộp phù hợp.</p><Link className="button primary" href="/app/new">Tạo hồ sơ <Plus size={16}/></Link></div>}<div className="table-footer"><ShieldCheck size={14}/>Chỉ bạn và người được cấp quyền mới xem được hồ sơ.</div></section><aside className="dashboard-aside"><section className="prep-card"><span className="eyebrow">TRƯỚC KHI BẮT ĐẦU</span><h3>Chuẩn bị một chút nhé.</h3><p>Ba điều giúp hồ sơ của bạn đầy đủ hơn.</p><div className="prep-item"><span>01</span><div><strong>Thước đo & cân</strong><small>Đo cây, chậu và cân thực tế</small></div><Ruler size={18}/></div><div className="prep-item"><span>02</span><div><strong>Hộp & vật tư</strong><small>Biết kích thước trong, tải trọng</small></div><Package size={18}/></div><div className="prep-item"><span>03</span><div><strong>Thông tin hành trình</strong><small>Nơi đi, nơi đến và nguồn nhiệt độ</small></div><Truck size={18}/></div><ArrowLink href="/guides/cach-do-cay-va-chau">Xem hướng dẫn chuẩn bị</ArrowLink></section><section className="tip-card"><span className="tip-icon"><Leaf size={19}/></span><div><strong>Một mẹo nhỏ</strong><p>Đo khoảng trống bên trong hộp, thay vì kích thước bên ngoài.</p><Link href="/guides/kiem-tra-hop">Vì sao cần đo? <ArrowUpRight size={14}/></Link></div></section></aside></div>
    <section className="dashboard-guides"><div className="panel-heading"><div><span className="eyebrow">GÓC NHÀ VƯỜN</span><h2>Hướng dẫn dành cho bạn</h2></div><ArrowLink href="/guides">Thư viện hướng dẫn</ArrowLink></div><GuideCards/></section>
  </>;
}
export function CaseTable({cases}:{cases:CaseRecord[]}){return <div className="table-wrap"><table className="case-table"><thead><tr><th>HỒ SƠ / CÂY</th><th>HÀNH TRÌNH</th><th>TRẠNG THÁI</th><th>CẬP NHẬT</th><th/></tr></thead><tbody>{cases.map((c,i)=><tr key={c.id}><td><Link className="case-name" href={`/app/cases/${c.id}/${c.status==='DRAFT'?(c.input.plant.confirmed?'shipment':'plant'):c.flow==='MVP'?'options':'plans'}`}><span className={`plant-thumb thumb-${i%3}`}><Sprout size={23}/></span><span><strong>{c.name}</strong><small>{c.demo?'Mẫu phát triển · ':''}{c.input.plant.name||'Chưa nhập cây'} · #{c.id.slice(0,6).toUpperCase()}</small></span></Link></td><td><span className="route-cell">{c.input.shipment.origin||'Chưa khai báo'}{c.input.shipment.destination&&<><ArrowRight size={12}/>{c.input.shipment.destination}</>}</span></td><td><Badge status={c.status}/></td><td className="muted nowrap">{date(c.updatedAt)}</td><td><Link className="icon-button" aria-label={'Mở '+c.name} href={`/app/cases/${c.id}/${c.status==='DRAFT'?(c.input.plant.confirmed?'shipment':'plant'):c.flow==='MVP'?'options':'plans'}`}><ArrowUpRight size={18}/></Link></td></tr>)}</tbody></table></div>;}
function NewCase(){
  const {session}=useSession(),router=useRouter();const [name,setName]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const create=async(sample=false)=>{setBusy(true);setError('');try{const c=await api<CaseRecord>('cases',{method:'POST',body:JSON.stringify({name:sample?(name.trim()||'Hồ sơ thử nghiệm mới'):name,sample})},session.csrf);router.push(`/app/cases/${c.id}/plant`);}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  return <><PageHeading eyebrow="HÀNH TRÌNH MỚI" title="Tạo hồ sơ đóng gói" description="Xác nhận cây, nhập hành trình, chọn phương án và đóng gói từng bước."/><div className="new-case-grid"><section className="panel new-case-form"><span className="feature-icon"><Sprout size={28}/></span><h2>Bắt đầu từ một cái tên</h2><p>Đặt tên để dễ tìm lại hồ sơ của bạn.</p><form onSubmit={e=>{e.preventDefault();void create();}}><label className="field"><span>Tên hồ sơ <span className="required">*</span></span><input autoFocus minLength={2} maxLength={120} required placeholder="Ví dụ: Trầu bà gửi Đà Nẵng" value={name} onChange={e=>setName(e.target.value)}/></label>{error&&<Alert kind="error">{error}</Alert>}<button className="button primary wide" disabled={busy}>{busy?'Đang tạo…':'Tạo hồ sơ'}<ArrowRight size={18}/></button></form>{session.development&&<button className="text-link sample-action" disabled={busy} onClick={()=>create(true)}>Hoặc tạo hồ sơ mẫu <ArrowUpRight size={16}/></button>}</section><section className="new-case-illustration"><img src="/photos/hero-v2.webp" alt="Cây xanh và hộp đóng gói"/><h3>Chăm chút từng chút xanh.</h3><p>Đo thực tế. Xác nhận vật tư.<br/>Hiểu bối cảnh. Làm từng bước.</p><span><ShieldCheck size={16}/>Hồ sơ của bạn mặc định riêng tư</span></section></div></>;
}
