import { describe, expect, test } from 'vitest';
import * as Grid from '@/grid';
import * as G from '@/geometry';

describe('grid', () => {
    test('constructor sets size correctly', () => {
        const grid = new Grid.SquareGrid(10);
        expect(grid.size).toBe(10);
    });

    test('size is readonly', () => {
        const grid = new Grid.SquareGrid(10);
        expect(() => {
            grid.size = 20;
        }).toThrow();
    });

    test.for([
   // prettier-ignore-start
        { point: [10, 10], type: Grid.PointType.Corner, expected: [10, 10], distance: 0 },
        { point: [13,  6], type: Grid.PointType.Corner, expected: [10, 10], distance: 5 },
        { point: [14.99, 14.99], type: Grid.PointType.Corner, expected: [10, 10], distance: Math.hypot(4.99, 4.99) },
        { point: [15, 15], type: Grid.PointType.Corner, expected: [20, 20], distance: Math.hypot(5, 5) },

        { point: [15, 15], type: Grid.PointType.Center, expected: [15, 15], distance: 0 },
        { point: [12, 19], type: Grid.PointType.Center, expected: [15, 15], distance: 5 },
        { point: [9.99, 9.99], type: Grid.PointType.Center, expected: [ 5,  5], distance: Math.hypot(4.99, 4.99) },
        { point: [10, 10], type: Grid.PointType.Center, expected: [15, 15], distance: Math.hypot(5, 5) },

        { point: [10, 15], type: Grid.PointType.Edge, expected: [10, 15], distance: 0 },
        { point: [15, 10], type: Grid.PointType.Edge, expected: [15, 10], distance: 0 },
        { point: [12, 13], type: Grid.PointType.Edge, expected: [10, 15], distance: Math.hypot(2, 2) },
        { point: [13, 12], type: Grid.PointType.Edge, expected: [15, 10], distance: Math.hypot(2, 2) },

        { point: [12, 12], type: Grid.PointType.Corner | Grid.PointType.Center, expected: [10, 10], distance: Math.hypot(2, 2) },
        { point: [13, 13], type: Grid.PointType.Corner | Grid.PointType.Center, expected: [15, 15], distance: Math.hypot(2, 2) },

        { point: [12.6, 12.4], type: Grid.PointType.All, expected: [15, 10], distance: Math.hypot(2.4, 2.4) },

    // prettier-ignore-end
    ])(
        'getNearest($point, $type) -> [$expected, $distance]',
        ({ point, type, expected, distance }) => {
            const grid = new Grid.SquareGrid(10);
            const [nearest, dist] = grid.getNearest(point as G.PolyPoint, type);
            expect(nearest).toEqual(expected);
            expect(dist).toBeCloseTo(distance);
        }
    );
});
