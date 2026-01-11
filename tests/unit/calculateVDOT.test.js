/**
 * Unit tests for VDOT calculation
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { calculateVDOT, formatTime } from '../../js/core.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let VDOT_TABLE;

beforeAll(() => {
    const dataPath = path.resolve(__dirname, '../../data/vdot-tables.json');
    const data = fs.readFileSync(dataPath, 'utf-8');
    VDOT_TABLE = JSON.parse(data);
});

describe('calculateVDOT', () => {
    describe('error handling', () => {
        it('throws error when VDOT table is null', () => {
            expect(() => calculateVDOT(null, '5K', 1200)).toThrow('VDOT data not loaded');
        });

        it('throws error when VDOT table is undefined', () => {
            expect(() => calculateVDOT(undefined, '5K', 1200)).toThrow('VDOT data not loaded');
        });

        it('throws error for time faster than VDOT 85', () => {
            // VDOT 85 5K time is 757s, so 700s should throw
            expect(() => calculateVDOT(VDOT_TABLE, '5K', 700)).toThrow(/beyond the scope/);
        });

        it('throws error for 1500m time faster than VDOT 85', () => {
            // VDOT 85 1500m time is 204s, so 200s should throw
            expect(() => calculateVDOT(VDOT_TABLE, '1500', 200)).toThrow(/beyond the scope/);
        });

        it('throws error for marathon time faster than VDOT 85', () => {
            // VDOT 85 Marathon time is 7270s (~2:01:10), so 7000s should throw
            expect(() => calculateVDOT(VDOT_TABLE, 'M', 7000)).toThrow(/beyond the scope/);
        });

        it('error message includes formatted time', () => {
            try {
                calculateVDOT(VDOT_TABLE, '5K', 700);
            } catch (e) {
                expect(e.message).toContain(formatTime(700));
            }
        });
    });

    describe('exact table lookups', () => {
        it('returns VDOT 50 for exact 5K table time (1197s)', () => {
            const vdot = calculateVDOT(VDOT_TABLE, '5K', 1197);
            expect(vdot).toBe(50);
        });

        it('returns VDOT 30 for exact 5K table time (1840s)', () => {
            const vdot = calculateVDOT(VDOT_TABLE, '5K', 1840);
            expect(vdot).toBe(30);
        });

        it('returns VDOT 85 for exact 5K table time (757s)', () => {
            const vdot = calculateVDOT(VDOT_TABLE, '5K', 757);
            expect(vdot).toBe(85);
        });

        it('returns VDOT 50 for exact 10K table time (2481s)', () => {
            const vdot = calculateVDOT(VDOT_TABLE, '10K', 2481);
            expect(vdot).toBe(50);
        });

        it('returns VDOT 50 for exact 1500m table time (324s)', () => {
            const vdot = calculateVDOT(VDOT_TABLE, '1500', 324);
            expect(vdot).toBe(50);
        });

        it('returns VDOT 50 for exact Marathon table time (11449s)', () => {
            const vdot = calculateVDOT(VDOT_TABLE, 'M', 11449);
            expect(vdot).toBe(50);
        });
    });

    describe('closest match lookups', () => {
        it('returns closest VDOT for time between table values', () => {
            // Between VDOT 50 (1197s) and VDOT 51 (1176s)
            const vdot = calculateVDOT(VDOT_TABLE, '5K', 1185);
            expect([50, 51]).toContain(vdot); // Should match one of the closest
        });

        it('returns VDOT for typical 5K time (25:00 = 1500s)', () => {
            const vdot = calculateVDOT(VDOT_TABLE, '5K', 1500);
            expect(vdot).toBeGreaterThan(30);
            expect(vdot).toBeLessThan(85);
        });

        it('returns VDOT for typical 10K time (50:00 = 3000s)', () => {
            const vdot = calculateVDOT(VDOT_TABLE, '10K', 3000);
            expect(vdot).toBeGreaterThan(30);
            expect(vdot).toBeLessThan(85);
        });

        it('returns VDOT for typical marathon time (4:00:00 = 14400s)', () => {
            const vdot = calculateVDOT(VDOT_TABLE, 'M', 14400);
            expect(vdot).toBeGreaterThan(30);
            expect(vdot).toBeLessThan(85);
        });
    });

    describe('boundary conditions', () => {
        it('handles time at VDOT 30 boundary (slowest)', () => {
            const vdot = calculateVDOT(VDOT_TABLE, '5K', 1840);
            expect(vdot).toBe(30);
        });

        it('handles time at VDOT 85 boundary (fastest)', () => {
            const vdot = calculateVDOT(VDOT_TABLE, '5K', 757);
            expect(vdot).toBe(85);
        });

        it('handles time slightly slower than VDOT 30', () => {
            // VDOT 30 5K is 1840s, so 1900s should still return 30
            const vdot = calculateVDOT(VDOT_TABLE, '5K', 1900);
            expect(vdot).toBe(30);
        });

        it('handles time slightly faster than VDOT 85 (should throw)', () => {
            // VDOT 85 5K is 757s, so 756s should throw
            expect(() => calculateVDOT(VDOT_TABLE, '5K', 756)).toThrow(/beyond the scope/);
        });
    });

    describe('all distances', () => {
        it('calculates VDOT for 1500m', () => {
            const vdot = calculateVDOT(VDOT_TABLE, '1500', 324); // VDOT 50 time
            expect(vdot).toBe(50);
        });

        it('calculates VDOT for Mile', () => {
            const vdot = calculateVDOT(VDOT_TABLE, 'Mile', 350); // VDOT 50 time
            expect(vdot).toBe(50);
        });

        it('calculates VDOT for 5K', () => {
            const vdot = calculateVDOT(VDOT_TABLE, '5K', 1197); // VDOT 50 time
            expect(vdot).toBe(50);
        });

        it('calculates VDOT for 10K', () => {
            const vdot = calculateVDOT(VDOT_TABLE, '10K', 2481); // VDOT 50 time
            expect(vdot).toBe(50);
        });

        it('calculates VDOT for 15K', () => {
            const vdot = calculateVDOT(VDOT_TABLE, '15K', 3796); // VDOT 50 time
            expect(vdot).toBe(50);
        });

        it('calculates VDOT for Half Marathon', () => {
            const vdot = calculateVDOT(VDOT_TABLE, 'HM', 5475); // VDOT 50 time
            expect(vdot).toBe(50);
        });

        it('calculates VDOT for Marathon', () => {
            const vdot = calculateVDOT(VDOT_TABLE, 'M', 11449); // VDOT 50 time
            expect(vdot).toBe(50);
        });
    });

    describe('cross-distance consistency', () => {
        it('similar VDOT for equivalent performances across distances', () => {
            // All VDOT 50 times should return VDOT 50
            const vdot1500 = calculateVDOT(VDOT_TABLE, '1500', 324);
            const vdot5K = calculateVDOT(VDOT_TABLE, '5K', 1197);
            const vdotM = calculateVDOT(VDOT_TABLE, 'M', 11449);

            expect(vdot1500).toBe(50);
            expect(vdot5K).toBe(50);
            expect(vdotM).toBe(50);
        });

        it('faster times yield higher VDOT', () => {
            const slowVDOT = calculateVDOT(VDOT_TABLE, '5K', 1500);
            const fastVDOT = calculateVDOT(VDOT_TABLE, '5K', 1100);
            expect(fastVDOT).toBeGreaterThan(slowVDOT);
        });

        it('slower times yield lower VDOT', () => {
            const fastVDOT = calculateVDOT(VDOT_TABLE, '5K', 1100);
            const slowVDOT = calculateVDOT(VDOT_TABLE, '5K', 1500);
            expect(slowVDOT).toBeLessThan(fastVDOT);
        });
    });

    describe('real-world scenarios', () => {
        it('calculates VDOT for sub-20 5K (elite amateur)', () => {
            const vdot = calculateVDOT(VDOT_TABLE, '5K', 19 * 60); // 19:00
            expect(vdot).toBeGreaterThan(50);
        });

        it('calculates VDOT for 30-minute 5K (recreational)', () => {
            const vdot = calculateVDOT(VDOT_TABLE, '5K', 30 * 60); // 30:00
            expect(vdot).toBe(30); // At or near minimum VDOT
        });

        it('calculates VDOT for sub-3 marathon (advanced)', () => {
            const vdot = calculateVDOT(VDOT_TABLE, 'M', 2 * 3600 + 59 * 60); // 2:59:00
            expect(vdot).toBeGreaterThan(50);
        });

        it('calculates VDOT for 4-hour marathon (recreational)', () => {
            const vdot = calculateVDOT(VDOT_TABLE, 'M', 4 * 3600); // 4:00:00
            expect(vdot).toBeGreaterThan(30);
            expect(vdot).toBeLessThan(50);
        });
    });
});
