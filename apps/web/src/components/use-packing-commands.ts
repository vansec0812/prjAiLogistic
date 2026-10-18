'use client';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { PackingCommandListener, type CommandRecognition, type PackingIntent } from '../lib/packing-voice-commands';

type SpeechWindow = Window & { SpeechRecognition?: new () => CommandRecognition; webkitSpeechRecognition?: new () => CommandRecognition };
export function usePackingCommands(options: { ready: boolean; paused: boolean; speaking: RefObject<boolean>; onCommand: (intent:PackingIntent,transcript:string) => void }) {
  const [enabled, setEnabled] = useState(false), [supported, setSupported] = useState(false), [state, setState] = useState('Đã tắt nghe lệnh'), [error, setError] = useState('');
  const latest = useRef(options); latest.current = options;
  const listener = useRef<PackingCommandListener | null>(null), alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const host = window as SpeechWindow, Constructor = host.SpeechRecognition || host.webkitSpeechRecognition;
    setSupported(!!Constructor && window.isSecureContext);
    if (Constructor && window.isSecureContext) listener.current = new PackingCommandListener({
      factory: () => new Constructor(),
      allowed: () => alive.current && latest.current.ready && !latest.current.paused && !latest.current.speaking.current && !document.hidden,
      onCommand: (intent,transcript) => latest.current.onCommand(intent,transcript),
      onState: value => { if (alive.current) setState(value); },
      onError: value => { if (alive.current) { setError(value); setEnabled(false); } }
    });
    const hide = () => { if (document.hidden) { listener.current?.disable(); setEnabled(false); } };
    document.addEventListener('visibilitychange', hide);
    return () => { alive.current = false; listener.current?.disable(); listener.current = null; document.removeEventListener('visibilitychange', hide); };
  }, []);
  const disable = useCallback(() => { listener.current?.disable(); if (alive.current) setEnabled(false); }, []);
  const suspend = useCallback(() => listener.current?.suspend(), []);
  const resume = useCallback(() => listener.current?.resume(), []);
  const enable = useCallback(() => {
    if (!listener.current || !latest.current.ready) return;
    setError(''); setEnabled(true); listener.current.enable();
  }, []);
  useEffect(() => {
    if (!enabled) return;
    if (!options.ready) { disable(); return; }
    if (options.paused || options.speaking.current) listener.current?.suspend();
    else listener.current?.resume();
  }, [enabled, options.ready, options.paused, options.speaking, disable]);
  return { enabled, supported, state, error, enable, disable, suspend, resume };
}
