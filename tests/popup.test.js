/**
 * Tests for the UK90Check Chrome Extension
 * 
 * This test suite covers the main functionality of the extension:
 * 1. Data Storage - Saving and loading user data
 * 2. Travel Entry Management - Adding and removing travel entries
 * 3. Days Calculation - Computing days spent outside the UK
 */

const { addTravelEntry, calculateDays, saveData } = require('../popup.js');

describe('UK90Check Extension', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset DOM
    document.body.innerHTML = `
      <input type="date" id="startDate" />
      <div id="travelDates"></div>
      <button id="addTravel">Add Travel Date</button>
      <button id="calculate">Calculate</button>
      <div id="currentPeriod">
        <p>Days outside UK (current period): <span id="currentDays">0</span></p>
      </div>
      <div id="fullPeriod">
        <p>Days outside UK (12-month period): <span id="fullPeriodDays">0</span></p>
      </div>
    `;

    // Initialize event listeners
    document.getElementById('addTravel').addEventListener('click', () => {
      addTravelEntry();
      calculateDays();
    });
    document.getElementById('calculate').addEventListener('click', calculateDays);
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
        expect(document.getElementById('currentDays').textContent).toBe('15');
        expect(document.getElementById('fullPeriodDays').textContent).toBe('15');
      }, 0);
    });

    it('should save data when calculate is clicked', () => {
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
    it('should add new travel entry and calculate days when addTravel is clicked', () => {
      document.getElementById('startDate').value = '2024-01-01';
      document.getElementById('addTravel').dispatchEvent(new Event('click'));
      
      expect(document.querySelectorAll('.travel-entry')).toHaveLength(1);
      expect(document.getElementById('currentDays').textContent).toBe('0');
      expect(document.getElementById('fullPeriodDays').textContent).toBe('0');
    });

    it('should remove travel entry and recalculate days when remove button is clicked', () => {
      // Set up test data
      document.getElementById('startDate').value = '2024-01-01';
      addTravelEntry('2024-02-01', '2024-02-15');
      calculateDays();
      
      expect(document.querySelectorAll('.travel-entry')).toHaveLength(1);
      expect(document.getElementById('currentDays').textContent).toBe('15');
      expect(document.getElementById('fullPeriodDays').textContent).toBe('15');

      // Remove the travel entry
      document.querySelector('.remove-travel').click();
      
      expect(document.querySelectorAll('.travel-entry')).toHaveLength(0);
      expect(document.getElementById('currentDays').textContent).toBe('0');
      expect(document.getElementById('fullPeriodDays').textContent).toBe('0');
    });
  });

  describe('Days Calculation', () => {
    it('should calculate days correctly for current period', () => {
      // Set up test data
      document.getElementById('startDate').value = '2024-01-01';
      addTravelEntry('2024-02-01', '2024-02-15');

      // Trigger calculate
      calculateDays();

      // Check current period calculation (from start date to today)
      expect(document.getElementById('currentDays').textContent).toBe('15');
    });

    it('should calculate days correctly for full 12-month period', () => {
      // Set up test data
      document.getElementById('startDate').value = '2024-01-01';
      addTravelEntry('2024-02-01', '2024-02-15');

      // Trigger calculate
      calculateDays();

      // Check full period calculation (12 months from start date)
      expect(document.getElementById('fullPeriodDays').textContent).toBe('15');
    });
  });
}); 