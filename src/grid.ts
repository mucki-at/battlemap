import type * as G from '@/geometry';

export const PointType = {
    Center: 1,
    Corner: 2,
    Edge: 4,
    All: 1 | 2 | 4,
} as const;

export interface Grid {
    readonly size: number;

    getNearest(point: G.PolyPoint, type: number):  [G.PolyPoint, number];
};

export class SquareGrid implements Grid {
    #size: number = 50;

    get size(): number { return this.#size; }

    constructor(size: number) {
        this.#size = size;
    }

    protected $roundToGrid(x: number, ofs: number) : number
    {
        return Math.round((x+ofs)/this.size)*this.size-ofs;
    }

    protected $roundPointToGrid(point: G.PolyPoint, ofs: G.PolyPoint) : G.PolyPoint
    {
        return [this.$roundToGrid(point[0], ofs[0]), this.$roundToGrid(point[1], ofs[1])];
    }

    public getNearest(point: G.PolyPoint, type: number): [G.PolyPoint, number] {
        const x = point[0];
        const y = point[1];
        const s = this.size;
        let result: G.PolyPoint = [0, 0];
        let dist = Number.MAX_VALUE;

        // since this is the first check, we can assign the result and dist directly
        if (type & PointType.Corner)
        {
            result = this.$roundPointToGrid(point, [0, 0]);
            dist = Math.hypot(result[0] - x, result[1] - y);
        }       

        // center is like corner but offset by half the grid size, so we can calculate it and compare distances
        if (type & PointType.Center)
        {
            const centerPoint = this.$roundPointToGrid(point, [s/2, s/2]);
            const centerDist = Math.hypot(centerPoint[0] - x, centerPoint[1] - y);
            if (centerDist < dist)
            {
                result = centerPoint;
                dist = centerDist;
            }
        }
 
        // edges are like corners of a grid which is offset by half the grid size in one direction, so we can calculate it and compare distances
        if (type & PointType.Edge)
        {
            // TODO: technically we can decide which edge to snap to based on the point's position 
            // relative to the center of the grid cell, but for now we'll just check both edges
            // and pick the closest one. 
            const edgePointX = this.$roundPointToGrid(point, [0, s/2]);
            const edgePointY = this.$roundPointToGrid(point, [s/2, 0]);

            const distEdgeX = Math.hypot(edgePointX[0] - x, edgePointX[1] - y);
            const distEdgeY = Math.hypot(edgePointY[0] - x, edgePointY[1] - y);

            if (distEdgeX < dist)
            {
                result = edgePointX;
                dist = distEdgeX;
            }
            if (distEdgeY < dist)
            {
                result = edgePointY;
                dist = distEdgeY;
            }
        }

        return [result, dist];
    }
}   
