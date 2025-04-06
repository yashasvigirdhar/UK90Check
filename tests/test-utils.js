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
};

module.exports = {
  setupTestDOM
}; 