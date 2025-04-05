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

describe('UK90Check Extension', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset DOM with new UI elements
    document.body.innerHTML = `
      <div class="container">
        <div class="extension-header">
          <img src="icons/icon48.png" alt="UK90Check" class="extension-icon">
          <div class="extension-title">UK90Check</div>
        </div>
        <div class="section-container">
          <div class="input-group">
            <div class="section-heading">When did you receive your Indefinite Leave to Remain (ILR) OR Settled Status?</div>
            <div class="section-subheading">This is the date after which your 12-month countdown begins.</div>
            <input type="date" id="startDate" />
          </div>
        </div>
        <div class="section-container">
          <div class="input-group">
            <div class="section-heading">Travel Dates</div>
            <div class="section-subheading">Add dates when you were outside the UK after receiving ILR, including any future travel plans.</div>
            <button id="addTravel">Add Travel Date</button>
            <div id="travelDates"></div>
          </div>
        </div>
        <div class="progress-container">
          <div class="section-heading">Days Available for Future Travel</div>
          <div class="section-subheading">You can spend up to 90 days outside the UK in the 12 months before applying for citizenship</div>
          <div class="progress-header">
            <div class="days-remaining">90 days remaining</div>
          </div>
          <div class="progress-bar">
            <div class="progress-bar-fill"></div>
          </div>
          <div class="progress-stats">
            <span>Days used: <span id="daysUsed">0</span>/90</span>
          </div>
          <div class="legend">
            <div class="legend-item">
              <div class="legend-color" style="background: #2ecc71"></div>
              <span>Ample</span>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background: #f1c40f"></div>
              <span>Limited</span>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background: #e67e22"></div>
              <span>Caution</span>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background: #e74c3c"></div>
              <span>Last few days</span>
            </div>
          </div>
        </div>
        <div class="eligibility-container">
          <div class="eligibility-info">
            <div class="eligibility-label">You can apply for UK citizenship on</div>
            <div class="eligibility-value" id="eligibilityDate">-</div>
            <div class="help-text" id="helpText">
              <span class="help-message">You might be able to apply at a later date when you have not been outside the UK for 90 days in a 12-month period.</span>
            </div>
          </div>
        </div>
        <div class="reference-link">
          <a href="https://www.gov.uk/apply-citizenship-indefinite-leave-to-remain" target="_blank">Read more about UK citizenship requirements on GOV.UK</a>
        </div>
      </div>
    `;

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
        expect(document.querySelector('.progress-bar-fill').style.width).toBe('16.67%');
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
      
      expect(document.querySelectorAll('.travel-entry')).toHaveLength(1);
      expect(document.querySelector('.days-remaining').textContent).toBe('89 days remaining');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('1.11%');
      expect(document.getElementById('daysUsed').textContent).toBe('1');
    });

    it('should remove travel entry and update UI when remove button is clicked', () => {
      // Set start date to 2024-01-01
      document.getElementById('startDate').value = '2024-01-01';
      
      // Add first travel entry: Jan 1-15
      addTravelEntry('2024-01-01', '2024-01-15');
      
      // Add second travel entry: Jan 10-20
      addTravelEntry('2024-01-10', '2024-01-20');
      
      // Remove the first travel entry
      const removeButtons = document.querySelectorAll('.remove-travel');
      removeButtons[0].dispatchEvent(new Event('click'));
      
      // Should show 79 days remaining (11 days used)
      expect(document.querySelectorAll('.travel-entry')).toHaveLength(1);
      expect(document.querySelector('.days-remaining').textContent).toBe('79 days remaining');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('12.22%');
      expect(document.getElementById('daysUsed').textContent).toBe('11');
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
      addTravelEntry('2024-02-01', '2024-03-15'); // 44 days
      calculateDays();

      expect(document.querySelector('.days-remaining').textContent).toBe('46 days remaining');
      expect(document.querySelector('.days-remaining').classList.contains('yellow')).toBe(true);
      expect(document.querySelector('.progress-bar-fill').classList.contains('yellow')).toBe(true);
    });

    it('should show red color when days are less than 30', () => {
      document.getElementById('startDate').value = '2024-01-01';
      addTravelEntry('2024-02-01', '2024-04-15'); // 75 days
      calculateDays();

      expect(document.querySelector('.days-remaining').textContent).toBe('15 days remaining');
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
      const addTravelButton = document.getElementById('addTravel');
      
      // Add a single travel entry that exceeds 90 days
      addTravelButton.dispatchEvent(new Event('click'));
      const entries = document.querySelectorAll('.travel-entry');
      const lastEntry = entries[entries.length - 1];
      lastEntry.querySelector('.travel-start').value = '2024-02-01';
      lastEntry.querySelector('.travel-end').value = '2024-05-01'; // 91 days
      
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
      // Set start date to 2024-01-01
      document.getElementById('startDate').value = '2024-01-01';
      
      // Add travel entry for dates before start date
      addTravelEntry('2023-12-01', '2023-12-15');
      calculateDays();
      
      // Should still show 90 days since travel was before start date
      expect(document.querySelector('.days-remaining').textContent).toBe('90 days remaining');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('0%');
      expect(document.getElementById('daysUsed').textContent).toBe('0');
    });

    it('should count only days after start date for travel entries spanning start date', () => {
      // Set start date to 2024-01-01
      document.getElementById('startDate').value = '2024-01-01';
      
      // Add travel entry that starts before but ends after start date
      addTravelEntry('2023-12-15', '2024-01-15');
      calculateDays();
      
      // Should count only 15 days (from Jan 1 to Jan 15)
      expect(document.querySelector('.days-remaining').textContent).toBe('75 days remaining');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('16.67%');
      expect(document.getElementById('daysUsed').textContent).toBe('15');
    });

    it('should not count travel days after 12 months from start date', () => {
      // Set start date to 2024-01-01
      document.getElementById('startDate').value = '2024-01-01';
      
      // Add travel entry that starts after 12 months from start date
      addTravelEntry('2025-01-15', '2025-02-15');
      calculateDays();
      
      // Should still show 90 days since travel was after the 12-month period
      expect(document.querySelector('.days-remaining').textContent).toBe('90 days remaining');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('0%');
      expect(document.getElementById('daysUsed').textContent).toBe('0');
    });

    it('should handle overlapping travel entries correctly', () => {
      // Set start date to 2024-01-01
      document.getElementById('startDate').value = '2024-01-01';
      
      // Add first travel entry: Jan 1-15
      addTravelEntry('2024-01-01', '2024-01-15');
      
      // Add overlapping travel entry: Jan 10-20
      addTravelEntry('2024-01-10', '2024-01-20');
      
      calculateDays();
      
      // Should count unique days only (Jan 1-20 = 20 days)
      expect(document.querySelector('.days-remaining').textContent).toBe('70 days remaining');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('22.22%');
      expect(document.getElementById('daysUsed').textContent).toBe('20');
    });

    it('should count only days up to 12-month mark for travel entries spanning end date', () => {
      // Set start date to 2024-01-01
      document.getElementById('startDate').value = '2024-01-01';
      
      // Add travel entry that starts before but ends after the 12-month mark
      addTravelEntry('2024-12-15', '2025-01-15');
      calculateDays();
      
      // Should count only days up to Dec 31, 2024 (17 days)
      expect(document.querySelector('.days-remaining').textContent).toBe('73 days remaining');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('18.89%');
      expect(document.getElementById('daysUsed').textContent).toBe('17');
    });

    it('should show 0 days remaining when exceeding 90 days limit', () => {
      // Set start date to 2024-01-01
      document.getElementById('startDate').value = '2024-01-01';
      
      // Add travel entry for 100 days (exceeding 90 days limit)
      addTravelEntry('2024-02-01', '2024-05-10');
      calculateDays();
      
      // Should show 0 days remaining instead of -10
      expect(document.querySelector('.days-remaining').textContent).toBe('0 days remaining');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('100%');
      expect(document.getElementById('daysUsed').textContent).toBe('100');
      
      // Verify eligibility message
      const eligibilityLabel = document.querySelector('.eligibility-label');
      expect(eligibilityLabel.textContent).toBe('You cannot apply for UK citizenship on');
      expect(eligibilityLabel.classList.contains('not-eligible')).toBe(true);
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
      expect(travelSection.querySelector('.section-heading').textContent).toBe('Travel Dates');
      expect(travelSection.querySelector('.section-subheading').textContent)
        .toBe('Add dates when you were outside the UK after receiving ILR, including any future travel plans.');
    });

    it('should display the GOV.UK reference link', () => {
      const link = document.querySelector('.reference-link a');
      expect(link).toBeTruthy();
      expect(link.href).toBe('https://www.gov.uk/apply-citizenship-indefinite-leave-to-remain');
      expect(link.target).toBe('_blank');
      expect(link.textContent).toBe('Read more about UK citizenship requirements on GOV.UK');
    });
  });
}); 