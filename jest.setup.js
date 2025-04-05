// Mock Chrome storage API
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  }
};

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