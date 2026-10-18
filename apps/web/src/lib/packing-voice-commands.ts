export function isPackingCheckCommand(transcript: string): boolean {
  const text = transcript.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  // Whole utterances only: never accept substrings of negations or conversation.
  return ['plantmove kiem tra', 'plant move kiem tra', 'da xong roi', 'xong roi', 'da xong'].includes(text);
}
export type PackingCommand = 'check' | 'confirm_manual';
export function packingCommand(transcript: string): PackingCommand | null {
  if (isPackingCheckCommand(transcript)) return 'check';
  const text = transcript.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  return ['toi da kiem tra truc tiep', 'da kiem tra truc tiep', 'da xong va da kiem tra truc tiep'].includes(text) ? 'confirm_manual' : null;
}

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
    onCommand: (command: PackingCommand) => void;
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
        const command = result.isFinal ? packingCommand(result[0].transcript) : null;
        if (command) {
          this.suspend(); // Synchronous lock before callback, speech, or React updates.
          this.options.onState(command === 'check' ? 'Đã nhận lệnh kiểm tra' : 'Đã nhận xác nhận kiểm tay');
          this.options.onCommand(command);
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
