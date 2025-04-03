/**
 * Tests for the UK90Check Chrome Extension
 * 
 * This test suite covers the main functionality of the extension:
 * 1. Data Storage - Saving and loading user data
 * 2. Travel Entry Management - Adding and removing travel entries
 * 3. Days Calculation - Computing remaining days that can be traveled
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
      <div id="currentPeriod" style="display: none;">
        <p>Days outside UK (current period): <span id="currentDays">0</span></p>
      </div>
      <div id="fullPeriod">
        <p>Number of days you can travel until your application: <span id="fullPeriodDays">0</span></p>
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
        expect(document.getElementById('fullPeriodDays').textContent).toBe('75'); // 90 - 15 days
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
    it('should add new travel entry and calculate remaining days when addTravel is clicked', () => {
      document.getElementById('startDate').value = '2024-01-01';
      document.getElementById('addTravel').dispatchEvent(new Event('click'));
      
      expect(document.querySelectorAll('.travel-entry')).toHaveLength(1);
      expect(document.getElementById('fullPeriodDays').textContent).toBe('90'); // No days spent yet
    });

    it('should remove travel entry and recalculate remaining days when remove button is clicked', () => {
      // Set up test data
      document.getElementById('startDate').value = '2024-01-01';
      addTravelEntry('2024-02-01', '2024-02-15');
      calculateDays();
      
      expect(document.querySelectorAll('.travel-entry')).toHaveLength(1);
      expect(document.getElementById('fullPeriodDays').textContent).toBe('75'); // 90 - 15 days

      // Remove the travel entry
      document.querySelector('.remove-travel').click();
      
      expect(document.querySelectorAll('.travel-entry')).toHaveLength(0);
      expect(document.getElementById('fullPeriodDays').textContent).toBe('90'); // Back to full 90 days
    });
  });

  describe('Days Calculation', () => {
    it('should show 90 days when no travel dates are added', () => {
      // Set up test data with just a start date
      document.getElementById('startDate').value = '2024-01-01';

      // Trigger calculate
      calculateDays();

      // Check that remaining days is 90 when no travel is recorded
      expect(document.getElementById('fullPeriodDays').textContent).toBe('90');
    });

    it('should calculate remaining days correctly for a single travel period', () => {
      // Set up test data
      document.getElementById('startDate').value = '2024-01-01';
      addTravelEntry('2024-02-01', '2024-02-15');

      // Trigger calculate
      calculateDays();

      // Check remaining days calculation (90 - days spent)
      expect(document.getElementById('fullPeriodDays').textContent).toBe('75');
    });

    it('should calculate remaining days correctly for multiple travel periods', () => {
      // Set up test data
      document.getElementById('startDate').value = '2024-01-01';
      addTravelEntry('2024-02-01', '2024-02-15');
      addTravelEntry('2024-03-01', '2024-03-15');

      // Trigger calculate
      calculateDays();

      // Check remaining days calculation (90 - total days spent)
      expect(document.getElementById('fullPeriodDays').textContent).toBe('60'); // 90 - (15 + 15) days
    });

    it('should not show negative remaining days', () => {
      // Set up test data with more than 90 days of travel
      document.getElementById('startDate').value = '2024-01-01';
      addTravelEntry('2024-02-01', '2024-05-01'); // About 90 days
      addTravelEntry('2024-06-01', '2024-06-15'); // Additional 15 days

      // Trigger calculate
      calculateDays();

      // Check that remaining days doesn't go below 0
      expect(document.getElementById('fullPeriodDays').textContent).toBe('0');
    });
  });
}); 