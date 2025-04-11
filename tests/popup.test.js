/**
 * Tests for the UK90Check Chrome Extension
 * 
 * This test suite covers the main functionality of the extension:
 * 1. Data Storage - Saving and loading user data
 * 2. Travel Entry Management - Adding and removing travel entries
 * 3. Days Calculation - Computing remaining days that can be traveled
 * 4. UI Updates - Progress bar, color coding, and eligibility date
 */

const { addTravelEntry, calculateDays, saveData } = require('../popup.js');
const { setupTestDOM } = require('./test-utils');

describe('UK90Check Extension', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset DOM with shared setup
    setupTestDOM();

    // Initialize event listeners
    document.getElementById('addTravel').addEventListener('click', () => {
      addTravelEntry();
      calculateDays();
    });

    // Add start date change listener
    document.getElementById('startDate').addEventListener('change', calculateDays);
  });

  describe('Data Storage', () => {
    it('should load saved data and calculate days when popup opens', () => {
      const mockData = {
        startDate: '2024-01-01',
        travelDates: [
          { start: '2024-02-01', end: '2024-02-15' }
        ]
      };

      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback(mockData);
      });

      // Trigger the DOMContentLoaded event
      document.dispatchEvent(new Event('DOMContentLoaded'));

      // Wait for async operations
      setTimeout(() => {
        expect(document.getElementById('startDate').value).toBe('2024-01-01');
        expect(document.querySelectorAll('.travel-entry')).toHaveLength(1);
        expect(document.querySelector('.days-remaining').textContent).toBe('75 days remaining');
        expect(document.querySelector('.progress-bar-fill').style.width).toBe('17%');
        expect(document.getElementById('daysUsed').textContent).toBe('15');
        expect(document.getElementById('eligibilityDate').textContent).toBe('31 December 2024');
      }, 0);
    });

    it('should save data when changes occur', () => {
      // Set up test data
      document.getElementById('startDate').value = '2024-01-01';
      addTravelEntry('2024-02-01', '2024-02-15');

      // Trigger calculate
      calculateDays();

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        startDate: '2024-01-01',
        travelDates: [{
          start: '2024-02-01',
          end: '2024-02-15'
        }]
      });
    });
  });

  describe('Travel Entry Management', () => {
    it('should add new travel entry and update UI when addTravel is clicked', () => {
      document.getElementById('startDate').value = '2024-01-01';
      document.getElementById('addTravel').dispatchEvent(new Event('click'));
      
      // When start and end dates are the same, no days should be counted
      expect(document.querySelectorAll('.travel-entry')).toHaveLength(1);
      expect(document.querySelector('.days-remaining').textContent).toBe('0 days used');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('0%');
      expect(document.getElementById('daysUsed').textContent).toBe('0');
    });

    it('should remove travel entry and update UI when remove button is clicked', () => {
      // Set start date to 2024-01-01
      document.getElementById('startDate').value = '2024-01-01';
      
      // Add first travel entry: Jan 1-15 (13 full days outside UK)
      addTravelEntry('2024-01-01', '2024-01-15');
      
      // Add second travel entry: Jan 10-20 (9 full days outside UK, 2 days overlap)
      addTravelEntry('2024-01-10', '2024-01-20');
      
      // Remove the first travel entry
      const removeButtons = document.querySelectorAll('.remove-travel');
      removeButtons[0].dispatchEvent(new Event('click'));
      
      // Should show 9 days used
      expect(document.querySelectorAll('.travel-entry')).toHaveLength(1);
      expect(document.querySelector('.days-remaining').textContent).toBe('9 days used');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('10%');
      expect(document.getElementById('daysUsed').textContent).toBe('9');
    });

    it('should show 0 days used and green color when no travel dates are added', () => {
      document.getElementById('startDate').value = '2024-01-01';
      calculateDays();

      expect(document.querySelector('.days-remaining').textContent).toBe('0 days used');
      expect(document.querySelector('.days-remaining').classList.contains('green')).toBe(true);
      expect(document.querySelector('.progress-bar-fill').classList.contains('green')).toBe(true);
    });

    it('should not count travel dates before the start date', () => {
      document.getElementById('startDate').value = '2024-01-01';
      addTravelEntry('2023-12-15', '2023-12-31');
      calculateDays();

      expect(document.querySelector('.days-remaining').textContent).toBe('0 days used');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('0%');
      expect(document.getElementById('daysUsed').textContent).toBe('0');
    });

    it('should count only days after start date for travel entries spanning start date', () => {
      document.getElementById('startDate').value = '2024-01-01';
      addTravelEntry('2023-12-15', '2024-01-15');
      calculateDays();

      // 13 full days outside UK (Jan 2-14)
      expect(document.querySelector('.days-remaining').textContent).toBe('13 days used');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('14%');
      expect(document.getElementById('daysUsed').textContent).toBe('13');
    });

    it('should not count travel days after 12 months from start date', () => {
      document.getElementById('startDate').value = '2024-01-01';
      // Entry completely after 12 months
      addTravelEntry('2025-01-15', '2025-02-15');
      calculateDays();

      expect(document.querySelector('.days-remaining').textContent).toBe('0 days used');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('0%');
      expect(document.getElementById('daysUsed').textContent).toBe('0');
    });

    it('should handle overlapping travel entries correctly', () => {
      document.getElementById('startDate').value = '2024-01-01';
      
      // First entry: Jan 1-15 (13 full days)
      addTravelEntry('2024-01-01', '2024-01-15');
      
      // Second entry: Jan 10-20 (9 full days, 5 days overlap)
      addTravelEntry('2024-01-10', '2024-01-20');
      
      calculateDays();

      // Total unique days: 18 (13 + 9 - 4 overlap)
      expect(document.querySelector('.days-remaining').textContent).toBe('18 days used');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('20%');
      expect(document.getElementById('daysUsed').textContent).toBe('18');
    });

    it('should count only days up to 12-month mark for travel entries spanning end date', () => {
      document.getElementById('startDate').value = '2024-01-01';
      // Entry spanning end date: Dec 15, 2024 - Jan 15, 2025
      addTravelEntry('2024-12-15', '2025-01-15');
      calculateDays();

      // 15 full days outside UK (Dec 16-31)
      expect(document.querySelector('.days-remaining').textContent).toBe('15 days used');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('17%');
      expect(document.getElementById('daysUsed').textContent).toBe('15');
    });

    it('should show 84 days used when exceeding 90 days limit', () => {
      document.getElementById('startDate').value = '2024-01-01';
      
      // First entry: Jan 1-31 (29 full days)
      addTravelEntry('2024-01-01', '2024-01-31');
      
      // Second entry: Feb 1-28 (26 full days)
      addTravelEntry('2024-02-01', '2024-02-28');
      
      // Third entry: Mar 1-31 (29 full days)
      addTravelEntry('2024-03-01', '2024-03-31');
      
      calculateDays();

      // Total: 84 full days
      expect(document.querySelector('.days-remaining').textContent).toBe('84 days used');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('93%');
      expect(document.getElementById('daysUsed').textContent).toBe('84');
    });

    it('should not count departure and arrival days in travel entries', () => {
      document.getElementById('startDate').value = '2024-01-01';
      
      // A 3-day trip from Jan 1-3 should only count 1 full day (Jan 2)
      addTravelEntry('2024-01-01', '2024-01-03');
      calculateDays();
      expect(document.getElementById('daysUsed').textContent).toBe('1');
      expect(document.querySelector('.days-remaining').textContent).toBe('1 days used');
      
      // A 4-day trip from Jan 10-13 should only count 2 full days (Jan 11-12)
      addTravelEntry('2024-01-10', '2024-01-13');
      calculateDays();
      expect(document.getElementById('daysUsed').textContent).toBe('3');
      expect(document.querySelector('.days-remaining').textContent).toBe('3 days used');
    });

    it('should count 0 days for consecutive travel dates', () => {
      document.getElementById('startDate').value = '2024-01-01';
      
      // Trip from Jan 1-2 (consecutive days) should count as 0 days
      addTravelEntry('2024-01-01', '2024-01-02');
      calculateDays();
      expect(document.getElementById('daysUsed').textContent).toBe('0');
      expect(document.querySelector('.days-remaining').textContent).toBe('0 days used');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('0%');
      
      // Trip from Jan 10-11 (consecutive days) should also count as 0 days
      addTravelEntry('2024-01-10', '2024-01-11');
      calculateDays();
      expect(document.getElementById('daysUsed').textContent).toBe('0');
      expect(document.querySelector('.days-remaining').textContent).toBe('0 days used');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('0%');
    });

    it('should show green color when days used are 50 or less', () => {
      document.getElementById('startDate').value = '2024-01-01';
      // 50 full days (Jan 2 - Feb 20)
      addTravelEntry('2024-01-01', '2024-02-21');
      calculateDays();

      expect(document.querySelector('.days-remaining').textContent).toBe('50 days used');
      expect(document.querySelector('.days-remaining').classList.contains('green')).toBe(true);
      expect(document.querySelector('.progress-bar-fill').classList.contains('green')).toBe(true);
    });

    it('should show yellow color when days used are between 51 and 75', () => {
      document.getElementById('startDate').value = '2024-01-01';
      // 75 full days (Jan 2 - Mar 16)
      addTravelEntry('2024-01-01', '2024-03-17');
      calculateDays();

      expect(document.querySelector('.days-remaining').textContent).toBe('75 days used');
      expect(document.querySelector('.days-remaining').classList.contains('yellow')).toBe(true);
      expect(document.querySelector('.progress-bar-fill').classList.contains('yellow')).toBe(true);
    });

    it('should show orange color when days used are between 76 and 90', () => {
      document.getElementById('startDate').value = '2024-01-01';
      // 90 full days (Jan 2 - Mar 31)
      addTravelEntry('2024-01-01', '2024-04-01');
      calculateDays();

      expect(document.querySelector('.days-remaining').textContent).toBe('90 days used');
      expect(document.querySelector('.days-remaining').classList.contains('orange')).toBe(true);
      expect(document.querySelector('.progress-bar-fill').classList.contains('orange')).toBe(true);
    });

    it('should show red color when days used exceed 90', () => {
      document.getElementById('startDate').value = '2024-01-01';
      // 100 full days (Jan 2 - Apr 10)
      addTravelEntry('2024-01-01', '2024-04-11');
      calculateDays();

      expect(document.querySelector('.days-remaining').textContent).toBe('100 days used');
      expect(document.querySelector('.days-remaining').classList.contains('red')).toBe(true);
      expect(document.querySelector('.progress-bar-fill').classList.contains('red')).toBe(true);
    });

    it('should show message to provide ILR date when start date is not entered', () => {
      document.getElementById('startDate').value = '';
      calculateDays();

      const eligibilityLabel = document.querySelector('.eligibility-label');
      const helpText = document.getElementById('helpText');
      const helpMessage = helpText.querySelector('.help-message');
      const daysUsed = document.getElementById('daysUsed');
      const progressContainer = document.querySelector('.progress-container');
      
      expect(daysUsed.textContent).toBe('0');
      expect(progressContainer.style.display).toBe('none');
      expect(eligibilityLabel.textContent).toBe('Please enter your ILR date below and add your travel entries to see eligibility information');
      expect(eligibilityLabel.classList.contains('not-eligible')).toBe(true);
      expect(eligibilityLabel.classList.contains('eligible')).toBe(false);
      expect(helpMessage.textContent).toBe('');
      expect(helpText.classList.contains('show')).toBe(false);
      expect(document.getElementById('eligibilityDate').textContent).toBe('-');

      // Verify progress container is shown when ILR date is provided
      document.getElementById('startDate').value = '2024-01-01';
      document.getElementById('startDate').dispatchEvent(new Event('change'));
      expect(progressContainer.style.display).toBe('block');
    });

    it('should show positive eligibility message when days are within limit', () => {
      document.getElementById('startDate').value = '2024-01-01';
      addTravelEntry('2024-02-01', '2024-02-15'); // 13 days
      calculateDays();

      const eligibilityLabel = document.querySelector('.eligibility-label');
      const helpText = document.getElementById('helpText');
      const helpMessage = helpText.querySelector('.help-message');
      
      expect(eligibilityLabel.textContent).toBe('You can apply for UK citizenship on');
      expect(eligibilityLabel.classList.contains('eligible')).toBe(true);
      expect(eligibilityLabel.classList.contains('not-eligible')).toBe(false);
      expect(helpMessage.textContent).toBe('');
      expect(helpText.classList.contains('show')).toBe(false);
    });

    it('should show appropriate message when days are between 90-100', () => {
      document.getElementById('startDate').value = '2024-01-01';
      addTravelEntry('2024-01-01', '2024-04-01'); // 90 days
      addTravelEntry('2024-04-02', '2024-04-12'); // Additional 10 days
      calculateDays();

      const eligibilityLabel = document.querySelector('.eligibility-label');
      const helpText = document.getElementById('helpText');
      const helpMessage = helpText.querySelector('.help-message');
      
      expect(eligibilityLabel.textContent).toBe('You might still be eligible to apply for UK citizenship on');
      expect(eligibilityLabel.classList.contains('not-eligible')).toBe(true);
      expect(eligibilityLabel.classList.contains('eligible')).toBe(false);
      expect(helpMessage.textContent)
        .toBe('While you have exceeded the standard limit of 90 days, this might be normally disregarded as you are still under the 100 days limit.');
      expect(helpText.classList.contains('show')).toBe(true);
    });

    it('should show appropriate message when days are between 101-179', () => {
      document.getElementById('startDate').value = '2024-01-01';
      addTravelEntry('2024-01-01', '2024-05-01'); // About 120 days
      calculateDays();

      const eligibilityLabel = document.querySelector('.eligibility-label');
      const helpText = document.getElementById('helpText');
      const helpMessage = helpText.querySelector('.help-message');
      
      expect(eligibilityLabel.textContent).toBe('You might still be eligible to apply for UK citizenship on');
      expect(eligibilityLabel.classList.contains('not-eligible')).toBe(true);
      expect(eligibilityLabel.classList.contains('eligible')).toBe(false);
      expect(helpMessage.textContent)
        .toBe('While you have exceeded 100 days, this might be normally disregarded only if all other requirements are met and you have demonstrated links with the UK through presence of family, established home and a substantial part of your estate.');
      expect(helpText.classList.contains('show')).toBe(true);
      expect(document.querySelector('.days-remaining').classList.contains('dark-red')).toBe(true);
      expect(document.querySelector('.progress-bar-fill').classList.contains('dark-red')).toBe(true);
    });

    it('should show appropriate message when days exceed 179', () => {
      document.getElementById('startDate').value = '2024-01-01';
      addTravelEntry('2024-01-01', '2024-07-01'); // About 180 days
      calculateDays();

      const eligibilityLabel = document.querySelector('.eligibility-label');
      const helpText = document.getElementById('helpText');
      const helpMessage = helpText.querySelector('.help-message');
      
      expect(eligibilityLabel.textContent).toBe('You might not be eligible to apply for UK citizenship on');
      expect(eligibilityLabel.classList.contains('not-eligible')).toBe(true);
      expect(eligibilityLabel.classList.contains('eligible')).toBe(false);
      expect(helpMessage.textContent)
        .toBe('You have spent more than 179 days outside the UK in the 12 months before applying for citizenship. This exceeds the maximum allowed period.');
      expect(helpText.classList.contains('show')).toBe(true);
      expect(document.querySelector('.days-remaining').classList.contains('dark-red')).toBe(true);
      expect(document.querySelector('.progress-bar-fill').classList.contains('dark-red')).toBe(true);
    });

    it('should recalculate days when start date changes', () => {
      // Set initial state
      document.getElementById('startDate').value = '2024-01-01';
      addTravelEntry('2024-02-01', '2024-02-15'); // 13 days
      calculateDays();
      expect(document.getElementById('daysUsed').textContent).toBe('13');

      // Change start date to after the travel entry
      const startDateInput = document.getElementById('startDate');
      startDateInput.value = '2024-02-16';
      startDateInput.dispatchEvent(new Event('change'));

      // Should show 0 days as travel entry is before start date
      expect(document.getElementById('daysUsed').textContent).toBe('0');
    });

    it('should recalculate days when travel dates change', () => {
      document.getElementById('startDate').value = '2024-01-01';
      addTravelEntry('2024-02-01', '2024-02-15'); // 13 days

      // Change travel end date
      const travelEntry = document.querySelector('.travel-entry');
      const endDateInput = travelEntry.querySelector('.travel-end');
      endDateInput.value = '2024-02-20';
      endDateInput.dispatchEvent(new Event('change'));

      // Should now show 18 days
      expect(document.getElementById('daysUsed').textContent).toBe('18');
    });

    it('should handle multiple overlapping travel entries correctly', () => {
      document.getElementById('startDate').value = '2024-01-01';
      
      // First entry: Jan 1-15 (13 full days)
      addTravelEntry('2024-01-01', '2024-01-15');
      
      // Second entry: Jan 10-20 (9 full days, 5 days overlap with first)
      addTravelEntry('2024-01-10', '2024-01-20');
      
      // Third entry: Jan 15-25 (9 full days, overlaps with both)
      addTravelEntry('2024-01-15', '2024-01-25');
      
      calculateDays();

      // Total unique days: 23 (13 + 9 + 9 - overlaps)
      expect(document.getElementById('daysUsed').textContent).toBe('23');
    });

    it('should handle travel entries exactly at 12-month boundary', () => {
      document.getElementById('startDate').value = '2024-01-01';
      
      // Entry ending exactly on Dec 31, 2024
      addTravelEntry('2024-12-15', '2024-12-31');
      calculateDays();
      expect(document.getElementById('daysUsed').textContent).toBe('15');

      // Entry starting exactly on Jan 1, 2025 should not be counted
      addTravelEntry('2025-01-01', '2025-01-15');
      calculateDays();
      expect(document.getElementById('daysUsed').textContent).toBe('15');
    });

    it('should handle travel entries spanning multiple months and years', () => {
      document.getElementById('startDate').value = '2024-01-01';
      
      // Entry spanning 3 months
      addTravelEntry('2024-01-15', '2024-03-15');
      calculateDays();
      
      // Should count 59 days (Jan 16-31: 16 days, Feb 1-29: 29 days, Mar 1-14: 14 days)
      expect(document.getElementById('daysUsed').textContent).toBe('59');

      // Entry spanning year boundary (but within 12-month period)
      addTravelEntry('2024-12-15', '2025-01-15');
      calculateDays();
      
      // Previous 59 days + 15 days (Dec 16-31)
      expect(document.getElementById('daysUsed').textContent).toBe('74');
    });

    it('should reset all UI elements and calculations when ILR date is cleared', () => {
      // Set up initial state with ILR date and travel entries
      document.getElementById('startDate').value = '2024-01-01';
      addTravelEntry('2024-02-01', '2024-02-15'); // 13 days
      calculateDays();

      // Verify initial state
      expect(document.getElementById('daysUsed').textContent).toBe('13');
      expect(document.querySelector('.days-remaining').textContent).toBe('13 days used');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('14%');
      expect(document.getElementById('eligibilityDate').textContent).toBe('31 December 2024');
      expect(document.querySelector('.eligibility-label').textContent).toBe('You can apply for UK citizenship on');
      expect(document.querySelector('.progress-container').style.display).toBe('block');

      // Clear the ILR date
      document.getElementById('startDate').value = '';
      document.getElementById('startDate').dispatchEvent(new Event('change'));

      // Verify all UI elements are reset
      expect(document.getElementById('daysUsed').textContent).toBe('0');
      expect(document.querySelector('.progress-container').style.display).toBe('none');
      expect(document.getElementById('eligibilityDate').textContent).toBe('-');
      expect(document.querySelector('.eligibility-label').textContent)
        .toBe('Please enter your ILR date below and add your travel entries to see eligibility information');
      expect(document.querySelector('.eligibility-label').classList.contains('not-eligible')).toBe(true);
      expect(document.querySelector('.eligibility-label').classList.contains('eligible')).toBe(false);
      expect(document.getElementById('helpText').classList.contains('show')).toBe(false);
      expect(document.querySelector('.help-message').textContent).toBe('');
    });

    it('should initialize with empty state when no saved data exists', () => {
      // Trigger the DOMContentLoaded event with no saved data
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({});
      });
      document.dispatchEvent(new Event('DOMContentLoaded'));

      expect(document.getElementById('startDate').value).toBe('');
      expect(document.querySelectorAll('.travel-entry')).toHaveLength(0);
      expect(document.querySelector('.progress-container').style.display).toBe('none');
      expect(document.getElementById('daysUsed').textContent).toBe('0');
      expect(document.getElementById('eligibilityDate').textContent).toBe('-');
    });
  });

  describe('Date Validation', () => {
    it('should handle invalid date combinations', () => {
      document.getElementById('startDate').value = '2024-01-01';
      
      // Add travel entry with end date before start date
      addTravelEntry('2024-02-15', '2024-02-01');
      calculateDays();
      
      // Should not count any days for invalid date range
      expect(document.getElementById('daysUsed').textContent).toBe('0');
    });

    it('should handle future dates correctly', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      futureDate.setDate(1); // Set to first day of the month to avoid end-of-month issues
      const futureDateString = futureDate.toISOString().split('T')[0];
      
      document.getElementById('startDate').value = futureDateString;
      addTravelEntry(futureDateString, futureDateString);
      calculateDays();
      
      // Should show future eligibility date
      const expectedEligibilityDate = new Date(futureDate);
      expectedEligibilityDate.setFullYear(expectedEligibilityDate.getFullYear() + 1);
      expectedEligibilityDate.setDate(expectedEligibilityDate.getDate() - 1);
      
      const expectedDateString = expectedEligibilityDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      expect(document.getElementById('eligibilityDate').textContent).toBe(expectedDateString);
    });
  });

  describe('UI Elements and Layout', () => {
    it('should display the extension header with icon and title', () => {
      const header = document.querySelector('.extension-header');
      const icon = document.querySelector('.extension-icon');
      const title = document.querySelector('.extension-title');

      expect(header).toBeTruthy();
      expect(icon).toBeTruthy();
      expect(icon.src).toContain('icons/icon48.png');
      expect(title.textContent).toBe('UK90Check');
    });

    it('should display section containers with correct headings', () => {
      const sectionContainers = document.querySelectorAll('.section-container');
      expect(sectionContainers).toHaveLength(2);

      const ilrSection = sectionContainers[0];
      expect(ilrSection.querySelector('.section-heading').textContent)
        .toBe('When did you receive your Indefinite Leave to Remain (ILR) OR Settled Status?');
      expect(ilrSection.querySelector('.section-subheading').textContent)
        .toBe('This is the date after which your 12-month countdown begins.');

      const travelSection = sectionContainers[1];
      expect(travelSection.querySelector('.section-heading').textContent).toBe('Travel Dates Outside the UK');
      expect(travelSection.querySelectorAll('.section-subheading')[0].textContent)
        .toBe('Add your departure and arrival dates for each trip.');
      expect(travelSection.querySelectorAll('.section-subheading')[1].textContent)
        .toBe('Note: Only full days between departure and arrival count towards your 90-day limit.');
    });

    it('should display the GOV.UK reference link', () => {
      const link = document.querySelector('.reference-link a');
      expect(link).toBeTruthy();
      expect(link.href).toBe('https://www.gov.uk/apply-citizenship-indefinite-leave-to-remain');
      expect(link.target).toBe('_blank');
      expect(link.textContent).toBe('Read more about UK citizenship requirements on GOV.UK');
    });

    it('should display UI elements in the correct order', () => {
      const container = document.querySelector('.container');
      const children = Array.from(container.children);
      
      // Log the number of children and their classes for debugging
      console.log('Number of children:', children.length);
      children.forEach((child, index) => {
        console.log(`Child ${index}:`, child.classList[0]);
      });
      
      // Verify the order of major elements
      expect(children[0].classList.contains('extension-header')).toBe(true);
      expect(children[1].classList.contains('eligibility-container')).toBe(true);
      expect(children[2].classList.contains('progress-container')).toBe(true);
      expect(children[3].classList.contains('section-container')).toBe(true);
      expect(children[4].classList.contains('section-container')).toBe(true);
      expect(children[5].classList.contains('reference-link')).toBe(true);
      expect(children[6].classList.contains('donation-container')).toBe(true);
    });

    it('should display the note about counting days in the Travel Dates section', () => {
      const travelSection = document.querySelectorAll('.section-container')[1];
      const subheadings = travelSection.querySelectorAll('.section-subheading');
      
      // Verify there are two subheadings
      expect(subheadings.length).toBe(2);
      
      // Verify the second subheading is the note
      const noteSubheading = subheadings[1];
      expect(noteSubheading.textContent).toBe('Note: Only full days between departure and arrival count towards your 90-day limit.');
      
      // Verify the note has the orange color styling
      expect(noteSubheading.style.color).toBe('rgb(230, 126, 34)'); // #e67e22 in RGB
    });
  });

  describe('Donation Section', () => {
    it('should display the donation section with correct elements', () => {
      // Check if donation container exists
      const donationContainer = document.querySelector('.donation-container');
      expect(donationContainer).toBeTruthy();

      // Check if donation content exists
      const donationContent = document.querySelector('.donation-content');
      expect(donationContent).toBeTruthy();

      // Check if donation header exists with heart icon and title
      const donationHeader = document.querySelector('.donation-header');
      expect(donationHeader).toBeTruthy();
      
      const heartIcon = donationHeader.querySelector('img[alt="Heart"]');
      expect(heartIcon).toBeTruthy();
      expect(heartIcon.src).toContain('heart-icon.svg');
      
      const donationTitle = donationHeader.querySelector('.donation-title');
      expect(donationTitle).toBeTruthy();
      expect(donationTitle.textContent).toBe('Support UK90Check');

      // Check if donation message exists
      const donationMessage = document.querySelector('.donation-message');
      expect(donationMessage).toBeTruthy();
      expect(donationMessage.textContent).toBe('If this extension has helped you, consider supporting its development with any amount, even small contributions help!');

      // Check if Buy Me a Coffee button exists with correct attributes
      const bmcButton = document.querySelector('.bmc-button');
      expect(bmcButton).toBeTruthy();
      expect(bmcButton.href).toBe('https://www.buymeacoffee.com/uSoY8yLkKu');
      expect(bmcButton.target).toBe('_blank');
      
      const coffeeIcon = bmcButton.querySelector('img[alt="Coffee"]');
      expect(coffeeIcon).toBeTruthy();
      expect(coffeeIcon.src).toContain('coffee-icon.svg');
      
      expect(bmcButton.textContent.trim()).toBe('Buy me a coffee');
    });

    it('should verify the exact content of the donation section', () => {
      // Get the donation container
      const donationContainer = document.querySelector('.donation-container');
      
      // Verify the container has the correct structure
      expect(donationContainer.children.length).toBe(1);
      expect(donationContainer.children[0].classList.contains('donation-content')).toBe(true);
      
      // Get the donation content
      const donationContent = donationContainer.querySelector('.donation-content');
      
      // Verify the content has the correct structure
      expect(donationContent.children.length).toBe(3);
      expect(donationContent.children[0].classList.contains('donation-header')).toBe(true);
      expect(donationContent.children[1].classList.contains('donation-message')).toBe(true);
      expect(donationContent.children[2].classList.contains('donation-buttons')).toBe(true);
      
      // Verify the header content
      const donationHeader = donationContent.querySelector('.donation-header');
      expect(donationHeader.children.length).toBe(2);
      expect(donationHeader.children[0].tagName).toBe('IMG');
      expect(donationHeader.children[0].alt).toBe('Heart');
      expect(donationHeader.children[1].classList.contains('donation-title')).toBe(true);
      expect(donationHeader.children[1].textContent).toBe('Support UK90Check');
      
      // Verify the message content
      const donationMessage = donationContent.querySelector('.donation-message');
      expect(donationMessage.textContent).toBe('If this extension has helped you, consider supporting its development with any amount, even small contributions help!');
      
      // Verify the buttons container
      const donationButtons = donationContent.querySelector('.donation-buttons');
      expect(donationButtons.children.length).toBe(1);
      expect(donationButtons.children[0].classList.contains('bmc-button')).toBe(true);
      
      // Verify the Buy Me a Coffee button
      const bmcButton = donationButtons.querySelector('.bmc-button');
      expect(bmcButton.href).toBe('https://www.buymeacoffee.com/uSoY8yLkKu');
      expect(bmcButton.target).toBe('_blank');
      expect(bmcButton.children.length).toBe(2);
      expect(bmcButton.children[0].tagName).toBe('IMG');
      expect(bmcButton.children[0].alt).toBe('Coffee');
      expect(bmcButton.children[1].textContent.trim()).toBe('Buy me a coffee');
    });

    it('should apply correct styles to donation elements', () => {
      // Check donation container styles
      const donationContainer = document.querySelector('.donation-container');
      const containerStyles = window.getComputedStyle(donationContainer);
      expect(containerStyles.backgroundColor).toBe('rgb(248, 249, 250)');
      expect(containerStyles.borderRadius).toBe('8px');
      expect(containerStyles.padding).toBe('15px');
      expect(containerStyles.margin).toBe('10px 0px');
      expect(containerStyles.border).toBe('2px solid rgb(233, 236, 239)');

      // Check heart icon size
      const heartIcon = document.querySelector('.donation-icon');
      const iconStyles = window.getComputedStyle(heartIcon);
      expect(iconStyles.width).toBe('24px');
      expect(iconStyles.height).toBe('24px');

      // Check Buy Me a Coffee button styles
      const bmcButton = document.querySelector('.bmc-button');
      const buttonStyles = window.getComputedStyle(bmcButton);
      expect(buttonStyles.backgroundColor).toBe('rgb(64, 220, 165)');
      expect(buttonStyles.color).toBe('rgb(255, 255, 255)');
      expect(buttonStyles.border).toBe('2px solid rgb(0, 0, 0)');
      expect(buttonStyles.borderRadius).toBe('4px');
      expect(buttonStyles.fontSize).toBe('16px');
      expect(buttonStyles.textDecoration).toBe('none');
    });

    it('should apply hover effects to Buy Me a Coffee button', () => {
      const bmcButton = document.querySelector('.bmc-button');
      
      // Simulate hover
      bmcButton.dispatchEvent(new MouseEvent('mouseover', {
        bubbles: true,
        cancelable: true,
        view: window
      }));
      
      // Check if transform and box-shadow are applied on hover
      const buttonStyles = window.getComputedStyle(bmcButton);
      expect(buttonStyles.transform).toBe('translateY(-2px)');
      expect(buttonStyles.boxShadow).toBe('rgba(0, 0, 0, 0.1) 0px 2px 4px');
    });
  });
}); 