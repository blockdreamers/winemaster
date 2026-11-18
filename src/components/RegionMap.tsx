import { useEffect, useRef, useState } from 'preact/hooks';
import type { Feature } from 'geojson';
import { countryAt } from '../lib/geo';

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
// Natural Earth 1:50m country outlines (public domain, via world-atlas), served from /public.
const COUNTRIES = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/geo/countries-50m.json`;
const NO_COUNTRY = ['==', ['get', 'name'], ''] as any;

/** Adds clear country borders, plus layers that dim every country but the chosen one. */
async function addCountries(m: import('maplibre-gl').Map): Promise<Feature[]> {
  const [{ feature, mesh }, topo] = await Promise.all([import('topojson-client'), fetch(COUNTRIES).then((r) => r.json())]);
  const countries = (feature(topo, topo.objects.countries) as any).features as Feature[];
  // Borders between countries only, so coastlines stay as the base map draws them.
  const borders = mesh(topo, topo.objects.countries, (a, b) => a !== b);
  const firstLabel = m.getStyle().layers.find((l) => l.type === 'symbol')?.id;
  m.addSource('wm-countries', { type: 'geojson', data: { type: 'FeatureCollection', features: countries } });
  m.addSource('wm-borders', { type: 'geojson', data: borders });
  const width = (lo: number, hi: number) => ['interpolate', ['linear'], ['zoom'], 3, lo, 9, hi] as any;
  m.addLayer({ id: 'wm-dim', type: 'fill', source: 'wm-countries', filter: NO_COUNTRY, paint: { 'fill-color': '#000', 'fill-opacity': 0.4 } }, firstLabel);
  m.addLayer({ id: 'wm-border-casing', type: 'line', source: 'wm-borders', layout: { 'line-join': 'round' }, paint: { 'line-color': '#fff', 'line-width': width(3, 7) } }, firstLabel);
  m.addLayer({ id: 'wm-border', type: 'line', source: 'wm-borders', layout: { 'line-join': 'round' }, paint: { 'line-color': '#4a4a4a', 'line-width': width(0.9, 2) } }, firstLabel);
  m.addLayer({ id: 'wm-focus', type: 'line', source: 'wm-countries', filter: NO_COUNTRY, layout: { 'line-join': 'round' }, paint: { 'line-color': '#000', 'line-width': width(1.6, 3.5) } }, firstLabel);
  return countries;
}

export default function RegionMap({ points, center, zoom = 6, label, jump }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('maplibre-gl').Map | undefined>(undefined);
  const pins = useRef<HTMLElement[]>([]);
  const overview = useRef<() => void>(() => {});
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(-1);
  const countries = useRef<Feature[]>([]);
  const chosen = useRef(-1);

  /** Dim every country except the one holding the chosen place (none when nothing is chosen). */
  const shade = () => {
    const m = mapRef.current;
    if (!m?.getLayer('wm-dim')) return;
    const p = points[chosen.current];
    const name = p && countryAt(countries.current, p.coords[1], p.coords[0]);
    m.setFilter('wm-dim', name ? ['!=', ['get', 'name'], name] : NO_COUNTRY);
    m.setFilter('wm-focus', name ? ['==', ['get', 'name'], name] : NO_COUNTRY);
  };

  const go = (i: number) => {
    setActive(i);
    chosen.current = i;
    shade();
    pins.current.forEach((n, j) => n.classList.toggle('on', j === i));
    const m = mapRef.current;
    if (!m) return;
    if (i < 0) return overview.current();
    const p = points[i];
    // Pan only: keep the reader's zoom so the surroundings stay in view.
    m.easeTo({ center: [p.coords[1], p.coords[0]], duration: 900, essential: true });
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
          // Wheel zooms and drag pans right away; on touch, one finger pans and a pinch zooms.
          cooperativeGestures: false,
        });
        map = m;
        mapRef.current = m;
        m.on('load', () => {
          addCountries(m)
            .then((f) => { if (!cancelled) { countries.current = f; shade(); } })
            .catch(() => { /* borders are a bonus; the map still works without them */ });
        });
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
