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

  // Calculate days spent outside UK
  const daysSpentOutside = calculateDaysInPeriod(startDate, twelveMonthsFromStart, travelEntries);
  
  // Calculate remaining days that can be traveled (90 - days spent)
  const remainingDays = Math.max(0, 90 - daysSpentOutside);
  
  // Only update the display if the element exists
  const fullPeriodDaysElement = document.getElementById('fullPeriodDays');
  if (fullPeriodDaysElement) {
    fullPeriodDaysElement.textContent = remainingDays;
  }

  // Save data
  saveData();

  console.log('🔄 Starting calculation...', {
    startDate: startDate.toISOString().split('T')[0],
    endDate: twelveMonthsFromStart.toISOString().split('T')[0]
  });

  console.log('📝 Travel entries found:', travelEntries.map(entry => ({
    start: entry.start.toISOString().split('T')[0],
    end: entry.end.toISOString().split('T')[0]
  })));

  console.log('📊 Total days spent outside UK:', daysSpentOutside);
  console.log('✈️ Remaining days that can be traveled:', remainingDays);
}

/**
 * Calculates the total number of days spent outside the UK within a given period
 * @param {Date} startDate - Start date of the period
 * @param {Date} endDate - End date of the period
 * @param {Array<{start: Date, end: Date}>} travelEntries - Array of travel periods
 * @returns {number} Total number of days spent outside the UK
 */
function calculateDaysInPeriod(startDate, endDate, travelEntries) {
  let totalDays = 0;

  travelEntries.forEach(travel => {
    const travelStart = new Date(Math.max(travel.start, startDate));
    const travelEnd = new Date(Math.min(travel.end, endDate));
    
    if (travelStart <= travelEnd) {
      const days = Math.ceil((travelEnd - travelStart) / (1000 * 60 * 60 * 24)) + 1;
      totalDays += days;

      console.log('\n📅 Calculating days in period:', {
        periodStart: startDate.toISOString().split('T')[0],
        periodEnd: endDate.toISOString().split('T')[0]
      });

      console.log(`🛫 Travel entry ${travelEntries.indexOf(travel) + 1}:`, {
        originalDates: {
          start: travel.start.toISOString().split('T')[0],
          end: travel.end.toISOString().split('T')[0]
        },
        adjustedDates: {
          start: travelStart.toISOString().split('T')[0],
          end: travelEnd.toISOString().split('T')[0]
        },
        daysCount: days
      });
    }
  });

  return totalDays;
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
    calculateDaysInPeriod,
    saveData
  };
} 