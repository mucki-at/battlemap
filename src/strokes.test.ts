import { describe, expect, test } from 'vitest';
import * as Strokes from '@/strokes';

describe('Strokes', () => {
    test('isEraser returns true for ERASE color', () => {
        const stroke: Strokes.Stroke = {
            color: Strokes.ERASE,
            outline: [],
            topLeft: [0, 0],
            bottomRight: [1, 1],
        };
        expect(Strokes.isEraser(stroke)).toBe(true);
    });

    test('isEraser returns false for non-ERASE color', () => {
        const stroke: Strokes.Stroke = {
            color: 'red',
            outline: [],
            topLeft: [0, 0],
            bottomRight: [1, 1],
        };
        expect(Strokes.isEraser(stroke)).toBe(false);
    });
});