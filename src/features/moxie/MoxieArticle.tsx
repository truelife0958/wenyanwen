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
) {
  const parts = String(q || '').split(/(_{3,})/g);
  let bi = -1;
  return parts.map((part, i) => {
    if (!/_{3,}/.test(part)) return <span key={i}>{part}</span>;
    bi += 1;
    const idx = bi;
    const res = results[idx];
    return (
      <span key={i} className={`moxie-blank-wrap${res === true ? ' ok' : res === false ? ' bad' : ''}`}>
        <input
          className="moxie-blank-input"
          value={values[idx] || ''}
          onChange={(e) => onChange(idx, e.target.value)}
          placeholder="填写"
          aria-label={`第 ${idx + 1} 空`}
          disabled={res !== null}
          size={Math.max(4, Math.min(10, (answers[idx] || '').length + 1))}
        />
        {res === false && <span className="moxie-blank-ans">{answers[idx]}</span>}
      </span>
    );
  });
}

interface AnswerState {
  revealed: boolean;
  selfJudge: 'pass' | 'fail' | null;
}

/** 原文默写题卡: 输入 + 自动判分 */
function FillQuestionCard({
  qid, q, answers, onJudged,
}: {
  qid: string; q: string; answers: string[]; onJudged: (qid: string, pass: boolean) => void;
}) {
  const [values, setValues] = useState<string[]>(() => answers.map(() => ''));
  const [results, setResults] = useState<(boolean | null)[]>(() => answers.map(() => null));
  const [checked, setChecked] = useState(false);

  const change = (i: number, v: string) => {
    setValues((prev) => prev.map((x, j) => (j === i ? v : x)));
  };
  const check = () => {
    const res = answers.map((a, i) => normAnswer(values[i] || '') === normAnswer(a));
    setResults(res);
    setChecked(true);
    onJudged(qid, res.every(Boolean));
  };

  const allFilled = values.every((v) => (v || '').trim() !== '');
  const passCount = results.filter((r) => r === true).length;

  return (
    <div className={`moxie-q${checked ? (passCount === answers.length ? ' ok' : ' bad') : ''}`}>
      <div className="mq-head">
        <span className="mq-type">原文默写</span>
        <span className="mq-blanks">{answers.length} 空</span>
        {checked && (
          <span className={`mq-check-result${passCount === answers.length ? ' ok' : ' bad'}`}>
            {passCount === answers.length ? '✓ 全部答对' : `答对 ${passCount}/${answers.length}`}
          </span>
        )}
      </div>
      <div className="mq-q">
        {renderBlankInputs(q, values, results, answers, change)}
      </div>
      {!checked ? (
        <div className="mq-actions">
          <button type="button" className="mq-reveal" onClick={check} disabled={!allFilled}>
            对答案
          </button>
          {!allFilled && <span className="mq-hint">请填写所有空后再判分</span>}
        </div>
      ) : (
        <div className="mq-answer">
          <div className="mq-answer-list">
            {answers.map((a, i) => (
              <div className={`mq-answer-row${results[i] === true ? ' ok' : results[i] === false ? ' bad' : ''}`} key={i}>
                <span className="mq-answer-no">第{i + 1}空</span>
                {results[i] === true ? (
                  <span className="mq-answer-text ok">✓ {values[i]}</span>
                ) : (
                  <span className="mq-answer-text">
                    <s className="mq-wrong">{values[i] || '（未填写）'}</s> → {a}
                  </span>
                )}
              </div>
            ))}
          </div>
          {passCount < answers.length && (
            <button type="button" className="mq-retry" onClick={() => { setValues(answers.map(() => '')); setResults(answers.map(() => null)); setChecked(false); }}>
              重新作答
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** 其他题型 (理解性/词义/译文等): 显示答案 + 自评 */
function QuestionCard({
  qid, q, blanks, answers, extra, word, type,
  onJudged,
}: {
  qid: string; q: string; blanks: number; answers: string[]; extra?: string[]; word?: string; type: string;
  onJudged: (qid: string, pass: boolean) => void;
}) {
  const [state, setState] = useState<AnswerState>({ revealed: false, selfJudge: null });

  const reveal = () => setState((s) => ({ ...s, revealed: true }));
  const judge = (pass: boolean) => {
    setState((s) => ({ ...s, selfJudge: pass ? 'pass' : 'fail' }));
    onJudged(qid, pass);
  };

  return (
    <div className={`moxie-q${state.selfJudge === 'pass' ? ' ok' : state.selfJudge === 'fail' ? ' bad' : ''}`}>
      <div className="mq-head">
        <span className="mq-type">{type}</span>
        {blanks > 1 && <span className="mq-blanks">{blanks} 空</span>}
      </div>
      <div className="mq-q">
        {word ? renderWord(q) : <span className="moxie-blank-static">{String(q).replace(/_+/g, '＿＿＿')}</span>}
      </div>

      {!state.revealed ? (
        <button type="button" className="mq-reveal" onClick={reveal}>对答案</button>
      ) : (
        <div className="mq-answer">
          <div className="mq-answer-list">
            {answers.length > 1 ? (
              answers.map((a, i) => (
                <div className="mq-answer-row" key={i}>
                  <span className="mq-answer-no">第{i + 1}空</span>
                  <span className="mq-answer-text">{a}</span>
                </div>
              ))
            ) : (
              <span className="mq-answer-text">{answers[0] || '（答案缺）'}</span>
            )}
            {answers.length === 0 && <span className="mq-answer-miss">（答案待补）</span>}
          </div>
          {extra && extra.length > 0 && (
            <div className="mq-extra">{extra.map((e, i) => <span key={i} className="mq-extra-item">{e}</span>)}</div>
          )}
          <div className="mq-judge">
            <span className="mq-judge-hint">你答对了吗？</span>
            <button type="button" className={`mq-judge-btn ok${state.selfJudge === 'pass' ? ' on' : ''}`} onClick={() => judge(true)}>✓ 答对</button>
            <button type="button" className={`mq-judge-btn bad${state.selfJudge === 'fail' ? ' on' : ''}`} onClick={() => judge(false)}>✗ 答错</button>
          </div>
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
              section.type === '原文默写' ? (
                <FillQuestionCard
                  key={item.qid}
                  qid={item.qid}
                  q={item.q}
                  answers={item.answers}
                  onJudged={handleJudged}
                />
              ) : (
                <QuestionCard
                  key={item.qid}
                  qid={item.qid}
                  q={item.q}
                  blanks={item.blanks}
                  answers={item.answers}
                  extra={item.extra}
                  word={item.word}
                  type={section.type}
                  onJudged={handleJudged}
                />
              )
            ))}
          </div>
        ) : (
          <EmptyState title="本题型暂无题目" hint="数据抽取中，稍后再试" compact />
        )}
      </main>
    </div>
  );
}
