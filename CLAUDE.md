# CLAUDE.md - AI Assistant Guide for Race Predictor

This document provides context for AI assistants working with this codebase.

## Project Overview

**Race Time Predictor** is a client-side web application that predicts running race times across different distances based on a recent race performance. It uses the VDOT (VO2max-based training) methodology developed by Dr. Jack Daniels.

**Author**: David Rosenberg (davidrosenberg.co.uk)

## Technology Stack

- **Pure HTML5/CSS3/JavaScript (ES6+)** - No frameworks or build tools
- **Vanilla JS** with async/await for data loading
- **CSS3** with Grid, Flexbox, animations, and responsive design
- **External Fonts**: 'Press Start 2P' (Google Fonts), Digital-7

## Project Structure

```
race-predictor/
├── index.html              # Main HTML file with embedded CSS (~580 lines)
├── js/
│   └── race-predictor.js   # Core application logic (~358 lines)
├── data/
│   └── vdot-tables.json    # VDOT lookup tables (values 30-85)
├── README.md               # Project description
├── CLAUDE.md               # This file
└── .gitignore              # Ignores .DS_Store, node_modules/, *.log
```

## Key Architecture

### Data Flow
1. Page loads → `initializeVDOTData()` fetches `vdot-tables.json`
2. User selects distance and enters time
3. `calculateVDOT()` finds matching VDOT value from lookup table
4. `interpolateTime()` predicts times for other distances
5. Results displayed in prediction modules

### Core Components

| Function | Purpose |
|----------|---------|
| `initializeVDOTData()` | Async fetch of VDOT lookup tables |
| `calculateVDOT(distance, timeInSeconds)` | Finds VDOT value for given performance |
| `interpolateTime(vdot, targetDistance)` | Predicts time for a target distance |
| `validateInputs()` | Input validation with error messages |
| `timeToSeconds()` / `formatTime()` | Time conversion utilities |
| `showForm()` / `showLoading()` / `showResults()` | UI state management |

### Data Structures

**VDOT_TABLE** (global): Nested object mapping VDOT values to race times
```javascript
{
  "30": { "1500": 510, "Mile": 551, "5K": 1840, ... },
  "32": { ... },
  ...
  "85": { ... }
}
```

**PERCENT_VDOT**: VO2max percentages by distance
```javascript
{ "1500": 0.98, "Mile": 0.97, "5K": 0.95, "10K": 0.92, "15K": 0.90, "HM": 0.88, "M": 0.84 }
```

### Supported Distances
- 1500m, Mile, 5K, 10K, 15K, Half Marathon (HM), Marathon (M)

## Code Conventions

### Naming
- `camelCase` for functions and variables
- `UPPER_SNAKE_CASE` for constants
- Descriptive function names: `calculateVDOT()`, `interpolateTime()`

### Patterns
- Event-driven architecture with DOM event listeners
- CSS class toggling for UI state (`.active`)
- Console logging for debugging
- Try-catch error handling with user-friendly messages

### UI State Management
Three containers managed via `.active` class:
- `#form-container` - Input form
- `#loading-container` - Loading animation (2s delay)
- `#results` - Prediction results grid

## Development Workflow

### Running Locally
No build step required. Simply serve the files:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Or open index.html directly (may have CORS issues with fetch)
```

### Making Changes
1. Edit files directly - no compilation needed
2. Refresh browser to see changes
3. Check browser console for debug logs

### Testing
- No automated tests exist
- Manual testing required
- Key test cases:
  - Enter valid times for each distance
  - Test edge cases (very fast times near VDOT 85)
  - Test validation (invalid inputs, missing distance)
  - Verify responsive design on mobile

## Important Considerations

### When Modifying JavaScript
- `VDOT_TABLE` is loaded asynchronously - always check if it's loaded
- Time is stored in seconds internally
- VDOT range is 30-85; times faster than VDOT 85 throw errors
- Predictions filter out the selected distance from results

### When Modifying CSS
- Styles are embedded in `index.html` `<style>` tag
- Uses retro gaming aesthetic (neon colors, pixel fonts)
- Responsive breakpoints handle mobile layout
- Loading animation uses CSS keyframes

### When Modifying Data
- `vdot-tables.json` contains times in seconds
- All VDOT values (30-85) must have consistent distance keys
- Distance keys must match those in `PERCENT_VDOT`

## Common Tasks

### Add a New Distance
1. Add entry to `PERCENT_VDOT` in `race-predictor.js`
2. Add times for all VDOT values in `vdot-tables.json`
3. Add distance button in `index.html`
4. Add minimum time validation in `validateInputs()`

### Modify Validation
- Edit `validateInputs()` in `race-predictor.js`
- Minimum times defined in `minTimes` object

### Change Loading Duration
- Modify timeout in `showLoading()` (currently 2000ms)
- Also update promise timeout in calculate handler

## Error Handling

The application handles:
- Failed VDOT data fetch
- Missing distance selection
- Invalid time inputs (out of range, too short)
- Times faster than VDOT 85 (beyond prediction scope)

Errors display in a styled `.error` div within the results container.

## External Dependencies

- **Google Fonts**: 'Press Start 2P' font
- **Giphy**: Background animation GIF (`https://i.gifer.com/SlxH.gif`)
- No npm packages or CDN libraries

## Browser Compatibility

Uses modern JavaScript features:
- `async/await`
- `fetch` API
- Template literals
- Arrow functions
- `padStart()`

Compatible with all modern browsers. No IE11 support.
