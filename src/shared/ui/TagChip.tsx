/** 通用 pill 标签: 题型/徽章/状态。统一视觉: 米色底 + 古铜字 (可传 tone 变体) */
type Tone = 'default' | 'primary' | 'success' | 'muted' | 'blue';

const TONE_CLASS: Record<Tone, string> = {
  default: 'tag-chip',
  primary: 'tag-chip tag-chip-primary',
  success: 'tag-chip tag-chip-success',
  muted: 'tag-chip tag-chip-muted',
  blue: 'tag-chip tag-chip-blue',
};

export default function TagChip({
  children,
  tone = 'default',
  className = '',
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return <span className={`${TONE_CLASS[tone]}${className ? ' ' + className : ''}`}>{children}</span>;
}
