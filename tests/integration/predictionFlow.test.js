/**
 * Integration tests for the complete prediction flow
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import {
    timeToSeconds,
    formatTime,
    calculateVDOT,
    interpolateTime,
    validateInputs,
    generatePredictions,
    getSupportedDistances,
    isValidDistance,
    PERCENT_VDOT
} from '../../js/core.js';
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

describe('Complete Prediction Flow', () => {
    describe('valid 5K prediction flow', () => {
        const hours = 0;
        const minutes = 25;
        const seconds = 0;
        const distance = '5K';

        it('validates inputs successfully', () => {
            const errors = validateInputs(hours, minutes, seconds, distance);
            expect(errors).toEqual([]);
        });

        it('converts time to seconds correctly', () => {
            const totalSeconds = timeToSeconds(hours, minutes, seconds);
            expect(totalSeconds).toBe(1500);
        });

        it('calculates reasonable VDOT', () => {
            const totalSeconds = timeToSeconds(hours, minutes, seconds);
            const vdot = calculateVDOT(VDOT_TABLE, distance, totalSeconds);
            expect(vdot).toBeGreaterThan(30);
            expect(vdot).toBeLessThan(85);
        });

        it('generates predictions for all other distances', () => {
            const totalSeconds = timeToSeconds(hours, minutes, seconds);
            const vdot = calculateVDOT(VDOT_TABLE, distance, totalSeconds);
            const predictions = generatePredictions(VDOT_TABLE, vdot, distance);

            expect(predictions.length).toBe(6);
            expect(predictions.map(p => p.distance)).not.toContain('5K');
        });

        it('produces formatted times in predictions', () => {
            const totalSeconds = timeToSeconds(hours, minutes, seconds);
            const vdot = calculateVDOT(VDOT_TABLE, distance, totalSeconds);
            const predictions = generatePredictions(VDOT_TABLE, vdot, distance);

            predictions.forEach(p => {
                expect(p.time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
            });
        });
    });

    describe('valid marathon prediction flow', () => {
        const hours = 3;
        const minutes = 30;
        const seconds = 0;
        const distance = 'M';

        it('completes full flow successfully', () => {
            const errors = validateInputs(hours, minutes, seconds, distance);
            expect(errors).toEqual([]);

            const totalSeconds = timeToSeconds(hours, minutes, seconds);
            expect(totalSeconds).toBe(12600);

            const vdot = calculateVDOT(VDOT_TABLE, distance, totalSeconds);
            expect(vdot).toBeGreaterThan(30);

            const predictions = generatePredictions(VDOT_TABLE, vdot, distance);
            expect(predictions.length).toBe(6);
        });

        it('predicts reasonable 5K time from marathon', () => {
            const totalSeconds = timeToSeconds(hours, minutes, seconds);
            const vdot = calculateVDOT(VDOT_TABLE, distance, totalSeconds);
            const predictions = generatePredictions(VDOT_TABLE, vdot, distance);

            const pred5K = predictions.find(p => p.distance === '5K');
            expect(pred5K.seconds).toBeGreaterThan(15 * 60); // > 15 minutes
            expect(pred5K.seconds).toBeLessThan(30 * 60);     // < 30 minutes
        });
    });

    describe('error flow - invalid inputs', () => {
        it('catches missing distance', () => {
            const errors = validateInputs(0, 25, 0, null);
            expect(errors.length).toBeGreaterThan(0);
        });

        it('catches zero time', () => {
            const errors = validateInputs(0, 0, 0, '5K');
            expect(errors).toContain('Please enter a valid time');
        });

        it('catches time too fast for distance', () => {
            const errors = validateInputs(0, 5, 0, '5K'); // 5 min 5K is unrealistic
            expect(errors.some(e => e.includes('too short'))).toBe(true);
        });
    });

    describe('error flow - VDOT beyond range', () => {
        it('throws for time faster than VDOT 85', () => {
            const totalSeconds = timeToSeconds(0, 10, 0); // 10 min 5K
            expect(() => calculateVDOT(VDOT_TABLE, '5K', totalSeconds)).toThrow();
        });
    });

    describe('cross-distance prediction consistency', () => {
        it('5K to marathon prediction matches marathon to 5K inverse', () => {
            // Start with 20 minute 5K
            const time5K = 20 * 60;
            const vdot5K = calculateVDOT(VDOT_TABLE, '5K', time5K);
            const marathonPred = generatePredictions(VDOT_TABLE, vdot5K, '5K')
                .find(p => p.distance === 'M');

            // Now take that marathon prediction and predict 5K
            const vdotM = calculateVDOT(VDOT_TABLE, 'M', marathonPred.seconds);
            const back5KPred = generatePredictions(VDOT_TABLE, vdotM, 'M')
                .find(p => p.distance === '5K');

            // Should be close to original 5K time (within ~30 seconds due to rounding)
            expect(Math.abs(back5KPred.seconds - time5K)).toBeLessThan(60);
        });
    });
});

describe('getSupportedDistances', () => {
    it('returns all 7 supported distances', () => {
        const distances = getSupportedDistances();
        expect(distances.length).toBe(7);
    });

    it('includes all expected distances', () => {
        const distances = getSupportedDistances();
        expect(distances).toContain('1500');
        expect(distances).toContain('Mile');
        expect(distances).toContain('5K');
        expect(distances).toContain('10K');
        expect(distances).toContain('15K');
        expect(distances).toContain('HM');
        expect(distances).toContain('M');
    });
});

describe('isValidDistance', () => {
    it('returns true for valid distances', () => {
        expect(isValidDistance('5K')).toBe(true);
        expect(isValidDistance('10K')).toBe(true);
        expect(isValidDistance('M')).toBe(true);
        expect(isValidDistance('HM')).toBe(true);
        expect(isValidDistance('1500')).toBe(true);
        expect(isValidDistance('Mile')).toBe(true);
        expect(isValidDistance('15K')).toBe(true);
    });

    it('returns false for invalid distances', () => {
        expect(isValidDistance('3K')).toBe(false);
        expect(isValidDistance('marathon')).toBe(false);
        expect(isValidDistance('')).toBe(false);
        expect(isValidDistance(null)).toBe(false);
        expect(isValidDistance(undefined)).toBe(false);
    });
});

describe('VDOT Table Data Integrity', () => {
    it('table has entries covering VDOT range 30 to 85', () => {
        const vdotKeys = Object.keys(VDOT_TABLE).map(Number);
        expect(Math.min(...vdotKeys)).toBe(30);
        expect(Math.max(...vdotKeys)).toBe(85);
        expect(vdotKeys.length).toBeGreaterThan(40); // At least 40 entries
    });

    it('each VDOT entry has all required distances', () => {
        const requiredDistances = ['1500', 'Mile', '5K', '10K', '15K', 'HM', 'M'];
        const vdotKeys = Object.keys(VDOT_TABLE);
        vdotKeys.forEach(v => {
            requiredDistances.forEach(d => {
                expect(VDOT_TABLE[v][d]).toBeDefined();
                expect(typeof VDOT_TABLE[v][d]).toBe('number');
            });
        });
    });

    it('times decrease as VDOT increases', () => {
        const distances = ['1500', 'Mile', '5K', '10K', '15K', 'HM', 'M'];
        const vdotKeys = Object.keys(VDOT_TABLE).map(Number).sort((a, b) => a - b);
        distances.forEach(distance => {
            for (let i = 1; i < vdotKeys.length; i++) {
                const lowerVDOT = vdotKeys[i - 1];
                const higherVDOT = vdotKeys[i];
                expect(VDOT_TABLE[higherVDOT][distance]).toBeLessThan(VDOT_TABLE[lowerVDOT][distance]);
            }
        });
    });

    it('longer distances have longer times at same VDOT', () => {
        const vdotKeys = Object.keys(VDOT_TABLE);
        vdotKeys.forEach(v => {
            expect(VDOT_TABLE[v]['Mile']).toBeGreaterThan(VDOT_TABLE[v]['1500']);
            expect(VDOT_TABLE[v]['5K']).toBeGreaterThan(VDOT_TABLE[v]['Mile']);
            expect(VDOT_TABLE[v]['10K']).toBeGreaterThan(VDOT_TABLE[v]['5K']);
            expect(VDOT_TABLE[v]['15K']).toBeGreaterThan(VDOT_TABLE[v]['10K']);
            expect(VDOT_TABLE[v]['HM']).toBeGreaterThan(VDOT_TABLE[v]['15K']);
            expect(VDOT_TABLE[v]['M']).toBeGreaterThan(VDOT_TABLE[v]['HM']);
        });
    });
});

describe('Real-World Prediction Scenarios', () => {
    it('sub-20 5K predicts sub-42 10K', () => {
        const time5K = 19 * 60 + 30; // 19:30
        const vdot = calculateVDOT(VDOT_TABLE, '5K', time5K);
        const pred10K = interpolateTime(VDOT_TABLE, vdot, '10K');
        expect(pred10K).toBeLessThan(42 * 60); // Under 42 minutes
    });

    it('4-hour marathon runner predicts ~55 min 10K', () => {
        const timeM = 4 * 3600; // 4:00:00
        const vdot = calculateVDOT(VDOT_TABLE, 'M', timeM);
        const pred10K = interpolateTime(VDOT_TABLE, vdot, '10K');
        expect(pred10K).toBeGreaterThan(50 * 60); // Over 50 minutes
        expect(pred10K).toBeLessThan(60 * 60);    // Under 60 minutes
    });

    it('5-minute mile predicts elite times', () => {
        const timeMile = 5 * 60; // 5:00
        const vdot = calculateVDOT(VDOT_TABLE, 'Mile', timeMile);
        const pred5K = interpolateTime(VDOT_TABLE, vdot, '5K');
        expect(pred5K).toBeLessThan(18 * 60); // Under 18 minutes
    });

    it('30-minute 5K predicts appropriate half marathon', () => {
        const time5K = 30 * 60; // 30:00
        const vdot = calculateVDOT(VDOT_TABLE, '5K', time5K);
        const predHM = interpolateTime(VDOT_TABLE, vdot, 'HM');
        expect(predHM).toBeGreaterThan(2 * 3600);     // Over 2 hours
        expect(predHM).toBeLessThan(2.5 * 3600);      // Under 2.5 hours
    });
});
