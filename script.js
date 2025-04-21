const apiUrl = "https://script.google.com/macros/s/AKfycbyQdAwRLnQ0MKNB3qdw3kkKPhaHBI7L5--J4HZLXTtdAK27XGHm_-2FKxraYNFH3FqUPg/exec";

const form = document.getElementById("recordForm");
const recordsContainer = document.getElementById("records");
const reportContainer = document.getElementById("report");
const viewToggle = document.getElementById("viewToggle");
const monthFilter = document.getElementById("monthFilter");
const monthlyTotal = document.getElementById("monthlyTotal");

let allData = [];

// 載入資料
async function loadRecords() {
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    allData = data.slice(1); // 去掉表頭
    populateMonthFilter(allData);
    renderCurrentView();
  } catch (error) {
    console.error("讀取失敗：", error);
    recordsContainer.innerHTML = "<p style='color:red;'>無法讀取紀錄，請稍後再試。</p>";
  }
}

// 動態產生月份選單
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

// 顯示紀錄列表
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

// 顯示分類報表
function renderReport() {
  const selectedMonth = monthFilter.value;
  reportContainer.innerHTML = "";
  let total = 0;
  const stats = {};

  allData.forEach(([date, category, amount]) => {
    if (selectedMonth === "all" || date.startsWith(selectedMonth)) {
      stats[category] = (stats[category] || 0) + Number(amount);
      total += Number(amount);
    }
  });

  if (total === 0) {
    reportContainer.innerHTML = "<p>本月無資料</p>";
  } else {
    for (const [category, amount] of Object.entries(stats)) {
      const percent = ((amount / total) * 100).toFixed(1);
      const item = document.createElement("p");
      item.innerHTML = `<strong>${category}</strong>：${amount} 元 (${percent}%)`;
      reportContainer.appendChild(item);
    }
  }

  recordsContainer.style.display = "none";
  reportContainer.style.display = "block";
}

// 根據當前檢視切換內容
function renderCurrentView() {
  if (viewToggle.value === "records") {
    renderRecords();
  } else {
    renderReport();
  }
}

// 表單提交（新增）
form.addEventListener("submit", async function (event) {
  event.preventDefault();

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
    console.error("提交失敗：", error);
    alert("❌ 記帳失敗，請稍後再試！");
  }
});

// 刪除記帳
recordsContainer.addEventListener("click", async (event) => {
  if (event.target.classList.contains("delete-btn")) {
    const index = event.target.getAttribute("data-index");
    if (confirm("確定要刪除這筆紀錄嗎？")) {
      await fetch(`${apiUrl}?index=${index}`, { method: "GET" });
      setTimeout(loadRecords, 1000);
    }
  }
});

// 切換檢視或月份
monthFilter.addEventListener("change", renderCurrentView);
viewToggle.addEventListener("change", renderCurrentView);
window.addEventListener("load", loadRecords);