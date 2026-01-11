/**
 * Unit tests for time conversion utilities
 */

import { describe, it, expect } from 'vitest';
import { timeToSeconds, formatTime, parseTimeInput, clampValue } from '../../js/core.js';

describe('timeToSeconds', () => {
    it('converts hours, minutes, seconds to total seconds', () => {
        expect(timeToSeconds(1, 30, 45)).toBe(5445);
    });

    it('handles zero values', () => {
        expect(timeToSeconds(0, 0, 0)).toBe(0);
    });

    it('handles only seconds', () => {
        expect(timeToSeconds(0, 0, 30)).toBe(30);
    });

    it('handles only minutes', () => {
        expect(timeToSeconds(0, 5, 0)).toBe(300);
    });

    it('handles only hours', () => {
        expect(timeToSeconds(2, 0, 0)).toBe(7200);
    });

    it('handles typical 5K time (25:30)', () => {
        expect(timeToSeconds(0, 25, 30)).toBe(1530);
    });

    it('handles typical marathon time (3:45:00)', () => {
        expect(timeToSeconds(3, 45, 0)).toBe(13500);
    });

    it('handles maximum stopwatch values (23:59:59)', () => {
        expect(timeToSeconds(23, 59, 59)).toBe(86399);
    });

    it('handles edge case of just under 1 hour', () => {
        expect(timeToSeconds(0, 59, 59)).toBe(3599);
    });
});

describe('formatTime', () => {
    it('formats seconds as HH:MM:SS with zero padding', () => {
        expect(formatTime(5445)).toBe('01:30:45');
    });

    it('handles zero seconds', () => {
        expect(formatTime(0)).toBe('00:00:00');
    });

    it('pads single digit hours', () => {
        expect(formatTime(3661)).toBe('01:01:01');
    });

    it('handles values under one minute', () => {
        expect(formatTime(45)).toBe('00:00:45');
    });

    it('handles values under one hour', () => {
        expect(formatTime(3599)).toBe('00:59:59');
    });

    it('handles exactly one hour', () => {
        expect(formatTime(3600)).toBe('01:00:00');
    });

    it('handles typical 5K time', () => {
        expect(formatTime(1530)).toBe('00:25:30');
    });

    it('handles typical marathon time', () => {
        expect(formatTime(13500)).toBe('03:45:00');
    });

    it('handles double digit hours', () => {
        expect(formatTime(43200)).toBe('12:00:00');
    });

    it('handles fractional seconds by flooring', () => {
        expect(formatTime(3661.7)).toBe('01:01:01');
    });
});

describe('timeToSeconds and formatTime round-trip', () => {
    it('round-trips correctly for typical times', () => {
        const times = [
            [0, 25, 30],
            [1, 30, 45],
            [3, 45, 0],
            [0, 0, 1],
            [23, 59, 59]
        ];

        times.forEach(([h, m, s]) => {
            const seconds = timeToSeconds(h, m, s);
            const formatted = formatTime(seconds);
            const expected = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            expect(formatted).toBe(expected);
        });
    });
});

describe('parseTimeInput', () => {
    it('parses valid integer string', () => {
        expect(parseTimeInput('25')).toBe(25);
    });

    it('parses string with leading zeros', () => {
        expect(parseTimeInput('05')).toBe(5);
    });

    it('returns default for empty string', () => {
        expect(parseTimeInput('')).toBe(0);
    });

    it('returns default for null', () => {
        expect(parseTimeInput(null)).toBe(0);
    });

    it('returns default for undefined', () => {
        expect(parseTimeInput(undefined)).toBe(0);
    });

    it('returns default for non-numeric string', () => {
        expect(parseTimeInput('abc')).toBe(0);
    });

    it('returns custom default value', () => {
        expect(parseTimeInput('', 10)).toBe(10);
    });

    it('trims whitespace before parsing', () => {
        expect(parseTimeInput('  25  ')).toBe(25);
    });

    it('handles numeric input', () => {
        expect(parseTimeInput(30)).toBe(30);
    });
});

describe('clampValue', () => {
    it('returns value when within range', () => {
        expect(clampValue(5, 0, 10)).toBe(5);
    });

    it('clamps to minimum when below', () => {
        expect(clampValue(-5, 0, 10)).toBe(0);
    });

    it('clamps to maximum when above', () => {
        expect(clampValue(15, 0, 10)).toBe(10);
    });

    it('handles exact minimum', () => {
        expect(clampValue(0, 0, 10)).toBe(0);
    });

    it('handles exact maximum', () => {
        expect(clampValue(10, 0, 10)).toBe(10);
    });

    it('works with negative ranges', () => {
        expect(clampValue(-5, -10, -1)).toBe(-5);
    });

    it('clamps hours (0-23)', () => {
        expect(clampValue(25, 0, 23)).toBe(23);
        expect(clampValue(-1, 0, 23)).toBe(0);
    });

    it('clamps minutes/seconds (0-59)', () => {
        expect(clampValue(60, 0, 59)).toBe(59);
        expect(clampValue(-1, 0, 59)).toBe(0);
    });
});
