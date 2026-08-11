/**
 * 本篇注释 — 独立标签页 (学习/鉴赏/考点/注释/默写 五 tab 之一)。
 * 课文注释词列表, 每条一张卡片 (参照鉴赏 appr-para 样式), 全展开。
 */
import { useMemo } from 'react';
import type { CanonicalArticle } from '../../types';
import { getCore } from '../../data';
import EmptyState from '../../shared/ui/EmptyState';
import './article.css';

const NOTE_CATEGORY = '课文注释';

export default function ArticleNotes({ article }: { article: CanonicalArticle }) {
  const words = useMemo(() => getCore()?.articleWordsOf(article.id) || [], [article.id]);
  const noteWords = useMemo(
    () => words.filter((w) => w.meanings.some((m) => m.category === NOTE_CATEGORY)),
    [words],
  );

  // 序号: 按原文首次出现顺序 (与学习页角标一致)
  const noteNums = useMemo(() => {
    const map = new Map<string, number>();
    const seen = new Set<string>();
    let n = 0;
    const sorted = [...noteWords].sort((a, b) => b.word.length - a.word.length);
    const text = article.reading.original || '';
    let i = 0;
    while (i < text.length) {
      const m = sorted.find((w) => w.word && text.startsWith(w.word, i));
      if (m) {
        if (!seen.has(m.id)) { seen.add(m.id); map.set(m.id, ++n); }
        i += m.word.length;
      } else i += 1;
    }
    return map;
  }, [noteWords, article.reading.original]);

  if (!noteWords.length) {
    return (
      <EmptyState
        title="本篇暂无注释"
        hint="可以继续学习课文，或切换其他标签。"
      />
    );
  }

  return (
    <div className="notes-tab view-enter">
      <div className="appr-whole">
        <h3 className="appr-title">本篇注释（{noteWords.length} 词）</h3>
        <div className="appr-paras">
          {noteWords.map((word, index) => (
            <div className="appr-para" key={word.id}>
              <div className="appr-orig note-word">
                <sup className="annot-no">{noteNums.get(word.id) ?? index + 1}</sup>
                {word.word}
              </div>
              <div className="appr-ana note-meaning">
                {word.meanings
                  .filter((m) => m.category === NOTE_CATEGORY)
                  .map((meaning, mi) => (
                    <span key={`${meaning.category}:${mi}`} className="note-meaning-item">
                      <i className="note-kind">{meaning.category}</i>
                      {meaning.text}
                      {meaning.example ? <em className="note-example">〔{meaning.example}〕</em> : null}
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
