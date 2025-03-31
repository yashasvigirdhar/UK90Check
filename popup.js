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
  
  entry.innerHTML = `
    <input type="date" class="travel-start" value="${startDate}" required>
    <input type="date" class="travel-end" value="${endDate}" required>
    <button class="remove-travel">Remove</button>
  `;

  entry.querySelector('.remove-travel').addEventListener('click', function() {
    entry.remove();
    saveData();
    calculateDays(); // Recalculate after removing an entry
  });

  travelDates.appendChild(entry);
}

/**
 * Calculates and displays the number of days spent outside the UK
 * for both the current period and the full 12-month period
 */
function calculateDays() {
  const startDate = new Date(document.getElementById('startDate').value);
  const today = new Date();
  const twelveMonthsFromStart = new Date(startDate);
  twelveMonthsFromStart.setMonth(startDate.getMonth() + 12);

  // Get all travel entries
  const travelEntries = Array.from(document.querySelectorAll('.travel-entry')).map(entry => ({
    start: new Date(entry.querySelector('.travel-start').value),
    end: new Date(entry.querySelector('.travel-end').value)
  }));

  // Calculate days for current period
  const currentDays = calculateDaysInPeriod(startDate, today, travelEntries);
  document.getElementById('currentDays').textContent = currentDays;

  // Calculate days for full 12-month period
  const fullPeriodDays = calculateDaysInPeriod(startDate, twelveMonthsFromStart, travelEntries);
  document.getElementById('fullPeriodDays').textContent = fullPeriodDays;

  // Save data
  saveData();
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

  // Add event listeners
  document.getElementById('addTravel').addEventListener('click', () => {
    addTravelEntry();
    calculateDays(); // Calculate after adding a new entry
  });
  document.getElementById('calculate').addEventListener('click', calculateDays);
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