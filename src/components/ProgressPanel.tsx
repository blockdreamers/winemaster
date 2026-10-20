import { useProgress } from '../lib/useProgress';
import { load, save, status, type Progress } from '../lib/progress';

type Props = {
  chapters: { slug: string; n: number; title: string; href: string }[];
  labels: Record<'chapters' | 'export' | 'import' | 'reset' | 'resetConfirm' | 'best' | 'done' | 'progress', string>;
};

export default function ProgressPanel({ chapters, labels }: Props) {
  const p = useProgress();
  const done = p ? chapters.filter((c) => status(p.chapters[c.slug]) === 'done').length : 0;

  const exportFile = () => {
    const blob = new Blob([JSON.stringify(load(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `winemaster-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importFile = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as Progress;
      if (data?.v === 1 && data.chapters) save(data);
    } catch { /* ignore malformed files */ }
  };
  const reset = () => confirm(labels.resetConfirm) && save({ v: 1, chapters: {} });

  return (
    <div class="progress-panel">
      <p class="progress-big num">{done}<span>/{chapters.length}</span></p>
      <p class="meta">{labels.chapters}</p>
      <div class="progress-grid" aria-hidden="true">
        {chapters.map((c) => <a href={c.href} title={`${c.n}. ${c.title}`} class={`cell ${p ? status(p.chapters[c.slug]) : 'none'}`} />)}
      </div>
      <ul class="rows">
        {chapters.filter((c) => p && status(p.chapters[c.slug]) !== 'none').map((c) => {
          const s = status(p!.chapters[c.slug]);
          const best = p!.chapters[c.slug]?.quiz?.best;
          return (
            <li key={c.slug}>
              <a class="row" href={c.href}>
                <span class="num">{String(c.n).padStart(2, '0')}</span>
                <span class="row-title">{c.title}</span>
                <span class="row-side">{s === 'done' ? labels.done : labels.progress}{best !== undefined ? ` · ${Math.round(best * 100)}%` : ''}</span>
              </a>
            </li>
          );
        })}
      </ul>
      <div class="btn-row" style={{ marginTop: '32px' }}>
        <button type="button" class="btn" onClick={exportFile}>{labels.export}</button>
        <label class="btn">{labels.import}<input type="file" accept="application/json" class="visually-hidden" onChange={importFile} /></label>
        <button type="button" class="btn" onClick={reset}>{labels.reset}</button>
      </div>
    </div>
  );
}
