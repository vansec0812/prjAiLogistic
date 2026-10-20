export type PackingIntent='CHECK'|'CONFIRM'|'MANUAL_CONFIRM'|'REPEAT'|'HELP'|'STOP'|'ISSUE'|'RESOLVED';
export function packingIntent(transcript: string): PackingIntent|null {
  const text = transcript.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  // Whole utterances only: never accept substrings of negations or conversation.
  if(['toi da kiem tra truc tiep','da kiem tra truc tiep','da xong va da kiem tra truc tiep'].includes(text))return 'MANUAL_CONFIRM';
  if(['da xong buoc nay','toi da xong buoc nay','xong buoc nay','tiep tuc buoc tiep theo','chuyen sang buoc tiep theo','sang buoc tiep theo','toi da hoan thanh buoc nay','toi da lam xong','da xong roi','xong roi','da xong','minh lam xong roi','toi lam xong roi','xong buoc nay roi','hoan thanh roi'].includes(text))return 'CONFIRM';
  if(['toi gap loi','co loi','bi loi','sai roi','toi lam sai','can kiem tra lai','cay bi hu','toi gap van de'].includes(text))return 'ISSUE';
  if(['da xu ly loi','toi da xu ly loi','da sua xong loi','da khac phuc'].includes(text))return 'RESOLVED';
  if(['plantmove kiem tra','plant move kiem tra','kiem tra','kiem tra lai','kiem tra giup toi','kiem tra buoc nay'].includes(text))return 'CHECK';
  if(['dong y','toi dong y','dong y roi','vang','da','da vang','co','u','uh','dung roi','duoc','duoc roi','ok','oke','okay','toi xac nhan','toi da kiem tra','da kiem tra xong','toi da kiem tra truc tiep','da kiem tra truc tiep','da xong va da kiem tra truc tiep','toi hieu roi','tiep tuc','tiep tuc di','duoc tiep tuc di','chuyen buoc','sang buoc tiep','qua buoc tiep theo'].includes(text))return 'CONFIRM';
  if(['nhac lai','noi lai','doc lai','huong dan lai'].includes(text))return 'REPEAT';
  if(['giup toi','can giup do','toi chua hieu','toi khong biet lam','lam the nao'].includes(text))return 'HELP';
  if(['dung lai','tam dung','dung kiem tra','tat camera'].includes(text))return 'STOP';
  return null;
}
export const isPackingCheckCommand=(text:string)=>packingIntent(text)==='CHECK';
export type PackingCommand='check'|'confirm_manual';
/** Compatibility for existing consumers; the instructor uses the full intent. */
export function packingCommand(text:string):PackingCommand|null{const intent=packingIntent(text);return intent==='CHECK'?'check':intent==='CONFIRM'||intent==='MANUAL_CONFIRM'?'confirm_manual':null;}

export interface RecognitionResultEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}
export interface CommandRecognition {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start(): void;
  abort(): void;
}
export type RecognitionFactory = () => CommandRecognition;

/** Own one recognition session at a time, ignoring events from aborted sessions. */
export class PackingCommandListener {
  private enabled = false;
  private serial = 0;
  private recognition: CommandRecognition | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  constructor(private readonly options: {
    factory: RecognitionFactory;
    allowed: () => boolean;
    onCommand: (intent:PackingIntent,transcript:string) => void;
    onState: (state: string) => void;
    onError: (message: string) => void;
  }) {}

  enable() { this.enabled = true; this.resume(true); }
  disable() { this.enabled = false; this.suspend(); this.options.onState('Đã tắt nghe lệnh'); }
  suspend() {
    ++this.serial;
    if (this.timer) clearTimeout(this.timer); this.timer = null;
    const old = this.recognition; this.recognition = null;
    if (old) { old.onresult = old.onstart = old.onend = old.onerror = null; try { old.abort(); } catch {} }
    if (this.enabled) this.options.onState('Tạm ngừng nghe lệnh');
  }
  resume(immediate = false) {
    if (!this.enabled || !this.options.allowed() || this.recognition || this.timer) return;
    if (immediate) this.start();
    else this.timer = setTimeout(() => { this.timer = null; this.start(); }, 800);
  }
  private fail(message: string) { this.disable(); this.options.onError(message); }
  private start() {
    if (!this.enabled || !this.options.allowed() || this.recognition) return;
    const token = ++this.serial;
    let rec: CommandRecognition;
    try { rec = this.options.factory(); } catch { this.fail('Trình duyệt không mở được nhận lệnh. Hãy dùng nút Kiểm tra.'); return; }
    this.recognition = rec;
    rec.lang = 'vi-VN'; rec.continuous = false; rec.interimResults = false; rec.maxAlternatives = 1;
    const current = () => this.enabled && token === this.serial && this.recognition === rec;
    rec.onstart = () => { if (current() && this.options.allowed()) this.options.onState('Đang nghe lệnh'); };
    rec.onresult = event => {
      if (!current() || !this.options.allowed()) return;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const intent=result.isFinal?packingIntent(result[0].transcript):null;
        if (intent) {
          this.suspend(); // Synchronous lock before callback, speech, or React updates.
          this.options.onState(intent==='CONFIRM'?'Đã nhận lời xác nhận':'Đã nhận lệnh');
          this.options.onCommand(intent,result[0].transcript);
          return;
        }
      }
    };
    rec.onend = () => { if (!current()) return; this.recognition = null; this.options.onState('Đang chờ nghe lại…'); this.resume(); };
    rec.onerror = event => {
      if (!current()) return;
      if (event.error === 'no-speech') return; // Browser emits end next; bounded-rate restart.
      const message = ['not-allowed', 'service-not-allowed'].includes(event.error)
        ? 'Micro hoặc dịch vụ nhận giọng bị từ chối. Cho phép micro rồi bật lại; nút Kiểm tra vẫn dùng được.'
        : event.error === 'audio-capture' ? 'Không có micro khả dụng. Kiểm tra thiết bị hoặc dùng nút Kiểm tra.'
        : event.error === 'network' ? 'Dịch vụ nhận giọng mất kết nối. Bật lại khi có mạng hoặc dùng nút Kiểm tra.'
        : 'Chưa nhận được lệnh tiếng Việt. Bật lại điều khiển giọng nói hoặc dùng nút Kiểm tra.';
      this.fail(message);
    };
    this.options.onState('Đang mở micro…');
    try { rec.start(); } catch { this.fail('Không khởi động được nhận giọng. Bấm bật lại hoặc dùng nút Kiểm tra.'); }
  }
}
