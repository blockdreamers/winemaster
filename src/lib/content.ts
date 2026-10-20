import { getCollection, type CollectionEntry } from 'astro:content';
import { defaultLang, type Lang } from '../i18n/ui';

type Name = 'chapters' | 'regions' | 'grapes';

export const slugOf = (id: string) => id.split('/').slice(1).join('/');
export const langOf = (id: string) => id.split('/')[0] as Lang;

/** Entry for a slug in the requested language, falling back to Korean. */
export async function localized<N extends Name>(name: N, slug: string, lang: Lang) {
  const all = (await getCollection(name)) as CollectionEntry<N>[];
  const entry = all.find((e) => e.id === `${lang}/${slug}`) ?? all.find((e) => e.id === `${defaultLang}/${slug}`);
  return entry ? { entry, fallback: langOf(entry.id) !== lang } : undefined;
}

/** All distinct slugs of a collection, each resolved for one language. */
export async function listLocalized<N extends Name>(name: N, lang: Lang) {
  const all = (await getCollection(name)) as CollectionEntry<N>[];
  const slugs = [...new Set(all.map((e) => slugOf(e.id)))];
  const out = [];
  for (const s of slugs) {
    const r = await localized(name, s, lang);
    if (r) out.push({ slug: s, ...r });
  }
  return out;
}
