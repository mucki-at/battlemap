import type { MultiPolygon, Polygon, Ring, Pair as PolyPoint } from 'polygon-clipping';
import type { Stroke } from './strokes';
export type { MultiPolygon, Polygon, Ring, Pair as PolyPoint } from 'polygon-clipping'

export function updateBoundsWithPoint(tl: PolyPoint, br: PolyPoint, p: PolyPoint)
{
    if (p[0] < tl[0]) tl[0]=p[0];
    if (p[1] < tl[1]) tl[1]=p[1];
    if (p[0] > br[0]) br[0]=p[0];
    if (p[1] > br[1]) br[1]=p[1];
}

export function updateBoundsWithRing(tl: PolyPoint, br: PolyPoint, points: Ring)
{
    for (const p of points)
    {
        if (p[0] < tl[0]) tl[0]=p[0];
        if (p[1] < tl[1]) tl[1]=p[1];
        if (p[0] > br[0]) br[0]=p[0];
        if (p[1] > br[1]) br[1]=p[1];
    }
}

export function updateBoundsWithPolygon(tl: PolyPoint, br: PolyPoint, polygon: Polygon)
{
    for (const r of polygon) updateBoundsWithRing(tl, br, r);
}

export function updateBoundsWithMultiPolygon(tl: PolyPoint, br: PolyPoint, multi: MultiPolygon)
{
    for (const p of multi) updateBoundsWithPolygon(tl, br, p);
}

export function boundsOverlap(tl1: PolyPoint, br1: PolyPoint, tl2: PolyPoint, br2:PolyPoint) : boolean
{
    // ranges do not overlap if right2 < left1 or right1 < left2
    if ((br2[0] < tl1[0]) || (br1[0] < tl2[0])) return false; 
    if ((br2[1] < tl1[1]) || (br1[1] < tl2[1])) return false; 
    return true;
}
