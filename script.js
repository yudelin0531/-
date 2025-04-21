const apiUrl = "https://script.google.com/macros/s/AKfycbyQdAwRLnQ0MKNB3qdw3kkKPhaHBI7L5--J4HZLXTtdAK27XGHm_-2FKxraYNFH3FqUPg/exec";

const form = document.getElementById("recordForm");
const recordsContainer = document.getElementById("records");
const reportContainer = document.getElementById("report");
const viewToggle = document.getElementById("viewToggle");
const monthFilter = document.getElementById("monthFilter");
const monthlyTotal = document.getElementById("monthlyTotal");

let allData = [];
let chart;

// 載入資料
async function loadRecords() {
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    allData = data.slice(1);
    populateMonthFilter(allData);
    renderCurrentView();
  } catch (error) {
    console.error("讀取失敗：", error);
    recordsContainer.innerHTML = "<p style='color:red;'>無法讀取紀錄</p>";
  }
}

// 動態月份篩選器
function populateMonthFilter(data) {
  const months = new Set();
  data.forEach(([date]) => {
    const month = date?.slice(0, 7);
    if (month) months.add(month);
  });

  monthFilter.innerHTML = `<option value="all">全部</option>`;
  [...months].sort().forEach(month => {
    const option = document.createElement("option");
    option.value = month;
    option.textContent = month;
    monthFilter.appendChild(option);
  });
}

// 顯示紀錄
function renderRecords() {
  const selectedMonth = monthFilter.value;
  recordsContainer.innerHTML = "";
  let total = 0;

  allData.forEach(([date, category, amount, note], i) => {
    if (selectedMonth === "all" || date.startsWith(selectedMonth)) {
      const rowIndex = i + 2;

      const item = document.createElement("div");
      item.classList.add("record");
      item.innerHTML = `
        <p><strong>日期：</strong>${date}</p>
        <p><strong>類別：</strong>${category}</p>
        <p><strong>金額：</strong>${amount}</p>
        <p><strong>備註：</strong>${note}</p>
        <button class="delete-btn" data-index="${rowIndex}">刪除</button>
      `;
      recordsContainer.appendChild(item);
      total += Number(amount);
    }
  });

  monthlyTotal.textContent = `總支出：${total} 元`;
  recordsContainer.style.display = "block";
  reportContainer.style.display = "none";
}

// 顯示報表
function renderReport() {
  const selectedMonth = monthFilter.value;
  const ctx = document.getElementById("reportChart").getContext("2d");

  const stats = {};
  let total = 0;

  allData.forEach(([date, category, amount]) => {
    if (selectedMonth === "all" || date.startsWith(selectedMonth)) {
      stats[category] = (stats[category] || 0) + Number(amount);
      total += Number(amount);
    }
  });

  const labels = Object.keys(stats);
  const values = Object.values(stats);
  const percentages = values.map(v => ((v / total) * 100).toFixed(1));

  if (chart) chart.destroy();
  if (total === 0) {
    ctx.font = "16px Arial";
    ctx.fillText("本月無支出資料", 100, 100);
  } else {
    chart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: labels.map((cat, i) => `${cat} (${percentages[i]}%)`),
        datasets: [{
          data: values,
          backgroundColor: [
            "#FF6384", "#36A2EB", "#FFCE56", "#AA65D2", "#4CAF50", "#FF8A65"
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.label}: ${ctx.parsed} 元`
            }
          }
        }
      }
    });
  }

  recordsContainer.style.display = "none";
  reportContainer.style.display = "block";
}

// 表單提交
form.addEventListener("submit", async e => {
  e.preventDefault();
  const date = document.getElementById("date").value;
  const category = document.getElementById("category").value;
  const amount = Number(document.getElementById("amount").value);
  const note = document.getElementById("note").value;

  const newRecord = { date, category, amount, note };

  try {
    await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRecord),
      mode: "no-cors"
    });
    setTimeout(loadRecords, 1000);
  } catch (error) {
    alert("❌ 提交失敗");
  }
});

// 刪除紀錄
recordsContainer.addEventListener("click", async (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const index = e.target.getAttribute("data-index");
    if (confirm("確定要刪除這筆紀錄嗎？")) {
      await fetch(`${apiUrl}?index=${index}`, { method: "GET" });
      setTimeout(loadRecords, 1000);
    }
  }
});

// 切換檢視模式與月份篩選
viewToggle.addEventListener("change", renderCurrentView);
monthFilter.addEventListener("change", renderCurrentView);
window.addEventListener("load", loadRecords);

function renderCurrentView() {
  viewToggle.value === "records" ? renderRecords() : renderReport();
}