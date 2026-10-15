export interface Line {
    color: string;
    points: Array<number>;
}

export interface Point {
    x: number;
    y: number;
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
        const test = Math.hypot(pos.x - points[i], pos.y - points[i + 1]) <= r;
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
            modified = true;
        } else if (segments.length == 2) {
            if (segments[1] != points.length) {
                points.splice(segments[1], points.length-segments[1]);
                modified = true;
            }
            if (segments[0] != 0) {
                points.splice(0, segments[0]);
                modified = true;
            }
        } else {
            const newFirstSegment = points.slice(segments[0], segments[1]);         
            const newLines : Array<Line> = [];
            for (let j = 2; j < segments.length; j += 2) {
                newLines.push({
                    color: lines[i].color,
                    points: points.slice(segments[j], segments[j + 1]),
                });
            }
             lines[i].points = newFirstSegment;
             splices.push({
                 index: i + 1,
                 delete: 0,
                 add: newLines,
             });
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