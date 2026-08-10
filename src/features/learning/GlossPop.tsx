/** 点字释义浮层 */
export default function GlossPop({
  text,
  x,
  y,
}: {
  text: string;
  x: number;
  y: number;
}) {
  return (
    <div className="gloss-pop" style={{ left: x, top: y }} onClick={(event) => event.stopPropagation()}>
      {text}
    </div>
  );
}
