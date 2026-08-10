import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { findMoxieArticle, flattenItems, saveMoxieResult, articleProgress, loadMoxieProgress } from '../../data/moxie';
import { findMoxieByArticleTitle } from '../../data/moxie';
import { findLearningArticle, articleHref } from '../../data/article-links';
import { useErrorBook } from '../errorbook/store';
import PageHeader from '../../shared/ui/PageHeader';
import EmptyState from '../../shared/ui/EmptyState';
import './moxie.css';

/** 渲染题干中的填空: ___ → 高亮占位 */
function renderBlanks(q: string) {
  const parts = String(q || '').split(/(_{3,})/g);
  return parts.map((part, i) =>
    /_{3,}/.test(part) ? <span className="moxie-blank" key={i} aria-label="填空">＿＿＿</span> : <span key={i}>{part}</span>
  );
}

/** 词义默写: 【字】高亮 */
function renderWord(q: string) {
  const parts = String(q || '').split(/(【[^】]+】)/g);
  return parts.map((part, i) =>
    /^【.+】$/.test(part) ? <b className="moxie-word" key={i}>{part.replace(/【|】/g, '')}</b> : <span key={i}>{part}</span>
  );
}

interface AnswerState {
  revealed: boolean;
  selfJudge: 'pass' | 'fail' | null;
}

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
        {word ? renderWord(q) : renderBlanks(q)}
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
            ))}
          </div>
        ) : (
          <EmptyState title="本题型暂无题目" hint="数据抽取中，稍后再试" compact />
        )}
      </main>
    </div>
  );
}
