import type { Feature, Geometry, Position } from 'geojson';

type Ring = Position[];

function inRing([x, y]: Position, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function inGeometry(p: Position, g: Geometry | null): boolean {
  if (!g) return false;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  return polys.some(([outer, ...holes]) => inRing(p, outer) && !holes.some((h) => inRing(p, h)));
}

/**
 * Name of the country containing [lng, lat]. Small islands and coastal towns can fall just
 * outside the simplified outlines, so nearby points are tried before giving up.
 */
export function countryAt(features: Feature[], lng: number, lat: number): string | undefined {
  const steps = [0, 0.05, 0.1, 0.2, 0.35, 0.5];
  for (const r of steps) {
    const tries: Position[] = r === 0 ? [[lng, lat]] : [[lng + r, lat], [lng - r, lat], [lng, lat + r], [lng, lat - r], [lng + r, lat + r], [lng - r, lat - r], [lng + r, lat - r], [lng - r, lat + r]];
    for (const p of tries) {
      const f = features.find((f) => inGeometry(p, f.geometry));
      if (f) return f.properties?.name as string;
    }
  }
  return undefined;
}
