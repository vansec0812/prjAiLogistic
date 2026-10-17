'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, useSession, Alert, PageHeading } from './common';
import { useVietnameseSpeech } from './use-vietnamese-speech';
import { usePackingCommands } from './use-packing-commands';
import { canAdvance, contextIssues, formLabels, plantLabels, selectSop, sopCatalog, validateResult, type PlantKind, type ShippingForm, type CheckpointResult, type StepRecord, type SopContext } from '../lib/live-packing';
const labels = { passed: 'Đạt tiêu chí nhìn thấy', needs_adjustment: 'Cần điều chỉnh', unverifiable: 'Không thể xác minh' };
export function LivePacking() {
  const { session } = useSession();
  const [plant, setPlant] = useState<PlantKind>('succulent'), [index, setIndex] = useState(0), [approved, setApproved] = useState(false), [consent, setConsent] = useState(false);
  const [form, setForm] = useState<ShippingForm>('POTTED'), [species, setSpecies] = useState(''), [scopeConfirmed, setScopeConfirmed] = useState(false);
  const [potCm, setPotCm] = useState(''), [heightCm, setHeightCm] = useState(''), [packedKg, setPackedKg] = useState(''), [manualNote, setManualNote] = useState('');
  const [records, setRecords] = useState<Record<string, StepRecord>>({}), [manual, setManual] = useState(false), [phase, setPhase] = useState<'idle' | 'positioning' | 'checking'>('idle'), [countdown, setCountdown] = useState<number | null>(null);
  const [message, setMessage] = useState(''), [camera, setCamera] = useState(false), [voice, setVoice] = useState(true), [finished, setFinished] = useState(false);
  const { speak: say, cancel: cancelSpeech, activate, voiceName, audioState, usingCloud, speaking, isSpeaking, notice: voiceNotice } = useVietnameseSpeech(voice, session.csrf);
  const video = useRef<HTMLVideoElement>(null), stream = useRef<MediaStream | null>(null), controller = useRef<AbortController | null>(null), mounted = useRef(true), starting = useRef(false), generation = useRef(0);
  const run = useRef(0), locked = useRef(false), waitCancel = useRef<(() => void) | null>(null);
  const sop = selectSop(plant, form), steps = sop.steps, step = steps[index] || steps[0], record = records[step.id], busy = phase !== 'idle';
  const numberOrNull = (s: string) => s.trim() ? Number(s.replace(',', '.')) : null;
  const context = { species, shop_scope_confirmed: scopeConfirmed, pot_cm: numberOrNull(potCm), height_cm: numberOrNull(heightCm), packed_kg: numberOrNull(packedKg) };
  const issues = contextIssues(sop, context), positionPrompt = 'Đưa sản phẩm trước camera để tôi kiểm tra bước vừa làm. ' + step.camera_prompt_vi;
  const voiceCommands = usePackingCommands({ ready: approved && !finished && session.development, paused: busy || isSpeaking, speaking, onCommand: () => { void handleVoiceCommand(); } });
  const suspendCommands = voiceCommands.suspend;
  const speak = useCallback((text: string) => { suspendCommands(); return say(text); }, [say, suspendCommands]);
  async function handleVoiceCommand() {
    try {
      if (locked.current || !approved || finished) return;
      if (step.mode === 'manual') {
        const text = 'Đã nhận lệnh. Bước này cần kiểm tra trực tiếp. ' + step.manual;
        setMessage(text); await speak(text); return;
      }
      if (!camera || !consent || !session.aiConfigured) {
        const text = !camera ? 'Hãy mở camera trước khi yêu cầu kiểm tra.' : !consent ? 'Cần đồng ý gửi ảnh để AI kiểm tra. Bạn vẫn có thể xác nhận thủ công.' : 'AI chưa được cấu hình. Hãy dùng xác nhận thủ công.';
        setMessage(text); await speak(text); return;
      }
      await confirmStep(true);
    } finally { voiceCommands.resume(); }
  }
  function resetSelection() { cancelCheck(); stop(); setApproved(false); setRecords({}); setIndex(0); setManual(false); setManualNote(''); setFinished(false); setScopeConfirmed(false); }
  function cancelCheck() { run.current++; locked.current = false; controller.current?.abort(); waitCancel.current?.(); waitCancel.current = null; cancelSpeech(); if (mounted.current) { setPhase('idle'); setCountdown(null); } }
  function stop() { voiceCommands.disable(); generation.current++; cancelCheck(); stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; if (video.current) video.current.srcObject = null; if (mounted.current) setCamera(false); }
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; stop(); }; }, []);
  useEffect(() => { const hide = () => { if (document.hidden) stop(); }; document.addEventListener('visibilitychange', hide); return () => document.removeEventListener('visibilitychange', hide); }, []);
  useEffect(() => { if (approved && !finished && !locked.current) void speak(step.speech_vi + ' ' + step.manual); return cancelSpeech; }, [index, approved, finished, voice, voiceName, speak, cancelSpeech, step]);
  async function start() {
    if (starting.current || locked.current) return; starting.current = true; const token = ++generation.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('CAMERA_UNAVAILABLE');
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      if (!mounted.current || token !== generation.current) { media.getTracks().forEach(t => t.stop()); return; }
      stream.current?.getTracks().forEach(t => t.stop()); stream.current = media;
      media.getVideoTracks().forEach(track => { track.onended = () => { stop(); if (mounted.current) setMessage('Camera đã ngắt. Mở lại camera hoặc xác nhận thủ công.'); }; });
      if (video.current) { video.current.srcObject = media; await video.current.play(); }
      if (!mounted.current || token !== generation.current) { media.getTracks().forEach(t => t.stop()); return; }
      setCamera(true); setMessage('');
    } catch { stop(); if (mounted.current) setMessage('Không mở được camera. Dùng HTTPS/localhost, cấp quyền rồi thử lại; hoặc xác nhận thủ công. Không cần quyền micro.'); }
    finally { starting.current = false; }
  }
  async function confirmStep(fromVoice = false) {
    if (locked.current || !approved || !consent || !session.aiConfigured || !camera || step.mode !== 'visual' || issues.length || !session.development) return;
    locked.current = true; const token = ++run.current;
    voiceCommands.suspend();
    const active = () => mounted.current && token === run.current && locked.current;
    setPhase('positioning'); setCountdown(null); setMessage(''); setManual(false);
    setRecords(r => { const next = { ...r }; delete next[step.id]; return next; });
    try {
      await speak((fromVoice ? 'Đã nhận lệnh. ' : '') + positionPrompt); if (!active()) return;
      for (let seconds = 3; seconds > 0; seconds--) {
        setCountdown(seconds);
        await new Promise<void>(resolve => { const timer = setTimeout(() => { waitCancel.current = null; resolve(); }, 1000); waitCancel.current = () => { clearTimeout(timer); resolve(); }; });
        if (!active()) return;
      }
      setCountdown(null); const v = video.current;
      if (!v || v.readyState < 2 || !v.videoWidth || !stream.current?.getVideoTracks().some(t => t.readyState === 'live')) throw new Error('CAMERA_NOT_READY');
      const canvas = document.createElement('canvas'), scale = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight)); canvas.width = Math.round(v.videoWidth * scale); canvas.height = Math.round(v.videoHeight * scale);
      const drawingContext = canvas.getContext('2d'); if (!drawingContext) throw new Error('FRAME_UNAVAILABLE');
      drawingContext.drawImage(v, 0, 0, canvas.width, canvas.height); const image = canvas.toDataURL('image/jpeg', 0.8); canvas.width = canvas.height = 0;
      if (!active()) return; setPhase('checking'); controller.current = new AbortController();
      const raw = await api<CheckpointResult>('live-packing/check', { method: 'POST', signal: controller.current.signal, body: JSON.stringify({ sop_id: sop.id, shipping_form: form, context: context as SopContext, step_id: step.id, sop_version: sop.version, approved_for_trial: true, consent: true, image }) }, session.csrf);
      if (!active()) return; const result = validateResult(raw, step);
      setRecords(r => ({ ...r, [step.id]: { kind: 'ai', result } }));
      void speak(labels[result.status] + '. Tôi quan sát thấy: ' + result.observed + '. ' + result.reason + '. ' + step.manual);
    } catch (error) {
      if (!active()) return;
      const text = error instanceof Error && ['CAMERA_NOT_READY', 'FRAME_UNAVAILABLE'].includes(error.message) ? 'Camera chưa có hình rõ để kiểm tra. Mở lại camera, giữ sản phẩm trong khung hình và xác nhận lại.' : error instanceof Error ? error.message : 'Không kiểm tra được lúc này. Hãy thử lại hoặc xác nhận thủ công.';
      setMessage(text); void speak('Chưa kiểm tra được bước này. Hãy thử lại hoặc xác nhận thủ công.');
    } finally { if (active()) { locked.current = false; setPhase('idle'); setCountdown(null); } }
  }
  function move() { cancelSpeech(); setManual(false); setManualNote(''); if (index === steps.length - 1) { setFinished(true); stop(); } else setIndex(i => i + 1); }
  const canNext = canAdvance(step, record, manual);
  function exportSession() {
    const data = { schema_version: 'plantmove-trial-session-v2', sop_id: sop.id, sop_version: sop.version, shipping_form: form, species, generated_at: new Date().toISOString(), approved_professionally: false, transport_safe: null, records };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'PlantMove-phien-kiem-thu.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="live-packing"><PageHeading title="AI giám sát đóng gói" description="Làm theo hướng dẫn → xác nhận xong bước → đưa sản phẩm trước camera để AI kiểm tra và nói kết quả"/>
    <Alert>KIỂM THỬ — SOP {sop.id}, phiên bản {sop.version}, chưa duyệt chuyên môn và chưa đo độ chính xác trên ảnh thật. Không chứng nhận an toàn vận chuyển. Camera hiển thị trực tiếp; AI chỉ nhận khung hình sau khi bạn xác nhận bước, không theo dõi mọi diễn biến video.</Alert>
    {!session.development && <Alert kind="error">SOP chưa được duyệt; chức năng thực hiện chỉ mở trong môi trường kiểm thử local.</Alert>}
    <section className="panel live-controls"><details className="live-setup" open={!approved}><summary>Thiết lập cây và SOP — {sop.title}</summary><label>Nhóm cây <select value={plant} disabled={busy || approved} onChange={e => { resetSelection(); setPlant(e.target.value as PlantKind); }}>{Object.entries(plantLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
      <label>Hình thức gửi <select value={form} disabled={busy || approved} onChange={e => { resetSelection(); setForm(e.target.value as ShippingForm); }}>{Object.entries(formLabels).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></label>
      <label>Loài/giống đã xác nhận <input value={species} disabled={approved} maxLength={100} onChange={e => setSpecies(e.target.value)}/></label>
      <p>{sop.scope} Đây là nhánh tham khảo theo nguồn, không tự nhận diện hoặc xác nhận đúng loài từ tên nhập.</p>
      {sop.limits && <><p>Chỉ thử phạm vi cây nhỏ của nguồn. Nhập số đo/cân thực; không lấy số đo từ ảnh.</p>
        {form === 'POTTED' && <label>Đường kính chậu (cm)<input inputMode="decimal" disabled={approved} value={potCm} onChange={e => setPotCm(e.target.value)}/></label>}
        <label>Chiều cao cả cây/chậu (cm)<input inputMode="decimal" disabled={approved} value={heightCm} onChange={e => setHeightCm(e.target.value)}/></label>
        <label>Khối lượng kiện dự kiến đã cân (kg)<input inputMode="decimal" disabled={approved} value={packedKg} onChange={e => setPackedKg(e.target.value)}/></label></>}
      <details><summary>Nguồn và phạm vi SOP</summary>{sopCatalog.sources.filter(s => sop.source_ids.includes(s.id)).map(s => <p key={s.id}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> — {s.locator}. Đọc ngày {s.accessed_at}. {s.limitation}</p>)}<p>Người duyệt chuyên môn: chưa có. Kiểm chứng ảnh thật: chưa thực hiện. ETA và điều kiện nhận gửi phải xác nhận riêng theo đơn, chưa được luồng thử này kiểm chứng.</p></details>
      <label><input type="checkbox" disabled={approved} checked={scopeConfirmed} onChange={e => setScopeConfirmed(e.target.checked)}/> Tôi đại diện shop đã xem phạm vi nguồn, đúng loài và hình thức để thử; đây chưa là duyệt chuyên môn.</label>
      {issues.length > 0 && <Alert kind="info">{issues.join(' ')}</Alert>}
      <details><summary>Xem checklist văn bản cho phiên thử</summary>{steps.map(s => <p key={s.id}><strong>{s.title}</strong>: {s.speech_vi} Kiểm tra tay: {s.manual} ({s.mode === 'manual' ? 'Kiểm trực tiếp' : 'Kiểm ảnh và kiểm tay'}; {s.source_id} — {s.source_locator})</p>)}</details>
      </details><label><input type="checkbox" disabled={!approved && (issues.length > 0 || !session.development)} checked={approved} onChange={e => { cancelCheck(); setApproved(e.target.checked); setRecords({}); setIndex(0); setManual(false); setManualNote(''); setFinished(false); if (!e.target.checked) stop(); }}/> Tôi đã xem và duyệt checklist này để kiểm thử, không phải phê duyệt chuyên môn.</label>
      <label><input type="checkbox" checked={consent} onChange={e => { setConsent(e.target.checked); if (!e.target.checked) { voiceCommands.disable(); cancelCheck(); } }}/> Đồng ý để AI lấy khung hình từ camera sau khi tôi xác nhận bước và gửi đến Google Gemini để phân tích. Tránh người, nhãn địa chỉ hoặc dữ liệu riêng tư. Ứng dụng không lưu ảnh/video; nhà cung cấp xử lý theo chính sách của họ.</label>
      <label><input type="checkbox" checked={voice} onChange={e => setVoice(e.target.checked)}/> Đọc hướng dẫn và phản hồi bằng tiếng Việt. Chức năng đọc không cần micro.</label>
      <p>Bật âm thanh dùng giọng Việt AI, không phụ thuộc giọng cài sẵn trên máy. Nội dung hướng dẫn và phản hồi cần đọc sẽ gửi tới Gemini để tạo âm thanh; có dùng hạn mức API.</p>
      <button className="button secondary" disabled={busy} onClick={async () => { setVoice(true); await activate(); await speak('Xin chào. Đây là giọng nói tiếng Việt của PlantMove. Hãy đưa sản phẩm trước camera để tôi kiểm tra.'); }}>Bật âm thanh và nghe thử</button>
      {voice && <p role="status">Âm thanh: {audioState}</p>}
      {voice && (usingCloud || voiceName) && <p>Giọng tiếng Việt: {usingCloud ? 'AI' : voiceName}</p>}{voiceNotice && <Alert kind="info">{voiceNotice}</Alert>}
      <label><input type="checkbox" checked={voiceCommands.enabled} disabled={!approved || finished || !voiceCommands.supported} onChange={e => e.target.checked ? voiceCommands.enable() : voiceCommands.disable()}/> Điều khiển bằng giọng nói — đồng ý dùng micro để nhận lệnh.</label>
      <p>Nói “PlantMove, kiểm tra”, “đã xong rồi” hoặc “xong rồi”. Lệnh chỉ yêu cầu kiểm tra, không tự đánh dấu đạt. Hệ thống ngừng nghe khi đang nói hoặc kiểm tra. Âm thanh có thể được trình duyệt gửi tới dịch vụ nhận dạng; PlantMove không lưu âm thanh. Quyền micro do trình duyệt quản lý; nếu bị thu hồi, bạn cần cấp lại.</p>
      {!voiceCommands.supported && <p>Trình duyệt chưa hỗ trợ nhận lệnh hoặc trang chưa dùng HTTPS/localhost. Nút Kiểm tra vẫn dùng được.</p>}
      <p role="status">Nhận lệnh: {voiceCommands.state}</p>
      {voiceCommands.error && <Alert kind="info">{voiceCommands.error}</Alert>}
    </section>
    {!session.aiConfigured && <Alert kind="info">Chưa cấu hình Vision API. Camera và checklist thủ công vẫn dùng được.</Alert>}{message && <Alert kind="error">{message}</Alert>}
    {finished ? <section className="panel live-controls"><h2>Đã kết thúc phiên kiểm thử</h2>{steps.map(s => <p key={s.id}>{s.title}: {records[s.id]?.kind === 'skipped' ? 'Đã bỏ qua — chưa đạt' : records[s.id]?.kind === 'manual' ? 'Người dùng xác nhận thủ công' : records[s.id]?.result ? labels[records[s.id].result!.status] + ' + xác nhận tay' : 'Chưa kiểm tra'}</p>)}<p>Phiên này không hoàn tất hồ sơ vận chuyển, không trừ tồn kho. Kết quả chỉ ở bộ nhớ trình duyệt, tải lại trang sẽ mất.</p><button className="button secondary" onClick={exportSession}>Tải biên bản kiểm thử (không ảnh)</button><button className="button secondary" onClick={() => { resetSelection(); }}>Thử phiên mới</button></section> : approved && <>
      <section className="panel live-camera"><video ref={video} muted playsInline autoPlay style={camera ? undefined : { aspectRatio: '16 / 9', maxHeight: 180 }} aria-label="Camera đóng gói trực tiếp"/><div className="button-row"><button className="button secondary" disabled={busy} onClick={() => void start()}>Mở camera</button><button className="button secondary" onClick={stop}>Tắt camera</button></div></section>
      <section className="panel live-controls"><p>Bước {index + 1}/{steps.length} — {step.mode === 'manual' ? 'Kiểm tra trực tiếp, không gửi ảnh' : 'Kiểm ảnh và kiểm tay'}</p><h2>{step.title}</h2><p>{step.instruction}</p><button className="button secondary" disabled={busy} onClick={() => void speak(step.speech_vi + ' ' + step.manual)}>Nghe lại</button>
        <p>Nguồn: {step.source_id} — {step.source_locator}</p>
        {step.mode === 'manual' ? <Alert kind="info">Bước này do người phụ trách kiểm trực tiếp. AI không xác minh độ khô, sức khỏe hoặc quyết định kỹ thuật bằng ảnh.</Alert> : <><p>{step.camera_prompt_vi} Làm xong, nhấn xác nhận. AI sẽ nhắc vị trí, đếm ngược rồi lấy một khung hình.</p>
        <details><summary>AI sẽ kiểm tra điều gì?</summary>{step.criteria.map(c => <div key={c.id}><p>Đạt phần nhìn thấy: {c.visible_pass}</p><p>Lỗi nhìn thấy: {c.visible_fail}</p></div>)}<p>Thiếu vùng nhìn, che khuất hoặc ảnh mờ: không thể xác minh. Tiêu chí này đang kiểm thử, chưa được thẩm định.</p></details>
        <button className="button primary" disabled={busy || !camera || !consent || !session.aiConfigured} onClick={() => void confirmStep()}>{phase === 'positioning' ? 'Đưa sản phẩm trước camera…' : phase === 'checking' ? 'AI đang kiểm tra…' : record ? 'Yêu cầu AI kiểm tra lại' : 'Đã làm xong bước này — nhờ AI kiểm tra'}</button></>}
        {busy && <div role="status"><p>{phase === 'positioning' ? positionPrompt : 'AI đang xem khung hình vừa lấy từ camera. Vui lòng chờ phản hồi.'}</p>{countdown !== null && <strong>Tự kiểm tra sau {countdown} giây</strong>}<button className="button secondary" onClick={cancelCheck}>Hủy kiểm tra</button></div>}
        {record?.result && <div aria-live="polite"><h3>{labels[record.result.status]}</h3><p>Quan sát: {record.result.observed}</p><p>{record.result.reason}</p>{record.result.criterion_results.map(c => <p key={c.criterion_id}>{c.criterion_id}: {labels[c.status]} — {c.observation}</p>)}<p>{step.remedy_vi}</p><p>Bắt buộc kiểm tra thủ công: có</p></div>}
        <label><input type="checkbox" checked={manual} disabled={busy} onChange={e => setManual(e.target.checked)}/>{step.manual}</label>
        <label>Ghi nhận kiểm tay / lý do thay kết luận ảnh <textarea value={manualNote} disabled={busy} maxLength={500} onChange={e => setManualNote(e.target.value)}/></label>
        <button className="button secondary" disabled={busy || !manual || (step.mode === 'visual' && manualNote.trim().length < 10)} onClick={() => { setRecords(r => ({ ...r, [step.id]: { kind: 'manual', note: manualNote.trim(), result: r[step.id]?.result } })); setMessage('Đã ghi nhận xác nhận của bạn; đây không phải kết luận AI.'); }}>Dùng xác nhận thủ công</button>
        {step.mode === 'visual' && <p>Xác nhận thủ công thay kiểm ảnh cần ghi lý do ít nhất 10 ký tự; kết quả AI trước đó vẫn giữ trong biên bản.</p>}
        <div className="button-row"><button className="button secondary" disabled={busy || index === 0} onClick={() => { cancelSpeech(); setIndex(i => i - 1); setManual(false); setManualNote(''); }}>Bước trước</button><button className="button secondary" disabled={busy} onClick={() => { setRecords(r => ({ ...r, [step.id]: { kind: 'skipped', note: manualNote.trim(), result: r[step.id]?.result } })); move(); }}>Bỏ qua — ghi chưa đạt</button><button className="button primary" disabled={busy || !canNext} onClick={() => { if (record) setRecords(r => ({ ...r, [step.id]: { ...record, note: manualNote.trim() || record.note } })); move(); }}>{index === steps.length - 1 ? 'Kết thúc thử nghiệm' : 'Bước tiếp'}</button></div>
      </section></>}
  </div>;
}
