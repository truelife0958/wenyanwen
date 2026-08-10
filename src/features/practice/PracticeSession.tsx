import { useEffect, useMemo, useState } from 'react';
import type { PracticeArticle, PracticeQuestion } from '../../types';
import StemView from '../../shared/ui/StemView';
import TagChip from '../../shared/ui/TagChip';
import SelfJudge from './SelfJudge';
import { questionSourceOf, questionSourceTone } from '../../data/question-source';
import './practice.css';

/** 题型标签 */
const TYPE_LABELS: Record<string, string> = {
  blank: '填空',
  choice: '选择',
  discuss: '论述',
  explain: '解释',
  passage: '阅读',
  punctuate: '标点',
  short: '简答',
  translate: '翻译',
  gloss: '字词',
  punct: '断句',
  understand: '理解',
  open: '开放',
};

function answerText(a: string | string[] | undefined): string {
  return Array.isArray(a) ? a.join('；') : String(a ?? '');
}

/** 单题作答组件 */
function QuestionItem({
  q,
  index,
  qkey,
  value,
  onChange,
  submitted,
  selfJudge,
  onSelfJudge,
}: {
  q: PracticeQuestion;
  index: number;
  qkey: string;
  value: string;
  onChange: (v: string) => void;
  submitted: boolean;
  /** 主观题自评状态: undefined=未评 / true=答对 / false=答错 */
  selfJudge?: boolean;
  onSelfJudge: (ok: boolean) => void;
}) {
  const label = TYPE_LABELS[q.type || ''] || q.type || '题';
  const src = questionSourceOf(q);
  const isChoice = (q.options || []).length > 0;
  const answered = value.trim() !== '';
  // 多选答案题 (如断句位置标号 ABD): options 为单字母标号且答案含多个字母
  const answerStr = answerText(q.answer).trim();
  const isMultiChoice = isChoice && /^[A-H]{2,}$/.test(answerStr);
  const selectedSet = new Set(value.split(''));
  const toggleLetter = (letter: string) => {
    if (isMultiChoice) {
      const next = new Set(selectedSet);
      if (next.has(letter)) next.delete(letter); else next.add(letter);
      onChange([...next].sort().join(''));
    } else {
      onChange(letter);
    }
  };
  // 选择/填空(提交后)自动判定; 主观题以自评为准
  const judged = isChoice
    ? submitted && answered
    : submitted && selfJudge !== undefined;
  const right = isChoice
    ? submitted && answered && (isMultiChoice ? [...selectedSet].sort().join('') === answerStr : answerStr.indexOf(value) >= 0)
    : judged && selfJudge === true;

  return (
    <div className={'q-item feedback-pop' + (judged ? (right ? ' q-right' : ' q-wrong') : '')}>
      <div className="q-head">
        <span className="q-num">{index + 1}</span>
        <TagChip>{label}</TagChip>
        {isMultiChoice && <span className="q-multi-hint">可多选</span>}
        {isChoice && submitted && answered && (
          <span className={`q-result ${right ? 'ok' : 'bad'}`}>{right ? '✓ 答对' : '✗ 答错'}</span>
        )}
        {!isChoice && submitted && selfJudge !== undefined && (
          <span className={`q-result ${selfJudge ? 'ok' : 'bad'}`}>{selfJudge ? '✓ 答对' : '✗ 答错'}</span>
        )}
      </div>

      <div className="q-source-line"><span className={"src-badge " + questionSourceTone(src.badge)}>{src.badge}</span><span className="src-label">{src.label}</span></div>

      <div className="q-stem">
        <StemView text={q.stem} />
      </div>

      {q.options && q.options.length > 0 ? (
        <div className="q-options">
          {q.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            const selected = isMultiChoice ? selectedSet.has(letter) : value === letter;
            const isRightOpt = !isMultiChoice && submitted && answerStr.indexOf(letter) >= 0;
            const isWrongPick = submitted && selected && !isRightOpt;
            return (
              <button
                key={i}
                className={
                  'q-option' +
                  (selected ? ' selected' : '') +
                  (submitted && isRightOpt ? ' right' : '') +
                  (submitted && isWrongPick ? ' wrong' : '')
                }
                onClick={() => toggleLetter(letter)}
                disabled={submitted}
              >
                <span className="opt-letter">{letter}.</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <textarea
          className="q-input"
          placeholder="在此作答…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={submitted}
          rows={3}
        />
      )}

      {submitted && (
        <div className="q-answer-box">
          <div className="q-answer-label">参考答案</div>
          <div className="q-answer-text">{answerText(q.answer)}</div>
          {q.explanation && (
            <div className="q-explanation">
              <b>解析：</b>
              {q.explanation}
            </div>
          )}
          {q.answerNote && (
            <div className="q-answer-note">
              <b>说明：</b>
              {q.answerNote}
            </div>
          )}
          {!isChoice && (
            <SelfJudge answered={answered} selfJudge={selfJudge} onSelfJudge={onSelfJudge} />
          )}
        </div>
      )}
    </div>
  );
}

export default function PracticeSession({
  article,
  onDone,
}: {
  article: PracticeArticle;
  onDone: (correct: number, total: number, wrong: PracticeQuestion[]) => void;
}) {
  const questions = article.questions || [];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [judge, setJudge] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(0);
  /** 每题是否已提交判分 (单题流: 一屏一题, 逐题提交) */
  const [qSubmitted, setQSubmitted] = useState<Record<string, boolean>>({});

  const current = questions[Math.min(page, Math.max(questions.length - 1, 0))];
  const qkey = current?.id || `q${page}`;
  const currentSubmitted = Boolean(qSubmitted[qkey]);

  const setAnswer = (qid: string, v: string) => {
    setAnswers((a) => ({ ...a, [qid]: v }));
    if (qSubmitted[qid]) {
      setQSubmitted((s) => ({ ...s, [qid]: false })); // 修改答案需重新提交
      setJudge((j) => { const next = { ...j }; delete next[qid]; return next; }); // 清除残留自评 (E3)
    }
  };

  const submitCurrent = () => {
    setQSubmitted((s) => ({ ...s, [qkey]: true }));
  };

  const goTo = (i: number) => {
    setPage(Math.max(0, Math.min(i, questions.length - 1)));
  };

  // 提交本题后自动滚动到答案/自评区 (避免长答案被底部 TabBar 遮挡)
  useEffect(() => {
    if (currentSubmitted) {
      const box = document.querySelector('.q-answer-box');
      if (box) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentSubmitted]);


  /** 已判定题数: 选择题提交即判定 + 主观题需自评(或未作答自动错) — useMemo 缓存 (性能: 大考点 682 题) */
  const judgedCount = useMemo(() => questions.filter((q) => {
    if (!qSubmitted[q.id || '']) return false;
    if ((q.options || []).length > 0) return true; // 提交后选择题自动判定
    return judge[q.id || ''] !== undefined || (answers[q.id || ''] || '').trim() === '';
  }).length, [questions, qSubmitted, judge, answers]);

  const correctCount = useMemo(() => questions.filter((q) => {
    if (!qSubmitted[q.id || '']) return false;
    const v = (answers[q.id || ''] || '').trim();
    if ((q.options || []).length > 0) {
      const a = answerText(q.answer).trim();
      const isM = /^[A-H]{2,}$/.test(a);
      return v !== '' && (isM ? [...new Set(v.split(''))].sort().join('') === a : a.indexOf(v) >= 0);
    }
    return judge[q.id || ''] === true;
  }).length, [questions, qSubmitted, judge, answers]);

  const allJudged = questions.length > 0 && judgedCount === questions.length;

  const finish = () => {
    const wrong: PracticeQuestion[] = [];
    questions.forEach((q) => {
      const v = (answers[q.id || ''] || '').trim();
      let right: boolean;
      if ((q.options || []).length > 0) {
        const a = answerText(q.answer).trim();
        const isM = /^[A-H]{2,}$/.test(a);
        right = v !== '' && (isM ? [...new Set(v.split(''))].sort().join('') === a : a.indexOf(v) >= 0);
      } else {
        right = v !== '' ? judge[q.id || ''] === true : false;
      }
      if (!right) wrong.push(q);
    });
    onDone(correctCount, questions.length, wrong);
  };

  const unanswered = useMemo(() => questions.filter((q) => {
    const isChoice = (q.options || []).length > 0;
    return !isChoice && (answers[q.id || ''] || '').trim() === '' && judge[q.id || ''] === undefined;
  }).length, [questions, answers, judge]);

  return (
    <div className="practice-session view-enter">
      <div className="content-head">
        <h3 className="content-head-sub">{article.title}</h3>
        <span className="content-chip">{questions.length} 题</span>
        {[article.author, article.dynasty].filter(Boolean).length > 0 && (
          <span className="content-chip">
            {[article.author, article.dynasty].filter(Boolean).join(' · ')}
          </span>
        )}
      </div>

      {/* 逐题进度: 一屏一题, 每题单独作答判分 */}
      <div className="ps-progress">
        <div className="ps-progress-bar">
          <i style={{ width: `${questions.length ? (judgedCount / questions.length) * 100 : 0}%` }} />
        </div>
        <span className="ps-progress-text">第 {page + 1}/{questions.length} 题 · 已判 {judgedCount}/{questions.length}</span>
      </div>

      {article.original_text && (
        <div className="material-box">
          <div className="material-text">{article.original_text}</div>
        </div>
      )}

      {current && (
        <div className="q-list">
          <QuestionItem
            key={qkey}
            q={current}
            index={page}
            qkey={qkey}
            value={answers[qkey] || ''}
            onChange={(v) => setAnswer(qkey, v)}
            submitted={currentSubmitted}
            selfJudge={judge[qkey]}
            onSelfJudge={(ok) => setJudge((j) => ({ ...j, [qkey]: ok }))}
          />
        </div>
      )}

      {/* 单题操作: 提交本题 → 下一题 / 查看结果 */}
      <div className="practice-actions ps-actions">
        {page > 0 && (
          <button className="btn btn-ghost" onClick={() => goTo(page - 1)}>
            ← 上一题
          </button>
        )}
        {!currentSubmitted ? (
          <button
            className="btn btn-primary"
            onClick={submitCurrent}
            disabled={!(answers[qkey] || '').trim()}
          >
            提交本题判分
          </button>
        ) : page < questions.length - 1 ? (
          <button className="btn btn-primary" onClick={() => goTo(page + 1)}>
            下一题 →
          </button>
        ) : allJudged ? (
          <button className="btn btn-primary" onClick={finish}>
            查看结果 ({correctCount}/{questions.length})
          </button>
        ) : (
          <span className="judge-progress">未判题会记为答错</span>
        )}
      </div>
    </div>
  );
}
