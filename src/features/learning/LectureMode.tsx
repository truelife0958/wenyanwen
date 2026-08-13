/** 动画讲解模式: 逐句原文+译文 + 内联字词/重点句/鉴赏增强 + 末尾随堂练习。
 *  流程 = 纯句子 (不插步骤), 简洁聚焦; 数据驱动 142 关通用; TTS 朗读; 无 TTS 静音降级自动推进。 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CanonicalArticle } from '../../types';
import { alignLines, splitSentences } from '../../shared/lib/utils';
import { speak, stopSpeak, ttsSupports } from '../../shared/lib/tts';
import { findMoxieArticle } from '../../data/moxie';

interface Sentence {
  text: string;
  paraIdx: number;
  words: { word: string; answers: string[]; stem: string }[];
  isKey: boolean;
  keyTrans?: string;
}
interface PracticeItem {
  type: string;
  q: string;
  answers: string[];
}

// 判分工具 (与 MoxieTrainer 一致)
function normAnswer(v: string): string {
  return String(v || '').replace(/[，,。；;！!？?：:、·…—~～"'“”‘’（）()\s]/g, '').toLowerCase();
}
function matchAnswer(input: string, cand: string): boolean {
  if (!input || !cand) return false;
  if (input === cand) return true;
  const [a, b] = input.length <= cand.length ? [input, cand] : [cand, input];
  return a.length >= Math.max(2, Math.ceil(b.length * 0.55)) && b.includes(a);
}

export default function LectureMode({
  article, onClose,
}: {
  article: CanonicalArticle;
  onClose: () => void;
}) {
  // ── 数据编排: 纯句子 + 内联增强 + 段鉴赏 + 末尾练习 ──
  const { sentences, paraTrans, paraAnalysis, practice } = useMemo(() => {
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

    // 词义题 (重点字词数据源)
    const moxieArt = findMoxieArticle(article.title);
    const wordItems = (moxieArt?.sections || [])
      .find((s) => s.type === '词义默写')?.items || [];
    // 背诵句 (重点句数据源)
    const stars = (article as { recitation?: { stars?: Array<{ sentence?: string; translation?: string; kind?: string }> } })
      .recitation?.stars?.filter((x) => x?.sentence) || [];
    const norm = (t: string) => t.replace(/[，,。；;！!？?、·—\-()（）\s]/g, '');

    const sentences: Sentence[] = [];
    originals.forEach((text, idx) => {
      const segs = splitSentences(text).map((s) => s.trim()).filter(Boolean);
      segs.forEach((sent) => {
        const ns = norm(sent);
        // 内联字词 (最多 2 个)
        const words = wordItems
          .filter((it) => { const w = String((it as any).word || ''); return w && ns.includes(norm(w)); })
          .slice(0, 2)
          .map((it) => ({ word: String((it as any).word || ''), answers: (it.answers || []) as string[], stem: it.q }));
        // 内联重点句
        const keyHit = stars.find((x) => ns.includes(norm(x.sentence || '')) || norm(x.sentence || '').includes(ns));
        sentences.push({
          text: sent, paraIdx: idx,
          words,
          isKey: !!keyHit,
          keyTrans: keyHit?.translation,
        });
      });
    });

    // 末尾练习: 非词义题真题 (最多 8 题)
    const practice: PracticeItem[] = [];
    (moxieArt?.sections || []).forEach((sec) => {
      if (sec.type === '词义默写') return;
      (sec.items || []).slice(0, 8).forEach((it) => {
        practice.push({ type: sec.type, q: it.q, answers: (it.answers || []) as string[] });
      });
    });

    return { sentences, paraTrans: trans, paraAnalysis: analysis, practice: practice.slice(0, 8) };
  }, [article]);

  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const [practiceState, setPracticeState] = useState<Record<number, { input: string; result: boolean | null | undefined }>>({});
  const [rate, setRate] = useState(() => {
    try { const v = Number(localStorage.getItem('wyw_tts_rate') || '0.92'); return v > 0 ? v : 0.92; } catch { return 0.92; }
  });
  const currentRef = useRef<HTMLDivElement>(null);
  const playingRef = useRef(false);
  playingRef.current = playing;

  const total = sentences.length;
  const curS = sentences[cur];
  const curPara = curS?.paraIdx ?? 0;
  const curTrans = curS ? (paraTrans[curPara] || '') : '';
  const isLastOfPara = curS ? (sentences[cur + 1]?.paraIdx ?? -1) !== curPara : false;

  // 播放当前句 (句完自动进下句; 末尾进练习提示)
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
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [cur]);

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

  const practiceCheck = (idx: number, p: PracticeItem) => {
    const input = practiceState[idx]?.input || '';
    const opts = (p.answers || []).map((a) => a.split('|').map(normAnswer)).flat();
    const ok = input !== '' && opts.some((c) => matchAnswer(normAnswer(input), c));
    setPracticeState((s) => ({ ...s, [idx]: { input, result: ok } }));
  };

  return (
    <div className="lec-overlay" data-testid="lecture-mode">
      <div className="lec-box">
        <div className="lec-head">
          <div className="lec-title">📖 动画讲解 · {article.title}</div>
          <div className="lec-progress">{Math.min(cur + 1, total)}/{total}</div>
          <button className="lec-close" onClick={onClose} aria-label="关闭讲解">✕</button>
        </div>

        <div className="lec-sentences">
          {sentences.map((s, i) => {
            const isCur = i === cur;
            const isLast = (sentences[i + 1]?.paraIdx ?? -1) !== s.paraIdx;
            return (
              <div key={i}>
                <div ref={isCur ? currentRef : undefined}
                  className={`lec-sentence${isCur ? ' active' : ''}${i < cur ? ' read' : ''}`}
                  onClick={() => jump(i)} role="button" tabIndex={-1}>
                  <span className="lec-s-no">{i + 1}</span>
                  <span className="lec-s-text">
                    {s.text}
                    {s.isKey && <span className="ink-key-badge">重点句</span>}
                  </span>
                </div>
                {/* 内联增强: 当前句的字词 / 重点句译文 (不占流程步骤) */}
                {isCur && (s.words.length > 0 || s.isKey) && (
                  <div className="ink-inline">
                    {s.words.map((w, wi) => (
                      <div className="ink-inline-word" key={wi}>
                        <b>{w.word}</b><span>{(w.answers || []).join('；')}</span>
                      </div>
                    ))}
                    {s.isKey && s.keyTrans && <div className="ink-inline-key">重点句译文：{s.keyTrans}</div>}
                  </div>
                )}
                {/* 段末鉴赏: 内联小字 */}
                {isCur && isLast && paraAnalysis[s.paraIdx] && (
                  <div className="ink-inline-analysis">鉴赏：{paraAnalysis[s.paraIdx]}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* 随堂练习 (末尾, 可跳过) */}
        {done && practice.length > 0 && (
          <div className="ink-practice-card">
            <span className="ink-card-tag">随堂练习</span>
            {practice.map((p, pi) => {
              const stt = practiceState[pi];
              const pd = stt?.result !== undefined;
              return (
                <div className="ink-p-item" key={pi}>
                  <div className="ink-p-type">{p.type}</div>
                  <div className="ink-p-q">{p.q}</div>
                  {pd ? (
                    <div className={`ink-p-result ${stt.result ? 'ok' : 'bad'}`}>
                      {stt.result ? '✓ 答对' : `✗ 答案：${(p.answers || []).join(' / ')}`}
                    </div>
                  ) : (
                    <div className="ink-p-input-row">
                      <input
                        className="ink-p-input"
                        value={stt?.input || ''}
                        placeholder="输入答案…"
                        onChange={(e) => setPracticeState((s) => ({ ...s, [pi]: { input: e.target.value, result: null } }))}
                      />
                      <button type="button" className="ink-p-check" onClick={() => practiceCheck(pi, p)}>对答案</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {curS && curTrans && !done && (
          <div className="lec-trans">
            <div className="lec-trans-label">译文</div>
            <div className="lec-trans-text">{curTrans}</div>
          </div>
        )}

        <div className="lec-controls">
          <button type="button" className="lec-btn" onClick={prev} aria-label="上一句" title="上一句">⏮</button>
          <button type="button" className="lec-btn lec-play" onClick={toggle} aria-label={playing ? '暂停' : '播放'} title={playing ? '暂停' : '播放'}>
            {playing ? '⏸' : '▶'}
          </button>
          <button type="button" className="lec-btn" onClick={next} aria-label="下一句" title="下一句">⏭</button>
          <input
            className="lec-range"
            type="range" min={0} max={Math.max(total - 1, 0)} value={cur}
            onChange={(e) => jump(Number(e.target.value))}
            aria-label="讲解进度"
          />
          <button type="button" className="lec-btn lec-rate" onClick={changeRate} title="讲解语速" aria-label="讲解语速">
            {rate}x
          </button>
        </div>
        {done && <div className="lec-done">🎉 本关讲解完毕 · 下拉随堂练习</div>}
      </div>
    </div>
  );
}
