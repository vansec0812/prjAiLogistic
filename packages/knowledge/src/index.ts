import type { EvidenceReference, Group } from '../../domain/src/index';
export const KNOWLEDGE_VERSION='plantcare-evidence-20261015-v2';
export interface KnowledgeSource extends EvidenceReference {kind:'CARRIER'|'MANUFACTURER'|'RESEARCH'|'PLATFORM'|'VIDEO';access:'READ'|'ABSTRACT_ONLY'|'BLOCKED';accessedAt:string;trainingRights:'NOT_CONFIRMED';}
export interface KnowledgeClaim {id:string;sourceId:string;text:string;tags:string[];scope:'POTTED_PLANTS'|'CACTUS'|'CUT_FLOWERS'|'GENERAL_WORKFLOW'|'MARITIME';expertReview:'UNREVIEWED';}
const source=(id:string,title:string,url:string,scope:string,limitation:string,kind:KnowledgeSource['kind']='CARRIER'):KnowledgeSource=>({id,title,url,scope,limitation,kind,access:'READ',accessedAt:'2026-10-15',trainingRights:'NOT_CONFIRMED',reviewStatus:'UNREVIEWED'});
export const sources:KnowledgeSource[]=[
  source('FEDEX','FedEx · Flowers and plants','https://www.fedex.com/en-us/shipping/how-to-ship-flowers-and-plants.html','Hướng dẫn hãng; cây chậu, cây giống và hoa cắt tách riêng','Nguồn US; không coi SLA/giới hạn dịch vụ là quy tắc Việt Nam.'),
  source('EMS','EMS · Hướng dẫn bọc gói cây cảnh','https://ems.com.vn/tin-tuc/tin-dich-vu-moi/huong-dan-boc-goi-hang-cay-canh---dich-vu-ems-cay-canh','EMS cây cảnh, bài 2021-03-16','Cần xác nhận chính sách hiện hành; không nhập ngưỡng 5 kg thành ngưỡng chung.'),
  source('UFP','UFP · Shipping plants safely','https://ufppackaging.com/insights/shipping-plants-safely','Thực hành nhà cung cấp bao bì gửi cây trực tiếp','Bài nhà cung cấp; không có chứng nhận cho kiện của bạn.','MANUFACTURER'),
  source('GHTK','GHTK · Hướng dẫn đóng gói','https://ghtk.vn/blog/cach-dong-goi-hang-hoa-van-chuyen/','Hướng dẫn hãng theo dịch vụ/loại hàng','Không mặc định lớp bọc/giới hạn dịch vụ cho mọi cây.'),
  source('CAYXINH','Cây Xinh · Quy trình gửi cây','https://cayxinh.com.vn/huong-dan-mua-hang/','Thực hành một nhà bán cây','Không chuyển cây nguyên chậu sang rễ trần/tách đất tự động.','MANUFACTURER'),
  source('EUCAP','EU CAP · IN.TRA.VIVA.','https://eu-cap-network.ec.europa.eu/projects/innovations-supply-chain-ornamental-plants-market-packaging-and-transport-nursery-products_en','Dự án cây vườn ươm 2019–2021, mô phỏng container lạnh','8°C/60% thuộc nghiên cứu cụ thể; không áp dụng cây nhiệt đới parcel.','RESEARCH'),
  source('SADEC','Sadec91 · Gói trầu bà thanh xuân','https://sadec91.vn/blog/cach-dong-goi-cay-trau-ba-thanh-xuan-ship-di-xa-khong-hu-mpum','Hướng dẫn thương mại cho trầu bà thanh xuân','Không tự tỉa lá sống/ép tán từ bài thương mại.','MANUFACTURER'),
  source('NTC','Nhà Thương Cây · Giao hàng và đổi trả','https://nhathuongcay.com/chinh-sach-dong-goi-giao-hang-va-doi-tra','Chính sách văn bản; video nhúng chưa xem','Không suy thao tác kỹ thuật từ video chưa xem.','MANUFACTURER'),
  source('SPS','Smart Packaging · Flowers','https://smart-packaging-solutions.com/en/markets/flowers','Giới thiệu vật liệu bao bì hoa/cây','Đặc tính quảng bá không thay thông số hộp được kiểm.','MANUFACTURER'),
  source('RSUTHESIS','Rangsit · Plant packaging thesis (2023)','https://rsuir-library.rsu.ac.th/bitstream/123456789/2769/1/THAPANIT%20PROUGESTAPON.pdf','Các phần thiết kế và thử gửi xương rồng nhỏ, PDF p.37–41','Chưa có protocol shock/load chuẩn hoặc tỷ lệ giảm hư đủ để áp dụng cho cây khác.','RESEARCH'),
  {...source('MDPI','MDPI · AI packing design (2025)','https://www.mdpi.com/2673-2688/6/7/146','Abstract do publisher cung cấp qua Crossref; hàng thương mại','Chưa đọc full text; mô hình RF không được huấn luyện trong PlantCare; không là nghiên cứu cây sống.','RESEARCH'),access:'ABSTRACT_ONLY'}
];
export const claims:KnowledgeClaim[]=[
  {id:'FEDEX-01',sourceId:'FEDEX',text:'Đối với cây chậu, cần giữ giá thể không tràn và kiểm khả năng giữ chậu bên trong kiện.',tags:['chậu','đất','giá thể','soil','pot'],scope:'POTTED_PLANTS',expertReview:'UNREVIEWED'},
  {id:'FEDEX-02',sourceId:'FEDEX',text:'Vách hoặc insert carton có thể giữ chậu; không dùng thân cây làm điểm chịu lực cố định.',tags:['chậu','cố định','carton','insert'],scope:'POTTED_PLANTS',expertReview:'UNREVIEWED'},
  {id:'FEDEX-03',sourceId:'FEDEX',text:'Nhãn hướng lên không bảo đảm kiện luôn giữ chiều; cần xem giới hạn xử lý thực của hãng.',tags:['nhãn','hướng','bàn giao','orientation'],scope:'POTTED_PLANTS',expertReview:'UNREVIEWED'},
  {id:'UFP-01',sourceId:'UFP',text:'Bao bì cần hạn chế cây/chậu xê dịch và phù hợp hình dạng cây; khoảng đệm không được biến thành áp lực lên tán.',tags:['đệm','lá','tán','xê dịch','cố định'],scope:'POTTED_PLANTS',expertReview:'UNREVIEWED'},
  {id:'EMS-03',sourceId:'EMS',text:'EMS mô tả giữ bầu đất, cố định cây/chậu dễ vỡ và tránh nước tự do trong gói.',tags:['bầu','đất','nước','chậu','ẩm'],scope:'POTTED_PLANTS',expertReview:'UNREVIEWED'},
  {id:'EMS-04',sourceId:'EMS',text:'Dịch vụ được mô tả không bảo đảm điều kiện nhiệt/ánh sáng/ẩm đặc biệt xuyên hành trình.',tags:['nhiệt','hành trình','ẩm','nguồn'],scope:'POTTED_PLANTS',expertReview:'UNREVIEWED'},
  {id:'CAYXINH-03',sourceId:'CAYXINH',text:'Hình dạng từng cây khác nhau; ảnh mẫu loại cây không đại diện cây cụ thể trong hồ sơ.',tags:['ảnh','hình','cây','số đo'],scope:'POTTED_PLANTS',expertReview:'UNREVIEWED'},
  {id:'NTC-01',sourceId:'NTC',text:'Ảnh/video khi mở kiện là bằng chứng tình trạng khi nhận trong chính sách của nhà bán, không tự chứng minh nguyên nhân hư hại.',tags:['nhận','mở kiện','ảnh','bằng chứng'],scope:'POTTED_PLANTS',expertReview:'UNREVIEWED'},
  {id:'EUCAP-02',sourceId:'EUCAP',text:'Các nhiệt độ/chỉ số xếp tải của dự án mô phỏng container không là ngưỡng chung cho cây nhiệt đới trong parcel.',tags:['nhiệt','container','ngưỡng','8°C'],scope:'MARITIME',expertReview:'UNREVIEWED'},
  {id:'RSUTHESIS-01',sourceId:'RSUTHESIS',text:'Luận văn thiết kế khay khóa chậu và tấm giữ đất cho hộp xương rồng; thiết kế này có phạm vi mẫu riêng, không thay phép kiểm fit/load của hộp đang có.',tags:['xương rồng','khay','khóa','chậu','đất'],scope:'CACTUS',expertReview:'UNREVIEWED'},
  {id:'RSUTHESIS-02',sourceId:'RSUTHESIS',text:'Thử gửi của luận văn mô tả cây ổn định và đất không tràn khi nhận; chưa đủ để suy tỷ lệ giảm hư hoặc bảo đảm mọi tuyến gửi.',tags:['xương rồng','thử gửi','nhận','bằng chứng','hư'],scope:'CACTUS',expertReview:'UNREVIEWED'}
];
const words=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').split(/[^a-z0-9]+/).filter(w=>w.length>1);
export function retrieveKnowledge(query:string,scope:KnowledgeClaim['scope']='POTTED_PLANTS',limit=5){
  const tokens=new Set(words(query));
  return claims.filter(c=>c.scope===scope&&sources.some(s=>s.id===c.sourceId&&s.access==='READ')).map(c=>({claim:c,score:words([...c.tags,c.text].join(' ')).filter(t=>tokens.has(t)).length})).filter(c=>c.score>0).sort((a,b)=>b.score-a.score||a.claim.id.localeCompare(b.claim.id)).slice(0,Math.max(0,Math.min(8,limit))).map(({claim})=>({...claim,source:sources.find(s=>s.id===claim.sourceId)!}));
}
export function referencesFor(ids:string[]):EvidenceReference[]{return sources.filter(s=>ids.includes(s.id)).map(({id,title,url,scope,limitation,reviewStatus})=>({id,title,url,scope,limitation,reviewStatus}));}
export function referenceContext(group:Group){
  const selected=retrieveKnowledge(group==='SUCCULENT'?'chậu giá thể nước cố định nhãn ảnh':'chậu cố định đệm lá đất nhãn ảnh');
  return {version:KNOWLEDGE_VERSION,mode:'REFERENCE_NOT_SAFETY_RULE',claims:selected.map(c=>({id:c.id,text:c.text,url:c.source.url,scope:c.scope,review:c.expertReview,limitation:c.source.limitation}))};
}
