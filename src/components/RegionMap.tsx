import { useEffect, useRef, useState } from 'preact/hooks';

type Point = { name: string; coords: [number, number]; href?: string };
type Props = { points: Point[]; center?: [number, number]; zoom?: number; label: string };

// Free, keyless vector tiles (OpenStreetMap data). Desaturated in CSS to stay black and white.
const STYLE = 'https://tiles.openfreemap.org/styles/positron';

export default function RegionMap({ points, center, zoom = 6, label }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

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
          cooperativeGestures: true,
        });
        map = m;
        m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
        m.on('error', () => setFailed((f) => f || !m.isStyleLoaded()));
        // Tiles unreachable (offline, blocked): show the coordinates list instead of a blank box.
        setTimeout(() => !cancelled && !m.isStyleLoaded() && setFailed(true), 8000);
        for (const p of points) {
          const node = document.createElement(p.href ? 'a' : 'span');
          node.className = 'map-pin';
          node.innerHTML = `<i></i><b>${p.name}</b>`;
          if (p.href) (node as HTMLAnchorElement).href = p.href;
          new maplibregl.Marker({ element: node, anchor: 'left' }).setLngLat([p.coords[1], p.coords[0]]).addTo(m);
        }
        if (!center && points.length > 1) {
          const b = new maplibregl.LngLatBounds();
          points.forEach((p) => b.extend([p.coords[1], p.coords[0]]));
          m.fitBounds(b, { padding: 60, maxZoom: zoom, duration: 0 });
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
    <figure class="map" aria-label={label}>
      <div ref={el} class="map-canvas" />
      {failed && (
        <ul class="map-fallback">
          {points.map((p) => <li><span class="num">{p.coords[0].toFixed(2)}, {p.coords[1].toFixed(2)}</span> {p.name}</li>)}
        </ul>
      )}
    </figure>
  );
}
