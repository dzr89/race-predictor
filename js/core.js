/**
 * Core business logic for race time predictions.
 * This module contains pure functions that can be tested independently.
 */

// VO2max percentages based on Daniels' tables
export const PERCENT_VDOT = {
    "1500": 0.98,
    "Mile": 0.97,
    "5K": 0.95,
    "10K": 0.92,
    "15K": 0.90,
    "HM": 0.88,
    "M": 0.84
};

// Minimum valid times for each distance (in seconds)
export const MIN_TIMES = {
    "1500": 180,  // 3 minutes
    "Mile": 200,  // 3:20
    "5K": 600,    // 10 minutes
    "10K": 1200,  // 20 minutes
    "15K": 2100,  // 35 minutes
    "HM": 2700,   // 45 minutes
    "M": 5400     // 1:30:00
};

/**
 * Convert time components to total seconds
 * @param {number} hours - Hours (0-23)
 * @param {number} minutes - Minutes (0-59)
 * @param {number} seconds - Seconds (0-59)
 * @returns {number} Total seconds
 */
export function timeToSeconds(hours, minutes, seconds) {
    return (hours * 3600) + (minutes * 60) + seconds;
}

/**
 * Format seconds as HH:MM:SS string
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted time string
 */
export function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate VDOT value from race performance
 * @param {Object} vdotTable - The VDOT lookup table
 * @param {string} distance - Race distance key
 * @param {number} timeInSeconds - Race time in seconds
 * @returns {number} Calculated VDOT value
 * @throws {Error} If table not loaded or time is beyond prediction scope
 */
export function calculateVDOT(vdotTable, distance, timeInSeconds) {
    if (!vdotTable) {
        throw new Error('VDOT data not loaded');
    }

    const vdotValues = Object.keys(vdotTable).map(Number);

    // Check if the time is faster than the fastest time in the table
    const highestVDOT = Math.max(...vdotValues);
    const fastestPossibleTime = vdotTable[highestVDOT][distance];

    if (timeInSeconds < fastestPossibleTime) {
        throw new Error(`Time of ${formatTime(timeInSeconds)} is beyond the scope of our predictions (faster than VDOT ${highestVDOT}). The fastest time we can predict for is ${formatTime(fastestPossibleTime)} for ${distance}.`);
    }

    // Find the closest VDOT value by comparing actual times in the table
    let bestVDOT = null;
    let smallestDiff = Infinity;

    for (let vdot of vdotValues) {
        const tableTime = vdotTable[vdot][distance];
        const diff = Math.abs(tableTime - timeInSeconds);

        if (diff < smallestDiff) {
            smallestDiff = diff;
            bestVDOT = vdot;
        }
    }

    return bestVDOT;
}

/**
 * Interpolate predicted time for a target distance
 * @param {Object} vdotTable - The VDOT lookup table
 * @param {number} vdot - VDOT value (can be fractional)
 * @param {string} targetDistance - Target distance key
 * @returns {number} Predicted time in seconds
 * @throws {Error} If table not loaded
 */
export function interpolateTime(vdotTable, vdot, targetDistance) {
    if (!vdotTable) {
        throw new Error('VDOT data not loaded');
    }

    const lowerVDOT = Math.floor(vdot);
    const upperVDOT = Math.ceil(vdot);

    if (lowerVDOT === upperVDOT) {
        return vdotTable[lowerVDOT][targetDistance];
    }

    const lowerTime = vdotTable[lowerVDOT][targetDistance];
    const upperTime = vdotTable[upperVDOT][targetDistance];
    const ratio = vdot - lowerVDOT;

    return Math.round(lowerTime - (lowerTime - upperTime) * ratio);
}

/**
 * Validate user inputs for race time prediction
 * @param {number} hours - Hours input
 * @param {number} minutes - Minutes input
 * @param {number} seconds - Seconds input
 * @param {string|null} recentDistance - Selected distance
 * @returns {string[]} Array of error messages (empty if valid)
 */
export function validateInputs(hours, minutes, seconds, recentDistance) {
    const errors = [];

    if (!recentDistance) {
        errors.push("Please select a recent race distance");
    }

    if (isNaN(hours) || hours < 0 || hours > 23) {
        errors.push("Hours must be between 0 and 23");
    }
    if (isNaN(minutes) || minutes < 0 || minutes > 59) {
        errors.push("Minutes must be between 0 and 59");
    }
    if (isNaN(seconds) || seconds < 0 || seconds > 59) {
        errors.push("Seconds must be between 0 and 59");
    }

    // Only calculate total if basic validation passed
    if (errors.length === 0 || (recentDistance && !isNaN(hours) && !isNaN(minutes) && !isNaN(seconds))) {
        const totalSeconds = timeToSeconds(hours, minutes, seconds);
        if (totalSeconds === 0) {
            errors.push("Please enter a valid time");
        }

        if (recentDistance && totalSeconds > 0 && totalSeconds < MIN_TIMES[recentDistance]) {
            errors.push(`Time seems too short for ${recentDistance}. Please check your input.`);
        }
    }

    return errors;
}

/**
 * Generate predictions for all distances except the input distance
 * @param {Object} vdotTable - The VDOT lookup table
 * @param {number} vdot - Calculated VDOT value
 * @param {string} excludeDistance - Distance to exclude from predictions
 * @returns {Array<{distance: string, time: string, seconds: number}>} Predictions
 */
export function generatePredictions(vdotTable, vdot, excludeDistance) {
    const distances = Object.keys(PERCENT_VDOT);

    return distances
        .filter(distance => distance !== excludeDistance)
        .map(distance => {
            const predictedSeconds = interpolateTime(vdotTable, vdot, distance);
            return {
                distance,
                time: formatTime(predictedSeconds),
                seconds: predictedSeconds
            };
        });
}

/**
 * Parse time input value to integer with default
 * @param {string} value - Input value string
 * @param {number} defaultValue - Default if parsing fails
 * @returns {number} Parsed integer
 */
export function parseTimeInput(value, defaultValue = 0) {
    const trimmed = (value || '').toString().trim();
    const parsed = parseInt(trimmed, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Clamp a numeric value to a range
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clampValue(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Get all supported distances
 * @returns {string[]} Array of distance keys
 */
export function getSupportedDistances() {
    return Object.keys(PERCENT_VDOT);
}

/**
 * Check if a distance is valid
 * @param {string} distance - Distance to check
 * @returns {boolean} True if valid
 */
export function isValidDistance(distance) {
    return distance in PERCENT_VDOT;
}
