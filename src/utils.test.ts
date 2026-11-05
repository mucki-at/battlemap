import { describe, expect, test } from 'vitest';
import { uid, filter } from '@/utils';

describe('uid', () => {
    test('returns a nonempty string', () => {
        const id = uid();
        expect(id).toBeTypeOf('string');
        expect(id).not.toBe('');
    });
    test('uids are unique', () => {
        const id1 = uid();
        const id2 = uid();
        expect(id1).not.toBe(id2);
    });
});

describe('filter', () => {
    test('filters an array', () => {
        const arr = [1, 2, 3, 4, 5];
        const result = Array.from(filter(arr, (x) => x % 2 === 0));
        expect(result).toEqual([2, 4]);
    });

    test('filters a Set', () => {
        const set = new Set([1, 2, 3, 4, 5]);
        const result = Array.from(filter(set, (x) => x > 3));
        expect(result).toEqual([4, 5]);
    });

    test('filters a Map', () => {
        const map = new Map([
            ['a', 1],
            ['b', 2],
            ['c', 3],
        ]);
        const result = Array.from(filter(map, ([key, value]) => value < 3));
        expect(result).toEqual([['a', 1], ['b', 2]]);
    });
});