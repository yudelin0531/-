const apiUrl = "https://script.google.com/a/macros/stu.tcssh.tc.edu.tw/s/AKfycbwU5a6D85U6DOoP-CHRcnybTCcuMEVv2M_T-zRDCQwp-vKmUBKm3AIJELOiRXm3nQ0Ezw/exec";

const form = document.getElementById("recordForm");
const recordsContainer = document.getElementById("records");

// 讀取 Google Sheets 的記帳紀錄並顯示
async function loadRecords() {
    try {
        const response = await fetch(apiUrl); // GET
        const data = await response.json();

        recordsContainer.innerHTML = "";

        for (let i = 1; i < data.length; i++) {
            const [date, category, amount, note] = data[i];
            const rowIndex = i + 1; // 第幾列（因為資料從第 2 列開始）

            const recordElement = document.createElement("div");
            recordElement.classList.add("record");
            recordElement.innerHTML = `
                <p><strong>日期：</strong>${date}</p>
                <p><strong>類別：</strong>${category}</p>
                <p><strong>金額：</strong>${amount}</p>
                <p><strong>備註：</strong>${note}</p>
                <button class="delete-btn" data-index="${rowIndex}">刪除</button>
            `;
            recordsContainer.appendChild(recordElement);
        }
    } catch (error) {
        console.error("讀取紀錄時發生錯誤：", error);
    }
}

// 新增記帳資料
form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const date = document.getElementById("date").value;
    const category = document.getElementById("category").value;
    const amount = Number(document.getElementById("amount").value);
    const note = document.getElementById("note").value;

    const newRecord = { date, category, amount, note };

    await fetch(apiUrl, {
        method: "POST",
        body: JSON.stringify(newRecord),
        headers: { "Content-Type": "application/json" },
        mode: "no-cors"
    });

    form.reset();
    alert("記帳成功！（請到 Google Sheets 查看資料）");
    setTimeout(loadRecords, 2000);
});

// 刪除功能
recordsContainer.addEventListener("click", async (event) => {
    if (event.target.classList.contains("delete-btn")) {
        const index = event.target.getAttribute("data-index");

        if (confirm("確定要刪除這筆紀錄嗎？")) {
            await fetch(`${apiUrl}?index=${index}`, {
                method: "GET", // 呼叫 Apps Script 的 doDelete
                mode: "no-cors"
            });

            setTimeout(loadRecords, 1000);
        }
    }
});

window.addEventListener("load", loadRecords);