const totalPredictionsEl = document.getElementById("total-predictions");
const avgProbabilityEl = document.getElementById("avg-probability");
const highRiskCountEl = document.getElementById("high-risk-count");
const lowRiskCountEl = document.getElementById("low-risk-count");

let riskChartInstance = null;
let subscriptionChartInstance = null;

function formatProbability(value) {
  return `${(value * 100).toFixed(2)}%`;
}

async function loadAnalytics() {
  try {
    const response = await fetch("/predictions");

    if (!response.ok) {
      throw new Error(`Server error ${response.status}`);
    }

    const records = await response.json();

    renderStats(records);
    renderCharts(records);
  } catch (error) {
    console.error("Analytics load error:", error);

    totalPredictionsEl.textContent = "Error";
    avgProbabilityEl.textContent = "Error";
    highRiskCountEl.textContent = "Error";
    lowRiskCountEl.textContent = "Error";
  }
}

function renderStats(records) {
  const total = records.length;

  const avgProbability =
    total > 0
      ? records.reduce((sum, record) => sum + record.churn_probability, 0) / total
      : 0;

  const highRiskCount = records.filter(record => record.risk_level === "High").length;
  const lowRiskCount = records.filter(record => record.risk_level === "Low").length;

  totalPredictionsEl.textContent = total;
  avgProbabilityEl.textContent = formatProbability(avgProbability);
  highRiskCountEl.textContent = highRiskCount;
  lowRiskCountEl.textContent = lowRiskCount;
}

function renderCharts(records) {
  const riskCounts = {
    High: 0,
    Medium: 0,
    Low: 0
  };

  const subscriptionCounts = {};

  records.forEach(record => {
    if (riskCounts[record.risk_level] !== undefined) {
      riskCounts[record.risk_level]++;
    }

    const subscription = record.Subscription_Type || "Unknown";
    subscriptionCounts[subscription] = (subscriptionCounts[subscription] || 0) + 1;
  });

  const riskCtx = document.getElementById("riskChart").getContext("2d");
  const subscriptionCtx = document.getElementById("subscriptionChart").getContext("2d");

  if (riskChartInstance) {
    riskChartInstance.destroy();
  }

  if (subscriptionChartInstance) {
    subscriptionChartInstance.destroy();
  }

  riskChartInstance = new Chart(riskCtx, {
    type: "bar",
    data: {
      labels: ["High", "Medium", "Low"],
      datasets: [
        {
          label: "Customers",
          data: [riskCounts.High, riskCounts.Medium, riskCounts.Low],
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

  subscriptionChartInstance = new Chart(subscriptionCtx, {
    type: "doughnut",
    data: {
      labels: Object.keys(subscriptionCounts),
      datasets: [
        {
          data: Object.values(subscriptionCounts),
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
      }
    }
  });
}

loadAnalytics();