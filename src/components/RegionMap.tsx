import { useEffect, useRef, useState } from 'preact/hooks';

type Point = { name: string; coords: [number, number]; href?: string; zoom?: number };
type Props = {
  points: Point[];
  center?: [number, number];
  zoom?: number;
  label: string;
  /** Adds a row of place buttons under the map that fly to each place; pins then show their name on hover or when chosen. */
  jump?: { all: string; hint?: string; wiki?: string };
};

// Free, keyless vector tiles (OpenStreetMap data). Desaturated in CSS to stay black and white.
const STYLE = 'https://tiles.openfreemap.org/styles/positron';

export default function RegionMap({ points, center, zoom = 6, label, jump }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('maplibre-gl').Map | undefined>(undefined);
  const pins = useRef<HTMLElement[]>([]);
  const overview = useRef<() => void>(() => {});
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(-1);

  const go = (i: number) => {
    setActive(i);
    pins.current.forEach((n, j) => n.classList.toggle('on', j === i));
    const m = mapRef.current;
    if (!m) return;
    if (i < 0) return overview.current();
    const p = points[i];
    m.flyTo({ center: [p.coords[1], p.coords[0]], zoom: p.zoom ?? 9, duration: 1200, essential: true });
  };

  useEffect(() => {
    if (!el.current) return;
    let map: import('maplibre-gl').Map | undefined;
    let cancelled = false;
    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      try {
        const [maplibregl, { default: workerUrl }] = await Promise.all([
          import('maplibre-gl'),
          // The bundler does not follow maplibre's own worker lookup, so point it at the emitted file.
          import('maplibre-gl/dist/maplibre-gl-worker.mjs?url'),
          import('maplibre-gl/dist/maplibre-gl.css'),
        ]);
        if (cancelled || !el.current) return;
        maplibregl.setWorkerUrl(workerUrl);
        const [lat, lng] = center ?? points[0].coords;
        const m = new maplibregl.Map({
          container: el.current,
          style: STYLE,
          center: [lng, lat],
          zoom,
          attributionControl: { compact: true },
          // Mouse: wheel zooms and drag pans right away. Touch: keep one-finger page scrolling, two fingers move the map.
          cooperativeGestures: matchMedia('(pointer: coarse)').matches,
        });
        map = m;
        mapRef.current = m;
        m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
        m.on('error', () => setFailed((f) => f || !m.isStyleLoaded()));
        // Tiles unreachable (offline, blocked): show the coordinates list instead of a blank box.
        setTimeout(() => !cancelled && !m.isStyleLoaded() && setFailed(true), 8000);
        pins.current = points.map((p, i) => {
          const node = document.createElement(p.href && !jump ? 'a' : 'span');
          node.className = jump ? 'map-pin compact' : 'map-pin';
          const dot = document.createElement('i');
          const name = document.createElement('b');
          name.textContent = p.name;
          node.append(dot, name);
          if (p.href && !jump) (node as HTMLAnchorElement).href = p.href;
          if (jump) {
            node.title = p.name;
            node.addEventListener('click', (ev) => { ev.stopPropagation(); go(i); });
          }
          new maplibregl.Marker({ element: node, anchor: 'left', offset: [-5, 0] }).setLngLat([p.coords[1], p.coords[0]]).addTo(m);
          return node;
        });
        if (!center && points.length > 1) {
          const b = new maplibregl.LngLatBounds();
          points.forEach((p) => b.extend([p.coords[1], p.coords[0]]));
          overview.current = () => m.fitBounds(b, { padding: 60, maxZoom: zoom, duration: 1200 });
          m.fitBounds(b, { padding: 60, maxZoom: zoom, duration: 0 });
        } else {
          const [la, ln] = center ?? points[0].coords;
          overview.current = () => m.flyTo({ center: [ln, la], zoom, duration: 1200 });
        }
      } catch {
        setFailed(true);
      }
    }, { rootMargin: '200px' });
    io.observe(el.current);
    return () => {
      cancelled = true;
      io.disconnect();
      map?.remove();
    };
  }, []);

  return (
    <figure class={jump ? 'map map-jump' : 'map'} aria-label={label}>
      <div class="map-frame">
        <div ref={el} class="map-canvas" />
        {failed && (
          <ul class="map-fallback">
            {points.map((p) => <li><span class="num">{p.coords[0].toFixed(2)}, {p.coords[1].toFixed(2)}</span> {p.name}</li>)}
          </ul>
        )}
      </div>
      {jump && (
        <figcaption class="map-places">
          {jump.hint && <span class="map-hint">{jump.hint}</span>}
          <button type="button" class={active < 0 ? 'on' : ''} aria-pressed={active < 0} onClick={() => go(-1)}>{jump.all}</button>
          {points.map((p, i) => (
            <button type="button" class={active === i ? 'on' : ''} aria-pressed={active === i} onClick={() => go(i)}
              onMouseEnter={() => pins.current[i]?.classList.add('hl')} onMouseLeave={() => pins.current[i]?.classList.remove('hl')}
              onFocus={() => pins.current[i]?.classList.add('hl')} onBlur={() => pins.current[i]?.classList.remove('hl')}>{p.name}</button>
          ))}
          {jump.wiki && active >= 0 && points[active].href && (
            <a class="map-wiki" href={points[active].href}>{points[active].name} · {jump.wiki} →</a>
          )}
        </figcaption>
      )}
    </figure>
  );
}
