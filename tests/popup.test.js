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
      <input type="date" id="startDate" />
      <div id="travelDates"></div>
      <button id="addTravel">Add Travel Date</button>
      <div class="days-remaining">90 days remaining</div>
      <div class="progress-bar">
        <div class="progress-bar-fill"></div>
      </div>
      <div class="progress-stats">
        <span>Days used: <span id="daysUsed">0</span>/90</span>
      </div>
      <div id="eligibilityDate">-</div>
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
}); 