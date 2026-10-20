// Learner progress, stored only in this browser.

export type ChapterProgress = {
  read: string[];
  cp: Record<string, boolean>;
  quiz?: { best: number; attempts: number; passedAt?: string };
};
export type Progress = { v: 1; chapters: Record<string, ChapterProgress> };

const KEY = 'wm:v1';
const EVENT = 'wm:progress';
export const PASS_RATIO = 0.8;

const empty = (): Progress => ({ v: 1, chapters: {} });

export function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    const p = raw ? (JSON.parse(raw) as Progress) : empty();
    return p && p.v === 1 && p.chapters ? p : empty();
  } catch {
    return empty();
  }
}

export function save(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable: progress lives for this page view only */
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function update(chapter: string, fn: (c: ChapterProgress) => void) {
  const p = load();
  const c = (p.chapters[chapter] ??= { read: [], cp: {} });
  fn(c);
  save(p);
}

export function subscribe(fn: () => void) {
  const onStorage = (e: StorageEvent) => e.key === KEY && fn();
  window.addEventListener(EVENT, fn);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener('storage', onStorage);
  };
}

export function status(c: ChapterProgress | undefined): 'done' | 'progress' | 'none' {
  if (c?.quiz?.passedAt) return 'done';
  if (c && (c.read.length || Object.keys(c.cp).length || c.quiz)) return 'progress';
  return 'none';
}
