/** 朗读 (Web Speech API) — 通假字/多音字读音已通过 pron-dict 在发声前预处理 */

/** 浏览器是否支持 SpeechSynthesis */
export function ttsSupports(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.speechSynthesis.speak === 'function';
}

/** 选取最佳中文语音（优先 zh-CN 女声/MarshalFF） */
let cachedVoice: SpeechSynthesisVoice | null | undefined;
export function getBestVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined) return cachedVoice;
  if (!ttsSupports()) return (cachedVoice = null);
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  // 优先 zh-CN 系
  const cn = voices.find((v) => v.lang === 'zh-CN') ||
             voices.find((v) => v.lang.startsWith('zh')) ||
             voices.find((v) => /Chinese|中文|cmn|Mandarin/i.test(v.name));
  cachedVoice = cn || voices[0];
  return cachedVoice;
}

if (ttsSupports()) {
  window.speechSynthesis.onvoiceschanged = () => { cachedVoice = undefined; };
}

let currentUtter: SpeechSynthesisUtterance | null = null;

/** 预处理原文：替换通假字/多音字为发音字的汉字 */
import { PRON_DICT } from './pron-dict';
function normalizePron(text: string): string {
  let out = '';
  let i = 0;
  while (i < text.length) {
    let matched = false;
    for (const e of PRON_DICT) {
      if (!e.replace) continue;
      if (e.context) {
        const ctx = text.substring(Math.max(0, i - e.context.length), i + e.context.length + e.char.length);
        if (!ctx.includes(e.context)) continue;
      }
      if (text.startsWith(e.char, i)) {
        // 不替换汉字本身（保留原文可视化），但通过 phoneme 影响发音：发出"replace"字的音
        out += e.replace;
        i += e.char.length;
        matched = true;
        break;
      }
    }
    if (!matched) { out += text[i]; i++; }
  }
  return out;
}

/** 朗读文本：通假字/多音字预处理后送 TTS；边界回调可用于高亮；rate 语速 (默认 0.92 便于文言文) */
export function speak(text: string, onEnd?: () => void, onBoundary?: (charIdx: number) => void, rate = 0.92) {
  if (!ttsSupports()) return;
  stopSpeak();
  // 预处理发音（替换通假字为发声音字）
  const normalized = normalizePron(text);
  const u = new SpeechSynthesisUtterance(normalized);
  const v = getBestVoice();
  if (v) u.voice = v;
  u.lang = v?.lang || 'zh-CN';
  u.rate = rate;  // 语速可调 (默认 0.92 便于文言文)
  u.pitch = 1.0;
  if (onEnd) u.onend = onEnd;
  if (onBoundary) u.onboundary = (ev) => onBoundary(ev.charIndex || 0);
  currentUtter = u;
  window.speechSynthesis.speak(u);
}

export function stopSpeak() {
  if (!ttsSupports()) return;
  try { window.speechSynthesis.cancel(); } catch { /* noop */ }
  currentUtter = null;
}

export function isSpeaking(): boolean {
  return ttsSupports() && window.speechSynthesis.speaking;
}
