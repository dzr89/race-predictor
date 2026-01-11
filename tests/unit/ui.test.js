/**
 * Unit tests for UI helper functions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
    showForm,
    showLoading,
    showResults,
    createPredictionModule,
    showError,
    clearErrors,
    getSelectedDistance,
    selectDistance,
    getTimeInputs,
    setTimeInputs,
    resetTimeInputs,
    renderPredictions
} from '../../js/ui.js';

// Setup mock DOM before each test
function setupDOM() {
    document.body.innerHTML = `
        <div id="form-container">
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
}

describe('showForm', () => {
    beforeEach(setupDOM);

    it('adds active class to form container', () => {
        showForm(document);
        expect(document.getElementById('form-container').classList.contains('active')).toBe(true);
    });

    it('removes active class from loading container', () => {
        document.getElementById('loading-container').classList.add('active');
        showForm(document);
        expect(document.getElementById('loading-container').classList.contains('active')).toBe(false);
    });

    it('removes active class from results container', () => {
        document.getElementById('results').classList.add('active');
        showForm(document);
        expect(document.getElementById('results').classList.contains('active')).toBe(false);
    });

    it('handles missing elements gracefully', () => {
        document.body.innerHTML = '';
        expect(() => showForm(document)).not.toThrow();
    });
});

describe('showResults', () => {
    beforeEach(setupDOM);

    it('adds active class to results container', () => {
        showResults(document);
        expect(document.getElementById('results').classList.contains('active')).toBe(true);
    });

    it('removes active class from form container', () => {
        document.getElementById('form-container').classList.add('active');
        showResults(document);
        expect(document.getElementById('form-container').classList.contains('active')).toBe(false);
    });

    it('removes active class from loading container', () => {
        document.getElementById('loading-container').classList.add('active');
        showResults(document);
        expect(document.getElementById('loading-container').classList.contains('active')).toBe(false);
    });

    it('handles missing elements gracefully', () => {
        document.body.innerHTML = '';
        expect(() => showResults(document)).not.toThrow();
    });
});

describe('showLoading', () => {
    beforeEach(() => {
        setupDOM();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('removes active class from form container', () => {
        document.getElementById('form-container').classList.add('active');
        showLoading(document, 100);
        expect(document.getElementById('form-container').classList.contains('active')).toBe(false);
    });

    it('adds active class to loading container', () => {
        showLoading(document, 100);
        expect(document.getElementById('loading-container').classList.contains('active')).toBe(true);
    });

    it('sets display flex on loading container', () => {
        showLoading(document, 100);
        expect(document.getElementById('loading-container').style.display).toBe('flex');
    });

    it('shows results after duration', async () => {
        const promise = showLoading(document, 100);
        vi.advanceTimersByTime(100);
        await promise;
        expect(document.getElementById('results').classList.contains('active')).toBe(true);
    });

    it('hides loading after duration', async () => {
        const promise = showLoading(document, 100);
        vi.advanceTimersByTime(100);
        await promise;
        expect(document.getElementById('loading-container').classList.contains('active')).toBe(false);
        expect(document.getElementById('loading-container').style.display).toBe('none');
    });

    it('uses default 2000ms duration', () => {
        showLoading(document);
        vi.advanceTimersByTime(1999);
        expect(document.getElementById('loading-container').classList.contains('active')).toBe(true);
        vi.advanceTimersByTime(1);
        expect(document.getElementById('loading-container').classList.contains('active')).toBe(false);
    });
});

describe('createPredictionModule', () => {
    beforeEach(setupDOM);

    it('creates element with prediction-module class', () => {
        const module = createPredictionModule(document, '5K', '00:25:00');
        expect(module.className).toBe('prediction-module');
    });

    it('contains wreath element', () => {
        const module = createPredictionModule(document, '5K', '00:25:00');
        const wreath = module.querySelector('.wreath');
        expect(wreath).not.toBeNull();
    });

    it('contains distance label with correct text', () => {
        const module = createPredictionModule(document, '5K', '00:25:00');
        const label = module.querySelector('.distance-label');
        expect(label.textContent).toBe('5K');
    });

    it('contains predicted time with correct text', () => {
        const module = createPredictionModule(document, '5K', '00:25:00');
        const time = module.querySelector('.predicted-time');
        expect(time.textContent).toBe('00:25:00');
    });

    it('creates correct structure with 3 children', () => {
        const module = createPredictionModule(document, '5K', '00:25:00');
        expect(module.children.length).toBe(3);
    });
});

describe('showError', () => {
    beforeEach(setupDOM);

    it('creates error element with message', () => {
        showError(document, 'Test error');
        const error = document.querySelector('.error');
        expect(error).not.toBeNull();
        expect(error.textContent).toBe('Test error');
    });

    it('removes existing error before adding new one', () => {
        showError(document, 'First error');
        showError(document, 'Second error');
        const errors = document.querySelectorAll('.error');
        expect(errors.length).toBe(1);
        expect(errors[0].textContent).toBe('Second error');
    });

    it('appends error to form-group', () => {
        showError(document, 'Test error');
        const formGroup = document.querySelector('.form-group');
        const error = formGroup.querySelector('.error');
        expect(error).not.toBeNull();
    });

    it('returns the error element', () => {
        const error = showError(document, 'Test error');
        expect(error.className).toBe('error');
        expect(error.textContent).toBe('Test error');
    });
});

describe('clearErrors', () => {
    beforeEach(setupDOM);

    it('removes all error elements', () => {
        showError(document, 'Error 1');
        // Manually add another error
        const error2 = document.createElement('div');
        error2.className = 'error';
        document.body.appendChild(error2);

        clearErrors(document);
        const errors = document.querySelectorAll('.error');
        expect(errors.length).toBe(0);
    });

    it('does nothing when no errors exist', () => {
        expect(() => clearErrors(document)).not.toThrow();
    });
});

describe('getSelectedDistance', () => {
    beforeEach(setupDOM);

    it('returns null when no distance selected', () => {
        expect(getSelectedDistance(document)).toBeNull();
    });

    it('returns selected distance value', () => {
        const btn = document.querySelector('[data-value="5K"]');
        btn.classList.add('selected');
        expect(getSelectedDistance(document)).toBe('5K');
    });

    it('returns first selected if multiple (edge case)', () => {
        document.querySelector('[data-value="5K"]').classList.add('selected');
        document.querySelector('[data-value="10K"]').classList.add('selected');
        const selected = getSelectedDistance(document);
        expect(['5K', '10K']).toContain(selected);
    });
});

describe('selectDistance', () => {
    beforeEach(setupDOM);

    it('adds selected class to matching button', () => {
        selectDistance(document, '5K');
        const btn = document.querySelector('[data-value="5K"]');
        expect(btn.classList.contains('selected')).toBe(true);
    });

    it('removes selected class from other buttons', () => {
        document.querySelector('[data-value="10K"]').classList.add('selected');
        selectDistance(document, '5K');
        const btn10K = document.querySelector('[data-value="10K"]');
        expect(btn10K.classList.contains('selected')).toBe(false);
    });

    it('handles invalid distance gracefully', () => {
        expect(() => selectDistance(document, 'invalid')).not.toThrow();
        const selected = document.querySelectorAll('.distance-btn.selected');
        expect(selected.length).toBe(0);
    });
});

describe('getTimeInputs', () => {
    beforeEach(setupDOM);

    it('returns all zeros for empty inputs', () => {
        const time = getTimeInputs(document);
        expect(time).toEqual({ hours: 0, minutes: 0, seconds: 0 });
    });

    it('returns correct values from inputs', () => {
        document.getElementById('hours').value = '1';
        document.getElementById('minutes').value = '30';
        document.getElementById('seconds').value = '45';
        const time = getTimeInputs(document);
        expect(time).toEqual({ hours: 1, minutes: 30, seconds: 45 });
    });

    it('handles whitespace in inputs', () => {
        document.getElementById('hours').value = '  1  ';
        document.getElementById('minutes').value = ' 30 ';
        document.getElementById('seconds').value = '45 ';
        const time = getTimeInputs(document);
        expect(time).toEqual({ hours: 1, minutes: 30, seconds: 45 });
    });

    it('returns 0 for non-numeric input', () => {
        document.getElementById('hours').value = 'abc';
        document.getElementById('minutes').value = '';
        document.getElementById('seconds').value = 'NaN';
        const time = getTimeInputs(document);
        expect(time).toEqual({ hours: 0, minutes: 0, seconds: 0 });
    });
});

describe('setTimeInputs', () => {
    beforeEach(setupDOM);

    it('sets input values correctly', () => {
        setTimeInputs(document, 1, 30, 45);
        expect(document.getElementById('hours').value).toBe('1');
        expect(document.getElementById('minutes').value).toBe('30');
        expect(document.getElementById('seconds').value).toBe('45');
    });

    it('handles zero values', () => {
        setTimeInputs(document, 0, 0, 0);
        expect(document.getElementById('hours').value).toBe('0');
        expect(document.getElementById('minutes').value).toBe('0');
        expect(document.getElementById('seconds').value).toBe('0');
    });
});

describe('resetTimeInputs', () => {
    beforeEach(setupDOM);

    it('clears all time inputs', () => {
        setTimeInputs(document, 1, 30, 45);
        resetTimeInputs(document);
        expect(document.getElementById('hours').value).toBe('');
        expect(document.getElementById('minutes').value).toBe('');
        expect(document.getElementById('seconds').value).toBe('');
    });
});

describe('renderPredictions', () => {
    beforeEach(setupDOM);

    it('renders prediction modules to container', () => {
        const predictions = [
            { distance: '5K', time: '00:25:00' },
            { distance: '10K', time: '00:52:00' }
        ];
        renderPredictions(document, predictions);
        const modules = document.querySelectorAll('.prediction-module');
        expect(modules.length).toBe(2);
    });

    it('clears existing predictions before rendering', () => {
        const predictions1 = [{ distance: '5K', time: '00:25:00' }];
        const predictions2 = [{ distance: '10K', time: '00:52:00' }];

        renderPredictions(document, predictions1);
        renderPredictions(document, predictions2);

        const modules = document.querySelectorAll('.prediction-module');
        expect(modules.length).toBe(1);
        expect(modules[0].querySelector('.distance-label').textContent).toBe('10K');
    });

    it('renders empty container when no predictions', () => {
        renderPredictions(document, []);
        const container = document.getElementById('predictions-container');
        expect(container.children.length).toBe(0);
    });

    it('renders all 6 predictions for typical flow', () => {
        const predictions = [
            { distance: '1500', time: '00:05:20' },
            { distance: 'Mile', time: '00:05:45' },
            { distance: '10K', time: '00:52:00' },
            { distance: '15K', time: '01:20:00' },
            { distance: 'HM', time: '01:52:00' },
            { distance: 'M', time: '03:55:00' }
        ];
        renderPredictions(document, predictions);
        const modules = document.querySelectorAll('.prediction-module');
        expect(modules.length).toBe(6);
    });
});
