import { uid, type Mapish } from '@/utils'
import { getStroke } from 'perfect-freehand';
import polygonClipping from 'polygon-clipping';
import type { MultiPolygon, Polygon, Ring, Pair as PolyPoint } from 'polygon-clipping';
export type { MultiPolygon, Polygon, Ring, Pair as PolyPoint } from 'polygon-clipping'
import { useSession } from '@/session';

let session : ReturnType<typeof useSession> | null = null;
let lastWetStrokeUpdateTime = 0;
const WET_STROKE_UPDATE_INTERVAL = 100; // milliseconds

export function initStrokes()
{
    session = useSession();
}

export const ERASE = 'erase';

// a single stroke as drawn by the user.
// color is anything css/canvas acceps as color value or the special value 'erase'
export interface Stroke {
    color: string; // set to 'erase' to cause the stroke to visually delete things
    outline: MultiPolygon; // stroke outline as multi-polygon in
    topLeft: PolyPoint;
    bottomRight: PolyPoint;
}

export function isEraser(stroke: Stroke) : boolean
{
    return stroke.color === ERASE;
}

// how we expect strokes to be stored by the backend
export type StrokeMap = Mapish<string, Stroke>;

// how we interface with frontend: x, y, pressure (optional)
export type TouchPoint = [number, number] | [number, number, number];

function updateBoundsWithPoint(tl: PolyPoint, br: PolyPoint, p: PolyPoint)
{
    if (p[0] < tl[0]) tl[0]=p[0];
    if (p[1] < tl[1]) tl[1]=p[1];
    if (p[0] > br[0]) br[0]=p[0];
    if (p[1] > br[1]) br[1]=p[1];
}

function updateBoundsWithRing(tl: PolyPoint, br: PolyPoint, points: Ring)
{
    for (const p of points)
    {
        if (p[0] < tl[0]) tl[0]=p[0];
        if (p[1] < tl[1]) tl[1]=p[1];
        if (p[0] > br[0]) br[0]=p[0];
        if (p[1] > br[1]) br[1]=p[1];
    }
}

function updateBoundsWithPolygon(tl: PolyPoint, br: PolyPoint, polygon: Polygon)
{
    for (const r of polygon) updateBoundsWithRing(tl, br, r);
}

function updateBoundsWithMultiPolygon(tl: PolyPoint, br: PolyPoint, multi: MultiPolygon)
{
    for (const p of multi) updateBoundsWithPolygon(tl, br, p);
}

function boundsOverlap(tl1: PolyPoint, br1: PolyPoint, tl2: PolyPoint, br2:PolyPoint) : boolean
{
    // ranges do not overlap if right2 < left1 or right1 < left2
    if ((br2[0] < tl1[0]) || (br1[0] < tl2[0])) return false; 
    if ((br2[1] < tl1[1]) || (br1[1] < tl2[1])) return false; 
    return true;
}

function strokeBoundsOverlap(s1: Stroke, s2: Stroke) : boolean
{
    return boundsOverlap(s1.topLeft, s1.bottomRight, s2.topLeft, s2.bottomRight);
}

// The currently active stroke.
class ActiveStroke implements Stroke {
    color: string;
    outline: MultiPolygon;
    points: Array<TouchPoint>;
    isPen: boolean;
    size: number;
    topLeft: PolyPoint;
    bottomRight: PolyPoint;

    constructor(
        start: TouchPoint,
        color: string,
        size: number,
        isPen: boolean
    ) {
        this.color = color;
        this.points = [];
        this.isPen = isPen;
        this.size = size;
        this.outline = [[[]]];
        this.topLeft = [start[0], start[1]];
        this.bottomRight = [start[0], start[1]];
        this.addPoint(start, false);
    }

    public continue(point: TouchPoint): void {
        this.addPoint(point, false);
    }

    public finalize(point?: TouchPoint): Stroke {
        if (point) {
            this.addPoint(point, true);
        } else {
            this.outline[0]![0] = getStroke(this.points, {
                size: this.size,
                simulatePressure: !this.isPen,
                last: true,
            });
        }

        return {
            color: this.color,
            outline: polygonClipping.union(this.outline),
            topLeft: this.topLeft,
            bottomRight: this.bottomRight
        };
    }

    public copyStroke(): Stroke {
        return {
            color: this.color,
            outline: this.outline,
            topLeft: this.topLeft,
            bottomRight: this.bottomRight
        };
    }

    protected addPoint(point: TouchPoint, final: boolean): void {
        this.points.push(point);
        updateBoundsWithPoint(this.topLeft, this.bottomRight, [point[0], point[1]]);
        this.outline[0]![0] = getStroke(this.points, {
            size: this.size,
            simulatePressure: !this.isPen,
            last: final,
        });
    }
}

export function beginStroke(
    start: TouchPoint,
    color: string,
    size: number,
    isPen: boolean
) : void {
    if (!session) return;
    if (session.myActiveStroke) endStroke();
    session.myActiveStroke = new ActiveStroke(start, color, size, isPen);
}    

export function continueStroke(pos: TouchPoint)
{
    if (session?.myActiveStroke)
    {
        const activeStroke = session.myActiveStroke as ActiveStroke;
        activeStroke.continue(pos);
        if (Date.now() - lastWetStrokeUpdateTime > WET_STROKE_UPDATE_INTERVAL)
        {
            lastWetStrokeUpdateTime = Date.now();
            session.activeStrokes?.set(
                session.getClientId(),
                activeStroke.copyStroke()
            );
        }
    }
}

export function endStroke(pos?: TouchPoint)
{
    if (!session) return;
    if (session.myActiveStroke)
    {
        session.activeStrokes?.delete(session.getClientId());
        const completStroke = (session.myActiveStroke as ActiveStroke).finalize(pos);
        if (session.strokes)
        {
            if (completStroke.color == ERASE)
            {
                const changes: [string, Stroke?][] = []
                for (const [key, stroke] of session.strokes)
                {
                    if (!strokeBoundsOverlap(completStroke, stroke)) continue;

                    const newOutline = polygonClipping.difference(stroke.outline, completStroke.outline);
                    if (newOutline.length == 0) changes.push([key]);
                    else
                    {
                        const anchor = newOutline[0]![0]![0]!;
                        const newStroke : Stroke = {
                            color: stroke.color,
                            outline: newOutline,
                            topLeft: [anchor[0], anchor[1]],
                            bottomRight: [anchor[0], anchor[1]],
                        };
                        updateBoundsWithMultiPolygon(newStroke.topLeft,newStroke.bottomRight,newStroke.outline);
                        changes.push([key, newStroke]);
                    }
                }
                for (const [key, stroke] of changes)
                {
                    if (stroke) session.strokes.set(key, stroke);
                    else session.strokes.delete(key);
                }
            }
            else
            {
                session.strokes.set(uid(), completStroke);
            }
        }
    }
    session.myActiveStroke = undefined;
}

