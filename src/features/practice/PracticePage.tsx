import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { PracticeArticle, PracticeQuestion } from '../../types';
import PracticeSession from './PracticeSession';
import StemView from '../../shared/ui/StemView';
import { useErrorBook } from '../errorbook/store';
import './practice.css';

const TYPE_LABEL: Record<string, string> = {
  blank: '填空',
  choice: '选择',
  discuss: '讨论',
  explain: '解释',
  passage: '阅读',
  punctuate: '断句',
  short: '简答',
  translate: '翻译',
  gloss: '字词',
  punct: '断句',
  understand: '理解',
  open: '开放',
};

/** 做题会话结果视图 */
function SessionResult({
  article,
  correct,
  total,
  wrong,
  onRetry,
  onBack,
  embedded = false,
  errorHref = '/errors',
}: {
  article: PracticeArticle;
  correct: number;
  total: number;
  wrong: PracticeQuestion[];
  onRetry: () => void;
  onBack: () => void;
  embedded?: boolean;
  errorHref?: string;
}) {
  const rate = total ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="practice-session view-enter">
      {!embedded && <button className="back-btn" onClick={onBack}>← 返回</button>}
      <div className="result-summary">
        <h3>《{article.title}》练习完成</h3>
        <div className="result-score">
          {correct} <span className="result-score-total">/ {total}</span>
        </div>
        <div className="result-stat">
          正确率 {rate}% · 答错 {wrong.length} 题
          {wrong.length > 0 && '(已自动收入错题本)'}
        </div>
      </div>
      {wrong.length > 0 && (
        <div className="result-detail">
          {wrong.map((q, i) => (
            <div className="result-item wrong" key={q.id || i}>
              <div className="result-item-q">
                <span className="q-type-chip">{TYPE_LABEL[q.type || ''] || q.type}</span>
                <StemView text={q.stem} />
              </div>
              <div className="result-item-a">
                参考答案:{Array.isArray(q.answer) ? q.answer.join(';') : q.answer}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="result-actions">
        <button className="btn btn-primary" onClick={onRetry}>再练一次</button>
        <Link className="btn" to={errorHref}>查看错题</Link>
        {!embedded && <button className="btn btn-ghost" onClick={onBack}>返回列表</button>}
      </div>
    </div>
  );
}

/** 做题会话(单篇) */
export function SessionView({
  article,
  onExit,
  embedded = false,
  errorHref,
}: {
  article: PracticeArticle;
  onExit: () => void;
  embedded?: boolean;
  errorHref?: string;
}) {
  const eb = useErrorBook();
  const [result, setResult] = useState<{ correct: number; total: number; wrong: PracticeQuestion[] } | null>(null);
  const [round, setRound] = useState(0);

  if (result) {
    return (
      <SessionResult
        article={article}
        correct={result.correct}
        total={result.total}
        wrong={result.wrong}
        onRetry={() => { setResult(null); setRound((r) => r + 1); }}
        onBack={onExit}
        embedded={embedded}
        errorHref={errorHref}
      />
    );
  }

  return (
    <PracticeSession
      key={round}
      article={article}
      onDone={(correct, total, wrong) => {
        if (wrong.length > 0) {
          eb.addWrong(
            { id: article.id, title: article.title },
            wrong.map((q) => ({
              qid: q.id || '',
              type: TYPE_LABEL[q.type || ''] || q.type || '题',
              stem: q.stem || '',
              answer: Array.isArray(q.answer) ? q.answer.join(';') : String(q.answer || ''),
            }))
          );
        }
        setResult({ correct, total, wrong });
      }}
    />
  );
}

/** 篇目工作区复用的单篇练习 */
export function ArticlePractice({
  article,
  errorHref,
}: {
  article: PracticeArticle;
  errorHref: string;
}) {
  return (
    <div className="practice-page article-practice">
      <SessionView article={article} onExit={() => {}} embedded errorHref={errorHref} />
    </div>
  );
}