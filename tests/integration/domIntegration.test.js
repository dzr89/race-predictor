/**
 * Integration tests for DOM initialization and event handlers
 * These tests cover the browser-specific code in race-predictor.js
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
    timeToSeconds,
    formatTime,
    calculateVDOT,
    interpolateTime,
    validateInputs,
    generatePredictions,
    PERCENT_VDOT
} from '../../js/core.js';
import {
    showForm,
    showLoading,
    showResults,
    createPredictionModule,
    showError,
    getSelectedDistance,
    selectDistance,
    getTimeInputs,
    setTimeInputs,
    resetTimeInputs,
    renderPredictions
} from '../../js/ui.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let VDOT_TABLE;

beforeEach(() => {
    const dataPath = path.resolve(__dirname, '../../data/vdot-tables.json');
    const data = fs.readFileSync(dataPath, 'utf-8');
    VDOT_TABLE = JSON.parse(data);

    // Setup mock DOM
    document.body.innerHTML = `
        <div id="form-container" class="active">
            <form id="race-form">
                <div class="distance-buttons">
                    <button type="button" class="distance-btn" data-value="1500">1500m</button>
                    <button type="button" class="distance-btn" data-value="Mile">Mile</button>
                    <button type="button" class="distance-btn" data-value="5K">5K</button>
                    <button type="button" class="distance-btn" data-value="10K">10K</button>
                    <button type="button" class="distance-btn" data-value="HM">Half</button>
                    <button type="button" class="distance-btn" data-value="M">Marathon</button>
                </div>
                <div class="form-group stopwatch">
                    <input type="text" id="hours" maxlength="2" placeholder="00" />
                    <span class="separator">:</span>
                    <input type="text" id="minutes" maxlength="2" placeholder="00" />
                    <span class="separator">:</span>
                    <input type="text" id="seconds" maxlength="2" placeholder="00" />
                </div>
                <button type="button" id="calculate">Calculate</button>
                <button type="button" id="reset">Reset</button>
            </form>
        </div>
        <div id="loading-container" style="display: none;"></div>
        <div id="results">
            <div id="predictions-container"></div>
        </div>
    `;
});

describe('Full Application Flow Simulation', () => {
    describe('Calculate 5K predictions', () => {
        it('simulates complete user flow for 5K time entry', () => {
            // 1. User selects 5K distance
            selectDistance(document, '5K');
            expect(getSelectedDistance(document)).toBe('5K');

            // 2. User enters time 25:00
            setTimeInputs(document, 0, 25, 0);
            const inputs = getTimeInputs(document);
            expect(inputs).toEqual({ hours: 0, minutes: 25, seconds: 0 });

            // 3. Validation passes
            const errors = validateInputs(inputs.hours, inputs.minutes, inputs.seconds, '5K');
            expect(errors).toEqual([]);

            // 4. Calculate VDOT
            const totalSeconds = timeToSeconds(inputs.hours, inputs.minutes, inputs.seconds);
            const vdot = calculateVDOT(VDOT_TABLE, '5K', totalSeconds);
            expect(vdot).toBeGreaterThan(30);

            // 5. Generate predictions
            const predictions = generatePredictions(VDOT_TABLE, vdot, '5K');
            expect(predictions.length).toBe(6);

            // 6. Render predictions
            renderPredictions(document, predictions);
            const modules = document.querySelectorAll('.prediction-module');
            expect(modules.length).toBe(6);

            // 7. Show results
            showResults(document);
            expect(document.getElementById('results').classList.contains('active')).toBe(true);
        });
    });

    describe('Calculate Marathon predictions', () => {
        it('simulates complete user flow for marathon time entry', () => {
            // User enters 3:30:00 marathon
            selectDistance(document, 'M');
            setTimeInputs(document, 3, 30, 0);

            const inputs = getTimeInputs(document);
            const errors = validateInputs(inputs.hours, inputs.minutes, inputs.seconds, 'M');
            expect(errors).toEqual([]);

            const totalSeconds = timeToSeconds(inputs.hours, inputs.minutes, inputs.seconds);
            const vdot = calculateVDOT(VDOT_TABLE, 'M', totalSeconds);
            const predictions = generatePredictions(VDOT_TABLE, vdot, 'M');

            renderPredictions(document, predictions);
            showResults(document);

            expect(document.querySelectorAll('.prediction-module').length).toBe(6);

            // Verify 5K prediction is reasonable (under 25 minutes for 3:30 marathoner)
            const pred5K = predictions.find(p => p.distance === '5K');
            expect(pred5K.seconds).toBeLessThan(25 * 60);
        });
    });

    describe('Error handling flow', () => {
        it('handles missing distance selection', () => {
            setTimeInputs(document, 0, 25, 0);

            const inputs = getTimeInputs(document);
            const selectedDistance = getSelectedDistance(document);
            const errors = validateInputs(inputs.hours, inputs.minutes, inputs.seconds, selectedDistance);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors).toContain('Please select a recent race distance');
        });

        it('handles invalid time input', () => {
            selectDistance(document, '5K');
            setTimeInputs(document, 0, 0, 0);

            const inputs = getTimeInputs(document);
            const errors = validateInputs(inputs.hours, inputs.minutes, inputs.seconds, '5K');

            expect(errors).toContain('Please enter a valid time');
        });

        it('handles time too fast for distance', () => {
            selectDistance(document, '5K');
            setTimeInputs(document, 0, 5, 0); // 5 minutes is impossibly fast

            const inputs = getTimeInputs(document);
            const errors = validateInputs(inputs.hours, inputs.minutes, inputs.seconds, '5K');

            expect(errors.some(e => e.includes('too short'))).toBe(true);
        });

        it('handles time faster than VDOT 85', () => {
            selectDistance(document, '5K');
            setTimeInputs(document, 0, 10, 0); // 10 minutes - beyond VDOT 85

            const inputs = getTimeInputs(document);
            const errors = validateInputs(inputs.hours, inputs.minutes, inputs.seconds, '5K');

            // Validation passes, but VDOT calculation should fail
            if (errors.length === 0) {
                const totalSeconds = timeToSeconds(inputs.hours, inputs.minutes, inputs.seconds);
                expect(() => calculateVDOT(VDOT_TABLE, '5K', totalSeconds)).toThrow();
            }
        });
    });

    describe('Reset flow', () => {
        it('resets form to initial state', () => {
            // Setup some state
            selectDistance(document, '5K');
            setTimeInputs(document, 0, 25, 0);

            // Reset
            resetTimeInputs(document);

            // Verify
            const inputs = getTimeInputs(document);
            expect(inputs).toEqual({ hours: 0, minutes: 0, seconds: 0 });
        });
    });

    describe('Back to form flow', () => {
        it('returns to form from results', () => {
            // Start at results
            showResults(document);
            expect(document.getElementById('results').classList.contains('active')).toBe(true);

            // Go back to form
            showForm(document);
            expect(document.getElementById('form-container').classList.contains('active')).toBe(true);
            expect(document.getElementById('results').classList.contains('active')).toBe(false);
        });
    });

    describe('Distance button behavior', () => {
        it('only one distance can be selected at a time', () => {
            selectDistance(document, '5K');
            selectDistance(document, '10K');

            const selected = document.querySelectorAll('.distance-btn.selected');
            expect(selected.length).toBe(1);
            expect(selected[0].dataset.value).toBe('10K');
        });

        it('selecting all distances works correctly', () => {
            const distances = ['1500', 'Mile', '5K', '10K', 'HM', 'M'];
            distances.forEach(d => {
                selectDistance(document, d);
                expect(getSelectedDistance(document)).toBe(d);
            });
        });
    });

    describe('Prediction module creation', () => {
        it('creates modules for all predicted distances', () => {
            const vdot = 50;
            const distances = Object.keys(PERCENT_VDOT).filter(d => d !== '5K');

            distances.forEach(d => {
                const time = interpolateTime(VDOT_TABLE, vdot, d);
                const formattedTime = formatTime(time);
                const module = createPredictionModule(document, d, formattedTime);

                expect(module.querySelector('.distance-label').textContent).toBe(d);
                expect(module.querySelector('.predicted-time').textContent).toBe(formattedTime);
            });
        });
    });

    describe('Loading state transitions', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('transitions through all states correctly', async () => {
            // Initial state
            expect(document.getElementById('form-container').classList.contains('active')).toBe(true);

            // Show loading
            const loadingPromise = showLoading(document, 100);
            expect(document.getElementById('loading-container').classList.contains('active')).toBe(true);
            expect(document.getElementById('form-container').classList.contains('active')).toBe(false);

            // After loading completes
            vi.advanceTimersByTime(100);
            await loadingPromise;

            expect(document.getElementById('results').classList.contains('active')).toBe(true);
            expect(document.getElementById('loading-container').classList.contains('active')).toBe(false);

            // Back to form
            showForm(document);
            expect(document.getElementById('form-container').classList.contains('active')).toBe(true);
        });
    });
});

describe('Edge Cases', () => {
    it('handles boundary VDOT values', () => {
        // Test at VDOT 30 boundary
        selectDistance(document, '5K');
        setTimeInputs(document, 0, 30, 40); // ~30:40, VDOT 30 time

        const inputs = getTimeInputs(document);
        const totalSeconds = timeToSeconds(inputs.hours, inputs.minutes, inputs.seconds);
        const vdot = calculateVDOT(VDOT_TABLE, '5K', totalSeconds);

        expect(vdot).toBe(30);
    });

    it('handles all distances for predictions', () => {
        const allDistances = ['1500', 'Mile', '5K', '10K', '15K', 'HM', 'M'];

        allDistances.forEach(inputDist => {
            // Get a valid time for each distance
            const validTime = VDOT_TABLE[50][inputDist];
            const vdot = calculateVDOT(VDOT_TABLE, inputDist, validTime);
            const predictions = generatePredictions(VDOT_TABLE, vdot, inputDist);

            expect(predictions.length).toBe(6);
            expect(predictions.map(p => p.distance)).not.toContain(inputDist);
        });
    });
});
