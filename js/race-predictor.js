let VDOT_TABLE = null;

// Fetch VDOT data when the page loads
async function initializeVDOTData() {
    try {
        const response = await fetch('../data/vdot-tables.json');
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
    "3000": 0.96,
    "2-mile": 0.96,
    "5K": 0.95,
    "10K": 0.92,
    "15K": 0.90,
    "HM": 0.88,
    "M": 0.84
};

// Utility functions
function timeToSeconds(hours, minutes, seconds) {
    return hours * 3600 + minutes * 60 + seconds;
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

    const vdotValues = Object.keys(VDOT_TABLE).map(Number);
    
    let closestVDOT = vdotValues[0];
    let smallestTimeDiff = Math.abs(VDOT_TABLE[vdotValues[0]][distance] - timeInSeconds);
    
    for (let vdot of vdotValues) {
        const timeDiff = Math.abs(VDOT_TABLE[vdot][distance] - timeInSeconds);
        if (timeDiff < smallestTimeDiff) {
            smallestTimeDiff = timeDiff;
            closestVDOT = vdot;
        }
    }
    
    const lowerVDOT = Math.floor(closestVDOT);
    const upperVDOT = Math.ceil(closestVDOT);
    
    if (lowerVDOT === upperVDOT) return lowerVDOT;
    
    const lowerTime = VDOT_TABLE[lowerVDOT][distance];
    const upperTime = VDOT_TABLE[upperVDOT][distance];
    const ratio = (lowerTime - timeInSeconds) / (lowerTime - upperTime);
    
    return lowerVDOT + ratio;
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
    if (totalSeconds === 0) errors.push("Total time must be greater than zero");

    return errors;
}

// Initialize event listeners when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load VDOT data
    initializeVDOTData();

    // Calculate button click handler
    document.getElementById('calculate').addEventListener('click', function() {
        console.log('Calculate button clicked');
        try {
            if (!VDOT_TABLE) {
                throw new Error('VDOT data not loaded yet');
            }
            const hours = parseInt(document.getElementById('hours').value) || 0;
            const minutes = parseInt(document.getElementById('minutes').value) || 0;
            const seconds = parseInt(document.getElementById('seconds').value) || 0;
            const recentDistance = document.getElementById('recent-distance').value;

            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = '';

            const errors = validateInputs(hours, minutes, seconds, recentDistance);
            if (errors.length > 0) {
                resultsDiv.innerHTML = `<div class="error">${errors.join('<br>')}</div>`;
                return;
            }

            const totalSeconds = timeToSeconds(hours, minutes, seconds);
            const vdot = calculateVDOT(recentDistance, totalSeconds);
            
            // Get all available distances
            const distances = Object.keys(PERCENT_VDOT);
            
            // Generate predictions for all distances
            const predictions = distances
                .filter(distance => distance !== recentDistance)
                .map(distance => {
                    const predictedSeconds = interpolateTime(vdot, distance);
                    return `
                        <tr>
                            <td>${distance}</td>
                            <td>${formatTime(predictedSeconds)}</td>
                        </tr>
                    `;
                }).join('');

            resultsDiv.innerHTML = `
                <h2>🎯 Race Predictions 🎯</h2>
                <p>Based on your ${recentDistance} time of ${formatTime(totalSeconds)}</p>
                <p>🌟 Your VDOT: ${vdot.toFixed(1)} 🌟</p>
                <table class="predictions-table">
                    <thead>
                        <tr>
                            <th>Distance</th>
                            <th>Predicted Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${predictions}
                    </tbody>
                </table>
                <p style="font-size: 1.2rem; color: #7f8c8d; margin-top: 1rem;">Keep running! 🎉</p>
            `;
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('results').innerHTML = `
                <div class="error">An error occurred: ${error.message}</div>
            `;
        }
    });

    // Reset button click handler
    document.getElementById('reset').addEventListener('click', function() {
        document.getElementById('results').innerHTML = '';
    });
}); 