/**
 * Analytics Module for Race Predictor
 * Handles Google Analytics 4 event tracking for user interactions
 */

// Analytics configuration
const ANALYTICS_CONFIG = {
    // Replace with your actual GA4 Measurement ID (format: G-XXXXXXXXXX)
    measurementId: 'G-XXXXXXXXXX',
    debug: false
};

/**
 * Initialize analytics when DOM is ready
 */
function initAnalytics() {
    if (ANALYTICS_CONFIG.debug) {
        console.log('Analytics initialized');
    }
}

/**
 * Track a custom event to Google Analytics
 * @param {string} eventName - The name of the event
 * @param {Object} params - Additional parameters for the event
 */
function trackEvent(eventName, params = {}) {
    if (typeof gtag === 'function') {
        gtag('event', eventName, params);
        if (ANALYTICS_CONFIG.debug) {
            console.log('Analytics event:', eventName, params);
        }
    } else if (ANALYTICS_CONFIG.debug) {
        console.warn('gtag not available, event not tracked:', eventName, params);
    }
}

/**
 * Track distance selection
 * @param {string} distance - The selected distance (e.g., "5K", "10K", "HM")
 */
function trackDistanceSelection(distance) {
    trackEvent('select_distance', {
        event_category: 'engagement',
        event_label: distance,
        distance: distance
    });
}

/**
 * Track race time calculation attempt
 * @param {string} distance - The input distance
 * @param {number} timeInSeconds - The input time in seconds
 * @param {number} vdot - The calculated VDOT value
 */
function trackCalculation(distance, timeInSeconds, vdot) {
    trackEvent('calculate_prediction', {
        event_category: 'conversion',
        event_label: distance,
        distance: distance,
        time_seconds: timeInSeconds,
        vdot: vdot
    });
}

/**
 * Track calculation error
 * @param {string} errorType - Type of error (e.g., "validation", "vdot_exceeded")
 * @param {string} errorMessage - The error message
 */
function trackError(errorType, errorMessage) {
    trackEvent('calculation_error', {
        event_category: 'error',
        event_label: errorType,
        error_type: errorType,
        error_message: errorMessage
    });
}

/**
 * Track form reset
 */
function trackReset() {
    trackEvent('form_reset', {
        event_category: 'engagement',
        event_label: 'reset_button'
    });
}

/**
 * Track back button click (return to form from results)
 */
function trackBackToForm() {
    trackEvent('back_to_form', {
        event_category: 'engagement',
        event_label: 'back_button'
    });
}

/**
 * Track "Get Faster" button click
 */
function trackGetFaster() {
    trackEvent('get_faster_click', {
        event_category: 'outbound',
        event_label: 'instagram_link',
        outbound_url: 'https://www.instagram.com/mattlopiccolo/'
    });
}

/**
 * Track results view with prediction details
 * @param {string} inputDistance - The distance user ran
 * @param {Array} predictions - Array of predicted distances
 */
function trackResultsView(inputDistance, predictions) {
    trackEvent('view_predictions', {
        event_category: 'engagement',
        event_label: inputDistance,
        input_distance: inputDistance,
        predictions_count: predictions.length
    });
}

/**
 * Track page timing/performance
 */
function trackPagePerformance() {
    if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        const pageLoadTime = timing.loadEventEnd - timing.navigationStart;

        if (pageLoadTime > 0) {
            trackEvent('page_timing', {
                event_category: 'performance',
                event_label: 'page_load',
                value: pageLoadTime
            });
        }
    }
}

// Initialize analytics and track performance when page loads
document.addEventListener('DOMContentLoaded', function() {
    initAnalytics();

    // Track page performance after load
    window.addEventListener('load', function() {
        setTimeout(trackPagePerformance, 0);
    });
});

// Export functions for use in other modules
window.Analytics = {
    trackEvent,
    trackDistanceSelection,
    trackCalculation,
    trackError,
    trackReset,
    trackBackToForm,
    trackGetFaster,
    trackResultsView
};
