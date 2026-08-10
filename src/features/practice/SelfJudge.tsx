/** 主观题自评区: 对照答案后 答对/答错 */
export default function SelfJudge({
  answered,
  selfJudge,
  onSelfJudge,
}: {
  answered: boolean;
  selfJudge?: boolean;
  onSelfJudge: (ok: boolean) => void;
}) {
  return (
    <div className="q-self-judge">
      <span className="qsj-tip">
        {answered ? '对照答案，自评一下：' : '未作答，记为答错：'}
      </span>
      <button
        className={'qsj-btn ok' + (selfJudge === true ? ' on' : '')}
        onClick={() => onSelfJudge(true)}
      >
        我答对了
      </button>
      <button
        className={'qsj-btn no' + (selfJudge === false ? ' on' : '')}
        onClick={() => onSelfJudge(false)}
      >
        我答错了
      </button>
    </div>
  );
}
