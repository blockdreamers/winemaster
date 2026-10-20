import { useEffect, useRef, useState } from 'preact/hooks';

type Result = { url: string; title: string; excerpt: string };
type Props = { base: string; placeholder: string; empty: string; devNote: string };

type Pagefind = { search: (q: string) => Promise<{ results: { data: () => Promise<{ url: string; meta: { title?: string }; excerpt: string }> }[] }> };

export default function Search({ base, placeholder, empty, devNote }: Props) {
  const pf = useRef<Pagefind | null>(null);
  const [ready, setReady] = useState<boolean | null>(null);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Result[] | null>(null);

  useEffect(() => {
    const url = `${base}pagefind/pagefind.js`;
    import(/* @vite-ignore */ url)
      .then((m) => { pf.current = m; setReady(true); })
      .catch(() => setReady(false));
    const initial = new URLSearchParams(location.search).get('q');
    if (initial) setQ(initial);
  }, []);

  useEffect(() => {
    if (!ready || !pf.current) return;
    const term = q.trim();
    if (!term) { setResults(null); return; }
    let live = true;
    const t = setTimeout(async () => {
      const r = await pf.current!.search(term);
      const data = await Promise.all(r.results.slice(0, 20).map((x) => x.data()));
      if (live) setResults(data.map((d) => ({ url: d.url, title: d.meta.title ?? d.url, excerpt: d.excerpt })));
    }, 120);
    return () => { live = false; clearTimeout(t); };
  }, [q, ready]);

  return (
    <div class="search">
      <input
        type="search" class="search-input" value={q} placeholder={placeholder} autofocus
        onInput={(e) => setQ((e.target as HTMLInputElement).value)} aria-label={placeholder}
      />
      {ready === false && <p class="note">{devNote}</p>}
      {results && results.length === 0 && <p class="meta">{empty}</p>}
      {results && results.length > 0 && (
        <ul class="rows">
          {results.map((r) => (
            <li key={r.url}>
              <a class="search-hit" href={r.url}>
                <span class="row-title">{r.title.replace(/ · WineMaster$/, '')}</span>
                <span class="row-sub" dangerouslySetInnerHTML={{ __html: r.excerpt }} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
