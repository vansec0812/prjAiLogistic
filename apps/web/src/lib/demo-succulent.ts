import Decimal from 'decimal.js';
import type { AlternativeId, MvpAlternative, MvpStep } from '@plantcare/domain';
import photos from '../data/succulent-demo-photos.json';
import { alternativeNames } from './mvp-labels';

export const succulentPackingVersion='packing-succulent-2026.10.23-v1';
export const succulentPackingSource='USER-SUCCULENT-DEMO-20261023';
export const succulentPricingVersion='succulent-material-prices-2026.10.23-v1';
export const succulentPricingReason='Bảng vật liệu sen đá do người dùng cung cấp trong file Word: PA1 15.000đ, PA2 8.000đ.';
function step(pa:AlternativeId,n:number,id:string,title:string,instruction:string,manual:string,pass:string,fail:string,remedy:string):MvpStep{
  return {id,title,instruction,speech:instruction,manual,remedy,image:photos.find(p=>p.alternative===pa&&p.step===n)!.image,mode:'visual',criteria:[{id:id+'-visible',visible_pass:pass,visible_fail:fail}]};
}
const pa1=[
  step('PA1',1,'prepare','Chuẩn bị vật liệu bảo vệ','Chuẩn bị thùng carton hai lớp, khay định vị chậu, hai miếng bìa gia cố, giấy bọc giá thể, màng bọc, giấy tổ ong chèn lót và băng keo theo ảnh mẫu.','Đo thùng 20 × 20 × 25 cm và đối chiếu quy cách, số lượng trong bảng vật liệu.','Thấy thùng carton mở, khay định vị, bìa, giấy, màng bọc và băng keo được chuẩn bị.','Thấy thùng rách, bẹp rõ rệt hoặc vật liệu đang đè lên lá cây.','Bổ sung vật liệu còn thiếu khi kiểm tay, thay thùng hư và dời vật liệu khỏi lá.'),
  step('PA1',2,'fix','Cố định chậu và bảo vệ giá thể','Phủ giấy bảo vệ giá thể quanh gốc, giữ giấy bằng màng bọc quanh miệng chậu. Đặt chậu vào khay định vị như ảnh mẫu, chừa thân và lá.','Kiểm tra giấy giữ giá thể, màng không siết cây và khay giữ chậu không xê dịch.','Thấy giấy phủ mặt chậu, màng giữ quanh miệng chậu và chậu nằm trong khay định vị.','Thấy giá thể tràn, màng đè gập lá hoặc khay bung rõ rệt.','Chỉnh giấy và màng quanh miệng chậu, nới chỗ siết và đặt lại chậu vào khay.'),
  step('PA1',3,'partition','Bảo vệ thân, lá bằng vách chắn','Đặt khay cùng chậu vào thùng. Bố trí hai miếng bìa carton gia cố hai bên cây như ảnh mẫu để ngăn vật liệu chèn tì vào thân và lá.','Kiểm khoảng trống quanh tán và vị trí vách chắn, tránh để bìa cấn hoặc ép lá.','Thấy cây trong thùng, có vách bìa hai bên và không thấy lá bị kẹp ở mép bìa.','Thấy bìa nghiêng đè hoặc kẹp lá rõ rệt.','Nới và đặt lại vách chắn, gỡ lá đang bị kẹp trước khi chèn lót.'),
  step('PA1',4,'close','Chèn lót, đóng thùng, tạo lỗ thông khí','Chèn giấy tổ ong vào khoảng trống quanh chậu, tránh ép tán lá. Kiểm lại cây rồi đóng thùng, dán băng keo và tạo lỗ thông khí ở vị trí tránh cây như ảnh mẫu.','Kiểm trực tiếp chậu không xê dịch, nắp không đè cây; xác định vị trí cây trước khi tạo lỗ, tránh chạm cây và tay.','Thấy thùng đóng, băng keo giữ các mép và có lỗ thông khí không bị che.','Thấy mép thùng bung, băng keo bong hoặc lỗ thông khí bị che kín.','Mở kiểm nếu có chỗ vướng, chèn lại quanh chậu, dán mép bong và giữ lỗ thông khí thoáng.'),
];
const pa2=[
  step('PA2',1,'prepare','Chuẩn bị vật liệu tiết kiệm','Chuẩn bị thùng carton một lớp, ba miếng bìa gia cố, hai tờ giấy bọc bảo vệ giá thể, giấy chèn tái sử dụng và băng keo theo ảnh mẫu.','Đo thùng 18 × 18 × 22 cm, đối chiếu bảng vật liệu và kiểm giấy chèn sạch, khô.','Thấy thùng mở, bìa gia cố, giấy bọc và băng keo được chuẩn bị.','Thấy thùng rách, bẹp rõ rệt hoặc vật liệu đè lên lá.','Bổ sung vật liệu còn thiếu khi kiểm tay, thay thùng hư và dời vật liệu khỏi cây.'),
  step('PA2',2,'base','Gấp đế giữ chậu, phủ giấy mặt chậu','Gấp bìa carton thành đế giữ chậu và đặt chậu vào đế như ảnh mẫu. Phủ giấy quanh gốc trên mặt chậu để giữ giá thể, chừa phần thân và tán lá.','Kiểm phần đế ôm giữ chậu, giấy phủ đúng mặt chậu và không cấn gốc hoặc lá.','Thấy đế bìa giữ quanh chậu và giấy phủ quanh gốc, tán lá còn thoáng.','Thấy đế bung, giá thể tràn hoặc giấy kéo gập lá.','Gấp và chỉnh lại đế, đặt lại giấy trên mặt chậu, nới phần đang cấn cây.'),
  step('PA2',3,'padding','Đặt cây giữa thùng, chèn lót quanh chậu','Đặt cây cùng đế giữ chậu vào giữa thùng. Dùng giấy chèn tái sử dụng lấp khoảng trống quanh chậu như ảnh mẫu, tránh nhét giấy ép vào tán.','Dùng tay kiểm chậu không trượt và giấy chèn không đè thân, lá.','Thấy chậu ở giữa thùng, giấy chèn quanh chậu và tán lá không bị ép rõ rệt.','Thấy chậu nghiêng hoặc giấy chèn đè gập lá.','Đặt lại cây thẳng, chỉnh giấy chèn quanh chậu và lấy phần giấy đang ép lá ra.'),
  step('PA2',4,'close','Đóng thùng, dán băng keo, tạo lỗ thông khí','Kiểm cây đã nằm trong thùng, chậu được giữ và nắp không đè tán. Đóng thùng, dán băng keo cố định rồi tạo lỗ thông khí ở vị trí tránh cây theo ảnh mẫu.','Kiểm trực tiếp cây trong kiện, độ cố định và vị trí lỗ; tránh chạm cây hoặc tay khi tạo lỗ.','Thấy thùng đóng, băng keo giữ các mép và các lỗ thông khí còn thoáng.','Thấy nắp hở, băng keo bong hoặc lỗ bị che kín.','Mở kiểm nếu có phần vướng, chỉnh cây và giấy chèn, đóng lại thùng và dán mép bong.'),
];
type Material={id:string;name:string;unit:string;specification:string;price:number|null;quantities:[number,number];subtotals?:[number,number];step:number};
const materials:Material[]=[
  {id:'succulent-double-carton',name:'Thùng carton hai lớp',unit:'thùng',specification:'20 × 20 × 25 cm',price:7000,quantities:[1,0],step:0},
  {id:'succulent-single-carton',name:'Thùng carton một lớp',unit:'thùng',specification:'18 × 18 × 22 cm',price:4000,quantities:[0,1],step:0},
  {id:'succulent-pot-tray',name:'Khay định vị chậu',unit:'khay',specification:'12 × 12 cm',price:2000,quantities:[1,0],step:1},
  {id:'succulent-reinforcement',name:'Bìa carton gia cố',unit:'miếng',specification:'12 × 15 cm',price:500,quantities:[2,3],step:0},
  {id:'succulent-paper',name:'Giấy bọc bảo vệ giá thể',unit:'tờ',specification:'20 × 20 cm',price:500,quantities:[2,2],step:1},
  {id:'succulent-wrap',name:'Màng bọc bảo vệ giá thể',unit:'đoạn',specification:'Rộng 10 cm, dài 30 cm',price:1000,quantities:[1,0],step:1},
  {id:'succulent-honeycomb',name:'Giấy tổ ong chèn lót',unit:'tấm',specification:'30 × 40 cm',price:2000,quantities:[1,0],step:3},
  {id:'succulent-reused-paper',name:'Giấy chèn tái sử dụng',unit:'tờ',specification:'30 × 30 cm',price:500,quantities:[0,2],step:2},
  {id:'succulent-tape',name:'Băng keo',unit:'m',specification:'Rộng 4,8 cm',price:500,quantities:[1.2,0.8],step:3},
  {id:'succulent-auxiliary',name:'Chi phí phụ trợ khác',unit:'đơn hàng',specification:'Phân bổ theo đơn hàng',price:null,quantities:[1,1],subtotals:[400,100],step:0},
];
function alternative(id:AlternativeId,steps:MvpStep[],index:0|1):MvpAlternative{
  const bom=materials.filter(m=>m.quantities[index]>0).map(m=>({id:m.id,name:m.name,unit:m.unit,specification:m.specification,price:m.price,active:true,image:steps[m.step].image,quantity:m.quantities[index],subtotal:m.subtotals?.[index]??new Decimal(m.price!).times(m.quantities[index]).toNumber()}));
  const total=bom.reduce((sum,m)=>sum.plus(m.subtotal),new Decimal(0)).toNumber();
  return {id,title:alternativeNames[id],description:'',bom,cost:{known:total,total},steps,notes:[],ruleIds:[succulentPackingSource,succulentPricingVersion]};
}
export const succulentDemoAlternatives=[alternative('PA1',pa1,0),alternative('PA2',pa2,1)];
