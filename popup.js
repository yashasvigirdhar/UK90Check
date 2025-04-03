/**
 * UK90Check Extension
 * 
 * This extension helps users track their days spent outside the UK
 * in preparation for their UK citizenship application.
 * 
 * According to UK citizenship rules, applicants cannot be outside the UK
 * for more than 90 days in the 12 months preceding their citizenship application.
 * The 12-month period can begin after receiving Indefinite Leave to Remain (ILR).
 */

/**
 * Adds a new travel entry to the form
 * @param {string} startDate - Start date of the travel period (YYYY-MM-DD)
 * @param {string} endDate - End date of the travel period (YYYY-MM-DD)
 */
function addTravelEntry(startDate = '', endDate = '') {
  const travelDates = document.getElementById('travelDates');
  const entry = document.createElement('div');
  entry.className = 'travel-entry';
  
  // Set default dates to today if not provided
  const today = new Date().toISOString().split('T')[0];
  startDate = startDate || today;
  endDate = endDate || today;
  
  entry.innerHTML = `
    <input type="date" class="travel-start" value="${startDate}" required>
    <input type="date" class="travel-end" value="${endDate}" required>
    <span class="remove-travel" style="cursor: pointer; padding: 0 8px; font-size: 18px;">&times;</span>
  `;

  // Add change event listeners to the date inputs
  entry.querySelector('.travel-start').addEventListener('change', calculateDays);
  entry.querySelector('.travel-end').addEventListener('change', calculateDays);

  entry.querySelector('.remove-travel').addEventListener('click', function() {
    entry.remove();
    saveData();
    calculateDays(); // Recalculate after removing an entry
  });

  travelDates.appendChild(entry);
}

/**
 * Calculates and displays the number of days spent outside the UK
 * in the 12-month period from the start date
 */
function calculateDays() {
  const startDateInput = document.getElementById('startDate');
  if (!startDateInput.value) return; // Don't calculate if no start date

  const startDate = new Date(startDateInput.value);
  const twelveMonthsFromStart = new Date(startDate);
  twelveMonthsFromStart.setMonth(startDate.getMonth() + 12);

  // Calculate and display eligibility date
  const eligibilityDate = new Date(startDate);
  eligibilityDate.setMonth(startDate.getMonth() + 12);
  eligibilityDate.setDate(startDate.getDate() - 1); // Subtract 1 day to show the day before 12 months
  document.getElementById('eligibilityDate').textContent = eligibilityDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Get all travel entries
  const travelEntries = Array.from(document.querySelectorAll('.travel-entry')).map(entry => {
    const startInput = entry.querySelector('.travel-start');
    const endInput = entry.querySelector('.travel-end');
    
    // Skip entries with empty dates or same start/end date (default state)
    if (!startInput.value || !endInput.value || startInput.value === endInput.value) return null;
    
    return {
      start: new Date(startInput.value),
      end: new Date(endInput.value)
    };
  }).filter(entry => entry !== null); // Remove null entries

  console.log('🔄 Starting calculation...', {
    startDate: startDate.toISOString().split('T')[0],
    endDate: twelveMonthsFromStart.toISOString().split('T')[0]
  });

  console.log('📝 Travel entries found:', travelEntries.map(entry => ({
    start: entry.start.toISOString().split('T')[0],
    end: entry.end.toISOString().split('T')[0]
  })));

  // Calculate days spent outside UK
  let daysSpentOutside = 0;
  travelEntries.forEach(entry => {
    const daysCount = Math.ceil((entry.end - entry.start) / (1000 * 60 * 60 * 24)) + 1;
    daysSpentOutside += daysCount;
    console.log('📅 Calculating days in period:', {
      periodStart: entry.start.toISOString().split('T')[0],
      periodEnd: entry.end.toISOString().split('T')[0]
    });
    console.log('🛫 Travel entry:', {
      originalDates: {
        start: entry.start.toISOString().split('T')[0],
        end: entry.end.toISOString().split('T')[0]
      },
      adjustedDates: {
        start: entry.start.toISOString().split('T')[0],
        end: entry.end.toISOString().split('T')[0]
      },
      daysCount
    });
  });

  console.log('📊 Total days spent outside UK:', daysSpentOutside);

  // Calculate remaining days
  const remainingDays = Math.max(0, 90 - daysSpentOutside);
  console.log('✈️ Remaining days that can be traveled:', remainingDays);

  // Update the display
  const daysRemainingElements = document.querySelectorAll('.days-remaining');
  daysRemainingElements.forEach(el => el.textContent = `${remainingDays} days remaining`);

  // Update progress bar
  const progressBarFill = document.querySelector('.progress-bar-fill');
  const progressPercentage = Math.round((daysSpentOutside / 90) * 100 * 100) / 100;
  progressBarFill.style.width = `${progressPercentage}%`;

  // Update color coding based on remaining days
  if (remainingDays > 60) {
    daysRemainingElements.forEach(el => el.className = 'days-remaining green');
    progressBarFill.className = 'progress-bar-fill green';
  } else if (remainingDays > 30) {
    daysRemainingElements.forEach(el => el.className = 'days-remaining yellow');
    progressBarFill.className = 'progress-bar-fill yellow';
  } else {
    daysRemainingElements.forEach(el => el.className = 'days-remaining red');
    progressBarFill.className = 'progress-bar-fill red';
  }

  // Update stats
  document.getElementById('daysUsed').textContent = daysSpentOutside;

  // Save the current state
  saveData();
}

/**
 * Saves the current form data to Chrome's local storage
 */
function saveData() {
  const startDate = document.getElementById('startDate').value;
  const travelDates = Array.from(document.querySelectorAll('.travel-entry')).map(entry => ({
    start: entry.querySelector('.travel-start').value,
    end: entry.querySelector('.travel-end').value
  }));

  chrome.storage.local.set({
    startDate: startDate,
    travelDates: travelDates
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add change event listener to start date
  document.getElementById('startDate').addEventListener('change', calculateDays);

  // Load saved data
  chrome.storage.local.get(['startDate', 'travelDates'], function(result) {
    if (result.startDate) {
      document.getElementById('startDate').value = result.startDate;
    }
    if (result.travelDates && result.travelDates.length > 0) {
      result.travelDates.forEach(travel => {
        addTravelEntry(travel.start, travel.end);
      });
    }
    // Calculate days after loading saved data
    calculateDays();
  });

  // Add event listener for adding new travel entry
  document.getElementById('addTravel').addEventListener('click', () => {
    addTravelEntry();
    calculateDays(); // Calculate after adding a new entry
  });
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    addTravelEntry,
    calculateDays,
    saveData
  };
} 