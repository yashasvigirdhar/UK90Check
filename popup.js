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
  eligibilityDate.setFullYear(eligibilityDate.getFullYear() + 1);
  eligibilityDate.setDate(eligibilityDate.getDate() - 1); // Subtract one day to show the day before
  const eligibilityDateElement = document.getElementById('eligibilityDate');
  const eligibilityLabelElement = document.querySelector('.eligibility-label');
  
  // Get all travel entries
  const travelEntries = Array.from(document.querySelectorAll('.travel-entry')).map(entry => ({
    start: entry.querySelector('.travel-start').value,
    end: entry.querySelector('.travel-end').value
  })).filter(entry => entry.start && entry.end); // Filter out empty entries

  // Calculate total days spent outside UK
  let totalDaysOutside = 0;
  travelEntries.forEach(entry => {
    if (entry.start && entry.end && entry.start !== entry.end) {
      const start = new Date(entry.start);
      const end = new Date(entry.end);
      // Include both start and end days in the count
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      totalDaysOutside += days;
    }
  });

  // Calculate remaining days
  const remainingDays = 90 - totalDaysOutside;

  // Update eligibility message based on remaining days
  if (remainingDays < 0) {
    eligibilityLabelElement.textContent = "You cannot apply for UK citizenship on";
  } else {
    eligibilityLabelElement.textContent = "You can apply for UK citizenship on";
  }
  eligibilityDateElement.textContent = eligibilityDate.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  // Update progress bar and color coding
  const progressBarFill = document.querySelector('.progress-bar-fill');
  const daysRemainingElement = document.querySelector('.days-remaining');
  const daysUsedElement = document.getElementById('daysUsed');
  
  // Calculate progress percentage (rounded to 2 decimal places)
  const progressPercentage = Math.min(Math.round((totalDaysOutside / 90) * 100 * 100) / 100, 100);
  progressBarFill.style.width = progressPercentage === 0 ? '0%' : `${progressPercentage.toFixed(2)}%`;
  
  // Update days remaining display
  daysRemainingElement.textContent = `${Math.max(0, remainingDays)} days remaining`;
  daysUsedElement.textContent = totalDaysOutside;

  // Update color coding based on remaining days
  progressBarFill.classList.remove('green', 'yellow', 'red');
  daysRemainingElement.classList.remove('green', 'yellow', 'red');

  if (remainingDays > 60) {
    progressBarFill.classList.add('green');
    daysRemainingElement.classList.add('green');
  } else if (remainingDays > 30) {
    progressBarFill.classList.add('yellow');
    daysRemainingElement.classList.add('yellow');
  } else {
    progressBarFill.classList.add('red');
    daysRemainingElement.classList.add('red');
  }

  // Save current state
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