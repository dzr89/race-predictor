/**
 * UI helper functions for race predictor
 * These functions handle DOM interactions and can be tested with jsdom
 */

/**
 * Show the form container, hide others
 * @param {Document} doc - Document object (allows dependency injection for testing)
 */
export function showForm(doc = document) {
    const formContainer = doc.getElementById('form-container');
    const loadingContainer = doc.getElementById('loading-container');
    const results = doc.getElementById('results');

    if (formContainer) formContainer.classList.add('active');
    if (loadingContainer) loadingContainer.classList.remove('active');
    if (results) results.classList.remove('active');
}

/**
 * Show the loading container
 * @param {Document} doc - Document object
 * @param {number} duration - Loading duration in ms (default 2000)
 * @returns {Promise} Resolves when loading is complete
 */
export function showLoading(doc = document, duration = 2000) {
    const formContainer = doc.getElementById('form-container');
    const loadingContainer = doc.getElementById('loading-container');
    const results = doc.getElementById('results');

    if (formContainer) formContainer.classList.remove('active');
    if (loadingContainer) {
        loadingContainer.style.display = 'flex';
        loadingContainer.classList.add('active');
    }

    return new Promise(resolve => {
        setTimeout(() => {
            if (loadingContainer) {
                loadingContainer.style.display = 'none';
                loadingContainer.classList.remove('active');
            }
            if (results) results.classList.add('active');
            resolve();
        }, duration);
    });
}

/**
 * Show the results container, hide others
 * @param {Document} doc - Document object
 */
export function showResults(doc = document) {
    const formContainer = doc.getElementById('form-container');
    const loadingContainer = doc.getElementById('loading-container');
    const results = doc.getElementById('results');

    if (formContainer) formContainer.classList.remove('active');
    if (loadingContainer) loadingContainer.classList.remove('active');
    if (results) results.classList.add('active');
}

/**
 * Create a prediction module DOM element
 * @param {Document} doc - Document object
 * @param {string} distance - Distance label
 * @param {string} time - Formatted time string
 * @returns {HTMLElement} The prediction module element
 */
export function createPredictionModule(doc = document, distance, time) {
    const module = doc.createElement('div');
    module.className = 'prediction-module';

    const wreath = doc.createElement('div');
    wreath.className = 'wreath';

    const distanceLabel = doc.createElement('div');
    distanceLabel.className = 'distance-label';
    distanceLabel.textContent = distance;

    const predictedTime = doc.createElement('div');
    predictedTime.className = 'predicted-time';
    predictedTime.textContent = time;

    module.appendChild(wreath);
    module.appendChild(distanceLabel);
    module.appendChild(predictedTime);

    return module;
}

/**
 * Show an error message in the results container
 * @param {Document} doc - Document object
 * @param {string} message - Error message to display
 */
export function showError(doc = document, message) {
    // Remove any existing error
    const existingError = doc.querySelector('.error');
    if (existingError) {
        existingError.remove();
    }

    // Create and show new error
    const error = doc.createElement('div');
    error.className = 'error';
    error.textContent = message;

    const formGroup = doc.querySelector('.form-group');
    if (formGroup) {
        formGroup.appendChild(error);
    }

    return error;
}

/**
 * Clear all error messages
 * @param {Document} doc - Document object
 */
export function clearErrors(doc = document) {
    const errors = doc.querySelectorAll('.error');
    errors.forEach(error => error.remove());
}

/**
 * Get selected distance from buttons
 * @param {Document} doc - Document object
 * @returns {string|null} Selected distance value or null
 */
export function getSelectedDistance(doc = document) {
    const selected = doc.querySelector('.distance-btn.selected');
    return selected ? selected.dataset.value : null;
}

/**
 * Select a distance button
 * @param {Document} doc - Document object
 * @param {string} distance - Distance value to select
 */
export function selectDistance(doc = document, distance) {
    const buttons = doc.querySelectorAll('.distance-btn');
    buttons.forEach(btn => {
        if (btn.dataset.value === distance) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

/**
 * Get time input values
 * @param {Document} doc - Document object
 * @returns {{hours: number, minutes: number, seconds: number}}
 */
export function getTimeInputs(doc = document) {
    const hoursEl = doc.getElementById('hours');
    const minutesEl = doc.getElementById('minutes');
    const secondsEl = doc.getElementById('seconds');

    return {
        hours: parseInt(hoursEl?.value?.trim() || '0', 10) || 0,
        minutes: parseInt(minutesEl?.value?.trim() || '0', 10) || 0,
        seconds: parseInt(secondsEl?.value?.trim() || '0', 10) || 0
    };
}

/**
 * Set time input values
 * @param {Document} doc - Document object
 * @param {number} hours
 * @param {number} minutes
 * @param {number} seconds
 */
export function setTimeInputs(doc = document, hours, minutes, seconds) {
    const hoursEl = doc.getElementById('hours');
    const minutesEl = doc.getElementById('minutes');
    const secondsEl = doc.getElementById('seconds');

    if (hoursEl) hoursEl.value = hours.toString();
    if (minutesEl) minutesEl.value = minutes.toString();
    if (secondsEl) secondsEl.value = seconds.toString();
}

/**
 * Reset all time inputs
 * @param {Document} doc - Document object
 */
export function resetTimeInputs(doc = document) {
    setTimeInputs(doc, 0, 0, 0);
    const hoursEl = doc.getElementById('hours');
    const minutesEl = doc.getElementById('minutes');
    const secondsEl = doc.getElementById('seconds');

    if (hoursEl) hoursEl.value = '';
    if (minutesEl) minutesEl.value = '';
    if (secondsEl) secondsEl.value = '';
}

/**
 * Render predictions to the container
 * @param {Document} doc - Document object
 * @param {Array} predictions - Array of prediction objects
 */
export function renderPredictions(doc = document, predictions) {
    const container = doc.getElementById('predictions-container');
    if (!container) return;

    container.innerHTML = '';
    predictions.forEach(pred => {
        const module = createPredictionModule(doc, pred.distance, pred.time);
        container.appendChild(module);
    });
}
