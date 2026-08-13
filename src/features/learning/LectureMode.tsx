/** 动画讲解模式 (重构版): 数据/渲染/控制/练习 分离。
 *  流程 = 纯句子 + 内联字词/重点句/鉴赏增强 + 末尾随堂练习。
 *  视觉: 当前句金色高亮 + 过渡动画; 控制条含句号/重播; 字词可朗读。 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CanonicalArticle } from '../../types';
import { alignLines, splitSentences } from '../../shared/lib/utils';
import { speak, stopSpeak, ttsSupports } from '../../shared/lib/tts';
import { findMoxieArticle } from '../../data/moxie';

// ────────────── 类型与工具 ──────────────
interface Sentence {
  text: string;
  paraIdx: number;
  words: { word: string; answers: string[] }[];
  isKey: boolean;
  keyTrans?: string;
}
interface PracticeItem {
  type: string;
  q: string;
  answers: string[];
}
interface LectureData {
  sentences: Sentence[];
  paraTrans: string[];
  paraAnalysis: string[];
  practice: PracticeItem[];
}

function normAnswer(v: string): string {
  return String(v || '').replace(/[，,。；;！!？?：:、·…—~～"'“”‘’（）()\s]/g, '').toLowerCase();
}
function matchAnswer(input: string, cand: string): boolean {
  if (!input || !cand) return false;
  if (input === cand) return true;
  const [a, b] = input.length <= cand.length ? [input, cand] : [cand, input];
  return a.length >= Math.max(2, Math.ceil(b.length * 0.55)) && b.includes(a);
}

// ────────────── 数据构建 hook ──────────────
function useLectureData(article: CanonicalArticle): LectureData {
  return useMemo(() => {
    const source = article.reading.paragraphs || [];
    const original = article.reading.original || '';
    const originals: string[] = [];
    source.forEach((p) => {
      if (typeof p.start === 'number' && typeof p.end === 'number') originals.push(original.slice(p.start, p.end));
      else originals.push(p.fallbackText || '');
    });
    const aligned = alignLines(originals.join('\n'), article.reading.translation || '');
    const trans: string[] = originals.map((_, i) => aligned[i]?.trans || '');
    const analysis: string[] = originals.map((_, i) => source[i]?.analysis?.trim() || '');

    const moxieArt = findMoxieArticle(article.title);
    const wordItems = (moxieArt?.sections || []).find((s) => s.type === '词义默写')?.items || [];
    const stars = (article as { recitation?: { stars?: Array<{ sentence?: string; translation?: string }> } })
      .recitation?.stars?.filter((x) => x?.sentence) || [];
    const norm = (t: string) => t.replace(/[，,。；;！!？?、·—\-()（）\s]/g, '');

    const sentences: Sentence[] = [];
    originals.forEach((text, idx) => {
      const segs = splitSentences(text).map((s) => s.trim()).filter(Boolean);
      segs.forEach((sent) => {
        const ns = norm(sent);
        const words = wordItems
          .filter((it) => { const w = String((it as any).word || ''); return w && ns.includes(norm(w)); })
          .slice(0, 2)
          .map((it) => ({ word: String((it as any).word || ''), answers: (it.answers || []) as string[] }));
        const keyHit = stars.find((x) => ns.includes(norm(x.sentence || '')) || norm(x.sentence || '').includes(ns));
        sentences.push({ text: sent, paraIdx: idx, words, isKey: !!keyHit, keyTrans: keyHit?.translation });
      });
    });

    const practice: PracticeItem[] = [];
    (moxieArt?.sections || []).forEach((sec) => {
      if (sec.type === '词义默写') return;
      (sec.items || []).slice(0, 8).forEach((it) => {
        practice.push({ type: sec.type, q: it.q, answers: (it.answers || []) as string[] });
      });
    });

    return { sentences, paraTrans: trans, paraAnalysis: analysis, practice: practice.slice(0, 8) };
  }, [article]);
}

// ────────────── 子组件: 句子行 (含内联增强) ──────────────
function SentenceRow({
  s, i, total, isCur, isRead, isLast, analysis, trans, onJump, onSpeakWord,
}: {
  s: Sentence;
  i: number;
  total: number;
  isCur: boolean;
  isRead: boolean;
  isLast: boolean;
  analysis: string;
  trans: string;
  onJump: (i: number) => void;
  onSpeakWord: (word: string) => void;
}) {
  return (
    <div>
      <div ref={isCur ? ((el) => { /* 滚动由父级 currentRef 处理 */ }) : undefined}
        className={`lec-sentence${isCur ? ' active' : ''}${isRead ? ' read' : ''}`}
        onClick={() => onJump(i)} role="button" tabIndex={-1}>
        <span className="lec-s-no">{i + 1}</span>
        <span className="lec-s-text">
          {s.text}
          {s.isKey && <span className="ink-key-badge">重点句</span>}
        </span>
      </div>
      {isCur && (s.words.length > 0 || s.isKey) && (
        <div className="ink-inline">
          {s.words.map((w, wi) => (
            <div className="ink-inline-word" key={wi}>
              <b onClick={() => onSpeakWord(w.word)} title="点击朗读">{w.word} <em>🔊</em></b>
              <span>{(w.answers || []).join('；')}</span>
            </div>
          ))}
          {s.isKey && s.keyTrans && <div className="ink-inline-key">重点句译文：{s.keyTrans}</div>}
        </div>
      )}
      {isCur && isLast && analysis && (
        <div className="ink-inline-analysis">鉴赏：{analysis}</div>
      )}
      {isCur && trans && (
        <div className="lec-inline-trans">译文：{trans}</div>
      )}
    </div>
  );
}

// ────────────── 子组件: 控制条 ──────────────
function LectureBar({
  cur, total, playing, rate, onToggle, onPrev, onNext, onReplay, onJump, onRate,
}: {
  cur: number;
  total: number;
  playing: boolean;
  rate: number;
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onReplay: () => void;
  onJump: (i: number) => void;
  onRate: () => void;
}) {
  return (
    <div className="lec-controls">
      <span className="lec-count">第 {cur + 1}/{total} 句</span>
      <button type="button" className="lec-btn" onClick={onPrev} aria-label="上一句" title="上一句">⏮</button>
      <button type="button" className="lec-btn lec-play" onClick={onToggle} aria-label={playing ? '暂停' : '播放'} title={playing ? '暂停' : '播放'}>
        {playing ? '⏸' : '▶'}
      </button>
      <button type="button" className="lec-btn" onClick={onNext} aria-label="下一句" title="下一句">⏭</button>
      <button type="button" className="lec-btn" onClick={onReplay} aria-label="重播本句" title="重播本句">↻</button>
      <input
        className="lec-range"
        type="range" min={0} max={Math.max(total - 1, 0)} value={cur}
        onChange={(e) => onJump(Number(e.target.value))}
        aria-label="讲解进度"
      />
      <button type="button" className="lec-btn lec-rate" onClick={onRate} title="讲解语速" aria-label="讲解语速">
        {rate}x
      </button>
    </div>
  );
}

// ────────────── 子组件: 随堂练习 ──────────────
function PracticePanel({
  items, state, onCheck, onInput,
}: {
  items: PracticeItem[];
  state: Record<number, { input: string; result: boolean | null }>;
  onCheck: (i: number) => void;
  onInput: (i: number, v: string) => void;
}) {
  return (
    <div className="ink-practice-card">
      <span className="ink-card-tag">随堂练习</span>
      {items.map((p, pi) => {
        const st = state[pi];
        const pd = st?.result !== undefined;
        return (
          <div className="ink-p-item" key={pi}>
            <div className="ink-p-type">{p.type}</div>
            <div className="ink-p-q">{p.q}</div>
            {pd ? (
              <div className={`ink-p-result ${st.result ? 'ok' : 'bad'}`}>
                {st.result ? '✓ 答对' : `✗ 答案：${(p.answers || []).join(' / ')}`}
              </div>
            ) : (
              <div className="ink-p-input-row">
                <input
                  className="ink-p-input"
                  value={st?.input || ''}
                  placeholder="输入答案…"
                  onChange={(e) => onInput(pi, e.target.value)}
                />
                <button type="button" className="ink-p-check" onClick={() => onCheck(pi)}>对答案</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ────────────── 主组件 ──────────────
export default function LectureMode({
  article, onClose,
}: {
  article: CanonicalArticle;
  onClose: () => void;
}) {
  const { sentences, paraTrans, paraAnalysis, practice } = useLectureData(article);
  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const [practiceState, setPracticeState] = useState<Record<number, { input: string; result: boolean | null }>>({});
  const [rate, setRate] = useState(() => {
    try { const v = Number(localStorage.getItem('wyw_tts_rate') || '0.92'); return v > 0 ? v : 0.92; } catch { return 0.92; }
  });
  const playingRef = useRef(false);
  playingRef.current = playing;

  const total = sentences.length;
  const curS = sentences[cur];
  const curPara = curS?.paraIdx ?? 0;
  const curTrans = curS ? (paraTrans[curPara] || '') : '';
  const isLastOfPara = curS ? (sentences[cur + 1]?.paraIdx ?? -1) !== curPara : false;

  const playAt = (idx: number) => {
    if (idx >= total) { setDone(true); setPlaying(false); return; }
    setCur(idx);
    setDone(false);
    const s = sentences[idx];
    if (!s) return;
    const silentAdvance = () => {
      if (playingRef.current) setTimeout(() => playAt(idx + 1), Math.max(1600, s.text.length * 200));
    };
    if (!ttsSupports()) { silentAdvance(); return; }
    speak(s.text, () => { if (playingRef.current) playAt(idx + 1); else setPlaying(false); }, undefined, rate);
  };

  const toggle = () => {
    if (playing) { setPlaying(false); stopSpeak(); }
    else { setPlaying(true); playAt(cur); }
  };
  const next = () => { stopSpeak(); setPlaying(true); playAt(Math.min(cur + 1, total)); };
  const prev = () => { stopSpeak(); setPlaying(true); playAt(Math.max(cur - 1, 0)); };
  const replay = () => { stopSpeak(); setPlaying(true); playAt(cur); };
  const jump = (idx: number) => { stopSpeak(); setPlaying(true); playAt(idx); };
  const changeRate = () => {
    setRate((r) => {
      const nr = r >= 1.1 ? 0.7 : Math.round((r + 0.1) * 100) / 100;
      try { localStorage.setItem('wyw_tts_rate', String(nr)); } catch { /* ignore */ }
      return nr;
    });
    if (playing) { stopSpeak(); playAt(cur); }
  };

  useEffect(() => () => { stopSpeak(); }, []);
  // 当前句滚动到视野
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const active = listRef.current?.querySelector('.lec-sentence.active');
    active?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [cur]);

  const practiceCheck = (idx: number) => {
    const p = practice[idx];
    if (!p) return;
    const input = practiceState[idx]?.input || '';
    const opts = (p.answers || []).map((a) => a.split('|').map(normAnswer)).flat();
    const ok = input !== '' && opts.some((c) => matchAnswer(normAnswer(input), c));
    setPracticeState((s) => ({ ...s, [idx]: { input, result: ok } }));
  };

  if (!total) {
    return (
      <div className="lec-overlay">
        <div className="lec-box">
          <div className="lec-empty">本篇暂无讲解内容</div>
          <div className="lec-controls">
            <button className="lec-btn lec-play" onClick={onClose} aria-label="关闭">关闭</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lec-overlay" data-testid="lecture-mode">
      <div className="lec-box">
        <div className="lec-head">
          <div className="lec-title">📖 动画讲解 · {article.title}</div>
          <div className="lec-progress">{Math.min(cur + 1, total)}/{total}</div>
          <button className="lec-close" onClick={onClose} aria-label="关闭讲解">✕</button>
        </div>

        <div className="lec-sentences" ref={listRef}>
          {sentences.map((s, i) => (
            <SentenceRow
              key={i}
              s={s} i={i} total={total}
              isCur={i === cur} isRead={i < cur}
              isLast={(sentences[i + 1]?.paraIdx ?? -1) !== s.paraIdx}
              analysis={paraAnalysis[s.paraIdx]}
              trans={i === cur ? curTrans : ''}
              onJump={jump}
              onSpeakWord={(w) => { if (ttsSupports()) speak(w, undefined, undefined, rate); }}
            />
          ))}
        </div>

        {done && practice.length > 0 && (
          <div className="lec-practice-wrap">
            <PracticePanel
              items={practice}
              state={practiceState}
              onCheck={practiceCheck}
              onInput={(i, v) => setPracticeState((s) => ({ ...s, [i]: { input: v, result: null } }))}
            />
          </div>
        )}

        <LectureBar
          cur={cur} total={total} playing={playing} rate={rate}
          onToggle={toggle} onPrev={prev} onNext={next}
          onReplay={replay} onJump={jump} onRate={changeRate}
        />
        {done && <div className="lec-done">🎉 本关讲解完毕{practice.length ? ' · 下拉随堂练习' : ''}</div>}
      </div>
    </div>
  );
}
