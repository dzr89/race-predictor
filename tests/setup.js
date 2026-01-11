/**
 * Test setup file for Vitest
 * Provides mock DOM and helper utilities for tests
 */

import { vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// Load the VDOT table data for tests
export function loadVDOTTable() {
    const dataPath = path.resolve(__dirname, '../data/vdot-tables.json');
    const data = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(data);
}

// Create a minimal mock DOM structure matching index.html
export function createMockDOM() {
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
        <div id="loading-container"></div>
        <div id="results">
            <div id="predictions-container"></div>
        </div>
    `;
}

// Reset DOM between tests
export function resetDOM() {
    document.body.innerHTML = '';
}

// Mock console.log to reduce noise in tests
export function silenceConsole() {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
}

// Restore console
export function restoreConsole() {
    vi.restoreAllMocks();
}
