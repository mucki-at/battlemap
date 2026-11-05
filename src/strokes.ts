import { uid, type Mapish } from '@/utils'
import { getStroke } from 'perfect-freehand';
import polygonClipping from 'polygon-clipping';
import { useSession } from '@/session';
import type { MultiPolygon, PolyPoint } from './geometry';
import { boundsOverlap, updateBoundsWithMultiPolygon, updateBoundsWithPoint, updateBoundsWithRing } from './geometry';

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
    color: string;          // anything CSS/Canvas2D can handle (eg. 'red', '#ff0000', 'rgb(255,0,0)') or the special value 'erase' which means this stroke is an eraser stroke.
    outline: MultiPolygon;  // the shape(s) of the stroke.
    topLeft: PolyPoint;     // the top left corner of the bounding rectangle of the stroke
    bottomRight: PolyPoint; // the bottom right corner of the bounding rectangle of the stroke
}

export function strokeBoundsOverlap(s1: Stroke, s2: Stroke) : boolean
{
    return boundsOverlap(s1.topLeft, s1.bottomRight, s2.topLeft, s2.bottomRight);
}

export function isEraser(stroke: Stroke) : boolean
{
    return stroke.color === ERASE;
}

// how we expect strokes to be stored by the backend
export type StrokeMap = Mapish<string, Stroke>;

// how we interface with frontend: x, y, pressure (optional)
export type TouchPoint = [number, number] | [number, number, number];


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

    public setShape(points: TouchPoint[]): void
    {
        if (points.length == 0)
        {
            this.points = [];
            this.topLeft = [0, 0];
            this.bottomRight = [0, 0];
            this.outline[0]![0] = [];
            return;
        }
        this.points = points.slice();
        this.topLeft = [points[0]![0], points[0]![1]];
        this.bottomRight = [points[0]![0], points[0]![1]];
        updateBoundsWithRing(this.topLeft, this.bottomRight, this.points as Ring);
        this.outline[0]![0] = getStroke(this.points, {
            size: this.size,
            simulatePressure: !this.isPen,
            last: false,
        });
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
            bottomRight: this.bottomRight,
        };
    }

    public copyStroke(): Stroke {
        return {
            color: this.color,
            outline: this.outline,
            topLeft: this.topLeft,
            bottomRight: this.bottomRight,
        };
    }

    protected addPoint(point: TouchPoint, final: boolean): void {
        this.points.push(point);
        updateBoundsWithPoint(this.topLeft, this.bottomRight, [
            point[0],
            point[1],
        ]);
        this.outline[0]![0] = getStroke(this.points, {
            size: this.size,
            simulatePressure: !this.isPen,
            last: final,
        });
    }
}

// Begin a new stroke. If an active stroke exists, it is finalized.
export function beginStroke(
    start: TouchPoint,      // first point in stroke
    color: string,          // color of stroke. use Strokes.ERASE to create a stroke which erases things.
    size: number,           // diameter of the brush
    isPen: boolean          // if false then pressure is simulated, otherwise the pressure in the touch points are used
) : void {
    if (!session) return;
    if (session.myActiveStroke) endStroke();
    session.myActiveStroke = new ActiveStroke(start, color, size, isPen);
}    

// add a new point to the currently active stroke. If no stroke is active, this does nothing.
export function continueStroke(
    pos: TouchPoint         // point to add
) : void {
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

// set the stroke to be exactly the given list of points. This can be used to
// draw predefined shapes like rectangles with a live preview. Note that if you
// want a closed shape you need to duplicate the first point at the end (so a
// rectangle has 5 points for example [A, B, C, D, A])
export function setActiveStrokeShape(
    points: TouchPoint[]    // list of points to set
): void {
    if (session?.myActiveStroke) {
        const activeStroke = session.myActiveStroke as ActiveStroke;
        activeStroke.setShape(points);
        if (Date.now() - lastWetStrokeUpdateTime > WET_STROKE_UPDATE_INTERVAL) {
            lastWetStrokeUpdateTime = Date.now();
            session.activeStrokes?.set(
                session.getClientId(),
                activeStroke.copyStroke()
            );
        }
    }
}

// finalize the active stroke. If this is a painting stroke, it is moved to the
// 'dry' strokes. If this is an erasing stroke, the outline is subtracted from
// all other 'dry' strokes. If there is no active stroke, this does nothing.
// After this function returns, the active stroke is cleared and there is no longer an active stroke.
export function endStroke(
    pos?: TouchPoint            // optional final point to add to the stroke before finalizing it
) : void
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

