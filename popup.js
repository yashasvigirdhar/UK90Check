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
  const travelEntries = document.querySelectorAll('.travel-entry');
  const daysRemaining = document.querySelector('.days-remaining');
  const progressBarFill = document.querySelector('.progress-bar-fill');
  const daysUsed = document.getElementById('daysUsed');
  const eligibilityLabel = document.querySelector('.eligibility-label');
  const eligibilityDate = document.getElementById('eligibilityDate');
  const helpText = document.getElementById('helpText');
  const helpMessage = helpText.querySelector('.help-message');

  // Calculate eligibility date (12 months from start date)
  const eligibilityDateObj = new Date(startDate);
  eligibilityDateObj.setFullYear(eligibilityDateObj.getFullYear() + 1);
  eligibilityDateObj.setDate(eligibilityDateObj.getDate() - 1);
  eligibilityDate.textContent = eligibilityDateObj.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Calculate days spent outside UK
  const uniqueDays = new Set();
  travelEntries.forEach(entry => {
    const entryStart = new Date(entry.querySelector('.travel-start').value);
    const entryEnd = new Date(entry.querySelector('.travel-end').value);
    
    // Set time to noon to avoid DST issues
    entryStart.setHours(12, 0, 0, 0);
    entryEnd.setHours(12, 0, 0, 0);
    startDate.setHours(12, 0, 0, 0);
    eligibilityDateObj.setHours(12, 0, 0, 0);
    
    // Skip if travel entry is completely before start date
    if (entryEnd < startDate) return;
    
    // Skip if travel entry is completely after end date
    if (entryStart > eligibilityDateObj) return;
    
    // Only count days after start date
    const effectiveStart = entryStart < startDate ? startDate : entryStart;
    
    // Only count days up to 12 months from start date
    const effectiveEnd = entryEnd > eligibilityDateObj ? eligibilityDateObj : entryEnd;
    
    // Add each day to the set
    let currentDate = new Date(effectiveStart);
    currentDate.setHours(12, 0, 0, 0);
    while (currentDate <= effectiveEnd) {
      uniqueDays.add(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  });

  const daysOutsideUK = uniqueDays.size;
  const remainingDays = Math.max(0, 90 - daysOutsideUK);

  // Update UI
  daysRemaining.textContent = `${remainingDays} days remaining`;
  daysUsed.textContent = daysOutsideUK;
  
  // Update progress bar
  const percentage = Math.min(100, (daysOutsideUK / 90) * 100);
  progressBarFill.style.width = percentage === 0 ? '0%' : 
                               percentage === 100 ? '100%' : 
                               `${percentage.toFixed(2)}%`;
  
  // Update colors based on remaining days
  daysRemaining.classList.remove('green', 'yellow', 'orange', 'red');
  progressBarFill.classList.remove('green', 'yellow', 'orange', 'red');
  
  if (remainingDays >= 60) {
    daysRemaining.classList.add('green');
    progressBarFill.classList.add('green');
  } else if (remainingDays >= 30) {
    daysRemaining.classList.add('yellow');
    progressBarFill.classList.add('yellow');
  } else if (remainingDays > 15) {
    daysRemaining.classList.add('orange');
    progressBarFill.classList.add('orange');
  } else {
    daysRemaining.classList.add('red');
    progressBarFill.classList.add('red');
  }

  // Update eligibility message
  if (daysOutsideUK > 90) {
    eligibilityLabel.textContent = 'You cannot apply for UK citizenship on';
    eligibilityLabel.classList.add('not-eligible');
    eligibilityLabel.classList.remove('eligible');
    helpMessage.textContent = 'You have spent more than 90 days outside the UK in the 12 months before applying for citizenship.';
    helpText.classList.add('show');
  } else {
    eligibilityLabel.textContent = 'You can apply for UK citizenship on';
    eligibilityLabel.classList.add('eligible');
    eligibilityLabel.classList.remove('not-eligible');
    helpMessage.textContent = '';
    helpText.classList.remove('show');
  }

  // Save data
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