import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { CanonicalArticle, CanonicalQuestion, CanonicalWord } from '../../types';
import { alignLines } from '../../shared/lib/utils';
import { getCore } from '../../data';
import { buildPronMap } from '../../shared/lib/pron-dict';
import Modal from '../../shared/ui/Modal';
import { speak, stopSpeak, ttsSupports } from '../../shared/lib/tts';
import GlossPop from './GlossPop';
import { applyTheme, THEME_DARK } from '../../shared/styles/tokens';
import './article.css';
import { examTagFor, examPoints } from '../../data/exam-tags';

const TTS_RATE_KEY = 'wyw_tts_rate';
const FONT_SCALE_KEY = 'wyw_font_scale';
const TTS_RATES = [0.7, 0.92, 1.2] as const;
const FONT_SCALES = [0.9, 1, 1.15] as const;

function loadSetting(key: string, def: number): number {
  try {
    const v = Number(localStorage.getItem(key));
    return Number.isFinite(v) ? v : def;
  } catch { return def; }
}

interface ReaderRow {
  orig: string;
  trans: string;
  analysis: string;
  number?: string;
  start: number;
  end?: number;
}

/** 注释类别: 仅本篇注释(课文注释)加横线; 全局实虚词仅可点击 */
const NOTE_CATEGORY = '课文注释';

/** 注释序号圈号 (1-20) */
const CIRCLED_NUM = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'] as const;

/** 序号 → 圈号 (1-20 用①②…, 21-35 用㉑-㉟, 更大用 (n)) */
function circled(n: number): string {
  if (n <= 20) return CIRCLED_NUM[n - 1];
  if (n <= 35) return String.fromCharCode(0x3251 + n - 21);
  return `(${n})`;
}
/** 是否本篇注释(课文注释)→ 加横线 */
const isNoteWord = (word: CanonicalWord) =>
  word.meanings.some((meaning) => meaning.category === NOTE_CATEGORY);

/** 考试重点类别 */
const EXAM_CATEGORIES = new Set(['通假字', '词类活用', '古今异义', '一词多义', '文言虚词', '重点实词']);

/** 是否重点词(考试类)→ 加粗/变色(不加横线) */
const isKeyWord = (word: CanonicalWord) =>
  word.meanings.some((meaning) => EXAM_CATEGORIES.has(meaning.category));
function wordDescription(word: CanonicalWord): string {
  return word.meanings
    .map((meaning) => `${meaning.category}:${meaning.text}`)
    .join(';');
}

function AnnotText({
  text,
  words,
  active,
  onWordClick,
  noteNums,
  onWordHover,
  paraIndex,
  noteFirst,
}: {
  text: string;
  words: CanonicalWord[];
  active: boolean;
  onWordClick: (word: CanonicalWord, event: React.MouseEvent) => void;
  /** 注释词 → 序号 (圈号角标) */
  noteNums?: Map<string, number>;
  /** hover 显示/隐藏注释 (滑动显示) */
  onWordHover?: (word: CanonicalWord, event: React.MouseEvent, show: boolean) => void;
  /** 当前段落索引 (用于判断是否首次出现, -1 表示不标注角标) */
  paraIndex: number;
  /** 注释词首现位置 { 段落, 偏移 } — 纯计算, 渲染无副作用 */
  noteFirst: Map<string, { para: number; offset: number }>;
}) {
  const pronunciation = useMemo(() => buildPronMap(text), [text]);
  const sorted = useMemo(() => [...words].sort((a, b) => b.word.length - a.word.length), [words]);
  const nodes: React.ReactNode[] = [];
  let index = 0;

  const renderChars = (value: string, start: number) => [...value].map((char, offset) => {
    const pron = pronunciation.get(start + offset);
    return pron ? <span className="pron-char" key={offset}>{char}<em>({pron})</em></span> : <span key={offset}>{char}</span>;
  });

  while (index < text.length) {
    const matched = sorted.find((word) => word.word && text.startsWith(word.word, index));
    if (matched) {
      // 是否本词在原文的首次出现位置 (重复不标)
      const firstPos = noteFirst.get(matched.id);
      const isFirst = firstPos !== undefined && firstPos.para === paraIndex && firstPos.offset === index;
      if (isFirst) {
        // 首次出现: 标注(角标 + 可点/hover); 后续出现: 纯文本, 不重复标注
        const num = noteNums?.get(matched.id);
        nodes.push(
          <span
            className={`annot-gloss${isNoteWord(matched) ? ' note' : ''}${isKeyWord(matched) ? ' key' : ''}${active ? ' on' : ''}`}
            key={`${index}:${matched.id}`}
            onClick={(event) => onWordClick(matched, event)}
            onMouseEnter={(event) => onWordHover?.(matched, event, true)}
            onMouseLeave={(event) => onWordHover?.(matched, event, false)}
          >
            {renderChars(matched.word, index)}
            {num != null && <sup className="annot-no">{circled(num)}</sup>}
          </span>
        );
      } else {
        nodes.push(<span key={`${index}:${matched.id}`}>{renderChars(matched.word, index)}</span>);
      }
      index += matched.word.length;
      continue;
    }
    nodes.push(<span key={index}>{renderChars(text[index], index)}</span>);
    index += 1;
  }
  return <>{nodes}</>;
}

function NoteList({ article, words, noteNums }: { article: CanonicalArticle; words: CanonicalWord[]; noteNums?: Map<string, number> }) {
  const [open, setOpen] = useState(false);
  const noteWords = useMemo(() => words.filter((w) => w.meanings.some((m) => m.category === NOTE_CATEGORY)), [words]);
  if (!noteWords.length) return null;
  return (
    <section className="note-list">
      <button type="button" className="note-list-head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span>本篇注释({noteWords.length} 词)</span>
        <span className="note-list-caret" aria-hidden="true">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="note-list-body">
          {noteWords.map((word) => (
            <div className="note-row" key={word.id}>
              <strong className="note-word">
                {noteNums?.get(word.id) != null && <sup className="annot-no">{circled(noteNums?.get(word.id) || 1)}</sup>}
                {word.word}
              </strong>
              <span className="note-meaning">
                {word.meanings.map((meaning, index) => (
                  <span key={`${meaning.category}:${index}`} className="note-meaning-item">
                    <i className="note-kind">{meaning.category}</i>
                    {meaning.text}
                    {meaning.example ? <em className="note-example">〔{meaning.example}〕</em> : null}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function ArticleReader({
  article,
  compact = false,
}: {
  article: CanonicalArticle;
  compact?: boolean;
}) {
  const [gloss, setGloss] = useState<{ text?: string; word?: CanonicalWord; x: number; y: number } | null>(null);
  const [reading, setReading] = useState(false);
  // 朗读语速 / 字号 / 主题 (持久化, 阅读体验打磨)
  const [ttsRate, setTtsRate] = useState<number>(() => loadSetting(TTS_RATE_KEY, 0.92));
  const [fontScale, setFontScale] = useState<number>(() => loadSetting(FONT_SCALE_KEY, 1));
  const [dark, setDark] = useState<boolean>(() => { try { return localStorage.getItem('wyw_theme') === THEME_DARK; } catch { return false; } });
  const [activeRow, setActiveRow] = useState(-1);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(() => new Set());
  // 背诵引导弹窗: 点击原文五角星 (背诵默写句) 弹出
  const [guideStar, setGuideStar] = useState<{ sentence: string; translation?: string; kind?: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const original = article.reading.original;
  const words = useMemo(() => getCore()?.articleWordsOf(article.id) || [], [article.id]);
  const examTag = useMemo(() => examTagFor(article.title), [article.title]);
  const reciteStars = useMemo(
    () => (article as { recitation?: { stars?: Array<{ sentence?: string; translation?: string; kind?: string }> } }).recitation?.stars?.filter((x) => x?.sentence) || [],
    [article],
  );
  const rows = useMemo<ReaderRow[]>(() => {
    const source = article.reading.paragraphs;
    const originals = source.map((row) => {
      if (typeof row.start === 'number' && typeof row.end === 'number') return original.slice(row.start, row.end);
      return row.fallbackText || '';
    });
    const aligned = alignLines(originals.join('\n'), article.reading.translation);
    let rows = source.map((row, index) => ({
      orig: originals[index],
      trans: row.translation || aligned[index]?.trans || '',
      analysis: row.analysis || '',
      number: row.number,
      start: row.start ?? -1,
      end: row.end,
    })).filter((row) => row.orig || row.analysis);
    // 分句均匀化: 丢弃完全重复段(数据层 bug 产物), 合并以逗号/分号结尾的残句
    const merged: ReaderRow[] = [];
    const seen = new Set<string>();
    for (const row of rows) {
      const key = row.orig.trim();
      if (!key) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      if (merged.length) {
        const prev = merged[merged.length - 1];
        if (!prev.analysis && !row.analysis && /[,;，；：:]$/.test(prev.orig.trim())) {
          prev.orig = prev.orig + row.orig;
          prev.trans = (prev.trans + row.trans).trim();
          prev.end = row.end;
          continue;
        }
      }
      merged.push({ ...row });
    }
    return merged;
  }, [article.reading.paragraphs, article.reading.translation, original])
;


  const onWordClick = useCallback((word: CanonicalWord, event: React.MouseEvent) => {
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const container = containerRef.current?.getBoundingClientRect();
    setGloss({
      word,
      x: rect.left - (container?.left || 0) + rect.width / 2,
      y: rect.bottom - (container?.top || 0) + 6,
    });
  }, []);

  // 注释词 → 序号 (按原文首次出现顺序, 与原文角标/注释列表对应)
  const noteNums = useMemo(() => {
    const map = new Map<string, number>();
    const seen = new Set<string>();
    let n = 0;
    const sorted = [...words].sort((a, b) => b.word.length - a.word.length);
    const scan = (text: string) => {
      let i = 0;
      while (i < text.length) {
        const m = sorted.find((w) => w.word && text.startsWith(w.word, i));
        if (m) {
          if (!seen.has(m.id) && isNoteWord(m)) { seen.add(m.id); map.set(m.id, ++n); }
          i += m.word.length;
        } else i += 1;
      }
    };
    rows.forEach((r) => scan(r.orig || ''));
    return map;
  }, [rows, words]);

  // 注释词首现位置 (纯计算: 段落索引 + 偏移, 渲染时判断重复不标)
  const noteFirst = useMemo(() => {
    const map = new Map<string, { para: number; offset: number }>();
    const seen = new Set<string>();
    const sorted = [...words].sort((a, b) => b.word.length - a.word.length);
    rows.forEach((r, pi) => {
      const text = r.orig || '';
      let i = 0;
      while (i < text.length) {
        const m = sorted.find((w) => w.word && text.startsWith(w.word, i));
        if (m) {
          if (!seen.has(m.id) && isNoteWord(m)) { seen.add(m.id); map.set(m.id, { para: pi, offset: i }); }
          i += m.word.length;
        } else i += 1;
      }
    });
    return map;
  }, [rows, words]);

  // 滑动显示注释 (hover 显示, 离开延迟关闭)
  const hoverTimer = useRef<number | null>(null);
  const onWordHover = useCallback((word: CanonicalWord, event: React.MouseEvent, show: boolean) => {
    if (!show) {
      if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
      hoverTimer.current = window.setTimeout(() => setGloss(null), 260);
      return;
    }
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const container = containerRef.current?.getBoundingClientRect();
    setGloss({
      word,
      x: rect.left - (container?.left || 0) + rect.width / 2,
      y: rect.bottom - (container?.top || 0) + 6,
    });
  }, []);
  useEffect(() => {
    if (!gloss) return;
    const close = () => setGloss(null);
    document.addEventListener('click', close);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [gloss]);

  const toggleRead = () => {
    if (!ttsSupports()) return;
    if (reading) {
      stopSpeak();
      setReading(false);
      setActiveRow(-1);
      return;
    }
    const prefix = `${article.title}。${article.author || ''}。`;
    setReading(true);
    setActiveRow(0);
    speak(prefix + original, () => {
      setReading(false);
      setActiveRow(-1);
    }, (charIndex) => {
      const position = Math.max(0, charIndex - prefix.length);
      let hit = 0;
      for (let index = rows.length - 1; index >= 0; index--) {
        if (rows[index].start >= 0 && rows[index].start <= position) { hit = index; break; }
      }
      setActiveRow(hit);
    }, ttsRate);
  };
  useEffect(() => () => stopSpeak(), [article.id]);
  // 卸载时清理 hover 计时器 (R4/M1)
  useEffect(() => () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
  }, []);
  useEffect(() => {
    if (activeRow >= 0) rowRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [activeRow]);

  const toggleRow = (index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="article" ref={containerRef}>
      {!compact && (
        <div className="article-head">
          <div className="article-head-row">
            <div>
              <h2 className="article-title">{article.title}</h2>
              <p className="article-meta">{[article.dynasty, article.author, article.origin, article.grade].filter(Boolean).join(' · ')}</p>
            </div>
            {ttsSupports() && (
              <button className={`read-btn${reading ? ' on' : ''}`} onClick={toggleRead} aria-label={reading ? '停止朗读' : '朗读原文'}>
                {reading ? '■ 停止' : '▶ 朗读'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 朗读控制条 */}
      {compact && ttsSupports() && (
        <div className={`read-bar${reading ? ' on' : ''}`}>
          <button className="read-btn" onClick={toggleRead} aria-label={reading ? '停止朗读' : '朗读全文'}>
            {reading ? '■ 停止' : '▶ 朗读全文'}
          </button>
          <span className="read-hint">{reading ? '正在朗读 · 高亮跟随' : '听朗读,边听边看'}</span>
          <span className="read-tools" aria-label="朗读与阅读设置">
            <button
              type="button"
              className="rt-btn"
              onClick={() => {
                const next = TTS_RATES[(TTS_RATES.indexOf(ttsRate as (typeof TTS_RATES)[number]) + 1) % TTS_RATES.length];
                setTtsRate(next);
                try { localStorage.setItem(TTS_RATE_KEY, String(next)); } catch { /* ignore */ }
                if (reading) { stopSpeak(); toggleRead(); } // 重新朗读应用新语速
              }}
              title="朗读语速"
              aria-label="朗读语速"
            >
              语速 {ttsRate}x
            </button>
            <button
              type="button"
              className="rt-btn"
              onClick={() => {
                const next = FONT_SCALES[(FONT_SCALES.indexOf(fontScale as (typeof FONT_SCALES)[number]) + 1) % FONT_SCALES.length];
                setFontScale(next);
                try { localStorage.setItem(FONT_SCALE_KEY, String(next)); } catch { /* ignore */ }
              }}
              title="正文字号"
              aria-label="正文字号"
            >
              字号 {Math.round(fontScale * 100)}%
            </button>
            <button
              type="button"
              className="rt-btn"
              onClick={() => { applyTheme(dark ? 'light' : THEME_DARK); setDark(!dark); }}
              title={dark ? '切换到白天' : '切换到夜间'}
              aria-label={dark ? '切换到白天' : '切换到夜间'}
            >
              {dark ? '☀' : '🌙'}
            </button>
          </span>
        </div>
      )}

      <div className="article-body" style={{ '--reader-scale': String(fontScale) } as React.CSSProperties}>
        <main className="article-main">
          {rows.length ? (
            <div className="para-list">
              {rows.map((row, index) => (
                <div className={`para-block${activeRow === index ? ' reading-para' : ''}`} key={index} ref={activeRow === index ? rowRef : undefined}>
                  <div className="para-orig">
                    <AnnotText text={row.orig} words={words} active={reading} onWordClick={onWordClick} noteNums={noteNums} onWordHover={onWordHover} paraIndex={index} noteFirst={noteFirst} />
                    {/* 背诵默写句: 以五角星标在原文句子右边 (2026-08) */}
                    {(() => {
                      // 归一化匹配: 句内全/半角标点差异 (如 , vs ，) 不影响命中
                      const normStar = (t: string) => t.replace(/[，,。；;！!？?、·—\-()（）\s]/g, '');
                      const paraNorm = normStar(row.orig || '');
                      const stars = reciteStars.filter((x) => paraNorm.includes(normStar(x.sentence || '')));
                      return stars.length ? (
                        <span className="para-recite-marks">
                          {stars.map((s, i) => (
                            <button
                              key={i}
                              type="button"
                              className="recite-star"
                              title="查看背诵学习引导"
                              aria-label={`背诵学习引导：${String(s.sentence || '')}`}
                              onClick={(e) => { e.stopPropagation(); setGuideStar({ sentence: String(s.sentence || ''), translation: s.translation, kind: s.kind }); }}
                            >★</button>
                          ))}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <div className="para-extra">
                    {row.trans && (
                      <button
                        type="button"
                        className={`para-toggle${expandedRows.has(index) ? ' on' : ''}`}
                        onClick={() => toggleRow(index)}
                      >
                        <span className="pt-icon" aria-hidden="true">{expandedRows.has(index) ? '▾' : '▸'}</span>
                        <span>{expandedRows.has(index) ? '收起译文' : '查看译文'}</span>
                      </button>
                    )}
                    {expandedRows.has(index) && row.trans && (
                      <div className="para-trans">{row.trans}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
            <p className="orig-sent"><AnnotText text={original} words={words} active={reading} onWordClick={onWordClick} noteNums={noteNums} onWordHover={onWordHover} paraIndex={-1} noteFirst={noteFirst} /></p>
            <p className="trans-line">{article.reading.translation}</p>
            </div>
          )}
          </main>

          {gloss && (
            gloss.word ? (
              <div className="gloss-pop word-card-pop" style={{ left: gloss.x, top: gloss.y }} onClick={(e) => e.stopPropagation()}>
                <div className="word-pop-head">
                  <b className="word-pop-char">{gloss.word.word}</b>
                  <span className="word-pop-count">{gloss.word.meanings.length} 义</span>
                </div>
                <div className="word-pop-meanings">
                  {gloss.word.meanings.map((m, i) => (
                    <div className="word-pop-m" key={i}>
                      {m.category && <em className="word-pop-cat">{m.category}</em>}
                      <span>{m.text}</span>
                      {m.example && <span className="word-pop-ex">例：{m.example}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <GlossPop text={gloss.text || ''} x={gloss.x} y={gloss.y} />
            )
          )}

          {/* 中考核心考点 (must/core 篇目才显示) */}
          {examTag && (
            <section className="reader-exam-card">
              <div className="exam-card-head">
                <span className={`exam-card-badge ${examTag}`}>{examTag === 'must' ? '中考必考' : '中考核心'}</span>
                <span className="exam-card-title">核心考点 · 应知应会</span>
              </div>
              <ul className="exam-points">
                {examPoints(article.title).map((pt, idx) => (
                  <li key={idx}><span className="ep-bullet">▸</span>{pt}</li>
                ))}
              </ul>
            </section>
          )}

          {/* 本篇注释清单 */}
          <NoteList article={article} words={words} noteNums={noteNums} />
      </div>

      {/* 背诵学习引导: 点击原文五角星弹出 */}
      <Modal
        open={!!guideStar}
        onClose={() => setGuideStar(null)}
        overlayClassName="recite-guide-modal"
        boxClassName="recite-guide-box"
        ariaLabel="背诵学习引导"
      >
        {guideStar && (
          <div className="recite-guide">
            <div className="rg-head">
              <span className="rg-title">⭐ 背诵学习引导</span>
              {guideStar.kind && <span className="rg-kind">{guideStar.kind}</span>}
              <button type="button" className="rg-close" onClick={() => setGuideStar(null)} aria-label="关闭">✕</button>
            </div>
            <p className="rg-sentence">{guideStar.sentence}</p>
            {guideStar.translation && <p className="rg-trans">{guideStar.translation}</p>}
            <div className="rg-actions">
              <Link className="btn btn-primary" to={`/moxie/${encodeURIComponent(article.title)}`}>去默写训练 →</Link>
              <button type="button" className="btn btn-ghost" onClick={() => setGuideStar(null)}>知道了</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}