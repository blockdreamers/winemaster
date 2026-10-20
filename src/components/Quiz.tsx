import { useMemo, useState } from 'preact/hooks';
import { useProgress } from '../lib/useProgress';
import { PASS_RATIO, update } from '../lib/progress';

type Q = { q: string; choices: string[]; answer: number; explain?: string };
type Labels = Record<'start' | 'check' | 'next' | 'finish' | 'passed' | 'failed' | 'retry' | 'best' | 'question' | 'lead', string>;
type Props = { chapter: string; questions: Q[]; labels: Labels };

const shuffle = <T,>(a: T[]) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

/** Shuffle questions and choices, remapping the answer index. */
const deal = (qs: Q[]) =>
  shuffle(qs).map((q) => {
    const order = shuffle(q.choices.map((_, i) => i));
    return { ...q, choices: order.map((i) => q.choices[i]), answer: order.indexOf(q.answer) };
  });

export default function Quiz({ chapter, questions, labels }: Props) {
  const p = useProgress();
  const best = p?.chapters[chapter]?.quiz?.best;
  const [round, setRound] = useState(0);
  const deck = useMemo(() => (round ? deal(questions) : []), [round]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);

  const start = () => {
    setRound((r) => r + 1);
    setI(0); setPicked(null); setChecked(false); setScore(0); setOver(false);
  };

  if (!round) {
    return (
      <div class="quiz">
        <p class="quiz-lead">{labels.lead}</p>
        {best !== undefined && <p class="meta">{labels.best} <span class="num">{Math.round(best * 100)}%</span></p>}
        <button type="button" class="btn primary" onClick={start}>{labels.start}</button>
      </div>
    );
  }

  if (over) {
    const ratio = score / deck.length;
    const passed = ratio >= PASS_RATIO;
    return (
      <div class="quiz" role="status">
        <p class="quiz-score num">{score} / {deck.length}</p>
        <p class={`quiz-verdict ${passed ? 'pass' : ''}`}>{passed ? labels.passed : labels.failed}</p>
        <button type="button" class="btn" onClick={start}>{labels.retry}</button>
      </div>
    );
  }

  const q = deck[i];
  const last = i === deck.length - 1;
  const check = () => {
    setChecked(true);
    if (picked === q.answer) setScore((s) => s + 1);
  };
  const next = () => {
    if (!last) {
      setI(i + 1); setPicked(null); setChecked(false);
      return;
    }
    const ratio = score / deck.length;
    update(chapter, (c) => {
      const prev = c.quiz ?? { best: 0, attempts: 0 };
      c.quiz = {
        best: Math.max(prev.best, ratio),
        attempts: prev.attempts + 1,
        passedAt: prev.passedAt ?? (ratio >= PASS_RATIO ? new Date().toISOString() : undefined),
      };
    });
    setOver(true);
  };

  return (
    <div class="quiz">
      <div class="quiz-top">
        <span class="meta">{labels.question} <span class="num">{i + 1}/{deck.length}</span></span>
        <span class="quiz-track" aria-hidden="true"><span style={{ width: `${((i + (checked ? 1 : 0)) / deck.length) * 100}%` }} /></span>
      </div>
      <p class="quiz-q">{q.q}</p>
      <ol class="choices">
        {q.choices.map((c, k) => {
          const state = !checked ? (picked === k ? 'picked' : '') : k === q.answer ? 'right' : k === picked ? 'wrong' : '';
          return (
            <li key={`${i}-${k}`}>
              <button type="button" class={`choice ${state}`} disabled={checked} onClick={() => setPicked(k)} aria-pressed={picked === k}>
                <span class="num">{String.fromCharCode(65 + k)}</span>
                {c}
              </button>
            </li>
          );
        })}
      </ol>
      {checked && q.explain && <p class="quiz-explain">{q.explain}</p>}
      <div class="btn-row">
        {!checked
          ? <button type="button" class="btn primary" disabled={picked === null} onClick={check}>{labels.check}</button>
          : <button type="button" class="btn primary" onClick={next}>{last ? labels.finish : labels.next}</button>}
      </div>
    </div>
  );
}
