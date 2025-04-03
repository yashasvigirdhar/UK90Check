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
              <div class="legend-color" style="background: #e74c3c"></div>
              <span>Last few days</span>
            </div>
          </div>
        </div>
        <div class="eligibility-container">
          <div class="eligibility-info">
            <div class="eligibility-label">You can apply for UK citizenship on</div>
            <div class="eligibility-value" id="eligibilityDate">-</div>
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
      expect(document.querySelector('.days-remaining').textContent).toBe('90 days remaining');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('0%');
      expect(document.getElementById('daysUsed').textContent).toBe('0');
    });

    it('should remove travel entry and update UI when remove button is clicked', () => {
      // Set up test data
      document.getElementById('startDate').value = '2024-01-01';
      addTravelEntry('2024-02-01', '2024-02-15');
      calculateDays();
      
      expect(document.querySelectorAll('.travel-entry')).toHaveLength(1);
      expect(document.querySelector('.days-remaining').textContent).toBe('75 days remaining');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('16.67%');

      // Remove the travel entry
      document.querySelector('.remove-travel').click();
      
      expect(document.querySelectorAll('.travel-entry')).toHaveLength(0);
      expect(document.querySelector('.days-remaining').textContent).toBe('90 days remaining');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe('0%');
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