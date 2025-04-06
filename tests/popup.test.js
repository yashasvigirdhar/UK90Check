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
      expect(document.querySelector('.days-remaining').textContent).toBe('90 days remaining');
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
      
      // Should show 81 days remaining (9 days used)
      expect(document.querySelectorAll('.travel-entry')).toHaveLength(1);
      expect(document.querySelector('.days-remaining').textContent).toBe('81 days remaining');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('10%');
      expect(document.getElementById('daysUsed').textContent).toBe('9');
    });
  });

  describe('Days Calculation and UI Updates', () => {
    it('should show 90 days and green color when no travel dates are added', () => {
      document.getElementById('startDate').value = '2024-01-01';
      calculateDays();

      expect(document.querySelector('.days-remaining').textContent).toBe('90 days remaining');
      expect(document.querySelector('.days-remaining').classList.contains('green')).toBe(true);
      expect(document.querySelector('.progress-bar-fill').classList.contains('green')).toBe(true);
    });

    it('should show yellow color when days are between 30-60', () => {
      document.getElementById('startDate').value = '2024-01-01';
      // 42 full days (Feb 2- Mar 15)
      addTravelEntry('2024-02-01', '2024-03-15');
      calculateDays();

      expect(document.querySelector('.days-remaining').textContent).toBe('48 days remaining');
      expect(document.querySelector('.days-remaining').classList.contains('yellow')).toBe(true);
      expect(document.querySelector('.progress-bar-fill').classList.contains('yellow')).toBe(true);
    });

    it('should show red color when days are less than 30', () => {
      document.getElementById('startDate').value = '2024-01-01';
      // 73 full days (Feb 2- Apr 14)
      addTravelEntry('2024-02-01', '2024-04-15');
      calculateDays();

      expect(document.querySelector('.days-remaining').textContent).toBe('17 days remaining');
      expect(document.querySelector('.days-remaining').classList.contains('red')).toBe(true);
      expect(document.querySelector('.progress-bar-fill').classList.contains('red')).toBe(true);
    });

    it('should calculate and display eligibility date correctly', () => {
      document.getElementById('startDate').value = '2024-01-01';
      calculateDays();

      expect(document.getElementById('eligibilityDate').textContent).toBe('31 December 2024');
    });

    it('should update eligibility date when start date changes', () => {
      document.getElementById('startDate').value = '2024-01-01';
      calculateDays();
      expect(document.getElementById('eligibilityDate').textContent).toBe('31 December 2024');

      document.getElementById('startDate').value = '2024-02-01';
      calculateDays();
      expect(document.getElementById('eligibilityDate').textContent).toBe('31 January 2025');
    });

    it('should show negative eligibility message when days are over limit', () => {
      document.getElementById('startDate').value = '2024-01-01';
      
      // First entry: Jan 1-31 (29 full days)
      addTravelEntry('2024-01-01', '2024-01-31');
      
      // Second entry: Feb 1-28 (26 full days)
      addTravelEntry('2024-02-01', '2024-02-28');
      
      // Third entry: Mar 1-31 (29 full days)
      addTravelEntry('2024-03-01', '2024-03-31');
      
      // Fourth entry: Apr 1-15 (13 full days)
      addTravelEntry('2024-04-01', '2024-04-15');
      
      calculateDays();

      const eligibilityLabel = document.querySelector('.eligibility-label');
      const helpText = document.getElementById('helpText');
      const helpMessage = helpText.querySelector('.help-message');
      
      expect(eligibilityLabel.textContent).toBe('You cannot apply for UK citizenship on');
      expect(eligibilityLabel.classList.contains('not-eligible')).toBe(true);
      expect(eligibilityLabel.classList.contains('eligible')).toBe(false);
      expect(document.getElementById('eligibilityDate').textContent)
        .toBe('31 December 2024');
      expect(helpMessage.textContent)
        .toBe('You have spent more than 90 days outside the UK in the 12 months before applying for citizenship.');
      expect(helpText.classList.contains('show')).toBe(true);
    });

    it('should hide help message when days are within limit', () => {
      document.getElementById('startDate').value = '2024-01-01';
      addTravelEntry('2024-02-01', '2024-02-15'); // 15 days
      calculateDays();

      const helpText = document.getElementById('helpText');
      const helpMessage = helpText.querySelector('.help-message');
      expect(helpMessage.textContent).toBe('');
      expect(helpText.classList.contains('show')).toBe(false);
    });

    it('should show positive eligibility message when days are within limit', () => {
      document.getElementById('startDate').value = '2024-01-01';
      addTravelEntry('2024-02-01', '2024-02-15'); // 15 days
      calculateDays();

      const eligibilityLabel = document.querySelector('.eligibility-label');
      expect(eligibilityLabel.textContent)
        .toBe('You can apply for UK citizenship on');
      expect(eligibilityLabel.classList.contains('eligible')).toBe(true);
      expect(eligibilityLabel.classList.contains('not-eligible')).toBe(false);
      expect(document.getElementById('eligibilityDate').textContent)
        .toBe('31 December 2024');
    });

    it('should not count travel dates before the start date', () => {
      document.getElementById('startDate').value = '2024-01-01';
      addTravelEntry('2023-12-15', '2023-12-31');
      calculateDays();

      expect(document.querySelector('.days-remaining').textContent).toBe('90 days remaining');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('0%');
      expect(document.getElementById('daysUsed').textContent).toBe('0');
    });

    it('should count only days after start date for travel entries spanning start date', () => {
      document.getElementById('startDate').value = '2024-01-01';
      addTravelEntry('2023-12-15', '2024-01-15');
      calculateDays();

      // 13 full days outside UK (Jan 2-14)
      expect(document.querySelector('.days-remaining').textContent).toBe('77 days remaining');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('14%');
      expect(document.getElementById('daysUsed').textContent).toBe('13');
    });

    it('should not count travel days after 12 months from start date', () => {
      document.getElementById('startDate').value = '2024-01-01';
      // Entry completely after 12 months
      addTravelEntry('2025-01-15', '2025-02-15');
      calculateDays();

      expect(document.querySelector('.days-remaining').textContent).toBe('90 days remaining');
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

      // Total unique days: 17 (13 + 9 - 5 overlap)
      expect(document.querySelector('.days-remaining').textContent).toBe('72 days remaining');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('20%');
      expect(document.getElementById('daysUsed').textContent).toBe('18');
    });

    it('should count only days up to 12-month mark for travel entries spanning end date', () => {
      document.getElementById('startDate').value = '2024-01-01';
      // Entry spanning end date: Dec 15, 2024 - Jan 15, 2025
      addTravelEntry('2024-12-15', '2025-01-15');
      calculateDays();

      // 15 full days outside UK (Dec 16-31)
      expect(document.querySelector('.days-remaining').textContent).toBe('75 days remaining');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('17%');
      expect(document.getElementById('daysUsed').textContent).toBe('15');
    });

    it('should show 0 days remaining when exceeding 90 days limit', () => {
      document.getElementById('startDate').value = '2024-01-01';
      
      // First entry: Jan 1-31 (29 full days)
      addTravelEntry('2024-01-01', '2024-01-31');
      
      // Second entry: Feb 1-28 (26 full days)
      addTravelEntry('2024-02-01', '2024-02-28');
      
      // Third entry: Mar 1-31 (29 full days)
      addTravelEntry('2024-03-01', '2024-03-31');
      
      calculateDays();

      // Total: 84 full days
      expect(document.querySelector('.days-remaining').textContent).toBe('6 days remaining');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('93%');
      expect(document.getElementById('daysUsed').textContent).toBe('84');
    });

    it('should not count departure and arrival days in travel entries', () => {
      document.getElementById('startDate').value = '2024-01-01';
      
      // A 3-day trip from Jan 1-3 should only count 1 full day (Jan 2)
      addTravelEntry('2024-01-01', '2024-01-03');
      calculateDays();
      expect(document.getElementById('daysUsed').textContent).toBe('1');
      expect(document.querySelector('.days-remaining').textContent).toBe('89 days remaining');
      
      // A 4-day trip from Jan 10-13 should only count 2 full days (Jan 11-12)
      addTravelEntry('2024-01-10', '2024-01-13');
      calculateDays();
      expect(document.getElementById('daysUsed').textContent).toBe('3');
      expect(document.querySelector('.days-remaining').textContent).toBe('87 days remaining');
    });

    it('should count 0 days for consecutive travel dates', () => {
      document.getElementById('startDate').value = '2024-01-01';
      
      // Trip from Jan 1-2 (consecutive days) should count as 0 days
      addTravelEntry('2024-01-01', '2024-01-02');
      calculateDays();
      expect(document.getElementById('daysUsed').textContent).toBe('0');
      expect(document.querySelector('.days-remaining').textContent).toBe('90 days remaining');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('0%');
      
      // Trip from Jan 10-11 (consecutive days) should also count as 0 days
      addTravelEntry('2024-01-10', '2024-01-11');
      calculateDays();
      expect(document.getElementById('daysUsed').textContent).toBe('0');
      expect(document.querySelector('.days-remaining').textContent).toBe('90 days remaining');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('0%');
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
      const children = container.children;

      // Debug logging
      console.log('Number of children:', children.length);
      for (let i = 0; i < children.length; i++) {
        console.log(`Child ${i}:`, children[i].classList.toString());
      }

      // Verify the order of major elements
      expect(children[0].classList.contains('extension-header')).toBe(true);
      expect(children[1].classList.contains('progress-container')).toBe(true);
      expect(children[2].classList.contains('section-container')).toBe(true);
      expect(children[3].classList.contains('section-container')).toBe(true);
      expect(children[4].classList.contains('eligibility-container')).toBe(true);
      expect(children[5].classList.contains('reference-link')).toBe(true);

      // Verify content of each section
      expect(children[0].querySelector('.extension-title').textContent).toBe('UK90Check');
      expect(children[1].querySelector('.section-heading').textContent).toBe('Days Available for Future Travel');
      expect(children[2].querySelector('.section-heading').textContent).toBe('When did you receive your Indefinite Leave to Remain (ILR) OR Settled Status?');
      expect(children[3].querySelector('.section-heading').textContent).toBe('Travel Dates Outside the UK');
      expect(children[4].querySelector('.eligibility-label').textContent).toBe('You can apply for UK citizenship on');
      expect(children[5].querySelector('a').textContent).toBe('Read more about UK citizenship requirements on GOV.UK');
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
}); 