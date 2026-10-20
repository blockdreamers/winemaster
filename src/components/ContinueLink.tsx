import { useProgress } from '../lib/useProgress';
import { status } from '../lib/progress';

type Props = { chapters: { slug: string; href: string }[]; startLabel: string; continueLabel: string };

/** Primary home CTA: first chapter not yet passed. */
export default function ContinueLink({ chapters, startLabel, continueLabel }: Props) {
  const p = useProgress();
  const started = p && Object.keys(p.chapters).length > 0;
  const next = (p && chapters.find((c) => status(p.chapters[c.slug]) !== 'done')) ?? chapters[0];
  return <a class="btn primary" href={next.href}>{started ? continueLabel : startLabel}</a>;
}
