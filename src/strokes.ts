import { uid } from '@/utils'

export interface Line
{
    id: string;
    color: string;
    points: Array<number>;
}

export interface Point {
    x: number;
    y: number;
}

let activeLine : Line | null = null;

export function beginOrContinueLine(lines: Array<Line>, pos: Point, color: string)
{
    if (activeLine)
    {
        activeLine.points = activeLine.points.concat([pos.x, pos.y]);
      //  activeLine.points.push(pos.x, pos.y);
    }
    else
    {
        lines.push({
            id: uid(),
            color: color,
            points: [pos.x, pos.y],
        });
        activeLine = lines[lines.length-1]
    }
}

export function endLine()
{
    activeLine = null;
}

function findSegements(
    points: Array<number>,
    pos: Point,
    r: number,
    inside: boolean
) {
    // Step 1: find all the places the line enters or leaves the circle
    const segments = [];
    let prevIn = !inside;
    let i = 0;
    while (i < points.length) {
        const px : number = points[i];
        const py : number = points[i+1];
        const test = Math.hypot(pos.x - px, pos.y - py) <= r;
        if (test != prevIn) {
            segments.push(i);
        }
        prevIn = test;
        i += 2;
    }
    if (prevIn === inside) segments.push(points.length);
    return segments;
}

interface Splice {
    index: number;
    delete: number;
    add: Array<Line>;
}

export function trimLines(lines: Array<Line>, pos: Point, r: number) : boolean {
    const splices = new Array<Splice>();
    let modified = false;
    for (let i = lines.length - 1; i >= 0; --i) {
        const points = lines[i].points;
        // Step 1: find all the parts of the line which are not inside the circle
        const segments = findSegements(points, pos, r, false);

        // Step 2: trim all the deletd points. might split or delete lines
        if (segments.length == 0) // line is gone
        {
            splices.push({
                index: i,
                delete: 1,
                add: [],
            });
            if (activeLine == lines[i])
            {
                activeLine = null;
            }
            modified = true;
        } else {
            const newFirstSegment = points.slice(segments[0], segments[1]);         
            const newLines : Array<Line> = [];
            for (let j = 2; j < segments.length; j += 2) {
                newLines.push({
                    id: uid(),
                    color: lines[i].color,
                    points: points.slice(segments[j], segments[j + 1]),
                });
            }
            lines[i].points = newFirstSegment;
            if (newLines.length > 0)
            {
                splices.push({
                    index: i + 1,
                    delete: 0,
                    add: newLines,
                });
            }
            modified = true;
        }
    }

    // Step 3: insert/delete all the new/deleted line segments in the right slots
    // we do this *after* iterating over the existing lines (and back to front) to
    // make sure the indices are valid
    for (const splice of splices) {
        lines.splice(splice.index, splice.delete, ...splice.add);
    }

    return modified;
}