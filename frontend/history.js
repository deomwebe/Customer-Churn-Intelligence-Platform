const tableBody = document.getElementById("history-table-body");

function formatPrediction(prediction) {
  return prediction === 1 ? "Likely to Churn" : "Likely to Stay";
}

function formatProbability(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

function riskClass(riskLevel) {
  if (riskLevel === "High") return "risk-high";
  if (riskLevel === "Medium") return "risk-medium";
  return "risk-low";
}

async function loadPredictionHistory() {
  try {
    const response = await fetch("/predictions");

    if (!response.ok) {
      throw new Error(`Server error ${response.status}`);
    }

    const records = await response.json();

    if (!records.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="10" class="loading-cell">No prediction history found yet.</td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = "";

    records.forEach((record) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${record.id}</td>
        <td>${record.Age}</td>
        <td>${record.Gender}</td>
        <td>${record.Tenure}</td>
        <td>${record.Subscription_Type}</td>
        <td>${Number(record.Total_Spend).toFixed(2)}</td>
        <td>${formatPrediction(record.prediction)}</td>
        <td>${formatProbability(record.churn_probability)}</td>
        <td class="${riskClass(record.risk_level)}">${record.risk_level}</td>
        <td>${formatDate(record.created_at)}</td>
      `;

      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading history:", error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="10" class="loading-cell">Failed to load prediction history.</td>
      </tr>
    `;
  }
}

loadPredictionHistory();