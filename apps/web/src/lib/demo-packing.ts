import type { CaseInput, MvpAlternative, MvpBundle, MvpStep } from '@plantcare/domain';
import { mvpInputIssues } from '../../../../packages/rule-engine/src/mvp';
import photos from '../data/packing-demo-photos.json';
import { alternativeNames } from './mvp-labels';
import { demoPricingReason, demoPricingVersion, withDemoMaterialPricing } from './demo-pricing';
import succulentPhotos from '../data/succulent-demo-photos.json';
import { isSucculentDemoProfile } from './demo-plant-profile';
import { succulentDemoAlternatives, succulentPackingVersion, succulentPackingSource, succulentPricingVersion, succulentPricingReason } from './demo-succulent';

export const packingDemoVersion='packing-photos-2026.10.20-v1';
export const packingDemoSource='USER-PACKING-DEMO-20261020';
export const demoPhotoByPath=new Map([...photos,...succulentPhotos].map(p=>[p.image,p]));
function step(pa:'PA1'|'PA2',n:number,id:string,title:string,instruction:string,manual:string,pass:string,fail:string,remedy:string):MvpStep{
  const image=photos.find(p=>p.alternative===pa&&p.step===n)!.image;
  return {id,title,instruction,speech:instruction,manual,remedy,image,mode:'visual',criteria:[{id:id+'-visible',visible_pass:pass,visible_fail:fail}]};
}
const pa1:MvpStep[]=[
  step('PA1',1,'wrap','Quấn màng co quanh chậu và hai phần ba lá','Quấn màng co quanh phần chậu và khoảng hai phần ba lá cây như ảnh mẫu. Giữ phần lá phía trên thoáng, không ép gập lá.','Kiểm tra trực tiếp mức bọc, đất và chỗ màng chạm thân lá.','Thấy màng bọc quanh chậu và phần dưới tán, lá phía trên còn thoáng.','Thấy màng ép gập lá hoặc bọc kín toàn bộ tán.','Nới màng đang ép lá, chỉnh lại vùng bọc theo ảnh mẫu.'),
  step('PA1',2,'padding','Đặt cây vào thùng xốp và chèn lót','Đặt cây thẳng đứng vào thùng xốp. Chèn vật liệu vào các khoảng trống trong thùng như ảnh mẫu, tránh ép tán lá.','Dùng tay kiểm tra chậu không xê dịch; kiểm phần chèn không đè lá.','Thấy cây trong thùng xốp, vật liệu chèn quanh chậu và tán không bị ép rõ rệt.','Thấy chậu nghiêng, khoảng trống lớn sát chậu hoặc vật liệu ép gập lá.','Chỉnh cây thẳng, chèn lại quanh chậu và bỏ phần đang đè lá trước khi đóng nắp.'),
  step('PA1',3,'close','Đóng nắp và cố định bằng băng keo','Đóng nắp thùng xốp rồi dùng băng keo cố định nắp như ảnh mẫu.','Kiểm tra nắp không đè cây và mép băng keo bám vào thùng.','Thấy nắp đóng và băng keo giữ nắp với thân thùng.','Thấy nắp hở, lệch rõ rệt hoặc băng keo bong.','Mở kiểm phần vướng nếu có, đặt lại nắp và dán lại mép bong.'),
  step('PA1',4,'ventilate','Tạo lỗ thoáng khí trên thùng','Tạo các lỗ thoáng khí khoảng một xen ti mét, nằm cách xa nhau trên thùng theo ảnh mẫu. Dừng thao tác nếu không xác định được vị trí cây bên trong.','Đo kích thước lỗ và kiểm vị trí trước khi tạo lỗ; tránh chạm cây và tay.','Thấy các lỗ thoáng tách rời trên thành thùng.','Thấy lỗ bị băng keo che kín hoặc thành thùng rách vỡ rõ rệt.','Bỏ phần băng keo che lỗ; nếu thùng rách vỡ, thay thùng và kiểm cây. Kích thước lỗ cần đo trực tiếp.'),
  step('PA1',5,'fragile-label','Dán tem hàng dễ vỡ','Dán tem hàng dễ vỡ ở mặt ngoài thùng, dễ nhìn như ảnh mẫu để người giao hàng nhận biết.','Kiểm tra tem bám trên thùng, không che lỗ thoáng.','Thấy tem hàng dễ vỡ rõ ở mặt thùng đưa vào camera.','Thấy tem bị che, bong hoặc dán đè lên lỗ thoáng.','Dán lại tem ở mặt dễ nhìn, tránh che các lỗ thoáng.'),
  step('PA1',6,'waybill','Dán vận đơn','Dán vận đơn lên mặt ngoài thùng như ảnh mẫu. Giữ mã vận đơn phẳng và không che tem hàng dễ vỡ hoặc lỗ thoáng.','Tự đối chiếu người nhận và mã vận đơn; AI không xác minh thông tin giao hàng.','Thấy vận đơn được dán phẳng ở mặt ngoài thùng.','Thấy vận đơn bong, gấp che mã hoặc chồng lên tem cảnh báo.','Dán lại vận đơn phẳng, tự kiểm đúng hồ sơ gửi hàng. Không đọc thông tin riêng tư qua camera.')
];
const pa2:MvpStep[]=[
  step('PA2',1,'wrap','Bọc mặt chậu','Bọc màng giữ đất trên mặt chậu như ảnh mẫu. Chừa thân cây, tránh kéo màng làm gập thân.','Kiểm tra đất không tràn và màng không siết thân cây.','Thấy mặt chậu có màng giữ đất quanh gốc cây.','Thấy đất rơi ra hoặc màng kéo gập thân.','Đặt lại màng ở mặt chậu, nới chỗ siết và kiểm trực tiếp đất.'),
  step('PA2',2,'gather','Gom lá gọn','Gom lá gọn và giữ phần dưới tán bằng màng như ảnh mẫu. Thao tác nhẹ, không ép gãy hoặc gập lá.','Kiểm tra trực tiếp phần gom không siết thân và lá.','Thấy phần dưới tán được gom gọn, lá phía trên còn mở.','Thấy thân hoặc lá bị gập, ép dưới màng.','Nới màng, đặt lá lại theo hướng tự nhiên rồi gom nhẹ.'),
  step('PA2',3,'pot-protection','Quấn bảo vệ chậu','Quấn tấm carton bảo vệ quanh chậu, cố định phần quấn bằng băng keo như ảnh mẫu.','Kiểm tra tấm carton ôm chậu và không cấn gốc, thân lá.','Thấy carton quấn quanh phần chậu và có băng keo giữ.','Thấy tấm bảo vệ bung, lệch hoặc đè rõ lên thân lá.','Chỉnh tấm bảo vệ quanh chậu, dán lại phần bung và bỏ chỗ cấn cây.'),
  step('PA2',4,'tube','Chuẩn bị ống carton','Chuẩn bị ống carton như ảnh mẫu. Kiểm tra ống đủ chỗ đặt cây và phần miệng để gập, không dùng ống rách hoặc bẹp.','Đo, thử độ vừa và kiểm đáy ống trực tiếp trước khi đặt cây.','Thấy ống carton dựng mở, thành ống không bẹp hoặc rách rõ rệt.','Thấy ống bị bẹp, rách hoặc thành bung.','Chỉnh hoặc thay ống hư; đo và kiểm phần đáy trước khi sử dụng.'),
  step('PA2',5,'fix','Đặt cây vào ống carton','Đặt cây vào ống carton theo chiều đứng như ảnh mẫu. Giữ phần lá gọn trong lúc đặt cây, tránh cọ gập lá vào miệng ống.','Dùng tay kiểm cây và chậu không trượt, kiểm đáy chịu được kiện.','Thấy cây nằm trong ống theo chiều đứng, lá không bị kẹp rõ rệt ở miệng.','Thấy chậu nghiêng, lá kẹt hoặc gập rõ ở miệng ống.','Nhấc chỉnh cây nhẹ nhàng, sửa phần cố định và kiểm lại đáy ống.'),
  step('PA2',6,'close','Gập miệng và cố định','Gập miệng ống carton và dùng băng keo cố định như ảnh mẫu. Trước khi gập, kiểm lá không nằm ở đường gập.','Kiểm miệng không đè cây và các mép băng keo bám chắc.','Thấy miệng carton đã gập, có băng keo giữ và không thấy lá bị kẹp.','Thấy miệng bung, băng keo bong hoặc lá bị kẹp ở mép gập.','Mở lại phần gập, gỡ lá vướng, chỉnh miệng và dán lại băng keo.'),
  step('PA2',7,'direction','Ghi nhãn hướng lên','Ghi chữ hướng lên và mũi tên chỉ lên ở mặt ngoài ống như ảnh mẫu.','Tự kiểm mũi tên đúng chiều đứng của cây và chậu.','Thấy chữ hướng lên và mũi tên rõ ở mặt ngoài kiện.','Thấy dấu hướng bị che, nhòe không đọc được hoặc các mũi tên ngược nhau.','Ghi lại hướng rõ ràng và kiểm trực tiếp đúng chiều cây bên trong.'),
  step('PA2',8,'waybill','Dán vận đơn','Dán vận đơn phẳng lên mặt ngoài ống carton như ảnh mẫu. Không che chữ và mũi tên hướng lên.','Tự đối chiếu người nhận và mã vận đơn; AI không xác minh thông tin giao hàng.','Thấy vận đơn được dán ở mặt ngoài ống, dấu hướng còn nhìn thấy.','Thấy vận đơn bong, gấp che mã hoặc che dấu hướng lên.','Dán lại vận đơn phẳng, giữ dấu hướng lên rõ và tự kiểm thông tin gửi hàng.')
];
export const demoAlternatives:MvpAlternative[]=([
  {id:'PA1',title:alternativeNames.PA1,description:'',steps:pa1,cost:{known:0,total:null},ruleIds:[packingDemoSource],notes:[],bom:[]},
  {id:'PA2',title:alternativeNames.PA2,description:'',steps:pa2,cost:{known:0,total:null},ruleIds:[packingDemoSource],notes:[],bom:[]}
] satisfies MvpAlternative[]).map(withDemoMaterialPricing);

/** Explicit local demonstration; never an eligibility or safety decision for the shipment. */
export function proposePackingDemo(input:CaseInput,threshold=70,now=new Date()):Omit<MvpBundle,'id'|'caseId'|'inputHash'|'createdAt'>{
  const missing=mvpInputIssues(input,now);
  if(Object.values(input.plant.fieldEvidence||{}).some(e=>e?.source==='AI'&&(e.confidence===null||e.confidence<threshold)))missing.push('Nhập tay các trường AI dưới ngưỡng tin cậy');
  if(isSucculentDemoProfile(input.plant))return {snapshot:structuredClone(input),configVersion:succulentPackingVersion,developmentOnly:true,demo:true,outcome:missing.length?'NEED_INPUT':'READY',missing,alternatives:missing.length?[]:structuredClone(succulentDemoAlternatives),suppressed:[],trace:[{id:succulentPackingSource,reason:'Hai phương án sen đá cố định theo bộ ảnh người dùng cung cấp. Không đánh giá phù hợp vận chuyển.'},{id:succulentPricingVersion,reason:succulentPricingReason}]};
  return {snapshot:structuredClone(input),configVersion:packingDemoVersion,developmentOnly:true,demo:true,outcome:missing.length?'NEED_INPUT':'READY',missing,alternatives:missing.length?[]:structuredClone(demoAlternatives),suppressed:[],trace:[{id:packingDemoSource,reason:'Hai phương án cố định từ source/pa1 và source/pa2 theo yêu cầu demo. Không đánh giá phù hợp vận chuyển.'},{id:demoPricingVersion,reason:demoPricingReason}]};
}
