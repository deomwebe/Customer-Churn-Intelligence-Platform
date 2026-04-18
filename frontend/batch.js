const batchForm = document.getElementById("batch-form");
const csvFileInput = document.getElementById("csv-file");
const batchResultsBody = document.getElementById("batch-results-body");

const batchTotalEl = document.getElementById("batch-total");
const batchHighEl = document.getElementById("batch-high");
const batchMediumEl = document.getElementById("batch-medium");
const batchLowEl = document.getElementById("batch-low");

const downloadResultsBtn = document.getElementById("download-results");

let batchResults = [];

function formatProbability(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function formatPrediction(prediction) {
  return prediction === 1 ? "Likely to Churn" : "Likely to Stay";
}

function updateSummary(data) {
  batchTotalEl.textContent = data.total_records;
  batchHighEl.textContent = data.high_risk_count;
  batchMediumEl.textContent = data.medium_risk_count;
  batchLowEl.textContent = data.low_risk_count;
}

function renderBatchResults(results) {
  if (!results.length) {
    batchResultsBody.innerHTML = `
      <tr>
        <td colspan="8" class="loading-cell">No results found.</td>
      </tr>
    `;
    return;
  }

  batchResultsBody.innerHTML = "";

  results.forEach((row) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${row.Age}</td>
      <td>${row.Gender}</td>
      <td>${row.Tenure}</td>
      <td>${row.Subscription_Type}</td>
      <td>${Number(row.Total_Spend).toFixed(2)}</td>
      <td>${formatPrediction(row.prediction)}</td>
      <td>${formatProbability(row.churn_probability)}</td>
      <td class="${row.risk_level === "High" ? "risk-high" : row.risk_level === "Medium" ? "risk-medium" : "risk-low"}">${row.risk_level}</td>
    `;

    batchResultsBody.appendChild(tr);
  });
}

function downloadCSV(results) {
  if (!results.length) return;

  const headers = [
    "Age",
    "Gender",
    "Tenure",
    "Usage_Frequency",
    "Support_Calls",
    "Payment_Delay",
    "Subscription_Type",
    "Contract_Length",
    "Total_Spend",
    "Last_Interaction",
    "prediction",
    "churn_probability",
    "risk_level"
  ];

  const rows = results.map((row) =>
    headers.map((header) => row[header])
  );

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "batch_prediction_results.csv";
  link.click();

  URL.revokeObjectURL(url);
}

batchForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const file = csvFileInput.files[0];

  if (!file) {
    alert("Please select a CSV file.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  batchResultsBody.innerHTML = `
    <tr>
      <td colspan="8" class="loading-cell">Processing batch prediction...</td>
    </tr>
  `;

  try {
    const response = await fetch("/predict-batch", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Batch prediction failed.");
    }

    batchResults = data.results;
    updateSummary(data);
    renderBatchResults(data.results);
  } catch (error) {
    console.error("Batch prediction error:", error);
    batchResultsBody.innerHTML = `
      <tr>
        <td colspan="8" class="loading-cell">${error.message}</td>
      </tr>
    `;
  }
});

downloadResultsBtn.addEventListener("click", function () {
  downloadCSV(batchResults);
});