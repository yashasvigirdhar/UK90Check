/**
 * Shared test utilities for UK90Check extension tests
 */

const setupTestDOM = () => {
  document.body.innerHTML = `
    <div class="container">
      <div class="extension-header">
        <img src="icons/icon48.png" alt="UK90Check" class="extension-icon">
        <div class="extension-title">UK90Check</div>
      </div>

      <div class="eligibility-container">
        <div class="eligibility-info">
          <div class="eligibility-label eligible">You can apply for UK citizenship on</div>
          <div class="eligibility-value" id="eligibilityDate">-</div>
          <div class="help-text" id="helpText">
            <span class="help-message"></span>
          </div>
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

      <div class="section-container">
        <div class="input-group">
          <div class="section-heading">When did you receive your Indefinite Leave to Remain (ILR) OR Settled Status?</div>
          <div class="section-subheading">This is the date after which your 12-month countdown begins.</div>
          <input type="date" id="startDate" required>
        </div>
      </div>

      <div class="section-container">
        <div class="input-group">
          <div class="section-heading">Travel Dates Outside the UK</div>
          <div class="section-subheading">Add your departure and arrival dates for each trip.</div>
          <div class="section-subheading" style="color: #e67e22;">Note: Only full days between departure and arrival count towards your 90-day limit.</div>
          <button id="addTravel">Add Travel Date</button>
          <div id="travelDates"></div>
        </div>
      </div>

      <div class="reference-link">
        <a href="https://www.gov.uk/apply-citizenship-indefinite-leave-to-remain" target="_blank">Read more about UK citizenship requirements on GOV.UK</a>
      </div>

      <div class="donation-container">
        <div class="donation-content">
          <div class="donation-header">
            <img src="icons/heart-icon.svg" alt="Heart" class="donation-icon">
            <span class="donation-title">Support UK90Check</span>
          </div>
          <div class="donation-message">If this extension has helped you, consider supporting its development with any amount, even small contributions help!</div>
          <div class="donation-buttons">
            <a href="https://www.buymeacoffee.com/uSoY8yLkKu" target="_blank" class="bmc-button">
              <img src="icons/coffee-icon.svg" alt="Coffee" class="donation-icon-small">
              <span>Buy me a coffee</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add styles for testing
  const style = document.createElement('style');
  style.textContent = `
    .donation-container {
      background-color: rgb(248, 249, 250);
      border-radius: 8px;
      padding: 15px;
      margin: 10px 0;
      border: 2px solid rgb(233, 236, 239);
    }

    .donation-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .donation-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .donation-icon {
      width: 24px;
      height: 24px;
    }

    .donation-title {
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
      text-align: center;
    }

    .donation-message {
      font-size: 14px;
      color: #666;
      text-align: center;
    }

    .donation-buttons {
      display: flex;
      justify-content: center;
      gap: 10px;
    }

    .bmc-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background-color: rgb(64, 220, 165);
      color: rgb(255, 255, 255);
      border: 2px solid rgb(0, 0, 0);
      border-radius: 4px;
      font-size: 16px;
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .bmc-button:hover {
      transform: translateY(-2px);
      box-shadow: rgba(0, 0, 0, 0.1) 0px 2px 4px;
    }

    .donation-icon-small {
      width: 24px;
      height: 24px;
    }
  `;
  document.head.appendChild(style);
};

module.exports = {
  setupTestDOM
}; 