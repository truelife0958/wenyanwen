import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { findMoxieArticle, flattenItems, saveMoxieResult, articleProgress, loadMoxieProgress } from '../../data/moxie';
import { findMoxieByArticleTitle } from '../../data/moxie';
import { findLearningArticle, articleHref } from '../../data/article-links';
import { useErrorBook } from '../errorbook/store';
import PageHeader from '../../shared/ui/PageHeader';
import EmptyState from '../../shared/ui/EmptyState';
import './moxie.css';

/** 答案归一化: 忽略标点/空格/全半角, 用于自动判分 */
function normAnswer(v: string): string {
  return String(v || '')
    .replace(/[，,。；;！!？?：:、·…—~～"'“”‘’（）()\s]/g, '')
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .toLowerCase();
}

/** 展开等价答案: 每个答案元素可用 | 分隔多分句; 空 i 的候选 = 所有元素第 i 分句 */
function answerOptionsFor(answers: string[], i: number): string[] {
  const opts = new Set<string>();
  for (const a of answers || []) {
    const parts = String(a).split('|');
    if (i < parts.length) opts.add(normAnswer(parts[i]));
  }
  return [...opts];
}

/** 判分容错: 用户输入与候选互相包含且长度占比 ≥ 0.55 (词义答案主干匹配, 如 "古代对男子的尊称" ⊂ "...尊称，这里指孔子") */
function matchAnswer(input: string, cand: string): boolean {
  if (!input || !cand) return false;
  if (input === cand) return true;
  const [a, b] = input.length <= cand.length ? [input, cand] : [cand, input];
  return a.length >= Math.max(2, Math.ceil(b.length * 0.55)) && b.includes(a);
}

/** 有效空数 = 答案分句最大长度 (至少 1) */
function blanksCount(answers: string[]): number {
  return (answers || []).reduce((m, a) => Math.max(m, String(a).split('|').length), 1);
}

/** 词义默写: 【字】高亮 */
function renderWord(q: string) {
  const parts = String(q || '').split(/(【[^】]+】)/g);
  return parts.map((part, i) =>
    /^【.+】$/.test(part) ? <b className="moxie-word" key={i}>{part.replace(/【|】/g, '')}</b> : <span key={i}>{part}</span>
  );
}

/** 原文默写: ___ → 可输入横线 (输入后自动判分展示) */
function renderBlankInputs(
  q: string,
  values: string[],
  results: (boolean | null)[],
  answers: string[],
  onChange: (i: number, v: string) => void,
  word?: boolean,
) {
  const parts = String(q || '').split(/(_{3,})/g);
  let bi = -1;
  return parts.map((part, i) => {
    if (/_{3,}/.test(part)) {
      bi += 1;
      const idx = bi;
      const res = results[idx];
      const ans = (answers[idx] || '').split('|').join(' / ');
      return (
        <span key={i} className={`moxie-blank-wrap${res === true ? ' ok' : res === false ? ' bad' : ''}`}>
          <input
            className="moxie-blank-input"
            value={values[idx] || ''}
            onChange={(e) => onChange(idx, e.target.value)}
            placeholder="填写"
            aria-label={`第 ${idx + 1} 空`}
            disabled={res !== null}
            size={Math.max(4, Math.min(14, (answers[idx] || '').length + 1))}
          />
          {res === false && <span className="moxie-blank-ans">{ans}</span>}
        </span>
      );
    }
    if (word) {
      const wparts = String(part).split(/(【[^】]+】)/g);
      return (
        <span key={i}>
          {wparts.map((wp, wi) =>
            /^【.+】$/.test(wp) ? <b className="moxie-word" key={wi}>{wp.replace(/【|】/g, '')}</b> : <span key={wi}>{wp}</span>
          )}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

interface AnswerState {
  revealed: boolean;
  selfJudge: 'pass' | 'fail' | null;
}

/** 全部题型输入卡: 输入 + 自动判分 (词义【字】高亮, 译文长答案自适应, 等价答案 | 支持) */
function FillQuestionCard({
  qid, q, answers, type, word, onJudged,
}: {
  qid: string; q: string; answers: string[]; type: string; word?: string; onJudged: (qid: string, pass: boolean) => void;
}) {
  const qBlanks = (String(q || '').match(/_+/g) || []).length;
  const nBlanks = Math.max(qBlanks || blanksCount(answers), 1);
  const noBlank = qBlanks === 0;
  const [values, setValues] = useState<string[]>(() => answers.map(() => ''));
  const [results, setResults] = useState<(boolean | null)[]>(() => answers.map(() => null));
  const [checked, setChecked] = useState(false);

  const change = (i: number, v: string) => {
    setValues((prev) => prev.map((x, j) => (j === i ? v : x)));
  };
  const check = () => {
    const res = answers.map((a, i) => {
      const norm = normAnswer(values[i] || '');
      return norm !== '' && answerOptionsFor(answers, i).some((cand) => matchAnswer(norm, cand));
    });
    setResults(res);
    setChecked(true);
    onJudged(qid, res.length > 0 && res.every(Boolean));
  };

  const allFilled = values.every((v) => (v || '').trim() !== '');
  const passCount = results.filter((r) => r === true).length;

  return (
    <div className={`moxie-q${checked ? (passCount === nBlanks ? ' ok' : ' bad') : ''}`}>
      <div className="mq-head">
        <span className="mq-type">{type}</span>
        <span className="mq-blanks">{nBlanks} 空</span>
        {checked && (
          <span className={`mq-check-result${passCount === nBlanks ? ' ok' : ' bad'}`}>
            {passCount === nBlanks ? '✓ 全部答对' : `答对 ${passCount}/${nBlanks}`}
          </span>
        )}
      </div>
      <div className="mq-q">
        {noBlank ? <span>{q}</span> : renderBlankInputs(q, values, results, answers, change, Boolean(word))}
      </div>
      {noBlank ? null : !checked ? (
        <div className="mq-actions">
          <button type="button" className="mq-reveal" onClick={check} disabled={!allFilled}>
            对答案
          </button>
          {!allFilled && <span className="mq-hint">请填写所有空后再判分</span>}
        </div>
      ) : (
        <div className="mq-answer">
          {noBlank && <span className="mq-answer-text">（本题无填空）</span>}
          <div className="mq-answer-list">
            {Array.from({ length: nBlanks }, (_, i) => {
              const opts = answerOptionsFor(answers, i);
              const ans = opts.length > 1 ? opts.join(' / ') : ((answers[i] || '').split('|').join(' / ') || '（答案待补）');
              return (
                <div className={`mq-answer-row${results[i] === true ? ' ok' : results[i] === false ? ' bad' : ''}`} key={i}>
                  <span className="mq-answer-no">第{i + 1}空</span>
                  {results[i] === true ? (
                    <span className="mq-answer-text ok">✓ {values[i]}</span>
                  ) : (
                    <span className="mq-answer-text">
                      <s className="mq-wrong">{values[i] || '（未填写）'}</s> → {ans || '（答案待补）'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {passCount < nBlanks && (
            <button type="button" className="mq-retry" onClick={() => { setValues(answers.map(() => '')); setResults(answers.map(() => null)); setChecked(false); }}>
              重新作答
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function MoxieArticle() {
  const { id } = useParams();
  const article = findMoxieArticle(id);
  const { addWrong } = useErrorBook();
  const [activeTab, setActiveTab] = useState('');
  const [tick, setTick] = useState(0);

  const learning = useMemo(() => {
    if (!article) return null;
    if (article.articleId) return findLearningArticle(article.articleId);
    return findLearningArticle(article.title);
  }, [article]);

  if (!article) {
    return (
      <div className="not-found view-enter">
        <h2>未找到该默写篇目</h2>
        <Link className="btn btn-primary" to="/moxie">返回默写列表</Link>
      </div>
    );
  }

  const progress = articleProgress(article);
  const tabs = article.sections.map((s) => s.type);
  const showTab = activeTab || tabs[0] || '';
  const section = article.sections.find((s) => s.type === showTab);

  const handleJudged = (qid: string, pass: boolean) => {
    saveMoxieResult(qid, pass);
    if (!pass) {
      const flat = flattenItems(article).find((x) => x.item.qid === qid);
      if (flat) {
        addWrong(
          { id: article.articleId || '', title: article.title },
          [{
            qid,
            type: flat.section.type,
            stem: flat.item.q,
            answer: (flat.item.answers || []).join(' / '),
          }],
        );
      }
    }
    setTick((t) => t + 1);
  };

  return (
    <div className="moxie-article view-enter">
      <PageHeader
        backTo="/moxie"
        backLabel="← 返回默写列表"
        title={article.title}
        badge={learning ? (
          <Link className="moxie-to-learn" to={articleHref(learning)}>📖 看课文 →</Link>
        ) : undefined}
        meta={`${article.grade} · ${article.source === 'legacy-converted' ? '真题转换' : `默写书 p${article.book_page}`} · ${article.sections.length} 题型`}
        right={<span className="workspace-progress">已答 {progress.done}/{progress.total} · 全对 {progress.passed}</span>}
      />

      <nav className="workspace-tabs" aria-label="题型切换">
        {tabs.map((t) => {
          const items = article.sections.find((s) => s.type === t)?.items || [];
          return (
            <button key={t} type="button" className={showTab === t ? 'active' : ''} onClick={() => setActiveTab(t)}>
              {t}
              <em className="ws-count">{items.length}</em>
            </button>
          );
        })}
      </nav>

      <main className="workspace-content">
        {section ? (
          <div className="moxie-section">
            {section.items.map((item) => (
              <FillQuestionCard
                key={item.qid}
                qid={item.qid}
                q={item.q}
                answers={item.answers}
                type={section.type}
                word={item.word}
                onJudged={handleJudged}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="本题型暂无题目" hint="数据抽取中，稍后再试" compact />
        )}
      </main>
    </div>
  );
}
