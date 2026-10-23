import Decimal from 'decimal.js';
import type { MvpBundle } from '@plantcare/domain';
import { money } from './common';

const quantity=(value:number)=>new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2}).format(value);
export function MaterialComparison({bundle}:{bundle:MvpBundle}){
  const materials=Array.from(new Map(bundle.alternatives.flatMap(a=>a.bom).map(m=>[m.id,m])).values());
  const hasSpecifications=materials.some(m=>m.specification);
  const [pa1,pa2]=bundle.alternatives;
  const difference=pa1?.cost.total!==null&&pa1?.cost.total!==undefined&&pa2?.cost.total!==null&&pa2?.cost.total!==undefined?new Decimal(pa1.cost.total).minus(pa2.cost.total):null;
  const percent=difference&&pa1.cost.total!>0?difference.times(100).dividedBy(pa1.cost.total!).toDecimalPlaces(1).toNumber():0;
  return <section className="panel form-panel material-costs">
    <details className="cost-details" key={bundle.id}><summary><span className="cost-show">Xem chi tiết</span><span className="cost-hide">Thu gọn</span></summary>
    <h2>So sánh chi phí vật liệu bao gói</h2>
    {!bundle.demo&&<p>Đơn giá tham khảo theo cấu hình {bundle.configVersion}. Không gồm cước vận chuyển.</p>}
    <div className="table-wrap"><table aria-label="Chi tiết chi phí vật tư"><thead><tr><th>Vật tư / đơn vị</th>{hasSpecifications&&<th>Quy cách</th>}<th>Đơn giá</th>{bundle.alternatives.map(a=><th key={a.id}>{a.id}: lượng · thành tiền</th>)}</tr></thead><tbody>
      {materials.map(m=><tr key={m.id}><td>{m.name} / {m.unit}</td>{hasSpecifications&&<td>{m.specification||'—'}</td>}<td>{m.price===null?(m.subtotal!==null?'—':'Chưa có giá'):money(m.price)}</td>{bundle.alternatives.map(a=>{const b=a.bom.find(b=>b.id===m.id);return <td key={a.id}>{b?`${quantity(b.quantity)} · ${b.subtotal===null?'Chưa có giá':money(b.subtotal)}`:'—'}</td>;})}</tr>)}
      <tr><th>Tổng vật tư</th>{hasSpecifications&&<td/>}<td/>{bundle.alternatives.map(a=><th key={a.id}>{a.cost.total===null?'Chưa đủ giá':money(a.cost.total)}</th>)}</tr>
    </tbody></table></div>
    {difference&&<p>PA2 tiết kiệm {money(difference.toNumber())} ({quantity(percent)}%).</p>}
    </details>
  </section>;
}
