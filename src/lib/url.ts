const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Prefix a site-absolute path ("/ko/learn/") with the deploy base path. */
export function u(path: string): string {
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
