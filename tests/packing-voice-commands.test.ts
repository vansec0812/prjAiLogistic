import { afterEach, describe, expect, it, vi } from 'vitest';
import { isPackingCheckCommand, packingIntent, PackingCommandListener, type CommandRecognition, type RecognitionResultEvent } from '../apps/web/src/lib/packing-voice-commands';

class FakeRecognition implements CommandRecognition {
  lang = ''; continuous = true; interimResults = true; maxAlternatives = 0;
  onstart: (() => void) | null = null; onend: (() => void) | null = null;
  onresult: ((e: RecognitionResultEvent) => void) | null = null; onerror: ((e: {error:string}) => void) | null = null;
  start = vi.fn(() => this.onstart?.()); abort = vi.fn();
}
const event = (text: string, final = true): RecognitionResultEvent => ({ resultIndex: 0, results: [{ isFinal: final, 0: { transcript: text } }] });
function setup() {
  const instances: FakeRecognition[] = [], command = vi.fn(), state = vi.fn(), error = vi.fn(); let allowed = true;
  const listener = new PackingCommandListener({ factory: () => { const r = new FakeRecognition(); instances.push(r); return r; }, allowed: () => allowed, onCommand: command, onState: state, onError: error });
  return { instances, listener, command, state, error, allow: (v: boolean) => { allowed = v; } };
}
afterEach(() => vi.useRealTimers());
describe('Vietnamese packing commands', () => {
  it.each(['Đã xong bước này','Tôi đã xong bước này','Tiếp tục bước tiếp theo','Chuyển sang bước tiếp theo','Đã xong','Xong rồi','Đã xong rồi.','DA XONG ROI','Tôi đã làm xong','Mình làm xong rồi','Hoàn thành rồi'])('confirms the current step with %s',text=>expect(packingIntent(text)).toBe('CONFIRM'));
  it('distinguishes explicit physical inspection from generic agreement',()=>{expect(packingIntent('Tôi đã kiểm tra trực tiếp')).toBe('MANUAL_CONFIRM');expect(packingIntent('Tôi chưa kiểm tra trực tiếp')).toBeNull();});
  it.each(['Tôi gặp lỗi','Tôi làm sai','Tôi gặp vấn đề'])('pauses on a problem report %s',text=>expect(packingIntent(text)).toBe('ISSUE'));
  it.each(['Tôi đã xử lý lỗi','Đã khắc phục'])('recognizes resolution without step completion %s',text=>expect(packingIntent(text)).toBe('RESOLVED'));
  it.each(['Chưa xong bước này','Đừng tiếp tục bước tiếp theo','Tôi chưa xử lý lỗi'])('does not accept negated workflow command %s',text=>expect(packingIntent(text)).toBeNull());
  it.each(['đồng ý','Dạ vâng!','OK','được, tiếp tục đi','tôi xác nhận','tôi hiểu rồi'])('recognizes explicit agreement %s',text=>expect(packingIntent(text)).toBe('CONFIRM'));
  it.each(['không đồng ý','chưa kiểm tra','tôi không đồng ý','bạn ấy đồng ý','có nhưng chưa xong','đừng chuyển bước'])('never takes negation or third-person agreement %s',text=>expect(packingIntent(text)).toBeNull());
  it('supports scoped help, repeat and stop commands',()=>{expect(packingIntent('nhắc lại')).toBe('REPEAT');expect(packingIntent('giúp tôi')).toBe('HELP');expect(packingIntent('tắt camera')).toBe('STOP');});
  it.each(['PlantMove, kiểm tra!', 'Plant Move kiểm tra', 'kiểm tra', 'kiểm tra lại'])('checks without advancing with %s', text => expect(isPackingCheckCommand(text)).toBe(true));
  it.each(['chưa xong', 'Chưa xong rồi', 'không kiểm tra', 'đừng kiểm tra', 'tôi chưa xong rồi', 'khi nào xong rồi thì kiểm tra', 'bạn ấy đã xong rồi', 'chưa xong. Đã xong rồi', 'PlantMove đừng kiểm tra', ''])('never checks or advances on negation or surrounding conversation %s', text => expect(['CHECK','CONFIRM','MANUAL_CONFIRM']).not.toContain(packingIntent(text)));
  it('accepts only final speech and locks synchronously against repeated and stale events', () => {
    const s = setup(); s.listener.enable(); const r = s.instances[0], receive = r.onresult!;
    expect(r.lang).toBe('vi-VN'); expect(r.interimResults).toBe(false);
    receive(event('đã xong rồi', false)); expect(s.command).not.toHaveBeenCalled();
    receive(event('chưa xong')); expect(s.command).not.toHaveBeenCalled();
    receive(event('đã xong rồi')); receive(event('đã xong rồi'));
    expect(s.command).toHaveBeenCalledTimes(1); expect(r.abort).toHaveBeenCalledTimes(1);
  });
  it('ignores speech while TTS/checking is active, resumes after a cooldown, and rejects old-session events', () => {
    vi.useFakeTimers(); const s = setup(); s.listener.enable(); const old = s.instances[0].onresult!;
    s.allow(false); old(event('PlantMove kiểm tra')); expect(s.command).not.toHaveBeenCalled(); s.listener.suspend();
    s.allow(true); s.listener.resume(); vi.advanceTimersByTime(799); expect(s.instances).toHaveLength(1);
    vi.advanceTimersByTime(1); expect(s.instances).toHaveLength(2);
    old(event('xong rồi')); expect(s.command).not.toHaveBeenCalled();
    s.instances[1].onresult!(event('xong rồi')); expect(s.command).toHaveBeenCalledTimes(1);
  });
  it.each(['not-allowed', 'service-not-allowed', 'network', 'audio-capture'])('stops on %s without automatic retry', error => {
    vi.useFakeTimers(); const s = setup(); s.listener.enable(); const end = s.instances[0].onend!;
    s.instances[0].onerror!({error}); end(); vi.runAllTimers(); expect(s.error).toHaveBeenCalledOnce(); expect(s.instances).toHaveLength(1);
  });
  it('turning off cancels pending restart and late events', () => {
    vi.useFakeTimers(); const s = setup(); s.listener.enable(); const r = s.instances[0], receive = r.onresult!;
    r.onend!(); s.listener.disable(); vi.runAllTimers(); receive(event('xong rồi')); expect(s.command).not.toHaveBeenCalled(); expect(s.instances).toHaveLength(1);
  });
});
