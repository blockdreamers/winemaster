import { useProgress } from '../lib/useProgress';
import { update } from '../lib/progress';

type Props = { chapter: string; id: string; label: string; doneLabel: string };

export default function SectionCheck({ chapter, id, label, doneLabel }: Props) {
  const p = useProgress();
  const done = !!p?.chapters[chapter]?.read.includes(id);
  const toggle = () =>
    update(chapter, (c) => {
      c.read = done ? c.read.filter((x) => x !== id) : [...c.read, id];
    });
  return (
    <button type="button" class={`check${done ? ' on' : ''}`} aria-pressed={done} onClick={toggle}>
      <span class="box" aria-hidden="true" />
      {done ? doneLabel : label}
    </button>
  );
}
