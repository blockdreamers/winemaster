import { useProgress } from '../lib/useProgress';
import { status } from '../lib/progress';

type Props = { chapter: string; labels: { done: string; progress: string } };

export default function StatusMark({ chapter, labels }: Props) {
  const p = useProgress();
  const s = status(p?.chapters[chapter]);
  if (s === 'none') return <span class="mark" aria-hidden="true" />;
  return <span class={`mark ${s}`} title={labels[s]} aria-label={labels[s]} role="img" />;
}
