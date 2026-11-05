import { describe, expect, test } from 'vitest';
import * as geom from '@/geometry';

describe('bounds', () => {
    test('updateBoundsWithPoint updates bounds correctly', () => {
        const tl: geom.PolyPoint = [10, 9];
        const br: geom.PolyPoint = [0, 0];
        const test1: geom.PolyPoint = [1, 2];
        const test2: geom.PolyPoint = [0.5, 0.7];
        const test3: geom.PolyPoint = [1.9, 1.5];

        geom.updateBoundsWithPoint(tl, br, test1);
        expect(tl).toEqual([1, 2]);
        expect(br).toEqual([1, 2]);
        geom.updateBoundsWithPoint(tl, br, test2);
        expect(tl).toEqual([0.5, 0.7]);
        expect(br).toEqual([1, 2]);
        geom.updateBoundsWithPoint(tl, br, test3);
        expect(tl).toEqual([0.5, 0.7]);
        expect(br).toEqual([1.9, 2]);       
    });

    test('updateBoundsWithRing updates bounds correctly', () => {
        const tl: geom.PolyPoint = [10, 9];
        const br: geom.PolyPoint = [0, 0];
        const test: geom.Ring = [
            [1, 2],
            [0.5, 0.7],
            [1.9, 1.5],
        ];

        geom.updateBoundsWithRing(tl, br, test);
        expect(tl).toEqual([0.5, 0.7]);
        expect(br).toEqual([1.9, 2]);
    });

    test('updateBoundsWithPolygon updates bounds correctly', () => {
        const tl: geom.PolyPoint = [10, 9];
        const br: geom.PolyPoint = [0, 0];
        const test: geom.Polygon = [
            [[1, 2], [0.5, 0.7]],
            [[1.9, 1.5]],
        ];

        geom.updateBoundsWithPolygon(tl, br, test);
        expect(tl).toEqual([0.5, 0.7]);
        expect(br).toEqual([1.9, 2]);
    });

    test('updateBoundsWithMultiPolygon updates bounds correctly', () => {
        const tl: geom.PolyPoint = [10, 9];
        const br: geom.PolyPoint = [0, 0];
        const test: geom.MultiPolygon = [
            [[[1, 2]],[[0.5, 0.7]]],
            [[[1.9, 1.5]]],
        ];

        geom.updateBoundsWithMultiPolygon(tl, br, test);
        expect(tl).toEqual([0.5, 0.7]);
        expect(br).toEqual([1.9, 2]);
    });

    test('boundsOverlap returns true for overlapping bounds', () => {
        const tl1: geom.PolyPoint = [0, 0];
        const br1: geom.PolyPoint = [2, 2];
        const tl2: geom.PolyPoint = [1, 1];
        const br2: geom.PolyPoint = [3, 3];

        expect(geom.boundsOverlap(tl1, br1, tl2, br2)).toBe(true);
    });

    test('boundsOverlap returns false for non-overlapping bounds', () => {
        const tl1: geom.PolyPoint = [0, 0];
        const br1: geom.PolyPoint = [1, 1];
        const tl2: geom.PolyPoint = [2, 2];
        const br2: geom.PolyPoint = [3, 3];

        expect(geom.boundsOverlap(tl1, br1, tl2, br2)).toBe(false);
    });

   

});
