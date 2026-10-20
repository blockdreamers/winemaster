import { useState } from 'preact/hooks';
import { useProgress } from '../lib/useProgress';
import { update } from '../lib/progress';

type Props = {
  chapter: string; id: string; q: string; choices: string[]; answer: number; explain?: string;
  labels: { label: string; correct: string; wrong: string };
};

export default function Checkpoint({ chapter, id, q, choices, answer, explain, labels }: Props) {
  const p = useProgress();
  const [picked, setPicked] = useState<number | null>(null);
  const passed = !!p?.chapters[chapter]?.cp[id];
  const shown = picked ?? (passed ? answer : null);

  const choose = (i: number) => {
    setPicked(i);
    if (i === answer) update(chapter, (c) => void (c.cp[id] = true));
  };

  return (
    <aside class="cp" aria-label={labels.label}>
      <p class="eyebrow">{labels.label}</p>
      <p class="cp-q">{q}</p>
      <ol class="choices">
        {choices.map((c, i) => {
          const state = shown === null ? '' : i === answer && shown === answer ? 'right' : i === shown ? 'wrong' : '';
          return (
            <li key={i}>
              <button type="button" class={`choice ${state}`} onClick={() => choose(i)} disabled={shown === answer}>
                <span class="num">{String.fromCharCode(65 + i)}</span>
                {c}
              </button>
            </li>
          );
        })}
      </ol>
      {shown !== null && (
        <p class="cp-result" role="status">
          <strong>{shown === answer ? labels.correct : labels.wrong}</strong>
          {shown === answer && explain ? ` ${explain}` : ''}
        </p>
      )}
    </aside>
  );
}
