/** 动画讲解模式 (五段式): 逐句原文+译文 → 重点字词 → 重点句 → 鉴赏 → 随堂练习。
 *  数据驱动 142 关通用; TTS 朗读; three.js 粒子特效 (inkBurst); 无 TTS 静音降级。 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CanonicalArticle } from '../../types';
import { alignLines, splitSentences } from '../../shared/lib/utils';
import { speak, stopSpeak, ttsSupports } from '../../shared/lib/tts';
import { findMoxieArticle } from '../../data/moxie';
import { inkBurst } from '../ink/InkScene';

type StepKind = 'sentence' | 'word' | 'key' | 'analysis' | 'practice';
interface Step {
  kind: StepKind;
  text: string;
  paraIdx?: number;
  word?: string;
  answers?: string[];
  stem?: string;
  trans?: string;
  practice?: PracticeItem[];
  key: string;
}
interface PracticeItem {
  type: string;
  q: string;
  answers: string[];
  word?: string;
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
  // ── 数据编排: 句子流 + 内容卡 ──
  const { steps, paraTrans } = useMemo(() => {
    const source = article.reading.paragraphs || [];
    const original = article.reading.original || '';
    const originals: string[] = [];
    source.forEach((p) => {
      if (typeof p.start === 'number' && typeof p.end === 'number') originals.push(original.slice(p.start, p.end));
      else originals.push(p.fallbackText || '');
    });
    const aligned = alignLines(originals.join('\n'), article.reading.translation || '');
    const trans: string[] = originals.map((_, i) => aligned[i]?.trans || '');

    // 词义题 (重点字词数据源)
    const moxieArt = findMoxieArticle(article.title);
    const wordItems = (moxieArt?.sections || [])
      .find((s) => s.type === '词义默写')?.items || [];
    // 背诵句 (重点句数据源)
    const stars = (article as { recitation?: { stars?: Array<{ sentence?: string; translation?: string; kind?: string }> } })
      .recitation?.stars?.filter((x) => x?.sentence) || [];
    const norm = (t: string) => t.replace(/[，,。；;！!？?、·—\-()（）\s]/g, '');

    // 句子 → 关联词义题 (word 出现在句文本)
    const wordForSentence = (sent: string): typeof wordItems => {
      const ns = norm(sent);
      return wordItems.filter((it) => {
        const w = String((it as any).word || '');
        return w && ns.includes(norm(w));
      });
    };
    // 句子是否背诵句
    const keyForSentence = (sent: string) => {
      const ns = norm(sent);
      return stars.find((x) => ns.includes(norm(x.sentence || '')) || norm(x.sentence || '').includes(ns));
    };

    const steps: Step[] = [];
    originals.forEach((text, idx) => {
      const segs = splitSentences(text).map((s) => s.trim()).filter(Boolean);
      segs.forEach((sent, si) => {
        const sKey = `s-${idx}-${si}`;
        steps.push({ kind: 'sentence', text: sent, paraIdx: idx, key: sKey });
        // 重点字词卡 (每句最多 2 张, 避免流程过长)
        for (const wi of wordForSentence(sent).slice(0, 2)) {
          steps.push({
            kind: 'word', text: String((wi as any).word || ''), paraIdx: idx,
            word: String((wi as any).word || ''),
            answers: (wi.answers || []) as string[],
            stem: wi.q, key: `w-${sKey}-${(wi as any).qid || steps.length}`,
          });
        }
        // 重点句卡
        const keyHit = keyForSentence(sent);
        if (keyHit) {
          steps.push({
            kind: 'key', text: sent, paraIdx: idx,
            trans: keyHit.translation, key: `k-${sKey}`,
          });
        }
      });
      // 鉴赏卡 (段末)
      const analysis = source[idx]?.analysis;
      if (analysis && analysis.trim()) {
        steps.push({ kind: 'analysis', text: analysis.trim(), paraIdx: idx, key: `a-${idx}` });
      }
    });

    // 随堂练习卡: 本关全部题型题
    const practice: PracticeItem[] = [];
    (moxieArt?.sections || []).forEach((sec) => {
      if (sec.type === '词义默写') return; // 词义已在前文讲解
      (sec.items || []).slice(0, 6).forEach((it) => {
        practice.push({ type: sec.type, q: it.q, answers: (it.answers || []) as string[], word: (it as any).word });
      });
    });
    if (practice.length) {
      steps.push({ kind: 'practice', text: '', key: 'practice', practice });
    }

    return { steps, paraTrans: trans };
  }, [article]);

  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const [practiceState, setPracticeState] = useState<Record<string, { input: string; result: boolean | null }>>({});
  const [rate, setRate] = useState(() => {
    try { const v = Number(localStorage.getItem('wyw_tts_rate') || '0.92'); return v > 0 ? v : 0.92; } catch { return 0.92; }
  });
  const currentRef = useRef<HTMLDivElement>(null);
  const playingRef = useRef(false);
  playingRef.current = playing;

  const total = steps.length;
  const curStep = steps[cur];
  const curPara = curStep?.paraIdx ?? 0;
  const curTrans = curStep?.kind === 'sentence' ? (paraTrans[curPara] || '') : '';

  // 播放当前步
  const playAt = (idx: number) => {
    if (idx >= total) { setDone(true); setPlaying(false); return; }
    setCur(idx);
    setDone(false);
    inkBurst(); // 3D 粒子特效
    const st = steps[idx];
    if (!st) return;
    // 静音推进: 无 TTS 时按文本时长自动定时 (每字 ~200ms, 最短 1.6s), 支持自动连播
    const silentAdvance = () => {
      if (playingRef.current) setTimeout(() => playAt(idx + 1), Math.max(1600, (st.text?.length || 8) * 200));
    };
    if (!ttsSupports()) { silentAdvance(); return; }
    if (st.kind === 'sentence') speak(st.text, () => { if (playingRef.current) playAt(idx + 1); else setPlaying(false); }, undefined, rate);
    else if (st.kind === 'word') speak(st.word || '', () => { if (playingRef.current) playAt(idx + 1); else setPlaying(false); }, undefined, rate);
    else if (st.kind === 'key') speak(st.text, () => { if (playingRef.current) playAt(idx + 1); else setPlaying(false); }, undefined, rate);
    else { silentAdvance(); } // analysis/practice: 停留片刻后自动进
  };

  const toggle = () => {
    if (playing) { setPlaying(false); stopSpeak(); }
    else { setPlaying(true); playAt(cur); }
  };
  const next = () => { stopSpeak(); setPlaying(true); playAt(Math.min(cur + 1, total - 1)); };
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

  // 随堂练习判分
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
          {steps.map((st, i) => {
            const isCur = i === cur;
            if (st.kind === 'sentence') {
              return (
                <div key={st.key} ref={isCur ? currentRef : undefined}
                  className={`lec-sentence${isCur ? ' active' : ''}${i < cur ? ' read' : ''}`}
                  onClick={() => jump(i)} role="button" tabIndex={-1}>
                  <span className="lec-s-no">{i + 1}</span>
                  <span className="lec-s-text">{st.text}</span>
                </div>
              );
            }
            if (st.kind === 'word') {
              return (
                <div key={st.key} ref={isCur ? currentRef : undefined}
                  className={`ink-card ink-word-card${isCur ? ' active' : ''}`} onClick={() => jump(i)} role="button" tabIndex={-1}>
                  <span className="ink-card-tag">重点字词</span>
                  <div className="ink-word-main"><b>{st.word}</b></div>
                  <div className="ink-word-mean">{(st.answers || []).join('；')}</div>
                  {st.stem && <div className="ink-word-stem">{st.stem}</div>}
                </div>
              );
            }
            if (st.kind === 'key') {
              return (
                <div key={st.key} ref={isCur ? currentRef : undefined}
                  className={`ink-card ink-key-card${isCur ? ' active' : ''}`} onClick={() => jump(i)} role="button" tabIndex={-1}>
                  <span className="ink-card-tag">重点句</span>
                  <div className="ink-key-text">{st.text}</div>
                  {st.trans && <div className="ink-key-trans">{st.trans}</div>}
                </div>
              );
            }
            if (st.kind === 'analysis') {
              return (
                <div key={st.key} ref={isCur ? currentRef : undefined}
                  className={`ink-card ink-analysis-card${isCur ? ' active' : ''}`} onClick={() => jump(i)} role="button" tabIndex={-1}>
                  <span className="ink-card-tag">鉴赏</span>
                  <div className="ink-analysis-text">{st.text}</div>
                </div>
              );
            }
            // practice
            return (
              <div key={st.key} ref={isCur ? currentRef : undefined}
                className={`ink-card ink-practice-card${isCur ? ' active' : ''}`} onClick={() => jump(i)} role="button" tabIndex={-1}>
                <span className="ink-card-tag">随堂练习</span>
                {(st.practice || []).map((p, pi) => {
                  const stt = practiceState[pi];
                  const done = stt?.result !== undefined;
                  return (
                    <div className="ink-p-item" key={pi}>
                      <div className="ink-p-type">{p.type}</div>
                      <div className="ink-p-q">{p.q}</div>
                      {done ? (
                        <div className={`ink-p-result ${stt.result ? 'ok' : 'bad'}`}>
                          {stt.result ? '✓ 答对' : `✗ 答案：${(p.answers || []).join(' / ')}`}
                        </div>
                      ) : (
                        <div className="ink-p-input-row">
                          <input
                            className="ink-p-input"
                            value={stt?.input || ''}
                            placeholder="输入答案…"
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setPracticeState((s) => ({ ...s, [pi]: { input: e.target.value, result: undefined } }))}
                          />
                          <button type="button" className="ink-p-check" onClick={(e) => { e.stopPropagation(); practiceCheck(pi, p); }}>对答案</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {curStep?.kind === 'sentence' && curTrans && (
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
        {done && <div className="lec-done">🎉 本关讲解完毕</div>}
      </div>
    </div>
  );
}
