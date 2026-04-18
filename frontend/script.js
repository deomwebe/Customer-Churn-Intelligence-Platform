const form = document.getElementById("prediction-form");
const predictionEl = document.getElementById("prediction");
const probabilityEl = document.getElementById("probability");
const riskLevelEl = document.getElementById("risk-level");
const submitButton = document.querySelector(".predict-btn");
const probabilityBar = document.getElementById("probability-bar");
const topDriversEl = document.getElementById("top-drivers");
const recommendationEl = document.getElementById("recommendation");
const themeToggle = document.getElementById("theme-toggle");

const API_URL = "/predict";

let probabilityChartInstance = null;
let driversChartInstance = null;

function setLoadingState(isLoading) {
  if (isLoading) {
    submitButton.disabled = true;
    submitButton.textContent = "Predicting...";
    predictionEl.textContent = "Processing...";
    probabilityEl.textContent = "Processing...";
    riskLevelEl.textContent = "Processing...";
    riskLevelEl.className = "";

    if (probabilityBar) {
      probabilityBar.style.width = "0%";
    }

    if (topDriversEl) {
      topDriversEl.innerHTML = "<li>Generating explanation...</li>";
    }

    if (recommendationEl) {
      recommendationEl.textContent = "Generating recommendation...";
    }
  } else {
    submitButton.disabled = false;
    submitButton.textContent = "Predict Churn";
  }
}

function validateForm(payload) {
  for (const key in payload) {
    if (
      payload[key] === "" ||
      payload[key] === null ||
      Number.isNaN(payload[key])
    ) {
      return "Please fill all fields correctly.";
    }
  }

  if (payload.Age < 1 || payload.Age > 120) return "Age must be between 1 and 120.";
  if (payload.Tenure < 0) return "Tenure cannot be negative.";
  if (payload.Usage_Frequency < 0) return "Usage Frequency cannot be negative.";
  if (payload.Support_Calls < 0) return "Support Calls cannot be negative.";
  if (payload.Payment_Delay < 0) return "Payment Delay cannot be negative.";
  if (payload.Total_Spend < 0) return "Total Spend cannot be negative.";
  if (payload.Last_Interaction < 0) return "Last Interaction cannot be negative.";

  return null;
}

function formatProbability(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function applyRiskStyle(riskLevel) {
  riskLevelEl.className = "";

  if (riskLevel === "High") {
    riskLevelEl.classList.add("risk-high");
  } else if (riskLevel === "Medium") {
    riskLevelEl.classList.add("risk-medium");
  } else if (riskLevel === "Low") {
    riskLevelEl.classList.add("risk-low");
  }
}

function resetResults() {
  predictionEl.textContent = "-";
  probabilityEl.textContent = "-";
  riskLevelEl.textContent = "-";
  riskLevelEl.className = "";

  if (probabilityBar) {
    probabilityBar.style.width = "0%";
  }

  if (topDriversEl) {
    topDriversEl.innerHTML = "<li>No explanation yet.</li>";
  }

  if (recommendationEl) {
    recommendationEl.textContent = "No recommendation yet.";
  }

  resetCharts();
}

function renderTopDrivers(drivers) {
  if (!topDriversEl) return;

  if (!drivers || !drivers.length) {
    topDriversEl.innerHTML = "<li>No explanation available.</li>";
    return;
  }

  topDriversEl.innerHTML = drivers
    .map((driver) => {
      const directionText =
        driver.direction === "increases"
          ? "increases churn risk"
          : "reduces churn risk";

      return `<li><strong>${driver.feature}</strong> — ${directionText}</li>`;
    })
    .join("");
}

function resetCharts() {
  if (probabilityChartInstance) {
    probabilityChartInstance.destroy();
    probabilityChartInstance = null;
  }

  if (driversChartInstance) {
    driversChartInstance.destroy();
    driversChartInstance = null;
  }
}

function renderProbabilityChart(probability) {
  const canvas = document.getElementById("probabilityChart");
  if (!canvas) return;

  if (probabilityChartInstance) {
    probabilityChartInstance.destroy();
  }

  probabilityChartInstance = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Churn Risk", "Remaining"],
      datasets: [
        {
          data: [probability * 100, 100 - probability * 100],
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      },
      cutout: "70%"
    }
  });
}

function renderDriversChart(drivers) {
  const canvas = document.getElementById("driversChart");
  if (!canvas || !drivers || !drivers.length) return;

  if (driversChartInstance) {
    driversChartInstance.destroy();
  }

  driversChartInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels: drivers.map((d) => d.feature),
      datasets: [
        {
          label: "Impact",
          data: drivers.map((d) => Math.abs(d.impact)),
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    if (themeToggle) themeToggle.textContent = "☀️ Light Mode";
  }
}

if (themeToggle) {
  themeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");

    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
  });
}

applySavedTheme();

form.addEventListener("reset", function () {
  resetResults();
});

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const payload = {
    Age: Number(document.getElementById("age").value),
    Gender: document.getElementById("gender").value,
    Tenure: Number(document.getElementById("tenure").value),
    Usage_Frequency: Number(document.getElementById("usage_frequency").value),
    Support_Calls: Number(document.getElementById("support_calls").value),
    Payment_Delay: Number(document.getElementById("payment_delay").value),
    Subscription_Type: document.getElementById("subscription_type").value,
    Contract_Length: document.getElementById("contract_length").value,
    Total_Spend: Number(document.getElementById("total_spend").value),
    Last_Interaction: Number(document.getElementById("last_interaction").value)
  };

  const validationError = validateForm(payload);

  if (validationError) {
    predictionEl.textContent = "Invalid input";
    probabilityEl.textContent = validationError;
    riskLevelEl.textContent = "-";
    riskLevelEl.className = "";

    if (probabilityBar) {
      probabilityBar.style.width = "0%";
    }

    if (topDriversEl) {
      topDriversEl.innerHTML = "<li>Please fix the form input first.</li>";
    }

    if (recommendationEl) {
      recommendationEl.textContent = "Recommendation unavailable until the input is valid.";
    }

    resetCharts();
    return;
  }

  setLoadingState(true);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const contentType = response.headers.get("content-type");
    let responseData;

    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      throw new Error(
        typeof responseData === "string"
          ? `Server error ${response.status}: ${responseData}`
          : `Server error ${response.status}: ${JSON.stringify(responseData)}`
      );
    }

    predictionEl.textContent =
      responseData.prediction === 1 ? "Likely to Churn" : "Likely to Stay";

    probabilityEl.textContent = formatProbability(responseData.churn_probability);

    riskLevelEl.textContent = responseData.risk_level;
    applyRiskStyle(responseData.risk_level);

    if (probabilityBar) {
      probabilityBar.style.width = `${(responseData.churn_probability * 100).toFixed(2)}%`;
    }

    renderTopDrivers(responseData.top_drivers);

    if (recommendationEl) {
      recommendationEl.textContent =
        responseData.recommendation || "No recommendation available.";
    }

    renderProbabilityChart(responseData.churn_probability);
    renderDriversChart(responseData.top_drivers);
  } catch (error) {
    console.error("Prediction error:", error);
    predictionEl.textContent = "Request failed";
    probabilityEl.textContent = error.message;
    riskLevelEl.textContent = "Check backend";
    riskLevelEl.className = "";

    if (probabilityBar) {
      probabilityBar.style.width = "0%";
    }

    if (topDriversEl) {
      topDriversEl.innerHTML = "<li>Could not load explanation.</li>";
    }

    if (recommendationEl) {
      recommendationEl.textContent = "Could not generate recommendation.";
    }

    resetCharts();
  } finally {
    setLoadingState(false);
  }
});