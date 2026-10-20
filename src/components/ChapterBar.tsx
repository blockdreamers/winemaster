import { useEffect, useState } from 'preact/hooks';
import { useProgress } from '../lib/useProgress';

type Props = { chapter: string; total: number; label: string };

/** Thin sticky bar under the header: sections understood out of total. */
export default function ChapterBar({ chapter, total, label }: Props) {
  const p = useProgress();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const read = p?.chapters[chapter]?.read.length ?? 0;
  const ratio = total ? Math.min(read / total, 1) : 0;
  return (
    <div class="chapter-bar" aria-label={label}>
      <span class="chapter-bar-fill" style={{ transform: `scaleX(${mounted ? ratio : 0})` }} />
      <span class="chapter-bar-text num">{read}/{total}</span>
    </div>
  );
}
