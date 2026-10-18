'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { vietnameseVoice } from '../lib/vietnamese-voice';
import { api } from './common';
import { vietnameseSpeechText } from '../lib/vietnamese-pronunciation';

export function useVietnameseSpeech(enabled: boolean, csrf: string | null, volume=1) {
  const speaking = useRef(false), [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceName, setVoiceName] = useState(''), [notice, setNotice] = useState(''), [audioState, setAudioState] = useState('Chưa phát âm thanh'), [usingCloud, setUsingCloud] = useState(false);
  const settings = useRef({ enabled, csrf, volume }); settings.current = { enabled, csrf, volume };
  const gain=useRef<GainNode|null>(null);
  useEffect(()=>{if(gain.current)gain.current.gain.value=volume;if(utteranceRef.current)utteranceRef.current.volume=volume;},[volume]);
  const finishRef = useRef<(() => void) | null>(null), alive = useRef(true), serial = useRef(0), cloudAllowed = useRef(false);
  const context = useRef<AudioContext | null>(null), source = useRef<AudioBufferSourceNode | null>(null), request = useRef<AbortController | null>(null), utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const buffers = useRef(new Map<string, AudioBuffer>());
  const cancel = useCallback(() => {
    speaking.current = false;
    if (alive.current) setIsSpeaking(false);
    serial.current++; request.current?.abort(); request.current = null;
    finishRef.current?.(); finishRef.current = null; utteranceRef.current = null;
    if (source.current) { source.current.onended = null; try { source.current.stop(); } catch {} source.current = null; }
    window.speechSynthesis?.cancel();
    if (alive.current) setAudioState('Đã dừng âm thanh');
  }, []);
  useEffect(() => {
    alive.current = true;
    const refresh = () => { const selected = vietnameseVoice(window.speechSynthesis?.getVoices() || []); setVoiceName(selected?.name || ''); if (!selected && !cloudAllowed.current) setNotice('Chưa có giọng Việt trên máy. Chọn Dùng giọng AI.'); };
    refresh(); window.speechSynthesis?.addEventListener('voiceschanged', refresh);
    return () => { alive.current = false; window.speechSynthesis?.removeEventListener('voiceschanged', refresh); cancel(); void context.current?.close(); context.current = null; buffers.current.clear(); };
  }, [cancel]);
  useEffect(() => { if (!enabled) cancel(); }, [enabled, cancel]);
  const activate = useCallback(async () => {
    // Called directly from a click: unlock the audio device before awaiting network.
    settings.current.enabled = true;
    try {
      const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) throw new Error('NO_AUDIO_CONTEXT');
      if (!context.current || context.current.state === 'closed') context.current = new AudioCtor();
      await context.current.resume();
      if (context.current.state !== 'running') throw new Error('AUDIO_BLOCKED');
      cloudAllowed.current = true; if (alive.current) { setUsingCloud(true); setNotice(''); setAudioState('Âm thanh đã bật'); }
    } catch { if (alive.current) setNotice('Cho phép âm thanh rồi chọn Dùng giọng AI.'); }
  }, []);
  const speak = useCallback(async (text: string): Promise<void> => {
    text=vietnameseSpeechText(text);
    cancel(); const token = serial.current;
    const current = () => alive.current && token === serial.current && settings.current.enabled;
    if (!settings.current.enabled) return;
    speaking.current = true; setIsSpeaking(true);
    try {
    const selected = vietnameseVoice(window.speechSynthesis?.getVoices() || []);
    if (selected && !cloudAllowed.current) {
      const outcome = await new Promise<'ok' | 'failed' | 'cancelled'>(resolve => {
        const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'vi-VN'; utterance.voice = selected; utterance.volume = settings.current.volume; utterance.rate = 1; utteranceRef.current = utterance;
        let ended = false;
        const finish = (result: 'ok' | 'failed' | 'cancelled') => { if (ended) return; ended = true; clearTimeout(startTimer); clearTimeout(endTimer); utterance.onstart = null; utterance.onend = null; utterance.onerror = null; finishRef.current = null; utteranceRef.current = null; resolve(result); };
        const startTimer = setTimeout(() => { finish('failed'); window.speechSynthesis.cancel(); }, 3000);
        const endTimer = setTimeout(() => { finish('failed'); window.speechSynthesis.cancel(); }, 120000);
        finishRef.current = () => finish('cancelled');
        utterance.onstart = () => { clearTimeout(startTimer); if (current()) setAudioState('Đang đọc bằng giọng Việt trên thiết bị'); };
        utterance.onend = () => finish('ok'); utterance.onerror = () => finish('failed');
        try { window.speechSynthesis.resume(); window.speechSynthesis.speak(utterance); } catch { finish('failed'); }
      });
      if (!current() || outcome === 'cancelled') return;
      if (outcome === 'ok') { setAudioState('Đã đọc xong'); setNotice(''); return; }
    }
    if (!current()) return;
    if (!cloudAllowed.current || !context.current) { setNotice('Chưa phát được giọng Việt. Chọn Dùng giọng AI.'); setAudioState('Cần bật âm thanh'); return; }
    try {
      setAudioState('Đang tạo giọng Việt AI…');
      let audio = buffers.current.get(text);
      if (!audio) {
        request.current = new AbortController();
        const result = await api<{ audio_base64: string; mime_type: string }>('live-packing/speech', { method: 'POST', signal: request.current.signal, body: JSON.stringify({ text, consent: true }) }, settings.current.csrf);
        if (!current()) return;
        if (result.mime_type !== 'audio/wav' || result.audio_base64.length > 8000000) throw new Error('INVALID_AUDIO');
        const bytes = Uint8Array.from(atob(result.audio_base64), c => c.charCodeAt(0));
        audio = await context.current.decodeAudioData(bytes.buffer);
        if (!current()) return;
        while (buffers.current.size >= 8) buffers.current.delete(buffers.current.keys().next().value!);
        buffers.current.set(text, audio);
      }
      await context.current.resume(); if (!current()) return;
      if (context.current.state !== 'running') throw new Error('AUDIO_BLOCKED');
      const sound = context.current.createBufferSource(); sound.buffer = audio;const level=context.current.createGain();level.gain.value=settings.current.volume;gain.current=level;sound.connect(level);level.connect(context.current.destination); source.current = sound;
      setNotice(''); setAudioState('Đang phát giọng Việt AI');
      await new Promise<void>(resolve => { const timer = setTimeout(() => { sound.onended = null; try { sound.stop(); } catch {} resolve(); }, 130000); const finish = () => { clearTimeout(timer); sound.onended = null; if (source.current === sound) source.current = null; finishRef.current = null; resolve(); }; sound.onended = finish; finishRef.current = finish; sound.start(); });
      if (current()) setAudioState('Đã đọc xong');
    } catch (error) {
      if (!current()) return;
      setAudioState('Chưa phát được âm thanh');
      setNotice(error instanceof Error && error.message === 'AUDIO_BLOCKED' ? 'Cho phép âm thanh rồi thử lại.' : error instanceof Error && !['INVALID_AUDIO'].includes(error.message) ? error.message : 'Không phát được âm thanh. Thử lại hoặc đọc hướng dẫn.');
    }
    } finally {
      if (token === serial.current) { speaking.current = false; if (alive.current) setIsSpeaking(false); }
    }
  }, [cancel]);
  return { speak, cancel, activate, voiceName, audioState, usingCloud, speaking, isSpeaking, notice: enabled ? notice : '' };
}
