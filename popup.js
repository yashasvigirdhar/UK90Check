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
  calculateDays();
}

/**
 * Calculates and displays the number of days spent outside the UK
 * in the 12-month period from the start date
 */
function calculateDays() {
  const startDate = new Date(document.getElementById('startDate').value);
  const today = new Date();
  const daysRemainingElement = document.querySelector('.days-remaining');
  const progressBarFill = document.querySelector('.progress-bar-fill');
  const daysUsedElement = document.getElementById('daysUsed');
  const eligibilityLabelElement = document.querySelector('.eligibility-label');
  const eligibilityDateElement = document.getElementById('eligibilityDate');
  const helpTextElement = document.getElementById('helpText');

  if (!startDate || isNaN(startDate.getTime())) {
    daysRemainingElement.textContent = '90 days remaining';
    daysRemainingElement.className = 'days-remaining green';
    progressBarFill.style.width = '0%';
    progressBarFill.className = 'progress-bar-fill green';
    daysUsedElement.textContent = '0';
    eligibilityLabelElement.textContent = 'You can apply for UK citizenship on';
    eligibilityLabelElement.className = 'eligibility-label eligible';
    eligibilityDateElement.textContent = '-';
    helpTextElement.classList.remove('show');
    return;
  }

  const oneYearFromStart = new Date(startDate);
  oneYearFromStart.setFullYear(startDate.getFullYear() + 1);

  const travelEntries = Array.from(document.querySelectorAll('.travel-entry')).map(entry => {
    const start = new Date(entry.querySelector('.travel-start').value);
    const end = new Date(entry.querySelector('.travel-end').value);
    return { start, end };
  });

  let daysOutside = 0;
  for (const entry of travelEntries) {
    if (entry.start && entry.end && !isNaN(entry.start.getTime()) && !isNaN(entry.end.getTime())) {
      const days = Math.ceil((entry.end - entry.start) / (1000 * 60 * 60 * 24)) + 1;
      daysOutside += days;
    }
  }

  const remainingDays = 90 - daysOutside;
  daysRemainingElement.textContent = `${Math.max(0, remainingDays)} days remaining`;
  daysUsedElement.textContent = daysOutside;

  // Calculate progress percentage and round to 2 decimal places
  const progressPercentage = Math.min(100, (daysOutside / 90) * 100);
  progressBarFill.style.width = progressPercentage === 0 ? '0%' : `${progressPercentage.toFixed(2)}%`;

  // Update progress bar color based on remaining days
  if (remainingDays > 60) {
    daysRemainingElement.className = 'days-remaining green';
    progressBarFill.className = 'progress-bar-fill green';
  } else if (remainingDays > 30) {
    daysRemainingElement.className = 'days-remaining yellow';
    progressBarFill.className = 'progress-bar-fill yellow';
  } else if (remainingDays > 15) {
    daysRemainingElement.className = 'days-remaining orange';
    progressBarFill.className = 'progress-bar-fill orange';
  } else {
    daysRemainingElement.className = 'days-remaining red';
    progressBarFill.className = 'progress-bar-fill red';
  }

  // Calculate eligibility date (12 months from start date)
  const eligibilityDate = new Date(startDate);
  eligibilityDate.setFullYear(startDate.getFullYear() + 1);
  eligibilityDate.setDate(eligibilityDate.getDate() - 1); // Subtract one day to match expected format

  // Update eligibility message and styling
  if (remainingDays < 0) {
    eligibilityLabelElement.textContent = 'You cannot apply for UK citizenship on';
    eligibilityLabelElement.className = 'eligibility-label not-eligible';
    helpTextElement.classList.add('show');
  } else {
    eligibilityLabelElement.textContent = 'You can apply for UK citizenship on';
    eligibilityLabelElement.className = 'eligibility-label eligible';
    helpTextElement.classList.remove('show');
  }

  eligibilityDateElement.textContent = eligibilityDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

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