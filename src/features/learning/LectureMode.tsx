/** 动画讲解模式: 逐句高亮原文 + 段译文 + TTS 朗读 (纯前端, 数据驱动 142 关通用)。
 *  无 TTS 环境自动降级为静音逐句浏览。 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CanonicalArticle } from '../../types';
import { alignLines, splitSentences } from '../../shared/lib/utils';
import { speak, stopSpeak, ttsSupports } from '../../shared/lib/tts';

interface LectureSentence {
  text: string;
  paraIdx: number;
}

export default function LectureMode({
  article, onClose,
}: {
  article: CanonicalArticle;
  onClose: () => void;
}) {
  // 句子构建: 遍历段落逐句拆
  const { sentences, paraTrans } = useMemo(() => {
    const source = article.reading.paragraphs || [];
    const original = article.reading.original || '';
    // 段原文: start/end 从整篇原文切片, 否则用 fallbackText
    const originals: string[] = [];
    source.forEach((p) => {
      if (typeof p.start === 'number' && typeof p.end === 'number') originals.push(original.slice(p.start, p.end));
      else originals.push(p.fallbackText || '');
    });
    // 段译文: alignLines 按段对齐整篇译文
    const aligned = alignLines(originals.join('\n'), article.reading.translation || '');
    const trans: string[] = originals.map((_, i) => aligned[i]?.trans || '');
    // 逐句拆
    const sents: LectureSentence[] = [];
    originals.forEach((text, idx) => {
      const segs = splitSentences(text);
      for (const s of segs) {
        if (s && s.trim()) sents.push({ text: s.trim(), paraIdx: idx });
      }
    });
    return { sentences: sents, paraTrans: trans };
  }, [article]);

  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const [rate, setRate] = useState(() => {
    try { const v = Number(localStorage.getItem('wyw_tts_rate') || '0.92'); return v > 0 ? v : 0.92; } catch { return 0.92; }
  });
  const currentRef = useRef<HTMLDivElement>(null);
  const playingRef = useRef(false);
  playingRef.current = playing;

  const total = sentences.length;
  const curPara = cur < total ? sentences[cur].paraIdx : (sentences[Math.max(0, total - 1)]?.paraIdx ?? 0);
  const curTrans = paraTrans[curPara] || '';

  // 播放指定句 (句完自动进下句)
  const playAt = (idx: number) => {
    if (idx >= total) { setDone(true); setPlaying(false); return; }
    setCur(idx);
    setDone(false);
    if (!ttsSupports()) return; // 静音模式: 仅移动高亮
    const s = sentences[idx];
    speak(s.text, () => {
      if (playingRef.current) playAt(idx + 1);
      else setPlaying(false);
    }, undefined, rate);
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
      const next = r >= 1.1 ? 0.7 : Math.round((r + 0.1) * 100) / 100;
      try { localStorage.setItem('wyw_tts_rate', String(next)); } catch { /* ignore */ }
      return next;
    });
    if (playing) { stopSpeak(); playAt(cur); } // 重播应用新语速
  };

  // 卸载清理朗读
  useEffect(() => () => { stopSpeak(); }, []);
  // 当前句滚动到视野
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [cur]);

  if (!sentences.length) {
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

        <div className="lec-sentences">
          {sentences.map((s, i) => (
            <div
              key={i}
              ref={i === cur ? currentRef : undefined}
              className={`lec-sentence${i === cur ? ' active' : ''}${i < cur ? ' read' : ''}`}
              onClick={() => jump(i)}
              role="button"
              tabIndex={-1}
            >
              <span className="lec-s-no">{i + 1}</span>
              <span className="lec-s-text">{s.text}</span>
            </div>
          ))}
        </div>

        {curTrans && (
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
