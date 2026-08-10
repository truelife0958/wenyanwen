/**
 * 字词页 — 核心实词虚词精选 + 分类列表展示 (少而精, 覆盖高频必考)。
 * 词库 = 全库 global 实词/虚词表 (86 核心词, 含义项/例句/出处篇目)。
 * 展示: 实词/虚词 分类 tab + 词条卡片 (点开展开全部义项)。
 * 另保留"背诵原文"入口 (原文逐句 → 译文)。
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCore } from '../../data';
import Modal from '../../shared/ui/Modal';
import EmptyState from '../../shared/ui/EmptyState';
import './flashcard.css';

/** 义项序号圈号 (1-20) */
const CIRCLED_NUM = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'] as const;
/** 核心词条: 词 + 分类 + 义项集 */
export interface VocabEntry {
  id: string;
  word: string;
  category: '实词' | '虚词';
  senses: Array<{ text: string; example?: string; origin?: string }>;
  articleCount: number;
}

/** 精选核心实虚词 (global 词表, 全库高频必考) */
export function buildCoreVocab(words: NonNullable<ReturnType<typeof useCore>>['words']): VocabEntry[] {
  return words
    .filter((w) => w.scope === 'global')
    .map((w) => {
    const category: '实词' | '虚词' = w.meanings.some((m) => m.category === '实词') ? '实词' : '虚词';
    const articles = new Set<string>();
    const senses = w.meanings.map((m) => {
      if (m.origin) articles.add(m.origin);
      return { text: m.text, example: m.example, origin: m.origin };
    });
    return {
      id: w.id,
      word: w.word,
      category,
      senses,
      articleCount: articles.size,
    };
  });
}

/** 背诵句卡 (原文逐句 → 译文) */
export interface ReciteCard {
  id: string;
  sentence: string;
  translation: string;
  article: string;
  kind: string;
}

export function buildReciteQueue(learningArticles: NonNullable<ReturnType<typeof useCore>>['learningArticles']): ReciteCard[] {
  const out: ReciteCard[] = [];
  for (const a of learningArticles) {
    for (const s of (a as { recitation?: { stars?: Array<{ sentence?: string; translation?: string; kind?: string }> } }).recitation?.stars || []) {
      if (!s?.sentence) continue;
      const t = (s.translation || '').trim();
      const translation = t.length > 80 ? t.slice(0, 80) + '…' : t || '——';
      out.push({ id: `${a.id}:${out.length}`, sentence: s.sentence, translation, article: a.title, kind: s.kind || '名句' });
    }
  }
  return out;
}



/** 词条卡片: 点击整卡任意区域打开弹窗 */
function VocabCard({ entry, onOpen }: { entry: VocabEntry; onOpen: (entry: VocabEntry) => void }) {
  const first = entry.senses[0];
  return (
    <div className="vocab-card" onClick={() => onOpen(entry)} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(entry); } }}>
      <span className="vocab-head">
        <span className="vocab-word">{entry.word}</span>
        <span className={'vocab-kind' + (entry.category === '实词' ? ' shici' : ' xuci')}>{entry.category}</span>
        <span className="vocab-count">{entry.senses.length} 义</span>
        {entry.articleCount >= 4 && <span className="vocab-hot">高频</span>}
        {entry.articleCount > 0 && <span className="vocab-articles">{entry.articleCount} 篇</span>}
        <span className="vocab-caret" aria-hidden="true">▸</span>
      </span>
      {first && (
        <div className="vocab-summary">{first.text}{first.origin ? `（《${first.origin}》）` : ''}</div>
      )}
    </div>
  );
}

/** 词条弹窗: 词 + 全部义项 + 例句 + 出处 (Esc/遮罩点击关闭) */
function VocabModal({ entry, onClose }: { entry: VocabEntry | null; onClose: () => void }) {
  if (!entry) return null;
  return (
    <Modal open={!!entry} onClose={onClose} overlayClassName="vocab-modal" boxClassName="vocab-modal-box" ariaLabel="词条详情">
        <div className="vocab-modal-head">
          <span className="vocab-modal-title">
            <span className="vocab-word">{entry.word}</span>
            <span className={'vocab-kind' + (entry.category === '实词' ? ' shici' : ' xuci')}>{entry.category}</span>
            {entry.articleCount >= 4 && <span className="vocab-hot">高频</span>}
            <em className="vocab-modal-meta">{entry.senses.length} 义 · {entry.articleCount} 篇</em>
          </span>
          <button className="vocab-modal-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>
        <div className="vocab-modal-body">
          {entry.senses.map((sense, i) => (
            <div className="vocab-sense" key={i}>
              <span className="vocab-sense-no">{CIRCLED_NUM[Math.min(i, CIRCLED_NUM.length - 1)]}</span>
              <div className="vocab-sense-main">
                <span className="vocab-sense-text">{sense.text}</span>
                {sense.example && <span className="vocab-sense-ex">例：{sense.example}</span>}
                {sense.origin && <span className="vocab-sense-origin">——《{sense.origin}》</span>}
              </div>
            </div>
          ))}
        </div>
    </Modal>
  );
}

export default function Flashcards() {
  const core = useCore();
  const [searchParams, setSearchParams] = useSearchParams();
  const vocab = useMemo(() => core ? buildCoreVocab(core.words) : [], [core]);
  const reciteQueue = useMemo(() => core ? buildReciteQueue(core.learningArticles) : [], [core]);
  const [cat, setCat] = useState<'实词' | '虚词'>('实词');
  // 弹窗选中的词条
  const [selected, setSelected] = useState<VocabEntry | null>(null);
  // 背诵模式
  const [recite, setRecite] = useState<{ queue: ReciteCard[]; idx: number } | null>(null);
  const [reciteDone, setReciteDone] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [reciteProgress, setReciteProgress] = useState<Record<string, true>>(() => {
    try { return JSON.parse(localStorage.getItem('wyw_recite_progress_v2') || '{}'); } catch { return {}; }
  });

  const shown = vocab.filter((v) => v.category === cat);
  const totalSenses = vocab.reduce((s, v) => s + v.senses.length, 0);

  // URL 参数 ?recite=1: 从学习页背诵引导跳转而来, core 就绪后自动开始背诵
  useEffect(() => {
    if (searchParams.get('recite') === '1' && core && reciteQueue.length) {
      startRecite();
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, core, reciteQueue.length]);

  const startRecite = () => {
    setRecite({ queue: reciteQueue, idx: 0 });
    setReciteDone(false);
    setFlipped(false);
  };

  const reciteRate = (ok: boolean) => {
    if (!recite) return;
    if (ok) {
      const id = recite.queue[recite.idx].id;
      // 函数式更新: 避免快速连点基于旧闭包覆盖 (R2)
      setReciteProgress((prev) => {
        const next = { ...prev, [id]: true as const };
        try { localStorage.setItem('wyw_recite_progress_v2', JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
    }
    if (recite.idx + 1 >= recite.queue.length) {
      setReciteDone(true);
    } else {
      setRecite((r) => (r ? { ...r, idx: r.idx + 1 } : r));
      setFlipped(false);
    }
  };

  const quitRecite = () => {
    setRecite(null);
    setReciteDone(false);
  };

  if (recite) {
    return (
      <div className="flashcard-view view-enter">
        <div className="vocab-top">
          <Link className="split-home" to="/">← 篇目中心</Link>
          <h2 className="vocab-top-title">背诵原文</h2>
        </div>
        {reciteDone ? (
          <div className="fc-done">
            <div className="fc-done-emoji">🎉</div>
            <div className="fc-done-title">背诵完成</div>
            <div className="fc-done-sub">已背 {Object.keys(reciteProgress).length} 句 · 共 {recite.queue.length} 句</div>
            <div className="fc-done-actions">
              <button className="btn btn-primary" onClick={startRecite}>再背一轮</button>
              <button className="btn btn-ghost" onClick={quitRecite}>返回字词</button>
            </div>
          </div>
        ) : (
          <div className="fc-session">
            <div className="fc-progress">
              <span className="fc-prog-num">{recite.idx + 1} / {recite.queue.length}</span>
              <div className="fc-prog-bar"><i style={{ width: `${(recite.idx / recite.queue.length) * 100}%` }} /></div>
            </div>
            <div className="recite-card" onClick={() => setFlipped(!flipped)}>
              <div className="recite-article">{recite.queue[recite.idx].article} · {recite.queue[recite.idx].kind}</div>
              {!flipped ? (
                <div className="recite-front">
                  <div className="recite-sentence">{recite.queue[recite.idx].sentence}</div>
                  <div className="fc-flip-tip">回忆译文 → 轻点翻面 ▸</div>
                </div>
              ) : (
                <div className="recite-back">
                  <div className="recite-trans">{recite.queue[recite.idx].translation || '（无译文）'}</div>
                </div>
              )}
            </div>
            {flipped && (
              <div className="recite-judge">
                <button className="recite-btn again" onClick={() => reciteRate(false)}>不熟 · 重来</button>
                <button className="recite-btn ok" onClick={() => reciteRate(true)}>记住了 ✓</button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flashcard-view view-enter">
      <div className="vocab-top">
        <Link className="split-home" to="/">← 篇目中心</Link>
        <h2 className="vocab-top-title">字词</h2>
        <span className="vocab-top-meta">{vocab.length} 个核心词 · {totalSenses} 义</span>
        <button type="button" className="btn btn-recite" onClick={startRecite}>
          📖 背诵原文 ({reciteQueue.length})
        </button>
      </div>

      {/* 分类 tab: 实词 / 虚词 */}
      <div className="pf-chips vocab-tabs">
        <button className={'chip' + (cat === '实词' ? ' active' : '')} onClick={() => { setCat("实词"); setSelected(null); }}>
          实词 <em>{vocab.filter((v) => v.category === '实词').length}</em>
        </button>
        <button className={'chip' + (cat === '虚词' ? ' active' : '')} onClick={() => { setCat("虚词"); setSelected(null); }}>
          虚词 <em>{vocab.filter((v) => v.category === '虚词').length}</em>
        </button>
      </div>
      <p className="vocab-tip">中考高频必考实虚词 · 点击词条展开义项与例句</p>

      {/* 词条列表 */}
      <div className="vocab-list">
        {shown.map((entry) => (
          <VocabCard
            key={entry.id}
            entry={entry}
            onOpen={setSelected}
          />
        ))}
        {shown.length === 0 && <EmptyState title="暂无词条" compact />}
      </div>
      {/* 词条弹窗 */}
      <VocabModal entry={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
