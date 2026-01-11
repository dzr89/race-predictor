/**
 * Unit tests for time interpolation
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { interpolateTime, generatePredictions, PERCENT_VDOT } from '../../js/core.js';
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

describe('interpolateTime', () => {
    describe('error handling', () => {
        it('throws error when VDOT table is null', () => {
            expect(() => interpolateTime(null, 50, '5K')).toThrow('VDOT data not loaded');
        });

        it('throws error when VDOT table is undefined', () => {
            expect(() => interpolateTime(undefined, 50, '5K')).toThrow('VDOT data not loaded');
        });
    });

    describe('integer VDOT (direct lookup)', () => {
        it('returns exact table value for integer VDOT 50, 5K', () => {
            const time = interpolateTime(VDOT_TABLE, 50, '5K');
            expect(time).toBe(1197); // VDOT 50 5K time from table
        });

        it('returns exact table value for integer VDOT 50, 10K', () => {
            const time = interpolateTime(VDOT_TABLE, 50, '10K');
            expect(time).toBe(2481);
        });

        it('returns exact table value for integer VDOT 50, Marathon', () => {
            const time = interpolateTime(VDOT_TABLE, 50, 'M');
            expect(time).toBe(11449);
        });

        it('returns exact table value for VDOT 30 (minimum)', () => {
            const time = interpolateTime(VDOT_TABLE, 30, '5K');
            expect(time).toBe(1840);
        });

        it('returns exact table value for VDOT 85 (maximum)', () => {
            const time = interpolateTime(VDOT_TABLE, 85, '5K');
            expect(time).toBe(757);
        });
    });

    describe('fractional VDOT (interpolation)', () => {
        it('interpolates between VDOT 50 and 51 for 5K', () => {
            // VDOT 50 5K = 1197s, VDOT 51 5K = 1176s
            const time = interpolateTime(VDOT_TABLE, 50.5, '5K');
            expect(time).toBe(Math.round(1197 - (1197 - 1176) * 0.5)); // 1187
        });

        it('interpolates at 0.25 ratio', () => {
            // VDOT 50 5K = 1197s, VDOT 51 5K = 1176s
            const time = interpolateTime(VDOT_TABLE, 50.25, '5K');
            const expected = Math.round(1197 - (1197 - 1176) * 0.25);
            expect(time).toBe(expected);
        });

        it('interpolates at 0.75 ratio', () => {
            // VDOT 50 5K = 1197s, VDOT 51 5K = 1176s
            const time = interpolateTime(VDOT_TABLE, 50.75, '5K');
            const expected = Math.round(1197 - (1197 - 1176) * 0.75);
            expect(time).toBe(expected);
        });

        it('interpolated time is between lower and upper bounds', () => {
            const lowerTime = VDOT_TABLE[50]['5K']; // 1197
            const upperTime = VDOT_TABLE[51]['5K']; // 1176
            const interpTime = interpolateTime(VDOT_TABLE, 50.5, '5K');

            expect(interpTime).toBeLessThanOrEqual(lowerTime);
            expect(interpTime).toBeGreaterThanOrEqual(upperTime);
        });

        it('returns rounded integer value', () => {
            const time = interpolateTime(VDOT_TABLE, 50.33, '5K');
            expect(Number.isInteger(time)).toBe(true);
        });
    });

    describe('all distances', () => {
        const distances = ['1500', 'Mile', '5K', '10K', '15K', 'HM', 'M'];

        distances.forEach(distance => {
            it(`interpolates correctly for ${distance}`, () => {
                const time = interpolateTime(VDOT_TABLE, 50, distance);
                expect(time).toBe(VDOT_TABLE[50][distance]);
            });
        });

        distances.forEach(distance => {
            it(`interpolates fractional VDOT for ${distance}`, () => {
                const time = interpolateTime(VDOT_TABLE, 50.5, distance);
                const lower = VDOT_TABLE[50][distance];
                const upper = VDOT_TABLE[51][distance];
                expect(time).toBeLessThanOrEqual(lower);
                expect(time).toBeGreaterThanOrEqual(upper);
            });
        });
    });

    describe('edge cases', () => {
        it('handles VDOT very close to integer (50.001)', () => {
            const intTime = interpolateTime(VDOT_TABLE, 50, '5K');
            const nearIntTime = interpolateTime(VDOT_TABLE, 50.001, '5K');
            // Should be very close to integer value
            expect(Math.abs(nearIntTime - intTime)).toBeLessThan(5);
        });

        it('handles VDOT just below next integer (50.999)', () => {
            const nextIntTime = interpolateTime(VDOT_TABLE, 51, '5K');
            const nearNextTime = interpolateTime(VDOT_TABLE, 50.999, '5K');
            // Should be very close to next integer value
            expect(Math.abs(nearNextTime - nextIntTime)).toBeLessThan(5);
        });
    });

    describe('prediction consistency', () => {
        it('higher VDOT produces faster times', () => {
            const time50 = interpolateTime(VDOT_TABLE, 50, '5K');
            const time60 = interpolateTime(VDOT_TABLE, 60, '5K');
            expect(time60).toBeLessThan(time50);
        });

        it('lower VDOT produces slower times', () => {
            const time50 = interpolateTime(VDOT_TABLE, 50, '5K');
            const time40 = interpolateTime(VDOT_TABLE, 40, '5K');
            expect(time40).toBeGreaterThan(time50);
        });

        it('longer distances produce longer times at same VDOT', () => {
            const time5K = interpolateTime(VDOT_TABLE, 50, '5K');
            const time10K = interpolateTime(VDOT_TABLE, 50, '10K');
            const timeM = interpolateTime(VDOT_TABLE, 50, 'M');

            expect(time10K).toBeGreaterThan(time5K);
            expect(timeM).toBeGreaterThan(time10K);
        });
    });
});

describe('generatePredictions', () => {
    it('returns predictions for all distances except excluded', () => {
        const predictions = generatePredictions(VDOT_TABLE, 50, '5K');
        expect(predictions.length).toBe(6); // 7 distances - 1 excluded
    });

    it('excludes the specified distance', () => {
        const predictions = generatePredictions(VDOT_TABLE, 50, '5K');
        const distances = predictions.map(p => p.distance);
        expect(distances).not.toContain('5K');
    });

    it('includes all other distances', () => {
        const predictions = generatePredictions(VDOT_TABLE, 50, '5K');
        const distances = predictions.map(p => p.distance);
        expect(distances).toContain('1500');
        expect(distances).toContain('Mile');
        expect(distances).toContain('10K');
        expect(distances).toContain('15K');
        expect(distances).toContain('HM');
        expect(distances).toContain('M');
    });

    it('returns objects with distance, time, and seconds', () => {
        const predictions = generatePredictions(VDOT_TABLE, 50, '5K');
        predictions.forEach(p => {
            expect(p).toHaveProperty('distance');
            expect(p).toHaveProperty('time');
            expect(p).toHaveProperty('seconds');
        });
    });

    it('time is formatted as HH:MM:SS', () => {
        const predictions = generatePredictions(VDOT_TABLE, 50, '5K');
        predictions.forEach(p => {
            expect(p.time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
        });
    });

    it('seconds is a positive integer', () => {
        const predictions = generatePredictions(VDOT_TABLE, 50, '5K');
        predictions.forEach(p => {
            expect(Number.isInteger(p.seconds)).toBe(true);
            expect(p.seconds).toBeGreaterThan(0);
        });
    });

    it('works with different excluded distances', () => {
        const distances = Object.keys(PERCENT_VDOT);
        distances.forEach(exclude => {
            const predictions = generatePredictions(VDOT_TABLE, 50, exclude);
            expect(predictions.length).toBe(6);
            expect(predictions.map(p => p.distance)).not.toContain(exclude);
        });
    });
});

describe('PERCENT_VDOT constant', () => {
    it('has entries for all distances', () => {
        expect(PERCENT_VDOT).toHaveProperty('1500');
        expect(PERCENT_VDOT).toHaveProperty('Mile');
        expect(PERCENT_VDOT).toHaveProperty('5K');
        expect(PERCENT_VDOT).toHaveProperty('10K');
        expect(PERCENT_VDOT).toHaveProperty('15K');
        expect(PERCENT_VDOT).toHaveProperty('HM');
        expect(PERCENT_VDOT).toHaveProperty('M');
    });

    it('percentages decrease with distance', () => {
        expect(PERCENT_VDOT['1500']).toBeGreaterThan(PERCENT_VDOT['Mile']);
        expect(PERCENT_VDOT['Mile']).toBeGreaterThan(PERCENT_VDOT['5K']);
        expect(PERCENT_VDOT['5K']).toBeGreaterThan(PERCENT_VDOT['10K']);
        expect(PERCENT_VDOT['10K']).toBeGreaterThan(PERCENT_VDOT['15K']);
        expect(PERCENT_VDOT['15K']).toBeGreaterThan(PERCENT_VDOT['HM']);
        expect(PERCENT_VDOT['HM']).toBeGreaterThan(PERCENT_VDOT['M']);
    });

    it('all percentages are between 0 and 1', () => {
        Object.values(PERCENT_VDOT).forEach(pct => {
            expect(pct).toBeGreaterThan(0);
            expect(pct).toBeLessThanOrEqual(1);
        });
    });
});
