export function vietnameseVoice<T extends { lang: string; default?: boolean; localService?: boolean }>(voices: T[]): T | null {
  const candidates = voices.filter(voice => /^vi(?:-|$)/i.test(voice.lang.replaceAll('_', '-')));
  return candidates.find(voice => voice.default) || candidates.find(voice => voice.localService) || candidates[0] || null;
}
