/**
 * Unit tests for input validation
 */

import { describe, it, expect } from 'vitest';
import { validateInputs, MIN_TIMES } from '../../js/core.js';

describe('validateInputs', () => {
    describe('distance validation', () => {
        it('returns error when distance is null', () => {
            const errors = validateInputs(0, 20, 0, null);
            expect(errors).toContain('Please select a recent race distance');
        });

        it('returns error when distance is undefined', () => {
            const errors = validateInputs(0, 20, 0, undefined);
            expect(errors).toContain('Please select a recent race distance');
        });

        it('returns error when distance is empty string', () => {
            const errors = validateInputs(0, 20, 0, '');
            expect(errors).toContain('Please select a recent race distance');
        });

        it('accepts valid distance', () => {
            const errors = validateInputs(0, 20, 0, '5K');
            expect(errors).not.toContain('Please select a recent race distance');
        });
    });

    describe('hours validation', () => {
        it('returns error for hours > 23', () => {
            const errors = validateInputs(24, 0, 0, '5K');
            expect(errors).toContain('Hours must be between 0 and 23');
        });

        it('returns error for negative hours', () => {
            const errors = validateInputs(-1, 0, 0, '5K');
            expect(errors).toContain('Hours must be between 0 and 23');
        });

        it('returns error for NaN hours', () => {
            const errors = validateInputs(NaN, 20, 0, '5K');
            expect(errors).toContain('Hours must be between 0 and 23');
        });

        it('accepts hours = 0', () => {
            const errors = validateInputs(0, 20, 0, '5K');
            expect(errors).not.toContain('Hours must be between 0 and 23');
        });

        it('accepts hours = 23', () => {
            const errors = validateInputs(23, 0, 0, 'M');
            expect(errors).not.toContain('Hours must be between 0 and 23');
        });
    });

    describe('minutes validation', () => {
        it('returns error for minutes > 59', () => {
            const errors = validateInputs(0, 60, 0, '5K');
            expect(errors).toContain('Minutes must be between 0 and 59');
        });

        it('returns error for negative minutes', () => {
            const errors = validateInputs(0, -1, 0, '5K');
            expect(errors).toContain('Minutes must be between 0 and 59');
        });

        it('returns error for NaN minutes', () => {
            const errors = validateInputs(0, NaN, 0, '5K');
            expect(errors).toContain('Minutes must be between 0 and 59');
        });

        it('accepts minutes = 0', () => {
            const errors = validateInputs(1, 0, 0, 'M');
            expect(errors).not.toContain('Minutes must be between 0 and 59');
        });

        it('accepts minutes = 59', () => {
            const errors = validateInputs(0, 59, 59, '5K');
            expect(errors).not.toContain('Minutes must be between 0 and 59');
        });
    });

    describe('seconds validation', () => {
        it('returns error for seconds > 59', () => {
            const errors = validateInputs(0, 20, 60, '5K');
            expect(errors).toContain('Seconds must be between 0 and 59');
        });

        it('returns error for negative seconds', () => {
            const errors = validateInputs(0, 20, -1, '5K');
            expect(errors).toContain('Seconds must be between 0 and 59');
        });

        it('returns error for NaN seconds', () => {
            const errors = validateInputs(0, 20, NaN, '5K');
            expect(errors).toContain('Seconds must be between 0 and 59');
        });

        it('accepts seconds = 0', () => {
            const errors = validateInputs(0, 20, 0, '5K');
            expect(errors).not.toContain('Seconds must be between 0 and 59');
        });

        it('accepts seconds = 59', () => {
            const errors = validateInputs(0, 20, 59, '5K');
            expect(errors).not.toContain('Seconds must be between 0 and 59');
        });
    });

    describe('zero time validation', () => {
        it('returns error when total time is zero', () => {
            const errors = validateInputs(0, 0, 0, '5K');
            expect(errors).toContain('Please enter a valid time');
        });

        it('accepts non-zero time', () => {
            const errors = validateInputs(0, 0, 1, '1500');
            expect(errors).not.toContain('Please enter a valid time');
        });
    });

    describe('minimum time validation by distance', () => {
        it('returns error for 1500m time below 3 minutes', () => {
            const errors = validateInputs(0, 2, 59, '1500');
            expect(errors.some(e => e.includes('too short for 1500'))).toBe(true);
        });

        it('accepts 1500m time at minimum (3:00)', () => {
            const errors = validateInputs(0, 3, 0, '1500');
            expect(errors.some(e => e.includes('too short for 1500'))).toBe(false);
        });

        it('returns error for Mile time below 3:20', () => {
            const errors = validateInputs(0, 3, 19, 'Mile');
            expect(errors.some(e => e.includes('too short for Mile'))).toBe(true);
        });

        it('accepts Mile time at minimum (3:20)', () => {
            const errors = validateInputs(0, 3, 20, 'Mile');
            expect(errors.some(e => e.includes('too short for Mile'))).toBe(false);
        });

        it('returns error for 5K time below 10 minutes', () => {
            const errors = validateInputs(0, 9, 59, '5K');
            expect(errors.some(e => e.includes('too short for 5K'))).toBe(true);
        });

        it('accepts 5K time at minimum (10:00)', () => {
            const errors = validateInputs(0, 10, 0, '5K');
            expect(errors.some(e => e.includes('too short for 5K'))).toBe(false);
        });

        it('returns error for 10K time below 20 minutes', () => {
            const errors = validateInputs(0, 19, 59, '10K');
            expect(errors.some(e => e.includes('too short for 10K'))).toBe(true);
        });

        it('accepts 10K time at minimum (20:00)', () => {
            const errors = validateInputs(0, 20, 0, '10K');
            expect(errors.some(e => e.includes('too short for 10K'))).toBe(false);
        });

        it('returns error for 15K time below 35 minutes', () => {
            const errors = validateInputs(0, 34, 59, '15K');
            expect(errors.some(e => e.includes('too short for 15K'))).toBe(true);
        });

        it('accepts 15K time at minimum (35:00)', () => {
            const errors = validateInputs(0, 35, 0, '15K');
            expect(errors.some(e => e.includes('too short for 15K'))).toBe(false);
        });

        it('returns error for HM time below 45 minutes', () => {
            const errors = validateInputs(0, 44, 59, 'HM');
            expect(errors.some(e => e.includes('too short for HM'))).toBe(true);
        });

        it('accepts HM time at minimum (45:00)', () => {
            const errors = validateInputs(0, 45, 0, 'HM');
            expect(errors.some(e => e.includes('too short for HM'))).toBe(false);
        });

        it('returns error for Marathon time below 1:30:00', () => {
            const errors = validateInputs(1, 29, 59, 'M');
            expect(errors.some(e => e.includes('too short for M'))).toBe(true);
        });

        it('accepts Marathon time at minimum (1:30:00)', () => {
            const errors = validateInputs(1, 30, 0, 'M');
            expect(errors.some(e => e.includes('too short for M'))).toBe(false);
        });
    });

    describe('valid inputs', () => {
        it('returns empty array for valid 5K time', () => {
            const errors = validateInputs(0, 25, 0, '5K');
            expect(errors).toEqual([]);
        });

        it('returns empty array for valid marathon time', () => {
            const errors = validateInputs(3, 30, 0, 'M');
            expect(errors).toEqual([]);
        });

        it('returns empty array for valid 1500m time', () => {
            const errors = validateInputs(0, 4, 30, '1500');
            expect(errors).toEqual([]);
        });

        it('returns empty array for valid Mile time', () => {
            const errors = validateInputs(0, 5, 0, 'Mile');
            expect(errors).toEqual([]);
        });

        it('returns empty array for valid 10K time', () => {
            const errors = validateInputs(0, 45, 0, '10K');
            expect(errors).toEqual([]);
        });

        it('returns empty array for valid 15K time', () => {
            const errors = validateInputs(1, 5, 0, '15K');
            expect(errors).toEqual([]);
        });

        it('returns empty array for valid HM time', () => {
            const errors = validateInputs(1, 30, 0, 'HM');
            expect(errors).toEqual([]);
        });
    });

    describe('multiple errors', () => {
        it('returns multiple errors for multiple invalid inputs', () => {
            const errors = validateInputs(25, 60, 60, null);
            expect(errors.length).toBeGreaterThan(1);
            expect(errors).toContain('Please select a recent race distance');
            expect(errors).toContain('Hours must be between 0 and 23');
            expect(errors).toContain('Minutes must be between 0 and 59');
            expect(errors).toContain('Seconds must be between 0 and 59');
        });
    });
});

describe('MIN_TIMES constant', () => {
    it('has entries for all distances', () => {
        expect(MIN_TIMES).toHaveProperty('1500');
        expect(MIN_TIMES).toHaveProperty('Mile');
        expect(MIN_TIMES).toHaveProperty('5K');
        expect(MIN_TIMES).toHaveProperty('10K');
        expect(MIN_TIMES).toHaveProperty('15K');
        expect(MIN_TIMES).toHaveProperty('HM');
        expect(MIN_TIMES).toHaveProperty('M');
    });

    it('has reasonable minimum values', () => {
        expect(MIN_TIMES['1500']).toBe(180);  // 3 minutes
        expect(MIN_TIMES['Mile']).toBe(200);  // 3:20
        expect(MIN_TIMES['5K']).toBe(600);    // 10 minutes
        expect(MIN_TIMES['10K']).toBe(1200);  // 20 minutes
        expect(MIN_TIMES['15K']).toBe(2100);  // 35 minutes
        expect(MIN_TIMES['HM']).toBe(2700);   // 45 minutes
        expect(MIN_TIMES['M']).toBe(5400);    // 1:30:00
    });
});
