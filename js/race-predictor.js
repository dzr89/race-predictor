let VDOT_TABLE = null;

// Fetch VDOT data when the page loads
async function initializeVDOTData() {
    try {
        const response = await fetch('data/vdot-tables.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        VDOT_TABLE = await response.json();
        console.log('VDOT data loaded successfully:', VDOT_TABLE);
    } catch (error) {
        console.error('Error loading VDOT data:', error);
        document.getElementById('results').innerHTML = `
            <div class="error">Failed to load race prediction data. Please refresh the page. Error: ${error.message}</div>
        `;
    }
}

// Update VO2max percentages based on Daniels' tables
const PERCENT_VDOT = {
    "1500": 0.98,
    "Mile": 0.97,
    "5K": 0.95,
    "10K": 0.92,
    "15K": 0.90,
    "HM": 0.88,
    "M": 0.84
};

// Utility functions
function timeToSeconds(hours, minutes, seconds) {
    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
    console.log(`Converting ${hours}:${minutes}:${seconds} to ${totalSeconds} seconds`);
    return totalSeconds;
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function calculateVDOT(distance, timeInSeconds) {
    if (!VDOT_TABLE) {
        throw new Error('VDOT data not loaded');
    }

    console.log(`Calculating VDOT for distance: ${distance}, time: ${timeInSeconds} seconds`);

    const vdotValues = Object.keys(VDOT_TABLE).map(Number);
    
    // Check if the time is faster than the fastest time in the table
    const highestVDOT = Math.max(...vdotValues);
    const fastestPossibleTime = VDOT_TABLE[highestVDOT][distance];
    
    if (timeInSeconds < fastestPossibleTime) {
        throw new Error(`Time of ${formatTime(timeInSeconds)} is beyond the scope of our predictions (faster than VDOT ${highestVDOT}). The fastest time we can predict for is ${formatTime(fastestPossibleTime)} for ${distance}.`);
    }

    // Find the closest VDOT value by comparing actual times in the table
    let bestVDOT = null;
    let smallestDiff = Infinity;
    
    for (let vdot of vdotValues) {
        const tableTime = VDOT_TABLE[vdot][distance];
        const diff = Math.abs(tableTime - timeInSeconds);
        
        console.log(`VDOT ${vdot}: table time = ${tableTime}s, diff = ${diff}s`);
        
        if (diff < smallestDiff) {
            smallestDiff = diff;
            bestVDOT = vdot;
        }
    }
    
    console.log(`Selected VDOT: ${bestVDOT}`);
    
    return bestVDOT;
}

function interpolateTime(vdot, targetDistance) {
    if (!VDOT_TABLE) {
        throw new Error('VDOT data not loaded');
    }

    const lowerVDOT = Math.floor(vdot);
    const upperVDOT = Math.ceil(vdot);
    
    if (lowerVDOT === upperVDOT) return VDOT_TABLE[lowerVDOT][targetDistance];
    
    const lowerTime = VDOT_TABLE[lowerVDOT][targetDistance];
    const upperTime = VDOT_TABLE[upperVDOT][targetDistance];
    const ratio = vdot - lowerVDOT;
    
    return Math.round(lowerTime - (lowerTime - upperTime) * ratio);
}

function validateInputs(hours, minutes, seconds, recentDistance) {
    const errors = [];
    
    if (!recentDistance) errors.push("Please select a recent race distance");
    
    if (isNaN(hours) || hours < 0 || hours > 23) errors.push("Hours must be between 0 and 23");
    if (isNaN(minutes) || minutes < 0 || minutes > 59) errors.push("Minutes must be between 0 and 59");
    if (isNaN(seconds) || seconds < 0 || seconds > 59) errors.push("Seconds must be between 0 and 59");
    
    const totalSeconds = timeToSeconds(hours, minutes, seconds);
    if (totalSeconds === 0) errors.push("Please enter a valid time");

    // Add reasonable minimum times based on distance
    const minTimes = {
        "1500": 180,  // 3 minutes
        "Mile": 200,  // 3:20
        "5K": 600,    // 10 minutes
        "10K": 1200,  // 20 minutes
        "15K": 2100,  // 35 minutes
        "HM": 2700,   // 45 minutes
        "M": 5400     // 1:30:00
    };

    if (recentDistance && totalSeconds < minTimes[recentDistance]) {
        errors.push(`Time seems too short for ${recentDistance}. Please check your input.`);
    }

    return errors;
}

// Add these new functions at the top
function showForm() {
    document.getElementById('form-container').classList.add('active');
    document.getElementById('loading-container').classList.remove('active');
    document.getElementById('results').classList.remove('active');
}

function showLoading() {
    document.getElementById('form-container').classList.remove('active');
    document.getElementById('loading-container').classList.add('active');
    document.getElementById('results').classList.remove('active');
}

function showResults() {
    document.getElementById('form-container').classList.remove('active');
    document.getElementById('loading-container').classList.remove('active');
    document.getElementById('results').classList.add('active');
}

// Stopwatch input handling
function initStopwatchInputs() {
    const inputs = ['hours', 'minutes', 'seconds'];
    
    inputs.forEach((id, index) => {
        const input = document.getElementById(id);
        
        // Add keydown event listener for Enter key
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (index < inputs.length - 1) {
                    // Move to next input if not on last input
                    document.getElementById(inputs[index + 1]).focus();
                } else {
                    // Trigger calculate if on last input
                    document.getElementById('calculate').click();
                }
            }
            // Existing backspace handler
            if (e.key === 'Backspace' && e.target.value.length === 0 && index > 0) {
                document.getElementById(inputs[index - 1]).focus();
            }
        });

        input.addEventListener('input', (e) => {
            let value = e.target.value;
            
            // Remove any non-digits
            value = value.replace(/\D/g, '');
            
            // Validate max values
            let max = 59;
            if (id === 'hours') max = 23;
            
            // Handle the value
            const numValue = parseInt(value);
            if (!isNaN(numValue)) {
                // Enforce max value
                if (numValue > max) {
                    value = max.toString();
                }
                
                // Enforce max length of 2
                if (value.length > 2) {
                    value = value.slice(0, 2);
                }
                
                // Only auto-advance if user explicitly entered 2 digits
                if (value.length === 2 && e.inputType === 'insertText' && index < inputs.length - 1) {
                    document.getElementById(inputs[index + 1]).focus();
                }
            }
            
            // Update the input value
            e.target.value = value;
        });
    });

    // Reset button enhancement
    document.getElementById('reset').addEventListener('click', () => {
        inputs.forEach(id => {
            document.getElementById(id).value = '';
        });
        document.getElementById('hours').focus();
    });
}

function createPredictionModule(distance, time) {
    const module = document.createElement('div');
    module.className = 'prediction-module';
    
    const wreath = document.createElement('div');
    wreath.className = 'wreath';
    
    const distanceLabel = document.createElement('div');
    distanceLabel.className = 'distance-label';
    distanceLabel.textContent = distance;
    
    const predictedTime = document.createElement('div');
    predictedTime.className = 'predicted-time';
    predictedTime.textContent = time;
    
    module.appendChild(wreath);
    module.appendChild(distanceLabel);
    module.appendChild(predictedTime);
    
    return module;
}

function initDistanceButtons() {
    const buttons = document.querySelectorAll('.distance-btn');
    let selectedDistance = null;
    
    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            buttons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            selectedDistance = button.dataset.value;
        });
    });

    document.getElementById('calculate').addEventListener('click', async function() {
        try {
            if (!VDOT_TABLE) {
                throw new Error('VDOT data not loaded yet');
            }
            
            // Parse values with explicit 0 defaults and trim any whitespace
            const hours = parseInt(document.getElementById('hours').value.trim()) || 0;
            const minutes = parseInt(document.getElementById('minutes').value.trim()) || 0;
            const seconds = parseInt(document.getElementById('seconds').value.trim()) || 0;

            console.log(`Input time: ${hours}:${minutes}:${seconds}`);

            if (!selectedDistance) {
                throw new Error('Please select a race distance');
            }

            const errors = validateInputs(hours, minutes, seconds, selectedDistance);
            if (errors.length > 0) {
                const resultsDiv = document.getElementById('results');
                resultsDiv.innerHTML = `<div class="error">${errors.join('<br>')}</div>`;
                showResults();
                return;
            }

            showLoading();

            await new Promise(resolve => setTimeout(resolve, 2000));

            const totalSeconds = timeToSeconds(hours, minutes, seconds);
            console.log(`Total seconds: ${totalSeconds}`);
            
            const vdot = calculateVDOT(selectedDistance, totalSeconds);
            console.log(`Calculated VDOT: ${vdot}`);
            
            const distances = Object.keys(PERCENT_VDOT);
            
            const predictionsContainer = document.getElementById('predictions-container');
            predictionsContainer.innerHTML = '';
            
            distances
                .filter(distance => distance !== selectedDistance)
                .forEach(distance => {
                    const predictedSeconds = interpolateTime(vdot, distance);
                    console.log(`Predicted time for ${distance}: ${predictedSeconds}s`);
                    const module = createPredictionModule(distance, formatTime(predictedSeconds));
                    predictionsContainer.appendChild(module);
                });

            showResults();

        } catch (error) {
            console.error('Error:', error);
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = `
                <div class="error">An error occurred: ${error.message}</div>
            `;
            showResults();
        }
    });
}

// Add form submit handler
function initFormHandler() {
    const form = document.getElementById('race-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        document.getElementById('calculate').click();
    });
}

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    // Load VDOT data
    initializeVDOTData();
    
    // Ensure form is visible initially
    showForm();

    // Reset button click handler
    document.getElementById('reset').addEventListener('click', function() {
        document.getElementById('predictions-body').innerHTML = '';
        showForm();
    });

    initStopwatchInputs();
    initDistanceButtons();
    initFormHandler();
});

function showError(message) {
    // Remove any existing error
    const existingError = document.querySelector('.error');
    if (existingError) {
        existingError.remove();
    }

    // Create and show new error
    const error = document.createElement('div');
    error.className = 'error';
    error.textContent = message;
    document.querySelector('.form-group').appendChild(error);
} 