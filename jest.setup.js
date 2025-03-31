// Mock Chrome storage API
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  }
};

// Set up DOM elements
document.body.innerHTML = `
  <input type="date" id="startDate" />
  <div id="travelDates"></div>
  <button id="addTravel">Add Travel Date</button>
  <button id="calculate">Calculate</button>
  <div id="currentPeriod">
    <p>Days outside UK (Until now): <span id="currentPeriodDays">0</span></p>
  </div>
  <div id="fullPeriod">
    <p>Days outside UK (Until application): <span id="fullPeriodDays">0</span></p>
  </div>
`;

// Mock Date class to return a fixed date
const RealDate = Date;
const mockDate = new RealDate('2024-03-31');

class MockDate extends RealDate {
  constructor(...args) {
    if (args.length === 0) {
      super(mockDate);
      return mockDate;
    }
    return new RealDate(...args);
  }
}

global.Date = MockDate; 