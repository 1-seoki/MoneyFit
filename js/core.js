const STORAGE_KEY = "ssak3FinanceInsightFinalData";

  let appData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
    users: {},
    lastUser: ""
  };

  let currentUser = appData.lastUser || "";
  let currentMonth = "";
  let calendarMonth = "";
  let calendarView = "expense";

  let basicInfo = {
    month: "",
    income: 0,
    availableInvestment: 0,
    budgetGoal: 0
  };

  let expenses = [];
  let investments = [];
  let editingInvestmentId = null;

  let expenseChart = null;
  let targetStatusChart = null;
  let incomeChart = null;
  let monthlyChart = null;

  init();

  function initDarkMode() {
    const isDark = localStorage.getItem("ssak3DarkMode") === "true";

    if (isDark) {
      document.body.classList.add("dark-mode");
    }
  }

  function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("ssak3DarkMode", document.body.classList.contains("dark-mode"));
  }

  function init() {
    initDarkMode();

    const today = new Date();
    const defaultMonth = today.toISOString().slice(0, 7);

    document.getElementById("targetMonth").value = defaultMonth;
    setReportDateToToday();

    if (currentUser && appData.users[currentUser]) {
      document.getElementById("userNameInput").value = currentUser;
      loadUser(currentUser, defaultMonth);
      showApp();
    } else {
      showUserGate();
      resetDashboard();
      drawAllEmptyCharts();
    }
  }

  function showTab(tabId) {
    const tabs = ["calendarTab", "resultTab", "reportTab", "historyTab"];
    const buttons = ["calendarTabBtn", "resultTabBtn", "reportTabBtn", "historyTabBtn"];

    tabs.forEach(id => {
      document.getElementById(id).style.display = "none";
    });

    buttons.forEach(id => {
      document.getElementById(id).classList.remove("active");
    });

    document.getElementById(tabId).style.display = "block";
    document.getElementById(tabId + "Btn").classList.add("active");

    if (tabId === "calendarTab") {
      renderCalendar();
    }

    if (tabId === "historyTab") {
      renderHoldingsBoard();
      renderRealizedBoard();
      renderHistory();
    }

  }

  function saveStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  }

  function showApp() {
    document.getElementById("userGate").style.display = "none";
    document.getElementById("appContainer").style.display = "block";
    updateAppUserBar();
    showTab("calendarTab");
  }

  function showUserGate() {
    document.getElementById("userGate").style.display = "block";
    document.getElementById("appContainer").style.display = "none";
    renderCurrentUser();
    renderUserList();
  }

  function changeUser() {
    currentUser = "";
    currentMonth = "";
    appData.lastUser = "";
    saveStorage();

    basicInfo = {
      month: "",
      income: 0,
      availableInvestment: 0,
      budgetGoal: 0
    };

    expenses = [];
    investments = [];

    document.getElementById("userNameInput").value = "";
    document.getElementById("appCurrentUserName").innerText = "선택 안 됨";

    showUserGate();
  }

  function updateAppUserBar() {
    const appName = document.getElementById("appCurrentUserName");

    if (appName) {
      appName.innerText = currentUser || "선택 안 됨";
    }
  }

  function selectUser() {
    const name = document.getElementById("userNameInput").value.trim();

    if (!name) {
      alert("사용자 이름을 입력해주세요.");
      return;
    }

    if (!appData.users[name]) {
      appData.users[name] = {
        months: {}
      };
    }

    appData.lastUser = name;
    currentUser = name;

    saveStorage();

    const month = document.getElementById("targetMonth").value || new Date().toISOString().slice(0, 7);
    loadUser(currentUser, month);

    alert(`${currentUser} 사용자로 시작합니다.`);
    showApp();
  }

  function loadUser(userName, month) {
    currentUser = userName;
    appData.lastUser = userName;
    saveStorage();

    document.getElementById("userNameInput").value = userName;
    document.getElementById("targetMonth").value = month;

    loadMonth(month);
    renderCurrentUser();
    renderUserList();
    updateAppUserBar();
  }

  function renderCurrentUser() {
    const box = document.getElementById("currentUserBox");

    if (!currentUser) {
      box.innerHTML = `<div class="empty-text">현재 선택된 사용자가 없습니다.</div>`;
      return;
    }

    box.innerHTML = `
      <div class="item">
        <span>현재 사용자: <strong>${currentUser}</strong></span>
      </div>
    `;
  }

  function showUserList() {
    renderUserList();
  }

  function renderUserList() {
    const box = document.getElementById("userListBox");
    const users = Object.keys(appData.users || {});

    if (users.length === 0) {
      box.innerHTML = `<div class="empty-text">저장된 사용자가 없습니다.</div>`;
      return;
    }

    box.innerHTML = users.map(user => `
      <div class="item">
        <span>${user}</span>
        <button onclick="loadUser('${user}', document.getElementById('targetMonth').value || new Date().toISOString().slice(0, 7))">선택</button>
      </div>
    `).join("");
  }

  function ensureUserSelected() {
    if (!currentUser) {
      alert("먼저 사용자 이름을 입력하고 시작해주세요.");
      showUserGate();
      return false;
    }

    return true;
  }

  function loadSelectedMonth() {
    if (!ensureUserSelected()) return;

    const month = document.getElementById("targetMonth").value;
    loadMonth(month);
  }

  function changeDate(inputId, diff) {
    const input = document.getElementById(inputId);
    const currentValue = input.value || new Date().toISOString().slice(0, 10);
    const date = new Date(currentValue);

    date.setDate(date.getDate() + diff);

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    input.value = `${yyyy}-${mm}-${dd}`;
  }

  function getTodayDateString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
  }

  function setReportDateToToday() {
    const reportDate = document.getElementById("reportDate");

    if (reportDate) {
      reportDate.value = getTodayDateString();
    }
  }


  function loadMonth(month) {
    if (!ensureUserSelected()) return;

    currentMonth = month;
    calendarMonth = month;

    const user = appData.users[currentUser];

    if (!user.months[month]) {
      user.months[month] = {
        basicInfo: {
          month,
          income: 0,
          availableInvestment: 0,
          budgetGoal: 0
        },
        expenses: [],
        investments: [],
        summary: null
      };

      saveStorage();
    }

    basicInfo = user.months[month].basicInfo;
    expenses = user.months[month].expenses || [];
    investments = user.months[month].investments || [];

    document.getElementById("monthlyIncome").value = basicInfo.income || "";
    document.getElementById("availableInvestment").value = basicInfo.availableInvestment || "";
    document.getElementById("budgetGoal").value = basicInfo.budgetGoal || "";

    document.getElementById("expenseDate").value = `${month}-01`;
    document.getElementById("buyDate").value = `${month}-01`;
    const todayDate = getTodayDateString();
    const todayMonth = todayDate.slice(0, 7);
    document.getElementById("reportDate").value = month === todayMonth ? todayDate : `${month}-01`;

    renderBasicInfo();
    renderLists();
    renderHistory();
    renderCalendar();

    if (user.months[month].summary) {
      applySummaryToDashboard(user.months[month].summary);
    } else {
      resetDashboard();
    }
  }

  function saveCurrentMonthData() {
    if (!currentUser || !currentMonth) return;

    const previousMonthData = appData.users[currentUser].months[currentMonth] || {};
    appData.users[currentUser].months[currentMonth] = {
      ...previousMonthData,
      basicInfo,
      expenses,
      investments,
      summary: previousMonthData.summary || null,
      dateNotes: previousMonthData.dateNotes || {}
    };

    saveStorage();
    renderHistory();
    drawMonthlyChart();
  }

  function saveBasicInfo() {
    if (!ensureUserSelected()) return;

    const month = document.getElementById("targetMonth").value;
    const income = Number(document.getElementById("monthlyIncome").value);
    const availableInvestment = Number(document.getElementById("availableInvestment").value);
    const budgetGoal = Number(document.getElementById("budgetGoal").value);

    if (!month || income <= 0) {
      alert("분석할 월과 월 수입을 올바르게 입력해주세요.");
      return;
    }

    if (month !== currentMonth) {
      loadMonth(month);
    }

    basicInfo = {
      month,
      income,
      availableInvestment: availableInvestment >= 0 ? availableInvestment : 0,
      budgetGoal: budgetGoal >= 0 ? budgetGoal : 0
    };

    appData.users[currentUser].months[month].basicInfo = basicInfo;
    saveCurrentMonthData();
    renderBasicInfo();
    resetDashboard();

    alert("기본정보가 저장되었습니다.");
  }

  function renderBasicInfo() {
    const box = document.getElementById("basicInfoBox");

    if (!basicInfo.month || basicInfo.income <= 0) {
      box.innerHTML = `<div class="empty-text">분석할 월, 수입, 투자 가능 금액, 목표를 입력해주세요.</div>`;
      return;
    }

    box.innerHTML = `
      <div class="item"><span>분석 월: ${basicInfo.month}</span></div>
      <div class="item"><span>월 수입: ${formatMoney(basicInfo.income)}</span></div>
      <div class="item"><span>투자 가능 금액: ${formatMoney(basicInfo.availableInvestment)}</span></div>
      <div class="item"><span>목표 소비 한도: ${formatMoney(basicInfo.budgetGoal)}</span></div>
    `;
  }

  function addExpense() {
    if (!ensureUserSelected()) return;

    const date = document.getElementById("expenseDate").value;
    const category = document.getElementById("expenseCategory").value;
    const amount = Number(document.getElementById("expenseAmount").value);

    if (!date || amount <= 0) {
      alert("날짜와 금액을 올바르게 입력해주세요.");
      return;
    }

    const expenseMonth = date.slice(0, 7);

    if (expenseMonth !== currentMonth) {
      alert(`현재 선택된 월은 ${currentMonth}입니다.\n${expenseMonth} 소비를 입력하려면 기본정보에서 해당 월로 변경해주세요.`);
      return;
    }

    expenses.push({
      id: Date.now(),
      date,
      category,
      amount
    });

    document.getElementById("expenseDate").value = "";
    document.getElementById("expenseAmount").value = "";

    appData.users[currentUser].months[currentMonth].summary = null;
    saveCurrentMonthData();
    renderLists();
    resetDashboard();
  }

  function saveInvestment() {
    if (!ensureUserSelected()) return;

    const buyDate = document.getElementById("buyDate").value;
    const name = document.getElementById("stockName").value.trim();
    const buyPrice = Number(document.getElementById("buyPrice").value);
    const quantity = Number(document.getElementById("quantity").value);
    const currentPrice = Number(document.getElementById("currentPrice")?.value || buyPrice);
    const targetReturnRate = Number(document.getElementById("targetReturnRate").value);
    const stopLossRate = Number(document.getElementById("stopLossRate").value);
    const memo = document.getElementById("investmentMemo").value.trim();

    if (!buyDate || !name || buyPrice <= 0 || quantity <= 0) {
      alert("매수일, 종목명, 매수가, 수량을 올바르게 입력해주세요.");
      return;
    }

    const buyMonth = buyDate.slice(0, 7);

    if (buyMonth !== currentMonth) {
      alert(`현재 선택된 월은 ${currentMonth}입니다.\n${buyMonth} 투자 내역을 입력하려면 기본정보에서 해당 월로 변경해주세요.`);
      return;
    }

    const investmentAmount = buyPrice * quantity;
    const evaluationAmount = currentPrice * quantity;
    const profitLoss = evaluationAmount - investmentAmount;
    const returnRate = investmentAmount === 0 ? 0 : (profitLoss / investmentAmount) * 100;

    const oldData = editingInvestmentId
      ? investments.find(item => item.id === editingInvestmentId)
      : null;

    const investmentData = {
      id: editingInvestmentId || Date.now(),
      buyDate,
      name,
      buyPrice,
      quantity,
      currentPrice,
      targetReturnRate,
      stopLossRate,
      memo,
      type: "주식",
      investmentAmount,
      evaluationAmount,
      profitLoss,
      returnRate,
      sellDate: oldData?.sellDate || "",
      sellPrice: oldData?.sellPrice || 0,
      sellAmount: oldData?.sellAmount || 0,
      realizedProfitLoss: oldData?.realizedProfitLoss || 0,
      realizedReturnRate: oldData?.realizedReturnRate || 0,
      isSold: oldData?.isSold || false
    };

    if (editingInvestmentId) {
      investments = investments.map(item =>
        item.id === editingInvestmentId ? investmentData : item
      );
    } else {
      investments.push(investmentData);
    }

    clearInvestmentInputs();
    cancelInvestmentEdit(false);

    appData.users[currentUser].months[currentMonth].summary = null;
    saveCurrentMonthData();
    renderLists();
    renderRealizedBoard();
    resetDashboard();
  }


  function editInvestment(id) {
    const target = investments.find(item => item.id === id);

    if (!target) {
      alert("수정할 투자 내역을 찾을 수 없습니다.");
      return;
    }

    editingInvestmentId = id;

    document.getElementById("buyDate").value = target.buyDate;
    document.getElementById("stockName").value = target.name;
    document.getElementById("buyPrice").value = target.buyPrice;
    document.getElementById("quantity").value = target.quantity;
    document.getElementById("currentPrice").value = target.currentPrice;
    document.getElementById("targetReturnRate").value = target.targetReturnRate || "";
    document.getElementById("stopLossRate").value = target.stopLossRate || "";
    document.getElementById("investmentMemo").value = target.memo || "";

    document.getElementById("investmentSubmitBtn").innerText = "수정 완료";
    document.getElementById("investmentCancelBtn").style.display = "inline-block";

    showTab("calendarTab");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }


  function cancelInvestmentEdit(shouldClear = true) {
    editingInvestmentId = null;

    document.getElementById("investmentSubmitBtn").innerText = "추가";
    document.getElementById("investmentCancelBtn").style.display = "none";

    if (shouldClear) {
      clearInvestmentInputs();
    }
  }

  function clearInvestmentInputs() {
    document.getElementById("buyDate").value = "";
    document.getElementById("stockName").value = "";
    document.getElementById("buyPrice").value = "";
    document.getElementById("quantity").value = "";
    document.getElementById("currentPrice").value = "";
    document.getElementById("targetReturnRate").value = "";
    document.getElementById("stopLossRate").value = "";
    document.getElementById("investmentMemo").value = "";
  }


  function deleteExpense(id) {
    expenses = expenses.filter(item => item.id !== id);
    appData.users[currentUser].months[currentMonth].summary = null;
    saveCurrentMonthData();
    renderLists();
    resetDashboard();
  }

  function deleteInvestment(id) {
    investments = investments.filter(item => item.id !== id);

    if (editingInvestmentId === id) {
      cancelInvestmentEdit();
    }

    appData.users[currentUser].months[currentMonth].summary = null;
    saveCurrentMonthData();
    renderLists();
    resetDashboard();
  }

  function getTargetStatus(item) {
    const target = Number(item.targetReturnRate || 0);

    if (!target) {
      return {
        text: "목표 미설정",
        className: "status-warning"
      };
    }

    if (item.returnRate >= target) {
      return {
        text: "목표 달성",
        className: "status-success"
      };
    }

    if (item.returnRate >= target * 0.8) {
      return {
        text: "목표 근접",
        className: "status-warning"
      };
    }

    return {
      text: "목표 미달",
      className: "status-danger"
    };
  }

  function getStopLossStatus(item) {
    const stopLoss = Number(item.stopLossRate || 0);

    if (!stopLoss) {
      return "";
    }

    if (item.returnRate <= -Math.abs(stopLoss)) {
      return `<span class="status-badge status-danger">손절 기준 도달</span>`;
    }

    return `<span class="status-badge status-success">손절 기준 미도달</span>`;
  }

  function renderLists() {
    const expenseList = document.getElementById("expenseList");
    const investmentList = document.getElementById("investmentList");

    const sortedExpenses = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
    const sortedInvestments = investments.filter(item => !item.isSold).sort((a, b) => b.buyDate.localeCompare(a.buyDate));

    expenseList.innerHTML = sortedExpenses.length === 0
      ? `<div class="empty-text">아직 입력된 소비 내역이 없습니다.</div>`
      : sortedExpenses.map(e => `
        <div class="data-card">
          <div>
            <div class="data-card-main">
              <span class="data-card-date">${e.date}</span>
              ${e.category}
            </div>
            <div class="data-card-sub">
              소비 금액: ${formatMoney(e.amount)}
            </div>
          </div>
          <button onclick="deleteExpense(${e.id})">삭제</button>
        </div>
      `).join("");

    investmentList.innerHTML = sortedInvestments.length === 0
      ? `<div class="empty-text">아직 입력된 투자 내역이 없습니다.</div>`
      : sortedInvestments.map(i => {
        const profitClass = i.profitLoss >= 0 ? "profit" : "loss";
        const realizedClass = i.realizedProfitLoss >= 0 ? "profit" : "loss";
        const targetText = i.targetReturnRate ? `목표수익률 ${i.targetReturnRate}%` : "목표수익률 미설정";
        const targetStatus = getTargetStatus(i);
        const stopLossStatus = getStopLossStatus(i);
        const memoText = i.memo ? `<div class="memo-box">메모: ${i.memo}</div>` : "";
        const stopLossText = i.stopLossRate ? ` | 손절 기준 ${i.stopLossRate}%` : "";
        const sellArea = i.isSold
          ? `
            <div class="data-card-sub">
              매도일 ${i.sellDate} |
              매도가 ${formatMoney(i.sellPrice)} |
              실현손익:
              <span class="${realizedClass}">
                ${formatMoney(i.realizedProfitLoss)} (${i.realizedReturnRate.toFixed(2)}%)
              </span>
            </div>
          `
          : `
            <div class="input-row" style="margin-top:8px;">
              <input type="date" id="sellDate-${i.id}">
              <input type="number" id="sellPrice-${i.id}" placeholder="매도가">
              <button class="sub-btn" onclick="sellInvestment(${i.id})">매도 처리</button>
            </div>
          `;

        return `
          <div class="data-card">
            <div>
              <div class="data-card-main">
                <span class="data-card-date">${i.buyDate}</span>
                ${i.name} <span class="badge">주식</span>
                ${i.isSold ? '<span class="badge">매도완료</span>' : '<span class="badge">보유중</span>'}
              </div>
              <div class="data-card-sub">
                매수가 ${formatMoney(i.buyPrice)} × ${i.quantity}주 |
                매수원금 ${formatMoney(i.investmentAmount)} |
                ${targetText}${stopLossText}
                <span class="status-badge ${targetStatus.className}">${targetStatus.text}</span>
                ${stopLossStatus}
              </div>
              ${memoText}
              <div class="data-card-sub">
                손익:
                <span class="${profitClass}">
                  ${formatMoney(i.profitLoss)} (${i.returnRate.toFixed(2)}%)
                </span>
              </div>
              ${sellArea}
            </div>
            <div style="display:flex; gap:6px;">
              <button class="sub-btn" onclick="editInvestment(${i.id})">수정</button>
              <button onclick="deleteInvestment(${i.id})">삭제</button>
            </div>
          </div>
        `;
      }).join("");

    renderRealizedBoard();
    renderHoldingsBoard();
    renderCalendar();
  }


  function sellInvestment(id) {
    const target = investments.find(item => item.id === id);

    if (!target) {
      alert("매도 처리할 투자 내역을 찾을 수 없습니다.");
      return;
    }

    const sellDate = document.getElementById(`sellDate-${id}`).value;
    const sellPrice = Number(document.getElementById(`sellPrice-${id}`).value);

    if (!sellDate || sellPrice <= 0) {
      alert("매도일과 매도가를 올바르게 입력해주세요.");
      return;
    }

    const sellMonth = sellDate.slice(0, 7);

    if (sellMonth !== currentMonth) {
      alert(`현재 선택된 월은 ${currentMonth}입니다.\n${sellMonth} 매도 내역을 입력하려면 기본정보에서 해당 월로 변경해주세요.`);
      return;
    }

    const sellAmount = sellPrice * target.quantity;
    const realizedProfitLoss = sellAmount - target.investmentAmount;
    const realizedReturnRate = target.investmentAmount === 0
      ? 0
      : (realizedProfitLoss / target.investmentAmount) * 100;

    investments = investments.map(item => {
      if (item.id !== id) return item;

      return {
        ...item,
        sellDate,
        sellPrice,
        sellAmount,
        realizedProfitLoss,
        realizedReturnRate,
        isSold: true
      };
    });

    appData.users[currentUser].months[currentMonth].summary = null;
    saveCurrentMonthData();
    renderLists();
    renderRealizedBoard();
    resetDashboard();
  }

  function renderRealizedBoard() {
    const list = document.getElementById("realizedList");

    if (!list) return;

    const soldItems = investments.filter(item => item.isSold);

    const realizedBuyTotal = soldItems.reduce((sum, item) => sum + item.investmentAmount, 0);
    const realizedSellTotal = soldItems.reduce((sum, item) => sum + item.sellAmount, 0);
    const realizedProfitTotal = realizedSellTotal - realizedBuyTotal;
    const realizedReturnRate = realizedBuyTotal === 0
      ? 0
      : (realizedProfitTotal / realizedBuyTotal) * 100;

    document.getElementById("realizedBuyTotal").innerText = formatMoney(realizedBuyTotal);
    document.getElementById("realizedSellTotal").innerText = formatMoney(realizedSellTotal);
    document.getElementById("realizedProfitTotal").innerText = formatMoney(realizedProfitTotal);
    document.getElementById("realizedReturnRate").innerText = realizedReturnRate.toFixed(2) + "%";

    list.innerHTML = soldItems.length === 0
      ? `<div class="empty-text">아직 매도 완료된 종목이 없습니다.</div>`
      : soldItems
        .sort((a, b) => b.sellDate.localeCompare(a.sellDate))
        .map(item => {
          const cls = item.realizedProfitLoss >= 0 ? "profit" : "loss";

          return `
            <div class="data-card">
              <div>
                <div class="data-card-main">
                  ${item.name} <span class="badge">매도완료</span>
                </div>
                <div class="data-card-sub">
                  매수일 ${item.buyDate} | 매수가 ${formatMoney(item.buyPrice)} × ${item.quantity}주
                </div>
                <div class="data-card-sub">
                  매도일 ${item.sellDate} | 매도가 ${formatMoney(item.sellPrice)}
                </div>
                <div class="data-card-sub">
                  실현손익:
                  <span class="${cls}">
                    ${formatMoney(item.realizedProfitLoss)} (${item.realizedReturnRate.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          `;
        }).join("");
  }

  function analyzeFinance() {
    if (!ensureUserSelected()) return;

    if (!basicInfo.month || basicInfo.income <= 0) {
      alert("먼저 기본정보에서 분석 월과 월 수입을 저장해주세요.");
      return;
    }

    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalInvestment = investments.reduce((sum, i) => sum + i.investmentAmount, 0);
    const totalEvaluation = investments.reduce((sum, i) => sum + i.evaluationAmount, 0);
    const totalProfitLoss = totalEvaluation - totalInvestment;

    const avgReturnRate = totalInvestment === 0
      ? 0
      : (totalProfitLoss / totalInvestment) * 100;

    const lossCount = investments.filter(i => !i.isSold && i.profitLoss < 0).length;

    const soldInvestments = investments.filter(i => i.isSold);
    const realizedBuyTotal = soldInvestments.reduce((sum, i) => sum + i.investmentAmount, 0);
    const realizedSellTotal = soldInvestments.reduce((sum, i) => sum + i.sellAmount, 0);
    const realizedProfitTotal = realizedSellTotal - realizedBuyTotal;
    const realizedReturnRate = realizedBuyTotal === 0 ? 0 : (realizedProfitTotal / realizedBuyTotal) * 100;

    const expenseByCategory = groupByAmount(expenses, "category", "amount");
    const investmentByType = groupByAmount(investments, "type", "investmentAmount");

    const income = basicInfo.income;
    const availableInvestment = basicInfo.availableInvestment;
    const budgetGoal = basicInfo.budgetGoal;

    const expenseRatio = income === 0 ? 0 : (totalExpense / income) * 100;
    const investRatio = income === 0 ? 0 : (totalInvestment / income) * 100;
    const availableUseRatio = availableInvestment === 0 ? 0 : (totalInvestment / availableInvestment) * 100;
    const remainingInvestment = availableInvestment - totalInvestment;

    const budgetGoalRatio = budgetGoal === 0 ? 0 : (totalExpense / budgetGoal) * 100;
    const budgetOverAmount = totalExpense - budgetGoal;

    const risk = calculateRisk(
      totalExpense,
      totalInvestment,
      avgReturnRate,
      investmentByType,
      expenseRatio,
      availableUseRatio,
      lossCount,
      budgetGoalRatio
    );

    const report = generateAIReport(
      totalExpense,
      totalInvestment,
      totalEvaluation,
      totalProfitLoss,
      avgReturnRate,
      lossCount,
      expenseByCategory,
      investmentByType,
      risk,
      expenseRatio,
      investRatio,
      availableUseRatio,
      remainingInvestment,
      budgetGoalRatio,
      budgetOverAmount,
      realizedBuyTotal,
      realizedSellTotal,
      realizedProfitTotal,
      realizedReturnRate
    );

    const summary = {
      income,
      totalExpense,
      totalInvestment,
      totalEvaluation,
      totalProfitLoss,
      avgReturnRate,
      lossCount,
      expenseRatio,
      investRatio,
      availableUseRatio,
      remainingInvestment,
      budgetGoalRatio,
      budgetOverAmount,
      realizedBuyTotal,
      realizedSellTotal,
      realizedProfitTotal,
      realizedReturnRate,
      risk,
      expenseByCategory,
      investmentByType,
      report
    };

    appData.users[currentUser].months[currentMonth].summary = summary;
    saveCurrentMonthData();
    applySummaryToDashboard(summary);
    renderRealizedBoard();
    showTab("resultTab");
  }


  function renderWarningPanel(summary) {
    const panel = document.getElementById("warningPanel");
    const summaryBox = document.getElementById("warningSummary");
    const expenseText = document.getElementById("riskExpenseText");
    const investmentText = document.getElementById("riskInvestmentText");
    const profitText = document.getElementById("riskProfitText");

    if (!panel) return;

    if (!summary) {
      panel.innerHTML = `<div class="warning-card safe">분석 후 위험 신호가 표시됩니다.</div>`;

      if (summaryBox) summaryBox.innerText = "위험 신호 요약은 분석 후 표시됩니다.";
      if (expenseText) expenseText.innerText = "분석 전";
      if (investmentText) investmentText.innerText = "분석 전";
      if (profitText) profitText.innerText = "분석 전";
      return;
    }

    const warnings = [];

    if (summary.expenseRatio >= 80) {
      warnings.push({
        level: "danger",
        title: "소비율 매우 높음",
        message: `월 수입 대비 소비율이 ${summary.expenseRatio.toFixed(1)}%입니다. 단기 현금흐름 관리가 필요합니다.`
      });
    } else if (summary.expenseRatio >= 65) {
      warnings.push({
        level: "warning",
        title: "소비율 주의",
        message: `월 수입 대비 소비율이 ${summary.expenseRatio.toFixed(1)}%입니다. 예산 점검이 필요합니다.`
      });
    }

    if (summary.budgetGoalRatio >= 120) {
      warnings.push({
        level: "danger",
        title: "소비 목표 크게 초과",
        message: `목표 소비 한도 대비 ${summary.budgetGoalRatio.toFixed(1)}%를 사용했습니다.`
      });
    } else if (summary.budgetGoalRatio >= 100) {
      warnings.push({
        level: "warning",
        title: "소비 목표 초과",
        message: "목표 소비 한도를 초과했습니다. 다음 달 예산 조정이 필요합니다."
      });
    }

    if (summary.availableUseRatio > 100) {
      warnings.push({
        level: "danger",
        title: "투자 가능 금액 초과",
        message: `투자 가능 금액을 ${formatMoney(Math.abs(summary.remainingInvestment))} 초과했습니다.`
      });
    } else if (summary.availableUseRatio >= 90) {
      warnings.push({
        level: "warning",
        title: "투자 여력 부족",
        message: `투자 가능 금액 사용률이 ${summary.availableUseRatio.toFixed(1)}%입니다.`
      });
    }

    if (summary.lossCount >= 2) {
      warnings.push({
        level: "warning",
        title: "손실 종목 증가",
        message: `손실 구간 종목이 ${summary.lossCount}개입니다. 종목별 손절 기준과 보유 이유 점검이 필요합니다.`
      });
    }

    if (summary.avgReturnRate <= -10) {
      warnings.push({
        level: "danger",
        title: "평균 손익률 위험",
        message: `평균 손익률이 ${summary.avgReturnRate.toFixed(2)}%입니다. 손실 관리가 필요합니다.`
      });
    } else if (summary.avgReturnRate < 0) {
      warnings.push({
        level: "warning",
        title: "평균 손익률 마이너스",
        message: `평균 손익률이 ${summary.avgReturnRate.toFixed(2)}%입니다. 포지션 점검이 필요합니다.`
      });
    }

    const targetReached = investments.filter(item => item.targetReturnRate && item.returnRate >= item.targetReturnRate).length;

    if (targetReached > 0) {
      warnings.push({
        level: "safe",
        title: "목표수익률 달성",
        message: `${targetReached}개 종목이 목표수익률을 달성했습니다. 수익 실현 기준을 점검해보세요.`
      });
    }

    const stopLossReached = investments.filter(item =>
      item.stopLossRate && item.returnRate <= -Math.abs(item.stopLossRate)
    ).length;

    if (stopLossReached > 0) {
      warnings.push({
        level: "danger",
        title: "손절 기준 도달",
        message: `${stopLossReached}개 종목이 손절 기준에 도달했습니다. 대응 기준을 확인하세요.`
      });
    }

    const soldLossCount = investments.filter(item => item.isSold && item.realizedProfitLoss < 0).length;

    if (soldLossCount > 0) {
      warnings.push({
        level: "warning",
        title: "실현 손실 발생",
        message: `매도 완료 종목 중 ${soldLossCount}개에서 실현 손실이 발생했습니다. 매도 기준을 복기해보세요.`
      });
    }

    if (warnings.length === 0) {
      panel.innerHTML = `<div class="warning-card safe">현재 주요 위험 신호는 감지되지 않았습니다.</div>`;
    } else {
      panel.innerHTML = warnings.map(item => `
        <div class="warning-card ${item.level}">
          <strong>${item.title}</strong><br>
          ${item.message}
        </div>
      `).join("");
    }

    if (summaryBox) {
      const dangerCount = warnings.filter(item => item.level === "danger").length;
      const warningCount = warnings.filter(item => item.level === "warning").length;
      const safeCount = warnings.filter(item => item.level === "safe").length;

      summaryBox.innerText = warnings.length === 0
        ? "현재 소비율, 투자 사용률, 손익률 기준에서 큰 위험 신호는 없습니다."
        : `위험 신호 요약: 고위험 ${dangerCount}개, 주의 ${warningCount}개, 긍정 신호 ${safeCount}개가 감지되었습니다.`;
    }

    if (expenseText) {
      expenseText.innerText = summary.expenseRatio >= 65
        ? `소비율 ${summary.expenseRatio.toFixed(1)}%로 관리 필요`
        : `소비율 ${summary.expenseRatio.toFixed(1)}%로 안정권`;
    }

    if (investmentText) {
      investmentText.innerText = summary.availableUseRatio > 100
        ? `투자 가능 금액 ${Math.abs(summary.remainingInvestment).toLocaleString("ko-KR")}원 초과`
        : `투자 여력 ${formatMoney(summary.remainingInvestment)} 남음`;
    }

    if (profitText) {
      profitText.innerText = summary.avgReturnRate < 0
        ? `평균 손익률 ${summary.avgReturnRate.toFixed(2)}%로 점검 필요`
        : `평균 손익률 ${summary.avgReturnRate.toFixed(2)}%`;
    }
  }

  function getCategoryTrendText() {
    if (!currentUser || !basicInfo.month || !appData.users[currentUser]) {
      return "- 소비 패턴 변화 분석을 위한 데이터가 부족합니다.\n";
    }

    const months = Object.keys(appData.users[currentUser].months).sort();
    const currentIndex = months.indexOf(basicInfo.month);

    if (currentIndex <= 0) {
      return "- 이전 월 데이터가 없어 소비 패턴 변화 분석은 제한적입니다.\n";
    }

    const previousMonth = months[currentIndex - 1];
    const previousExpenses = appData.users[currentUser].months[previousMonth].expenses || [];

    const currentMap = groupByAmount(expenses, "category", "amount");
    const previousMap = groupByAmount(previousExpenses, "category", "amount");
    const categories = Array.from(new Set([...Object.keys(currentMap), ...Object.keys(previousMap)]));

    if (categories.length === 0) {
      return "- 비교할 소비 카테고리 데이터가 부족합니다.\n";
    }

    let lines = "";

    categories.forEach(category => {
      const currentValue = currentMap[category] || 0;
      const previousValue = previousMap[category] || 0;

      if (previousValue === 0 && currentValue > 0) {
        lines += `- ${category}: 이전 달에는 없었지만 이번 달 ${formatMoney(currentValue)} 소비가 발생했습니다.\n`;
      } else if (previousValue > 0) {
        const changeRate = ((currentValue - previousValue) / previousValue) * 100;

        if (Math.abs(changeRate) >= 20) {
          lines += `- ${category}: 이전 달 대비 ${changeRate > 0 ? "+" : ""}${changeRate.toFixed(1)}% 변화했습니다.\n`;
        }
      }
    });

    return lines || "- 큰 폭으로 변화한 소비 카테고리는 감지되지 않았습니다.\n";
  }

  function calculateAdvancedInsights(summary) {
    const activeInvestments = investments.filter(item => !item.isSold);
    const soldInvestments = investments.filter(item => item.isSold);

    const tradeCount = investments.length;
    const soldCount = soldInvestments.length;
    const lossActiveCount = activeInvestments.filter(item => item.profitLoss < 0).length;
    const stopLossReached = activeInvestments.filter(item =>
      item.stopLossRate && item.returnRate <= -Math.abs(item.stopLossRate)
    ).length;
    const targetReached = activeInvestments.filter(item =>
      item.targetReturnRate && item.returnRate >= item.targetReturnRate
    ).length;

    const spendingScore = Math.max(0, Math.min(100,
      100
      - Math.max(0, summary.expenseRatio - 40) * 1.2
      - Math.max(0, summary.budgetGoalRatio - 100) * 0.4
    ));

    const investmentScore = Math.max(0, Math.min(100,
      75
      + (summary.avgReturnRate > 0 ? 10 : 0)
      - (summary.avgReturnRate < -5 ? 15 : 0)
      - lossActiveCount * 5
      + targetReached * 3
    ));

    const riskManageScore = Math.max(0, Math.min(100,
      100
      - Math.max(0, summary.availableUseRatio - 80) * 0.7
      - stopLossReached * 12
      - lossActiveCount * 5
    ));

    const habitScore = Math.round((spendingScore * 0.4) + (investmentScore * 0.3) + (riskManageScore * 0.3));

    let investorType = "균형형";

    if (summary.investRatio >= 60 || tradeCount >= 5 || summary.availableUseRatio >= 90) {
      investorType = "공격형";
    } else if (summary.investRatio <= 20 && summary.expenseRatio <= 50 && summary.availableUseRatio <= 50) {
      investorType = "안정형";
    } else if (lossActiveCount >= 2 || stopLossReached >= 1) {
      investorType = "리스크 관리 필요형";
    }

    let oneLine = "";

    if (summary.expenseRatio >= 70) {
      oneLine = "소비 비중이 높아 투자보다 현금흐름 관리가 먼저 필요한 상태입니다.";
    } else if (summary.avgReturnRate < -5) {
      oneLine = "투자 손실 구간이므로 추가 매수보다 손절 기준과 보유 이유 점검이 우선입니다.";
    } else if (targetReached > 0) {
      oneLine = "일부 종목이 목표수익률에 도달했으므로 수익 실현 기준을 점검할 시점입니다.";
    } else if (summary.availableUseRatio >= 90) {
      oneLine = "투자 가능 금액 대부분을 사용했으므로 추가 투자 여력 관리가 필요합니다.";
    } else {
      oneLine = "현재 소비와 투자 구조는 비교적 안정적이며 월별 추이를 꾸준히 확인하는 것이 좋습니다.";
    }

    return {
      habitScore: Math.round(habitScore),
      spendingScore: Math.round(spendingScore),
      investmentScore: Math.round(investmentScore),
      riskManageScore: Math.round(riskManageScore),
      investorType,
      oneLine,
      targetReached,
      stopLossReached,
      lossActiveCount,
      soldCount
    };
  }

  function renderAdvancedInsights(summary) {
    const insights = calculateAdvancedInsights(summary);

    document.getElementById("habitScore").innerText = insights.habitScore + "점";
    document.getElementById("investorType").innerText = insights.investorType;
    document.getElementById("spendingScore").innerText = insights.spendingScore + "점";
    document.getElementById("riskManageScore").innerText = insights.riskManageScore + "점";

    document.getElementById("oneLineComment").innerText = "AI 한줄 코멘트: " + insights.oneLine;
  }

  function resetAdvancedInsights() {
    document.getElementById("habitScore").innerText = "0점";
    document.getElementById("investorType").innerText = "분석 전";
    document.getElementById("spendingScore").innerText = "0점";
    document.getElementById("riskManageScore").innerText = "0점";
    document.getElementById("oneLineComment").innerText = "AI 한줄 코멘트가 여기에 표시됩니다.";
  }

  function renderInvestmentCalendar() {
    const box = document.getElementById("investmentCalendar");

    if (!box) return;

    const events = [];

    investments.forEach(item => {
      events.push({
        date: item.buyDate,
        text: `매수 | ${item.name} | ${formatMoney(item.investmentAmount)}`
      });

      if (item.isSold) {
        events.push({
          date: item.sellDate,
          text: `매도 | ${item.name} | 실현손익 ${formatMoney(item.realizedProfitLoss)} (${item.realizedReturnRate.toFixed(2)}%)`
        });
      }
    });

    if (events.length === 0) {
      box.innerHTML = `<div class="empty-text">투자 달력에 표시할 매수/매도 기록이 없습니다.</div>`;
      return;
    }

    const grouped = {};

    events.forEach(event => {
      if (!grouped[event.date]) {
        grouped[event.date] = [];
      }

      grouped[event.date].push(event.text);
    });

    const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    box.innerHTML = dates.map(date => `
      <div class="calendar-day">
        <div class="calendar-date">${date}</div>
        ${grouped[date].map(text => `<div class="calendar-event">• ${text}</div>`).join("")}
      </div>
    `).join("");
  }

  function renderGoalDetails(summary) {
    const goalStatusText = document.getElementById("goalStatusText");
    const goalAvailableUseRatio = document.getElementById("goalAvailableUseRatio");
    const budgetGoalDetail = document.getElementById("budgetGoalDetail");
    const investmentCapacityDetail = document.getElementById("investmentCapacityDetail");
    const targetReturnDetail = document.getElementById("targetReturnDetail");
    const budgetProgressFill = document.getElementById("budgetProgressFill");
    const investmentCapacityFill = document.getElementById("investmentCapacityFill");

    if (!summary) {
      if (goalStatusText) goalStatusText.innerText = "분석 전";
      if (goalAvailableUseRatio) goalAvailableUseRatio.innerText = "0%";
      if (budgetGoalDetail) budgetGoalDetail.innerText = "목표 소비 한도를 입력하면 진행률이 표시됩니다.";
      if (investmentCapacityDetail) investmentCapacityDetail.innerText = "투자 가능 금액과 실제 투자 원금을 비교합니다.";
      if (targetReturnDetail) targetReturnDetail.innerText = "종목별 목표수익률 달성 여부가 표시됩니다.";
      if (budgetProgressFill) budgetProgressFill.style.width = "0%";
      if (investmentCapacityFill) investmentCapacityFill.style.width = "0%";
      return;
    }

    const budgetRatio = summary.budgetGoalRatio || 0;
    const investUseRatio = summary.availableUseRatio || 0;

    if (goalAvailableUseRatio) {
      goalAvailableUseRatio.innerText = investUseRatio.toFixed(1) + "%";
    }

    let status = "양호";

    if (budgetRatio >= 100 || investUseRatio > 100) {
      status = "관리 필요";
    }

    if (budgetRatio >= 120 || investUseRatio >= 120) {
      status = "위험";
    }

    if (goalStatusText) {
      goalStatusText.innerText = status;
    }

    if (budgetGoalDetail) {
      if (!basicInfo.budgetGoal) {
        budgetGoalDetail.innerText = "목표 소비 한도가 설정되지 않았습니다.";
      } else if (summary.budgetOverAmount > 0) {
        budgetGoalDetail.innerText = `목표보다 ${formatMoney(summary.budgetOverAmount)} 초과했습니다.`;
      } else {
        budgetGoalDetail.innerText = `목표보다 ${formatMoney(Math.abs(summary.budgetOverAmount))} 여유가 있습니다.`;
      }
    }

    if (investmentCapacityDetail) {
      if (!basicInfo.availableInvestment) {
        investmentCapacityDetail.innerText = "투자 가능 금액이 설정되지 않았습니다.";
      } else if (summary.remainingInvestment < 0) {
        investmentCapacityDetail.innerText = `투자 가능 금액을 ${formatMoney(Math.abs(summary.remainingInvestment))} 초과했습니다.`;
      } else {
        investmentCapacityDetail.innerText = `투자 가능 금액 중 ${formatMoney(summary.remainingInvestment)}이 남아 있습니다.`;
      }
    }

    const targetSet = investments.filter(item => item.targetReturnRate).length;
    const targetReached = investments.filter(item => item.targetReturnRate && item.returnRate >= item.targetReturnRate).length;
    const targetNear = investments.filter(item => item.targetReturnRate && item.returnRate < item.targetReturnRate && item.returnRate >= item.targetReturnRate * 0.8).length;

    if (targetReturnDetail) {
      if (targetSet === 0) {
        targetReturnDetail.innerText = "목표수익률이 설정된 종목이 없습니다.";
      } else {
        targetReturnDetail.innerText = `목표 설정 ${targetSet}개 / 달성 ${targetReached}개 / 근접 ${targetNear}개`;
      }
    }

    if (budgetProgressFill) {
      const width = Math.min(budgetRatio, 130);
      budgetProgressFill.style.width = width + "%";
      budgetProgressFill.className = "progress-fill";

      if (budgetRatio >= 120) {
        budgetProgressFill.classList.add("danger");
      } else if (budgetRatio >= 100) {
        budgetProgressFill.classList.add("warning");
      }
    }

    if (investmentCapacityFill) {
      const width = Math.min(investUseRatio, 130);
      investmentCapacityFill.style.width = width + "%";
      investmentCapacityFill.className = "progress-fill";

      if (investUseRatio > 100) {
        investmentCapacityFill.classList.add("danger");
      } else if (investUseRatio >= 90) {
        investmentCapacityFill.classList.add("warning");
      }
    }
  }

  function applySummaryToDashboard(summary) {
    document.getElementById("incomeView").innerText = formatMoney(summary.income);
    document.getElementById("totalExpense").innerText = formatMoney(summary.totalExpense);
    document.getElementById("totalInvestment").innerText = formatMoney(summary.totalInvestment);
    document.getElementById("riskScore").innerText = summary.risk.score + "점";

    document.getElementById("totalEvaluation").innerText = formatMoney(summary.totalEvaluation);
    document.getElementById("totalProfitLoss").innerText = formatMoney(summary.totalProfitLoss);
    document.getElementById("avgReturnRate").innerText = summary.avgReturnRate.toFixed(2) + "%";
    document.getElementById("lossCount").innerText = summary.lossCount + "개";

    document.getElementById("budgetGoalRatio").innerText = summary.budgetGoalRatio.toFixed(1) + "%";
    document.getElementById("budgetOverAmount").innerText =
      summary.budgetOverAmount > 0 ? formatMoney(summary.budgetOverAmount) : "0원";

    document.getElementById("expenseRatio").innerText = summary.expenseRatio.toFixed(1) + "%";
    document.getElementById("investmentRatio").innerText = summary.investRatio.toFixed(1) + "%";
    document.getElementById("availableUseRatio").innerText = summary.availableUseRatio.toFixed(1) + "%";
    document.getElementById("remainingInvestment").innerText = formatMoney(summary.remainingInvestment);

    drawExpenseChart(summary.expenseByCategory);
    drawTargetStatusChart();
    drawIncomeChart(
      summary.totalExpense,
      summary.totalInvestment,
      Math.max(summary.income - summary.totalExpense - summary.totalInvestment, 0)
    );
    drawMonthlyChart();

    document.getElementById("aiReport").innerText = summary.report;
    renderWarningPanel(summary);
    renderGoalDetails(summary);
    renderAdvancedInsights(summary);
    renderCalendar();
  }

  function resetDashboard() {
    document.getElementById("incomeView").innerText = formatMoney(basicInfo.income || 0);
    document.getElementById("totalExpense").innerText = "0원";
    document.getElementById("totalInvestment").innerText = "0원";
    document.getElementById("riskScore").innerText = "0점";

    document.getElementById("totalEvaluation").innerText = "0원";
    document.getElementById("totalProfitLoss").innerText = "0원";
    document.getElementById("avgReturnRate").innerText = "0%";
    document.getElementById("lossCount").innerText = "0개";

    document.getElementById("budgetGoalRatio").innerText = "0%";
    document.getElementById("budgetOverAmount").innerText = "0원";
    document.getElementById("expenseRatio").innerText = "0%";
    document.getElementById("investmentRatio").innerText = "0%";
    document.getElementById("availableUseRatio").innerText = "0%";
    document.getElementById("remainingInvestment").innerText = formatMoney(basicInfo.availableInvestment || 0);

    document.getElementById("aiReport").innerText =
      "사용자와 기본정보, 소비 내역, 투자 내역을 입력한 뒤 분석 버튼을 눌러주세요.";

    drawAllEmptyCharts();
    drawMonthlyChart();
    renderRealizedBoard();
    renderWarningPanel(null);
    renderGoalDetails(null);
    resetAdvancedInsights();
    renderCalendar();
  }

  function groupByAmount(data, key, amountKey) {
    const result = {};

    data.forEach(item => {
      if (!result[item[key]]) {
        result[item[key]] = 0;
      }

      result[item[key]] += item[amountKey];
    });

    return result;
  }

  function calculateRisk(totalExpense, totalInvestment, avgReturnRate, investmentByType, expenseRatio, availableUseRatio, lossCount, budgetGoalRatio) {
    let score = 20;

    const stockAmount = investmentByType["주식"] || 0;
    const stockRatio = totalInvestment === 0 ? 0 : (stockAmount / totalInvestment) * 100;

    if (expenseRatio > 70) score += 25;
    else if (expenseRatio > 50) score += 15;

    if (availableUseRatio > 100) score += 25;
    else if (availableUseRatio > 80) score += 15;

    if (stockRatio > 70) score += 20;
    if (avgReturnRate < -10) score += 20;
    else if (avgReturnRate < -5) score += 10;

    if (lossCount >= 2) score += 10;
    if (budgetGoalRatio > 120) score += 10;

    if (score > 100) score = 100;

    let level = "낮음";

    if (score >= 70) {
      level = "높음";
    } else if (score >= 45) {
      level = "보통";
    }

    return {
      score,
      level,
      stockRatio
    };
  }

  function generateAIReport(
    totalExpense,
    totalInvestment,
    totalEvaluation,
    totalProfitLoss,
    avgReturnRate,
    lossCount,
    expenseByCategory,
    investmentByType,
    risk,
    expenseRatio,
    investRatio,
    availableUseRatio,
    remainingInvestment,
    budgetGoalRatio,
    budgetOverAmount,
    realizedBuyTotal,
    realizedSellTotal,
    realizedProfitTotal,
    realizedReturnRate
  ) {
    const topExpense = getTopItem(expenseByCategory);
    const topInvestment = getTopItem(investmentByType);

    const remainCash = basicInfo.income - totalExpense - totalInvestment;
    const remainCashRatio = basicInfo.income === 0 ? 0 : (remainCash / basicInfo.income) * 100;

    const outliers = detectExpenseOutliers();
    const previous = getPreviousMonthSummary();

    const expenseLevel =
      expenseRatio >= 80 ? "매우 높음" :
      expenseRatio >= 60 ? "높음" :
      expenseRatio >= 40 ? "보통" : "낮음";

    const investmentLevel =
      investRatio >= 60 ? "공격적" :
      investRatio >= 35 ? "적극적" :
      investRatio >= 15 ? "보통" : "보수적";

    let report = "";

    report += `[${currentUser}님의 ${basicInfo.month} 종합 금융 분석 리포트]\n\n`;

    report += "1. 수입 대비 현금흐름 분석\n";
    report += `- 월 수입: ${formatMoney(basicInfo.income)}\n`;
    report += `- 총 소비 금액: ${formatMoney(totalExpense)} (${expenseRatio.toFixed(1)}%)\n`;
    report += `- 투자 원금: ${formatMoney(totalInvestment)} (${investRatio.toFixed(1)}%)\n`;
    report += `- 소비와 투자 후 잔여 금액: ${formatMoney(remainCash)} (${remainCashRatio.toFixed(1)}%)\n`;
    report += `- 소비 수준 판단: ${expenseLevel}\n`;
    report += `- 투자 성향 판단: ${investmentLevel}\n\n`;

    if (remainCash < 0) {
      report += "→ 현재 수입보다 소비와 투자 지출이 더 큰 상태입니다. 단기적으로 현금흐름 관리가 필요합니다.\n\n";
    } else if (remainCashRatio < 10) {
      report += "→ 잔여 금액 비율이 낮아 예상치 못한 지출에 대응하기 어려울 수 있습니다.\n\n";
    } else {
      report += "→ 수입 대비 일정 수준의 잔여 금액이 확보되어 있어 기본적인 현금흐름은 유지되고 있습니다.\n\n";
    }

    report += "2. 목표 소비 한도 분석\n";
    report += `- 목표 소비 한도: ${formatMoney(basicInfo.budgetGoal)}\n`;
    report += `- 소비 목표 사용률: ${budgetGoalRatio.toFixed(1)}%\n`;

    if (basicInfo.budgetGoal > 0) {
      if (budgetOverAmount > 0) {
        report += `→ 목표 소비 한도를 ${formatMoney(budgetOverAmount)} 초과했습니다.\n`;
      } else {
        report += `→ 목표 소비 한도보다 ${formatMoney(Math.abs(budgetOverAmount))} 적게 사용했습니다.\n`;
      }
    } else {
      report += "→ 목표 소비 한도가 설정되지 않았습니다.\n";
    }

    report += "\n3. 소비 패턴 및 이상 소비 분석\n";

    if (topExpense) {
      const topExpenseRatio = totalExpense === 0 ? 0 : (topExpense.value / totalExpense) * 100;

      report += `- 최다 소비 카테고리: ${topExpense.name}\n`;
      report += `- 해당 카테고리 소비 금액: ${formatMoney(topExpense.value)}\n`;
      report += `- 전체 소비 대비 비중: ${topExpenseRatio.toFixed(1)}%\n`;

      if (topExpenseRatio >= 50) {
        report += "→ 한 카테고리에 소비가 매우 집중되어 있습니다. 지출 구조가 특정 항목에 치우쳐 있을 가능성이 큽니다.\n";
      } else if (topExpenseRatio >= 35) {
        report += "→ 특정 카테고리 비중이 높은 편입니다. 예산 한도를 정해 관리하면 소비 안정성이 좋아질 수 있습니다.\n";
      } else {
        report += "→ 소비가 비교적 여러 카테고리로 분산되어 있습니다.\n";
      }

      if (outliers.length > 0) {
        report += "\n[이상 소비 감지]\n";
        outliers.forEach(item => {
          report += `- ${item.date} ${item.category} ${formatMoney(item.amount)}: 평균 소비보다 큰 지출로 감지되었습니다.\n`;
        });
      } else {
        report += "- 평균 대비 크게 튀는 이상 소비는 감지되지 않았습니다.\n";
      }

      if (expenseRatio >= 70) {
        report += "→ 전체 소비율도 높은 편이므로 고정비와 변동비를 분리해 줄이는 항목을 찾아야 합니다.\n";
      }
    } else {
      report += "- 입력된 소비 데이터가 없어 소비 패턴 분석을 진행할 수 없습니다.\n";
    }

    report += "\n4. 주식 평가손익 및 리스크 분석\n";

    if (investments.length > 0) {
      report += `- 투자 원금 합계: ${formatMoney(totalInvestment)}\n`;
      report += `- 현재 평가금액 합계: ${formatMoney(totalEvaluation)}\n`;
      report += `- 총 손익: ${formatMoney(totalProfitLoss)}\n`;
      report += `- 평균 평가수익률: ${avgReturnRate.toFixed(2)}%\n`;
      report += `- 보유 중 손실 구간 종목 수: ${lossCount}개\n`;

      const targetReached = investments.filter(item => item.targetReturnRate && item.returnRate >= item.targetReturnRate).length;
      const targetSetCount = investments.filter(item => item.targetReturnRate).length;

      if (targetSetCount > 0) {
        report += `- 목표수익률 설정 종목: ${targetSetCount}개\n`;
        report += `- 목표수익률 도달 종목: ${targetReached}개\n`;
      }

      if (topInvestment) {
        const topInvestmentRatio = totalInvestment === 0 ? 0 : (topInvestment.value / totalInvestment) * 100;
        report += `- 투자 자산 유형: ${topInvestment.name} (${topInvestmentRatio.toFixed(1)}%)\n`;
      }

      if (avgReturnRate <= -10) {
        report += "→ 평균 평가수익률이 -10% 이하로 손실 관리가 필요한 구간입니다. 추가 매수보다는 손절 기준과 회복 가능성을 먼저 점검해야 합니다.\n";
      } else if (avgReturnRate < 0) {
        report += "→ 전체적으로 평가손실 구간입니다. 종목별 매수 근거를 다시 확인할 필요가 있습니다.\n";
      } else if (avgReturnRate >= 10) {
        report += "→ 평가수익률이 양호한 편입니다. 목표수익률 도달 종목은 분할 매도 기준을 검토할 수 있습니다.\n";
      } else {
        report += "→ 투자 성과는 안정 또는 중립 구간입니다. 추가 투자보다는 기존 포지션 관리가 중요합니다.\n";
      }
    } else {
      report += "- 입력된 투자 데이터가 없어 투자 손익 분석을 진행할 수 없습니다.\n";
    }

    report += "\n5. 투자 수익현황 분석\n";
    report += `- 실현 매수금: ${formatMoney(realizedBuyTotal)}\n`;
    report += `- 실현 매도금: ${formatMoney(realizedSellTotal)}\n`;
    report += `- 실현 손익: ${formatMoney(realizedProfitTotal)}\n`;
    report += `- 실현 수익률: ${realizedReturnRate.toFixed(2)}%\n`;

    if (realizedBuyTotal === 0) {
      report += "→ 아직 매도 완료된 종목이 없어 실현손익은 발생하지 않았습니다.\n";
    } else if (realizedProfitTotal > 0) {
      report += "→ 매도 완료 종목 기준으로 실현 수익이 발생했습니다.\n";
    } else if (realizedProfitTotal < 0) {
      report += "→ 매도 완료 종목 기준으로 실현 손실이 발생했습니다. 매도 기준을 점검할 필요가 있습니다.\n";
    } else {
      report += "→ 실현손익은 손익분기 수준입니다.\n";
    }

    report += "\n6. 투자 가능 금액 관리 분석\n";
    report += `- 입력한 투자 가능 금액: ${formatMoney(basicInfo.availableInvestment)}\n`;
    report += `- 실제 투자 원금: ${formatMoney(totalInvestment)}\n`;
    report += `- 투자 가능 금액 사용률: ${availableUseRatio.toFixed(1)}%\n`;

    if (remainingInvestment < 0) {
      report += `→ 투자 가능 금액을 ${formatMoney(Math.abs(remainingInvestment))} 초과했습니다. 계획보다 공격적인 투자가 이루어진 상태입니다.\n`;
    } else if (availableUseRatio >= 90) {
      report += "→ 투자 가능 금액의 대부분을 사용했습니다. 추가 투자 여력은 제한적입니다.\n";
    } else if (availableUseRatio >= 50) {
      report += `→ 아직 ${formatMoney(remainingInvestment)}의 투자 여력이 남아 있습니다. 분할 접근이 가능합니다.\n`;
    } else {
      report += "→ 투자 가능 금액 사용률이 낮아 보수적으로 접근하고 있습니다.\n";
    }

    report += "\n7. 소비 패턴 변화 감지\n";
    report += getCategoryTrendText();

    report += "\n8. 월별 비교 분석\n";

    if (previous) {
      const expenseDiff = totalExpense - previous.totalExpense;
      const investDiff = totalInvestment - previous.totalInvestment;
      const riskDiff = risk.score - previous.riskScore;

      report += `- 비교 대상 월: ${previous.month}\n`;
      report += `- 이전 달 소비 대비 변화: ${formatMoney(expenseDiff)}\n`;
      report += `- 이전 달 투자 원금 대비 변화: ${formatMoney(investDiff)}\n`;
      report += `- 이전 달 위험도 대비 변화: ${riskDiff > 0 ? "+" : ""}${riskDiff}점\n`;

      if (expenseDiff > 0) {
        report += "→ 이전 달보다 소비가 증가했습니다. 증가한 카테고리를 확인할 필요가 있습니다.\n";
      } else if (expenseDiff < 0) {
        report += "→ 이전 달보다 소비가 감소했습니다. 소비 관리가 개선된 흐름입니다.\n";
      } else {
        report += "→ 이전 달과 소비 수준이 비슷합니다.\n";
      }

      if (riskDiff > 0) {
        report += "→ 위험도 점수가 상승해 소비율, 투자 집중도, 손실 종목을 점검해야 합니다.\n";
      } else if (riskDiff < 0) {
        report += "→ 위험도 점수가 낮아져 이전 달보다 안정적인 구조입니다.\n";
      }
    } else {
      report += "- 비교 가능한 이전 달 분석 기록이 없습니다.\n";
    }

    report += "\n9. 종합 위험도 판단\n";
    report += `- 금융 위험도 점수: ${risk.score}점\n`;
    report += `- 위험도 등급: ${risk.level}\n`;

    if (risk.level === "높음") {
      report += "→ 소비율, 투자 사용률, 손실 종목, 자산 집중도 중 하나 이상에서 위험 신호가 나타났습니다.\n";
    } else if (risk.level === "보통") {
      report += "→ 현재 구조는 관리 가능한 수준이지만 월별 추적과 기준 설정이 필요합니다.\n";
    } else {
      report += "→ 현재 소비와 투자 구조는 비교적 안정적인 편입니다.\n";
    }

    const advancedInsights = calculateAdvancedInsights({
      totalInvestment,
      expenseRatio,
      investRatio,
      availableUseRatio,
      remainingInvestment,
      budgetGoalRatio,
      avgReturnRate,
      risk,
      lossCount
    });

    report += "\n10. 투자 성향 및 금융 습관 점수\n";
    report += `- 투자 성향: ${advancedInsights.investorType}\n`;
    report += `- 금융 습관 점수: ${advancedInsights.habitScore}점\n`;
    report += `- 소비 관리 점수: ${advancedInsights.spendingScore}점\n`;
    report += `- 리스크 관리 점수: ${advancedInsights.riskManageScore}점\n`;
    report += `- AI 한줄 코멘트: ${advancedInsights.oneLine}\n`;

    report += "\n11. 다음 달 개선 전략\n";
    report += "- 소비는 가장 큰 카테고리부터 예산 한도를 설정하는 것이 좋습니다.\n";
    report += "- 주식 투자 전에는 투자 가능 금액, 분할 매수 비율, 목표수익률, 손절 기준을 먼저 정하는 것이 좋습니다.\n";
    report += "- 목표수익률에 도달한 종목은 분할 매도 또는 수익 실현 기준을 검토하는 것이 좋습니다.\n";
    report += "- 손실 종목은 추가 매수 여부보다 최초 매수 근거가 유지되는지 먼저 확인해야 합니다.\n";
    report += "- 금융 히스토리을 비교하여 소비율, 투자율, 위험도 점수의 변화를 확인하는 것이 중요합니다.\n";

    return report;
  }


  function detectExpenseOutliers() {
    if (!expenses || expenses.length < 3) {
      return [];
    }

    const total = expenses.reduce((sum, item) => sum + item.amount, 0);
    const average = total / expenses.length;

    return expenses.filter(item => item.amount >= average * 2 && item.amount >= 50000);
  }

  function getPreviousMonthSummary() {
    if (!currentUser || !basicInfo.month || !appData.users[currentUser]) {
      return null;
    }

    const months = Object.keys(appData.users[currentUser].months).sort();
    const currentIndex = months.indexOf(basicInfo.month);

    if (currentIndex <= 0) {
      return null;
    }

    for (let i = currentIndex - 1; i >= 0; i--) {
      const previousMonth = months[i];
      const previousData = appData.users[currentUser].months[previousMonth];

      if (previousData && previousData.summary) {
        return {
          month: previousMonth,
          totalExpense: previousData.summary.totalExpense || 0,
          totalInvestment: previousData.summary.totalInvestment || 0,
          riskScore: previousData.summary.risk ? previousData.summary.risk.score : 0
        };
      }
    }

    return null;
  }

  function renderHistory() {
    const box = document.getElementById("historyList");

    if (!currentUser || !appData.users[currentUser]) {
      box.innerHTML = `<div class="empty-text">현재 선택된 사용자가 없습니다.</div>`;
      return;
    }

    const months = Object.keys(appData.users[currentUser].months).sort().reverse();

    if (months.length === 0) {
      box.innerHTML = `<div class="empty-text">아직 저장된 월별 분석 기록이 없습니다.</div>`;
      return;
    }

    box.innerHTML = months.map(month => {
      const data = appData.users[currentUser].months[month];
      const monthExpenses = data.expenses || [];
      const monthInvestments = data.investments || [];
      const expenseTotal = monthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const investTotal = monthInvestments.reduce((sum, i) => sum + Number(i.investmentAmount || 0), 0);
      const evaluationTotal = monthInvestments.reduce((sum, i) => sum + Number(i.evaluationAmount || 0), 0);
      const profitLoss = evaluationTotal - investTotal;
      const realizedProfit = monthInvestments.filter(i => i.isSold).reduce((sum, i) => sum + Number(i.realizedProfitLoss || 0), 0);
      const summary = data.summary;
      const openAttr = month === currentMonth ? "open" : "";

      return `
        <div class="history-card">
          <details ${openAttr}>
            <summary>
              <div class="history-summary-line">
                <h3 style="margin:0;">${month}</h3>
                <div class="history-mini-value">소비<strong>${formatMoney(expenseTotal)}</strong></div>
                <div class="history-mini-value">투자<strong>${formatMoney(investTotal)}</strong></div>
                <div class="history-mini-value">실현손익<strong class="${realizedProfit >= 0 ? "profit" : "loss"}">${formatMoney(realizedProfit)}</strong></div>
                <span class="badge">상세 보기</span>
              </div>
            </summary>
            <div class="history-detail-body">
              <p><strong>수입:</strong> ${formatMoney(data.basicInfo.income || 0)}</p>
              <p><strong>평가 손익:</strong> <span class="${profitLoss >= 0 ? "profit" : "loss"}">${formatMoney(profitLoss)}</span></p>
              <p><strong>위험도:</strong> ${summary ? summary.risk.score + "점 (" + summary.risk.level + ")" : "분석 전"}</p>
              <p><strong>소비 건수:</strong> ${monthExpenses.length}건 / <strong>투자 기록:</strong> ${monthInvestments.length}건</p>
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button onclick="selectHistoryMonth('${month}')">이 달 불러오기</button>
                <button class="danger-btn" onclick="deleteMonthData('${month}')">이 달 삭제</button>
              </div>
            </div>
          </details>
        </div>
      `;
    }).join("");
  }

  function selectHistoryMonth(month) {
    document.getElementById("targetMonth").value = month;
    loadMonth(month);
    showTab("calendarTab");
  }

  function deleteMonthData(month) {
    if (!ensureUserSelected()) return;

    if (!confirm(`${currentUser} 사용자의 ${month} 데이터를 삭제할까요?`)) {
      return;
    }

    delete appData.users[currentUser].months[month];

    const months = Object.keys(appData.users[currentUser].months).sort();

    if (currentMonth === month) {
      if (months.length > 0) {
        const nextMonth = months[months.length - 1];
        document.getElementById("targetMonth").value = nextMonth;
        loadMonth(nextMonth);
      } else {
        const defaultMonth = new Date().toISOString().slice(0, 7);
        document.getElementById("targetMonth").value = defaultMonth;

        currentMonth = defaultMonth;
        basicInfo = {
          month: defaultMonth,
          income: 0,
          availableInvestment: 0,
          budgetGoal: 0
        };
        expenses = [];
        investments = [];

        appData.users[currentUser].months[defaultMonth] = {
          basicInfo,
          expenses: [],
          investments: [],
          summary: null
        };

        renderBasicInfo();
        renderLists();
        resetDashboard();
      }
    }

    saveStorage();
    renderHistory();
    drawMonthlyChart();

    alert(`${month} 데이터가 삭제되었습니다.`);
  }

  function clearCurrentUserData() {
    if (!ensureUserSelected()) return;

    if (!confirm(`${currentUser} 사용자의 모든 월별 데이터를 삭제할까요?`)) return;

    delete appData.users[currentUser];
    appData.lastUser = "";
    currentUser = "";
    currentMonth = "";
    basicInfo = { month: "", income: 0, availableInvestment: 0, budgetGoal: 0 };
    expenses = [];
    investments = [];

    saveStorage();

    document.getElementById("userNameInput").value = "";
    document.getElementById("monthlyIncome").value = "";
    document.getElementById("availableInvestment").value = "";
    document.getElementById("budgetGoal").value = "";

    renderCurrentUser();
    renderUserList();
    renderBasicInfo();
    renderLists();
    renderHistory();
    resetDashboard();

    alert("현재 사용자 데이터가 삭제되었습니다.");
    showUserGate();
  }

  function getTopItem(obj) {
    const entries = Object.entries(obj);

    if (entries.length === 0) {
      return null;
    }

    entries.sort((a, b) => b[1] - a[1]);

    return {
      name: entries[0][0],
      value: entries[0][1]
    };
  }

  function drawAllEmptyCharts() {
    drawExpenseChart({});
    drawTargetStatusChart();
    drawIncomeChart(0, 0, 0);
    drawMonthlyChart();
  }

  function drawExpenseChart(data) {
    const ctx = document.getElementById("expenseChart");

    if (expenseChart) {
      expenseChart.destroy();
    }

    const labels = Object.keys(data);
    const values = Object.values(data);

    expenseChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels.length ? labels : ["데이터 없음"],
        datasets: [{
          data: values.length ? values : [1]
        }]
      }
    });
  }

  function drawTargetStatusChart() {
    const ctx = document.getElementById("targetStatusChart");

    if (targetStatusChart) {
      targetStatusChart.destroy();
    }

    let achieved = 0;
    let near = 0;
    let missed = 0;
    let unset = 0;

    investments.forEach(item => {
      const target = Number(item.targetReturnRate || 0);

      if (!target) {
        unset++;
      } else if (item.returnRate >= target) {
        achieved++;
      } else if (item.returnRate >= target * 0.8) {
        near++;
      } else {
        missed++;
      }
    });

    const labels = ["목표 달성", "목표 근접", "목표 미달", "목표 미설정"];
    const values = [achieved, near, missed, unset];

    const hasData = values.some(value => value > 0);

    targetStatusChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: hasData ? labels : ["데이터 없음"],
        datasets: [{
          data: hasData ? values : [1]
        }]
      }
    });
  }

  function drawIncomeChart(expense, investment, remain) {
    const ctx = document.getElementById("incomeChart");

    if (incomeChart) {
      incomeChart.destroy();
    }

    incomeChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["소비", "투자 원금", "잔여"],
        datasets: [{
          label: "금액",
          data: [expense, investment, remain]
        }]
      }
    });
  }

  function drawMonthlyChart() {
    const ctx = document.getElementById("monthlyChart");

    if (monthlyChart) {
      monthlyChart.destroy();
    }

    if (!currentUser || !appData.users[currentUser]) {
      monthlyChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: ["데이터 없음"],
          datasets: [
            { label: "소비", data: [0] },
            { label: "투자 원금", data: [0] },
            { label: "평가금액", data: [0] }
          ]
        }
      });
      return;
    }

    const months = Object.keys(appData.users[currentUser].months).sort();

    const expenseData = months.map(month =>
      (appData.users[currentUser].months[month].expenses || []).reduce((sum, e) => sum + e.amount, 0)
    );

    const investmentData = months.map(month =>
      (appData.users[currentUser].months[month].investments || []).reduce((sum, i) => sum + i.investmentAmount, 0)
    );

    const evaluationData = months.map(month =>
      (appData.users[currentUser].months[month].investments || []).reduce((sum, i) => sum + i.evaluationAmount, 0)
    );

    monthlyChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: months.length ? months : ["데이터 없음"],
        datasets: [
          {
            label: "소비",
            data: expenseData.length ? expenseData : [0]
          },
          {
            label: "투자 원금",
            data: investmentData.length ? investmentData : [0]
          },
          {
            label: "평가금액",
            data: evaluationData.length ? evaluationData : [0]
          }
        ]
      }
    });
  }



  function showInputView(type) {
    const views = {
      basic: "basicInputView",
      expense: "expenseInputView",
      investment: "investmentInputView"
    };

    const buttons = {
      basic: "basicInputBtn",
      expense: "expenseInputBtn",
      investment: "investmentInputBtn"
    };

    Object.values(views).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });

    Object.values(buttons).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove("active");
    });

    const targetView = document.getElementById(views[type] || views.basic);
    const targetButton = document.getElementById(buttons[type] || buttons.basic);

    if (targetView) targetView.style.display = "block";
    if (targetButton) targetButton.classList.add("active");
  }

  function showCalendarView(type) {
    calendarView = type;

    const expenseBtn = document.getElementById("expenseCalendarBtn");
    const investmentBtn = document.getElementById("investmentCalendarBtn");

    if (expenseBtn && investmentBtn) {
      expenseBtn.classList.toggle("active", type === "expense");
      investmentBtn.classList.toggle("active", type === "investment");
    }

    renderCalendar();
  }

  function renderCalendar() {
    renderCalendarMonthSummary();
    renderCalendarLegend();

    if (calendarView === "investment") {
      renderInvestmentCalendar();
    } else {
      renderExpenseCalendar();
    }
  }

  function renderCalendarMonthSummary() {
    const box = document.getElementById("calendarMonthSummary");
    if (!box) return;

    if (!currentUser || !appData.users[currentUser]) {
      box.innerHTML = "";
      return;
    }

    const targetMonth = calendarMonth || currentMonth || new Date().toISOString().slice(0, 7);
    const data = appData.users[currentUser].months[targetMonth] || {
      basicInfo: { income: 0, availableInvestment: 0, budgetGoal: 0 },
      expenses: [],
      investments: []
    };

    const monthExpenses = data.expenses || [];
    const monthInvestments = data.investments || [];
    const expenseTotal = monthExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const investmentTotal = monthInvestments.reduce((sum, item) => sum + Number(item.investmentAmount || 0), 0);
    const realizedProfit = monthInvestments
      .filter(item => item.isSold)
      .reduce((sum, item) => sum + Number(item.realizedProfitLoss || 0), 0);
    const available = Number(data.basicInfo?.availableInvestment || 0);
    const remaining = available - investmentTotal;

    box.innerHTML = `
      <div class="calendar-summary-card"><span>이번 달 소비 총액</span><strong>${formatMoney(expenseTotal)}</strong></div>
      <div class="calendar-summary-card"><span>이번 달 투자 원금</span><strong>${formatMoney(investmentTotal)}</strong></div>
      <div class="calendar-summary-card"><span>매도 실현손익</span><strong class="${realizedProfit >= 0 ? "profit" : "loss"}">${formatMoney(realizedProfit)}</strong></div>
      <div class="calendar-summary-card"><span>남은 투자 가능 금액</span><strong class="${remaining >= 0 ? "profit" : "loss"}">${formatMoney(remaining)}</strong></div>
    `;
  }

  function renderCalendarLegend() {
    const box = document.getElementById("calendarLegend");
    if (!box) return;

    if (calendarView === "investment") {
      box.innerHTML = `
        <span class="legend-title">범례</span>
        <span class="legend-chip"><span class="legend-dot" style="background:#16a34a"></span>매수</span>
        <span class="legend-chip"><span class="legend-dot" style="background:#dc2626"></span>매도 수익</span>
        <span class="legend-chip"><span class="legend-dot" style="background:#2563eb"></span>매도 손실</span>
        <span class="legend-chip">종목별 색상은 자동 구분</span>
      `;
    } else {
      box.innerHTML = `
        <span class="legend-title">범례</span>
        <span class="legend-chip"><span class="legend-dot" style="background:#fee2e2"></span>식비</span>
        <span class="legend-chip"><span class="legend-dot" style="background:#ffedd5"></span>카페</span>
        <span class="legend-chip"><span class="legend-dot" style="background:#dbeafe"></span>교통</span>
        <span class="legend-chip"><span class="legend-dot" style="background:#fce7f3"></span>쇼핑</span>
        <span class="legend-chip"><span class="legend-dot" style="background:#ede9fe"></span>문화생활</span>
        <span class="legend-chip"><span class="legend-dot" style="background:#dcfce7"></span>고정비</span>
        <span class="legend-chip"><span class="legend-dot" style="background:#e5e7eb"></span>기타</span>
      `;
    }
  }

  function renderExpenseCalendar() {
    const box = document.getElementById("calendarBox");

    if (!box) return;

    if (!currentUser || !appData.users[currentUser]) {
      box.innerHTML = `<div class="empty-text">사용자를 먼저 선택해주세요.</div>`;
      return;
    }

    const targetMonth = calendarMonth || currentMonth || new Date().toISOString().slice(0, 7);
    const [year, month] = targetMonth.split("-").map(Number);

    const title = document.getElementById("calendarTitle");

    if (title) {
      title.innerText = `${year}년 ${month}월 소비 캘린더`;
    }

    const firstDay = new Date(year, month - 1, 1);
    const lastDate = new Date(year, month, 0).getDate();
    const startWeekday = firstDay.getDay();

    const eventsByDate = {};
    const userMonths = appData.users[currentUser].months || {};

    Object.keys(userMonths).forEach(monthKey => {
      const monthExpenses = userMonths[monthKey].expenses || [];

      monthExpenses.forEach(item => {
        if (item.date && item.date.startsWith(targetMonth)) {
          if (!eventsByDate[item.date]) {
            eventsByDate[item.date] = [];
          }

          eventsByDate[item.date].push({
            className: getExpenseCalendarClass(item.category),
            text: `<span class="event-kind">${item.category}</span>${formatMoney(item.amount)}`
          });
        }
      });
    });

    drawCalendarGrid(box, targetMonth, startWeekday, lastDate, eventsByDate);
  }

  function renderInvestmentCalendar() {
    const box = document.getElementById("calendarBox");

    if (!box) return;

    if (!currentUser || !appData.users[currentUser]) {
      box.innerHTML = `<div class="empty-text">사용자를 먼저 선택해주세요.</div>`;
      return;
    }

    const targetMonth = calendarMonth || currentMonth || new Date().toISOString().slice(0, 7);
    const [year, month] = targetMonth.split("-").map(Number);

    const title = document.getElementById("calendarTitle");

    if (title) {
      title.innerText = `${year}년 ${month}월 투자 캘린더`;
    }

    const firstDay = new Date(year, month - 1, 1);
    const lastDate = new Date(year, month, 0).getDate();
    const startWeekday = firstDay.getDay();

    const eventsByDate = {};
    const userMonths = appData.users[currentUser].months || {};

    Object.keys(userMonths).forEach(monthKey => {
      const monthInvestments = userMonths[monthKey].investments || [];

      monthInvestments.forEach(item => {
        if (item.buyDate && item.buyDate.startsWith(targetMonth)) {
          if (!eventsByDate[item.buyDate]) {
            eventsByDate[item.buyDate] = [];
          }

          eventsByDate[item.buyDate].push({
            className: `calendar-buy ${getStockCalendarClass(item.name)}`,
            text: `<span class="event-kind">매수</span><strong>${item.name}</strong> ${formatMoney(item.investmentAmount)}`
          });
        }

        if (item.isSold && item.sellDate && item.sellDate.startsWith(targetMonth)) {
          if (!eventsByDate[item.sellDate]) {
            eventsByDate[item.sellDate] = [];
          }

          eventsByDate[item.sellDate].push({
            className: `${item.realizedProfitLoss >= 0 ? "calendar-sell-profit" : "calendar-sell-loss"} ${getStockCalendarClass(item.name)}`,
            text: `<span class="event-kind">매도</span><strong>${item.name}</strong> ${formatMoney(item.realizedProfitLoss)}`
          });
        }
      });
    });

    drawCalendarGrid(box, targetMonth, startWeekday, lastDate, eventsByDate);
  }


  function getExpenseCalendarClass(category) {
    const categoryClassMap = {
      "식비": "calendar-expense-food",
      "카페": "calendar-expense-cafe",
      "교통": "calendar-expense-traffic",
      "쇼핑": "calendar-expense-shopping",
      "문화생활": "calendar-expense-culture",
      "고정비": "calendar-expense-fixed",
      "기타": "calendar-expense-etc"
    };

    return categoryClassMap[category] || "calendar-expense-etc";
  }

  function getStockCalendarClass(stockName) {
    const name = String(stockName || "기타");
    let hash = 0;

    for (let i = 0; i < name.length; i++) {
      hash = (hash + name.charCodeAt(i) * (i + 1)) % 8;
    }

    return `calendar-stock-${hash}`;
  }

  function drawCalendarGrid(box, targetMonth, startWeekday, lastDate, eventsByDate) {
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    let calendarHtml = `<div class="calendar-grid">`;

    weekdays.forEach(day => {
      calendarHtml += `<div class="calendar-weekday">${day}</div>`;
    });

    for (let i = 0; i < startWeekday; i++) {
      calendarHtml += `<div class="calendar-cell empty"></div>`;
    }

    for (let day = 1; day <= lastDate; day++) {
      const dateText = `${targetMonth}-${String(day).padStart(2, "0")}`;
      const events = eventsByDate[dateText] || [];

      calendarHtml += `
        <div class="calendar-cell">
          <div class="calendar-date-number">${day}</div>
          ${
            events.length === 0
              ? ""
              : events.map(event => `
                <div class="calendar-event ${event.className || `calendar-${event.type}`}">
                  ${event.text}
                </div>
              `).join("")
          }
        </div>
      `;
    }

    calendarHtml += `</div>`;
    box.innerHTML = calendarHtml;
  }


  function changeCalendarMonth(diff) {
    const baseMonth = calendarMonth || currentMonth || new Date().toISOString().slice(0, 7);
    const [year, month] = baseMonth.split("-").map(Number);
    const date = new Date(year, month - 1 + diff, 1);

    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, "0");

    calendarMonth = `${newYear}-${newMonth}`;
    renderCalendar();
  }

  function goCurrentCalendarMonth() {
    calendarMonth = currentMonth || new Date().toISOString().slice(0, 7);
    renderCalendar();
  }

  function downloadCSV() {
    if (!ensureUserSelected()) return;

    const rows = [];
    rows.push(["사용자", currentUser]);
    rows.push(["월", currentMonth]);
    rows.push([]);
    rows.push(["구분", "날짜", "항목", "분류", "금액", "평가금액", "평가손익", "평가수익률", "목표수익률", "매도일", "매도금액", "실현손익", "실현수익률"]);

    expenses.forEach(e => {
      rows.push(["소비", e.date, "", e.category, e.amount, "", "", "", "", "", "", "", ""]);
    });

    investments.forEach(i => {
      rows.push([
        "투자",
        i.buyDate,
        i.name,
        "주식",
        i.investmentAmount,
        i.evaluationAmount,
        i.profitLoss,
        i.returnRate.toFixed(2) + "%",
        i.targetReturnRate ? i.targetReturnRate + "%" : "",
        i.sellDate || "",
        i.sellAmount || "",
        i.realizedProfitLoss || "",
        i.isSold ? i.realizedReturnRate.toFixed(2) + "%" : ""
      ]);
    });

    const csv = rows.map(row =>
      row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")
    ).join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentUser}_${currentMonth}_finance_report.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }



  function getCurrentMonthData() {
    if (!currentUser || !currentMonth || !appData.users[currentUser]) {
      return null;
    }

    return appData.users[currentUser].months[currentMonth] || null;
  }

  function showDailyReport() {
    if (!currentUser || !appData.users[currentUser]) {
      alert("먼저 사용자를 선택해주세요.");
      return;
    }

    const selectedDate = document.getElementById("reportDate").value;

    if (!selectedDate) {
      alert("일간 리포트를 볼 날짜를 선택해주세요.");
      return;
    }

    const report = generateDailyReport(selectedDate);
    document.getElementById("aiReport").innerText = report;
  }

  function showWeeklyReport() {
    if (!currentUser || !appData.users[currentUser]) {
      alert("먼저 사용자를 선택해주세요.");
      return;
    }

    const selectedDate = document.getElementById("reportDate").value;

    if (!selectedDate) {
      alert("주간 리포트를 볼 기준 날짜를 선택해주세요.");
      return;
    }

    const report = generateWeeklyReport(selectedDate);
    document.getElementById("aiReport").innerText = report;
  }

  function showMonthlyReport() {
    const data = getCurrentMonthData();

    if (!data || !data.summary) {
      alert("먼저 현재 월의 데이터를 분석해주세요.");
      return;
    }

    document.getElementById("aiReport").innerText = data.summary.report;
  }

  function showYearlyReport() {
    if (!currentUser || !currentMonth || !appData.users[currentUser]) {
      alert("먼저 사용자를 선택해주세요.");
      return;
    }

    const year = currentMonth.slice(0, 4);
    const months = Object.keys(appData.users[currentUser].months)
      .filter(month => month.startsWith(year))
      .sort();

    if (months.length === 0) {
      alert("해당 연도의 데이터가 없습니다.");
      return;
    }

    const report = generateYearlyReport(year, months);
    document.getElementById("aiReport").innerText = report;
  }


  function getAllUserMonthData() {
    if (!currentUser || !appData.users[currentUser]) {
      return [];
    }

    const months = Object.keys(appData.users[currentUser].months).sort();

    return months.map(month => ({
      month,
      data: appData.users[currentUser].months[month]
    }));
  }

  function getDateRangeByWeek(selectedDate) {
    const base = new Date(selectedDate);
    const day = base.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const monday = new Date(base);
    monday.setDate(base.getDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      start: formatDateObject(monday),
      end: formatDateObject(sunday)
    };
  }

  function formatDateObject(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
  }

  function collectPeriodData(startDate, endDate) {
    const periodExpenses = [];
    const periodBuyInvestments = [];
    const periodSoldInvestments = [];

    getAllUserMonthData().forEach(({ data }) => {
      (data.expenses || []).forEach(item => {
        if (item.date >= startDate && item.date <= endDate) {
          periodExpenses.push(item);
        }
      });

      (data.investments || []).forEach(item => {
        if (item.buyDate >= startDate && item.buyDate <= endDate) {
          periodBuyInvestments.push(item);
        }

        if (item.isSold && item.sellDate >= startDate && item.sellDate <= endDate) {
          periodSoldInvestments.push(item);
        }
      });
    });

    return {
      expenses: periodExpenses,
      buys: periodBuyInvestments,
      sells: periodSoldInvestments
    };
  }

  function summarizePeriodData(periodData) {
    const totalExpense = periodData.expenses.reduce((sum, item) => sum + item.amount, 0);
    const totalBuy = periodData.buys.reduce((sum, item) => sum + item.investmentAmount, 0);
    const totalEvaluation = periodData.buys.reduce((sum, item) => sum + item.evaluationAmount, 0);
    const evaluationProfit = totalEvaluation - totalBuy;

    const totalSellBuy = periodData.sells.reduce((sum, item) => sum + item.investmentAmount, 0);
    const totalSellAmount = periodData.sells.reduce((sum, item) => sum + item.sellAmount, 0);
    const realizedProfit = totalSellAmount - totalSellBuy;
    const realizedReturn = totalSellBuy === 0 ? 0 : (realizedProfit / totalSellBuy) * 100;

    const expenseCategory = {};

    periodData.expenses.forEach(item => {
      if (!expenseCategory[item.category]) {
        expenseCategory[item.category] = 0;
      }

      expenseCategory[item.category] += item.amount;
    });

    return {
      totalExpense,
      totalBuy,
      totalEvaluation,
      evaluationProfit,
      totalSellBuy,
      totalSellAmount,
      realizedProfit,
      realizedReturn,
      expenseCategory,
      topExpense: getTopItem(expenseCategory)
    };
  }

  function generateDailyReport(selectedDate) {
    const periodData = collectPeriodData(selectedDate, selectedDate);
    const summary = summarizePeriodData(periodData);

    const previousDateObj = new Date(selectedDate);
    previousDateObj.setDate(previousDateObj.getDate() - 1);
    const previousDate = formatDateObject(previousDateObj);
    const previousSummary = summarizePeriodData(collectPeriodData(previousDate, previousDate));

    let report = "";

    report += `[${currentUser}님의 ${selectedDate} 일간 금융 분석 리포트]\n\n`;

    report += "1. 일간 소비 요약\n";
    report += `- 오늘 총 소비: ${formatMoney(summary.totalExpense)}\n`;
    report += `- 소비 건수: ${periodData.expenses.length}건\n`;

    if (summary.topExpense) {
      const ratio = summary.totalExpense === 0 ? 0 : (summary.topExpense.value / summary.totalExpense) * 100;

      report += `- 최다 소비 카테고리: ${summary.topExpense.name} (${ratio.toFixed(1)}%)\n`;

      if (ratio >= 60) {
        report += "→ 오늘 소비가 특정 카테고리에 크게 집중되어 있습니다.\n";
      }
    } else {
      report += "- 오늘 입력된 소비 내역이 없습니다.\n";
    }

    const expenseDiff = summary.totalExpense - previousSummary.totalExpense;

    report += `- 전일 대비 소비 변화: ${formatMoney(expenseDiff)}\n`;

    if (expenseDiff > 0) {
      report += "→ 전일보다 소비가 증가했습니다.\n";
    } else if (expenseDiff < 0) {
      report += "→ 전일보다 소비가 감소했습니다.\n";
    } else {
      report += "→ 전일과 소비 수준이 동일합니다.\n";
    }

    report += "\n2. 일간 투자 활동\n";
    report += `- 오늘 신규 매수 원금: ${formatMoney(summary.totalBuy)}\n`;
    report += `- 오늘 신규 매수 종목 수: ${periodData.buys.length}개\n`;
    report += `- 오늘 매도 완료 종목 수: ${periodData.sells.length}개\n`;
    report += `- 오늘 실현손익: ${formatMoney(summary.realizedProfit)}\n`;
    report += `- 오늘 실현수익률: ${summary.realizedReturn.toFixed(2)}%\n`;

    if (periodData.buys.length >= 3) {
      report += "→ 하루 신규 매수 건수가 많은 편입니다. 단기 매매 빈도를 점검할 필요가 있습니다.\n";
    }

    if (summary.realizedProfit < 0) {
      report += "→ 오늘 매도 기준 실현 손실이 발생했습니다. 매도 기준을 점검해야 합니다.\n";
    } else if (summary.realizedProfit > 0) {
      report += "→ 오늘 매도 기준 실현 수익이 발생했습니다.\n";
    }

    report += "\n3. 일간 개선 제안\n";
    report += "- 하루 단위로 큰 소비가 발생한 경우 해당 소비의 필요성을 기록하는 것이 좋습니다.\n";
    report += "- 매수와 매도가 같은 날 집중되는 경우 충동 매매 여부를 점검하는 것이 좋습니다.\n";
    report += "- 일간 리포트는 단기 습관을 확인하는 용도로 활용하고, 최종 판단은 주간·월간 리포트와 함께 보는 것이 좋습니다.\n";

    return report;
  }

  function generateWeeklyReport(selectedDate) {
    const range = getDateRangeByWeek(selectedDate);
    const periodData = collectPeriodData(range.start, range.end);
    const summary = summarizePeriodData(periodData);

    const prevStartObj = new Date(range.start);
    prevStartObj.setDate(prevStartObj.getDate() - 7);

    const prevEndObj = new Date(range.end);
    prevEndObj.setDate(prevEndObj.getDate() - 7);

    const prevStart = formatDateObject(prevStartObj);
    const prevEnd = formatDateObject(prevEndObj);
    const previousSummary = summarizePeriodData(collectPeriodData(prevStart, prevEnd));

    const weekdayExpense = periodData.expenses
      .filter(item => {
        const day = new Date(item.date).getDay();
        return day >= 1 && day <= 5;
      })
      .reduce((sum, item) => sum + item.amount, 0);

    const weekendExpense = periodData.expenses
      .filter(item => {
        const day = new Date(item.date).getDay();
        return day === 0 || day === 6;
      })
      .reduce((sum, item) => sum + item.amount, 0);

    const weekendRatio = summary.totalExpense === 0 ? 0 : (weekendExpense / summary.totalExpense) * 100;

    let report = "";

    report += `[${currentUser}님의 ${range.start} ~ ${range.end} 주간 금융 분석 리포트]\n\n`;

    report += "1. 주간 소비 요약\n";
    report += `- 이번 주 총 소비: ${formatMoney(summary.totalExpense)}\n`;
    report += `- 소비 건수: ${periodData.expenses.length}건\n`;
    report += `- 평일 소비: ${formatMoney(weekdayExpense)}\n`;
    report += `- 주말 소비: ${formatMoney(weekendExpense)} (${weekendRatio.toFixed(1)}%)\n`;

    if (summary.topExpense) {
      const ratio = summary.totalExpense === 0 ? 0 : (summary.topExpense.value / summary.totalExpense) * 100;

      report += `- 주간 최다 소비 카테고리: ${summary.topExpense.name} (${ratio.toFixed(1)}%)\n`;
    }

    const expenseDiff = summary.totalExpense - previousSummary.totalExpense;

    report += `- 지난 주 대비 소비 변화: ${formatMoney(expenseDiff)}\n`;

    if (expenseDiff > 0) {
      report += "→ 지난 주보다 소비가 증가했습니다. 증가 원인을 확인할 필요가 있습니다.\n";
    } else if (expenseDiff < 0) {
      report += "→ 지난 주보다 소비가 감소했습니다. 소비 관리가 개선된 흐름입니다.\n";
    } else {
      report += "→ 지난 주와 소비 수준이 동일합니다.\n";
    }

    if (weekendRatio >= 50) {
      report += "→ 주말 소비 비중이 높습니다. 주말 외식, 쇼핑, 문화생활 지출을 점검하면 좋습니다.\n";
    }

    report += "\n2. 주간 투자 활동\n";
    report += `- 이번 주 신규 매수 원금: ${formatMoney(summary.totalBuy)}\n`;
    report += `- 이번 주 신규 매수 종목 수: ${periodData.buys.length}개\n`;
    report += `- 이번 주 매도 완료 종목 수: ${periodData.sells.length}개\n`;
    report += `- 이번 주 실현손익: ${formatMoney(summary.realizedProfit)}\n`;
    report += `- 이번 주 실현수익률: ${summary.realizedReturn.toFixed(2)}%\n`;

    if (periodData.buys.length >= 5) {
      report += "→ 한 주 동안 신규 매수 빈도가 높은 편입니다. 분할매수 계획과 종목 집중도를 점검해야 합니다.\n";
    }

    if (summary.realizedProfit < 0) {
      report += "→ 이번 주 매도 기준 실현 손실이 발생했습니다. 손절 기준과 매도 근거를 다시 확인할 필요가 있습니다.\n";
    } else if (summary.realizedProfit > 0) {
      report += "→ 이번 주 매도 기준 실현 수익이 발생했습니다.\n";
    }

    report += "\n3. 주간 개선 제안\n";
    report += "- 주간 리포트는 일간 소비 변동을 묶어 실제 습관 변화를 확인하는 데 유용합니다.\n";
    report += "- 주말 소비 비중이 높다면 주말 예산을 별도로 설정하는 것이 좋습니다.\n";
    report += "- 신규 매수와 매도 빈도를 함께 확인해 단기 매매가 과도하지 않은지 점검하는 것이 좋습니다.\n";

    return report;
  }

  function generateYearlyReport(year, months) {
    let yearlyIncome = 0;
    let yearlyExpense = 0;
    let yearlyInvestment = 0;
    let yearlyEvaluation = 0;
    let yearlyRealizedBuy = 0;
    let yearlyRealizedSell = 0;

    const categoryMap = {};
    const investmentTypeMap = {};
    const monthlyRiskList = [];

    months.forEach(month => {
      const data = appData.users[currentUser].months[month];
      const basic = data.basicInfo || {};
      const monthExpenses = data.expenses || [];
      const monthInvestments = data.investments || [];

      yearlyIncome += basic.income || 0;
      yearlyExpense += monthExpenses.reduce((sum, item) => sum + item.amount, 0);
      yearlyInvestment += monthInvestments.reduce((sum, item) => sum + item.investmentAmount, 0);
      yearlyEvaluation += monthInvestments.reduce((sum, item) => sum + item.evaluationAmount, 0);

      monthInvestments.filter(item => item.isSold).forEach(item => {
        yearlyRealizedBuy += item.investmentAmount;
        yearlyRealizedSell += item.sellAmount || 0;
      });

      monthExpenses.forEach(item => {
        if (!categoryMap[item.category]) {
          categoryMap[item.category] = 0;
        }

        categoryMap[item.category] += item.amount;
      });

      monthInvestments.forEach(item => {
        if (!investmentTypeMap[item.type]) {
          investmentTypeMap[item.type] = 0;
        }

        investmentTypeMap[item.type] += item.investmentAmount;
      });

      if (data.summary && data.summary.risk) {
        monthlyRiskList.push({
          month,
          score: data.summary.risk.score,
          level: data.summary.risk.level
        });
      }
    });

    const yearlyProfitLoss = yearlyEvaluation - yearlyInvestment;
    const yearlyReturnRate = yearlyInvestment === 0 ? 0 : (yearlyProfitLoss / yearlyInvestment) * 100;
    const yearlyExpenseRatio = yearlyIncome === 0 ? 0 : (yearlyExpense / yearlyIncome) * 100;
    const yearlyInvestmentRatio = yearlyIncome === 0 ? 0 : (yearlyInvestment / yearlyIncome) * 100;
    const yearlyRealizedProfit = yearlyRealizedSell - yearlyRealizedBuy;
    const yearlyRealizedReturn = yearlyRealizedBuy === 0 ? 0 : (yearlyRealizedProfit / yearlyRealizedBuy) * 100;

    const topCategory = getTopItem(categoryMap);
    const topInvestment = getTopItem(investmentTypeMap);

    const maxExpenseMonth = months
      .map(month => {
        const data = appData.users[currentUser].months[month];
        const total = (data.expenses || []).reduce((sum, item) => sum + item.amount, 0);
        return { month, total };
      })
      .sort((a, b) => b.total - a.total)[0];

    const avgRisk = monthlyRiskList.length === 0
      ? 0
      : monthlyRiskList.reduce((sum, item) => sum + item.score, 0) / monthlyRiskList.length;

    let report = "";

    report += `[${currentUser}님의 ${year}년 연간 금융 분석 리포트]\n\n`;

    report += "1. 연간 현금흐름 요약\n";
    report += `- 분석 대상 월: ${months.join(", ")}\n`;
    report += `- 연간 입력 수입: ${formatMoney(yearlyIncome)}\n`;
    report += `- 연간 총 소비: ${formatMoney(yearlyExpense)} (${yearlyExpenseRatio.toFixed(1)}%)\n`;
    report += `- 연간 투자 원금: ${formatMoney(yearlyInvestment)} (${yearlyInvestmentRatio.toFixed(1)}%)\n`;
    report += `- 수입 대비 잔여 금액: ${formatMoney(yearlyIncome - yearlyExpense - yearlyInvestment)}\n\n`;

    if (yearlyExpenseRatio >= 70) {
      report += "→ 연간 소비율이 높은 편입니다. 고정비와 반복 소비 항목을 점검할 필요가 있습니다.\n\n";
    } else if (yearlyExpenseRatio >= 50) {
      report += "→ 연간 소비율은 관리 가능한 범위지만, 월별 소비 변동을 함께 확인하는 것이 좋습니다.\n\n";
    } else {
      report += "→ 연간 소비율이 비교적 안정적인 편입니다.\n\n";
    }

    report += "2. 연간 소비 패턴 분석\n";

    if (topCategory) {
      const topRatio = yearlyExpense === 0 ? 0 : (topCategory.value / yearlyExpense) * 100;

      report += `- 연간 최다 소비 카테고리: ${topCategory.name}\n`;
      report += `- 해당 카테고리 소비 금액: ${formatMoney(topCategory.value)}\n`;
      report += `- 연간 소비 대비 비중: ${topRatio.toFixed(1)}%\n`;
    }

    if (maxExpenseMonth) {
      report += `- 소비가 가장 많았던 월: ${maxExpenseMonth.month} (${formatMoney(maxExpenseMonth.total)})\n`;
    }

    report += "\n3. 연간 투자 성과 분석\n";
    report += `- 연간 투자 원금 합계: ${formatMoney(yearlyInvestment)}\n`;
    report += `- 현재 평가금액 합계: ${formatMoney(yearlyEvaluation)}\n`;
    report += `- 평가 손익: ${formatMoney(yearlyProfitLoss)}\n`;
    report += `- 평가 수익률: ${yearlyReturnRate.toFixed(2)}%\n`;

    if (topInvestment) {
      const investRatio = yearlyInvestment === 0 ? 0 : (topInvestment.value / yearlyInvestment) * 100;

      report += `- 가장 큰 투자 유형: ${topInvestment.name} (${investRatio.toFixed(1)}%)\n`;
    }

    if (yearlyReturnRate <= -10) {
      report += "→ 연간 투자 성과가 손실 관리 구간입니다. 손실 종목과 매수 기준을 재점검해야 합니다.\n";
    } else if (yearlyReturnRate < 0) {
      report += "→ 연간 기준으로 소폭 손실 구간입니다. 보유 종목의 비중과 리스크를 점검해야 합니다.\n";
    } else if (yearlyReturnRate >= 10) {
      report += "→ 연간 투자 성과가 양호합니다. 수익 실현 기준과 현금 비중 관리가 필요합니다.\n";
    } else {
      report += "→ 연간 투자 성과는 중립 구간입니다.\n";
    }

    report += "\n4. 연간 실현손익 분석\n";
    report += `- 실현 매수금: ${formatMoney(yearlyRealizedBuy)}\n`;
    report += `- 실현 매도금: ${formatMoney(yearlyRealizedSell)}\n`;
    report += `- 실현 손익: ${formatMoney(yearlyRealizedProfit)}\n`;
    report += `- 실현 수익률: ${yearlyRealizedReturn.toFixed(2)}%\n`;

    if (yearlyRealizedBuy === 0) {
      report += "→ 아직 연간 기준 매도 완료 데이터가 없어 실현손익 분석은 제한적입니다.\n";
    } else if (yearlyRealizedProfit > 0) {
      report += "→ 연간 기준 실현 수익이 발생했습니다.\n";
    } else if (yearlyRealizedProfit < 0) {
      report += "→ 연간 기준 실현 손실이 발생했습니다. 매도 기준을 점검할 필요가 있습니다.\n";
    }

    report += "\n5. 연간 위험도 분석\n";

    if (monthlyRiskList.length > 0) {
      const highestRisk = [...monthlyRiskList].sort((a, b) => b.score - a.score)[0];

      report += `- 월 평균 위험도 점수: ${avgRisk.toFixed(1)}점\n`;
      report += `- 위험도가 가장 높았던 월: ${highestRisk.month} (${highestRisk.score}점, ${highestRisk.level})\n`;

      if (avgRisk >= 70) {
        report += "→ 연간 전반적으로 고위험 금융 습관이 나타났습니다.\n";
      } else if (avgRisk >= 45) {
        report += "→ 연간 전반적으로 관리가 필요한 수준입니다.\n";
      } else {
        report += "→ 연간 위험도는 비교적 안정적인 편입니다.\n";
      }
    } else {
      report += "- 월별 분석 기록이 부족하여 위험도 추세 분석은 제한적입니다.\n";
    }

    report += "\n6. 연간 개선 전략\n";
    report += "- 소비가 가장 많았던 월과 카테고리를 기준으로 다음 해 예산을 설정하는 것이 좋습니다.\n";
    report += "- 투자 성과는 평가손익과 실현손익을 분리해서 관리하는 것이 좋습니다.\n";
    report += "- 위험도가 높았던 월의 소비율, 투자 집중도, 손실 종목 수를 다시 확인해야 합니다.\n";
    report += "- 월별 데이터를 계속 누적하면 장기적인 소비·투자 습관 분석이 가능해집니다.\n";

    return report;
  }


  let selectedCalendarDate = "";
  let detailMode = null;
  let detailId = null;

  function ensureMonthData(month) {
    if (!currentUser) return null;

    if (!appData.users[currentUser]) {
      appData.users[currentUser] = { months: {} };
    }

    if (!appData.users[currentUser].months[month]) {
      appData.users[currentUser].months[month] = {
        basicInfo: {
          month,
          income: 0,
          availableInvestment: 0,
          budgetGoal: 0
        },
        expenses: [],
        investments: [],
        summary: null,
        dateNotes: {}
      };
    }

    if (!appData.users[currentUser].months[month].dateNotes) {
      appData.users[currentUser].months[month].dateNotes = {};
    }

    return appData.users[currentUser].months[month];
  }

  function jumpCalendarMonth() {
    const picker = document.getElementById("calendarMonthPicker");
    if (!picker || !picker.value) return;

    calendarMonth = picker.value;
    renderCalendar();
  }

  function syncCalendarPicker() {
    const picker = document.getElementById("calendarMonthPicker");
    if (picker) {
      picker.value = calendarMonth || currentMonth || new Date().toISOString().slice(0, 7);
    }
  }

  function showMemoTab(type) {
    const tabs = ["note", "expense", "investment", "records"];

    tabs.forEach(tab => {
      const panel = document.querySelector(`[data-memo-tab="${tab}"]`);
      const btn = document.getElementById(`memoTab${tab.charAt(0).toUpperCase() + tab.slice(1)}Btn`);
      if (panel) panel.classList.toggle("active", tab === type);
      if (btn) btn.classList.toggle("active", tab === type);
    });
  }

  function openCalendarMemo(dateText) {
    if (!ensureUserSelected()) return;

    selectedCalendarDate = dateText;
    const selectedMonth = dateText.slice(0, 7);

    if (selectedMonth !== currentMonth) {
      document.getElementById("targetMonth").value = selectedMonth;
      loadMonth(selectedMonth);
    }

    calendarMonth = selectedMonth;
    const data = ensureMonthData(selectedMonth);

    document.getElementById("memoInputArea").style.display = "grid";
    document.getElementById("memoDetailArea").style.display = "none";
    document.getElementById("memoDetailArea").innerHTML = "";

    document.getElementById("memoModalTitle").innerText = `${dateText} 기록 입력`;
    document.getElementById("memoModalSub").innerText = "이 날짜의 소비, 투자, 메모를 기록할 수 있습니다.";

    document.getElementById("memoDayNote").value = data.dateNotes?.[dateText] || "";

    clearMemoExpenseInputs();
    clearMemoInvestmentInputs();
    renderOpenHoldingOptions();
    updateSelectedHoldingPreview();
    renderMemoDayRecords(dateText);
    showMemoTab("note");

    document.getElementById("calendarMemoModal").style.display = "flex";
  }

  function closeCalendarMemo() {
    const modal = document.getElementById("calendarMemoModal");
    if (modal) modal.style.display = "none";

    detailMode = null;
    detailId = null;
  }

  function saveMemoBasicInfo() {
    if (!ensureUserSelected() || !selectedCalendarDate) return;

    const month = selectedCalendarDate.slice(0, 7);
    const data = ensureMonthData(month);
    const dayNote = document.getElementById("memoDayNote").value.trim();

    data.dateNotes[selectedCalendarDate] = dayNote;
    data.summary = null;

    saveStorage();
    renderCalendar();
    renderMemoDayRecords(selectedCalendarDate);
    alert("날짜 메모가 저장되었습니다.");
  }

  function clearMemoExpenseInputs() {
    const amount = document.getElementById("memoExpenseAmount");
    const memo = document.getElementById("memoExpenseMemo");
    if (amount) amount.value = "";
    if (memo) memo.value = "";
  }

  function clearMemoInvestmentInputs() {
    ["memoStockName", "memoBuyPrice", "memoQuantity", "memoTargetReturnRate", "memoStopLossRate", "memoSellPrice", "memoInvestmentMemo", "memoSellMemo"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    renderOpenHoldingOptions();
    showInvestmentTradeMode("buy");
  }

  function getOpenInvestments() {
    if (!currentUser || !appData.users[currentUser]) return [];

    const result = [];
    const months = appData.users[currentUser].months || {};

    Object.keys(months).forEach(monthKey => {
      (months[monthKey].investments || []).forEach(item => {
        if (!item.isSold) {
          result.push({ ...item, sourceMonth: monthKey });
        }
      });
    });

    return result;
  }

  function showInvestmentTradeMode(mode) {
    const isSell = mode === "sell";
    const buyPanel = document.getElementById("memoBuyPanel");
    const sellPanel = document.getElementById("memoSellPanel");
    const buyBtn = document.getElementById("memoTradeBuyBtn");
    const sellBtn = document.getElementById("memoTradeSellBtn");

    if (buyPanel) buyPanel.classList.toggle("active", !isSell);
    if (sellPanel) sellPanel.classList.toggle("active", isSell);
    if (buyBtn) buyBtn.classList.toggle("active", !isSell);
    if (sellBtn) sellBtn.classList.toggle("active", isSell);

    if (isSell) {
      renderOpenHoldingOptions();
      updateSelectedHoldingPreview();
    }
  }

  function renderOpenHoldingOptions() {
    const select = document.getElementById("memoSellHoldingSelect");
    if (!select) return;

    const openItems = getOpenInvestments().sort((a, b) => String(a.buyDate).localeCompare(String(b.buyDate)));

    if (openItems.length === 0) {
      select.innerHTML = `<option value="">매도 가능한 보유 종목이 없습니다</option>`;
      updateSelectedHoldingPreview();
      return;
    }

    select.innerHTML = openItems.map(item => `
      <option value="${item.sourceMonth}|${item.id}">${escapeHtml(item.name)} · ${item.buyDate} 매수 · ${formatMoney(item.buyPrice)} × ${item.quantity}주</option>
    `).join("");
  }

  function getSelectedHoldingFromDropdown() {
    const select = document.getElementById("memoSellHoldingSelect");
    if (!select || !select.value) return null;

    const [sourceMonth, rawId] = select.value.split("|");
    const id = Number(rawId || 0);
    const data = ensureMonthData(sourceMonth);
    const item = (data.investments || []).find(i => i.id === id && !i.isSold);

    return item ? { item, sourceMonth, data } : null;
  }

  function updateSelectedHoldingPreview() {
    const preview = document.getElementById("memoSellHoldingPreview");
    if (!preview) return;

    const selected = getSelectedHoldingFromDropdown();

    if (!selected) {
      preview.innerHTML = `보유 중인 종목을 선택하면 매수 정보가 표시됩니다.`;
      return;
    }

    const item = selected.item;
    const profitClass = Number(item.profitLoss || 0) >= 0 ? "profit" : "loss";

    preview.innerHTML = `
      <strong>${escapeHtml(item.name)}</strong><br>
      매수일: ${item.buyDate} · 매수가: ${formatMoney(item.buyPrice)} · 수량: ${item.quantity}주<br>
      매수 원금: ${formatMoney(item.investmentAmount)} · 현재가: ${formatMoney(item.currentPrice || item.buyPrice)}<br>
      평가손익: <span class="${profitClass}">${formatMoney(item.profitLoss || 0)} (${Number(item.returnRate || 0).toFixed(2)}%)</span>
      ${item.memo ? `<br>매수 메모: ${escapeHtml(item.memo)}` : ""}
    `;
  }

  function saveExpenseFromMemo() {
    if (!ensureUserSelected() || !selectedCalendarDate) return;

    const month = selectedCalendarDate.slice(0, 7);
    const data = ensureMonthData(month);

    const category = document.getElementById("memoExpenseCategory").value;
    const amount = Number(document.getElementById("memoExpenseAmount").value);
    const memo = document.getElementById("memoExpenseMemo").value.trim();

    if (amount <= 0) {
      alert("소비 금액을 올바르게 입력해주세요.");
      return;
    }

    data.expenses.push({
      id: Date.now(),
      date: selectedCalendarDate,
      category,
      amount,
      memo
    });

    data.summary = null;
    currentMonth = month;
    basicInfo = data.basicInfo;
    expenses = data.expenses || [];
    investments = data.investments || [];

    saveStorage();
    clearMemoExpenseInputs();
    renderLists();
    renderHistory();
    resetDashboard();
    renderMemoDayRecords(selectedCalendarDate);
    showMemoTab("records");
    alert("소비 내역이 저장되었습니다.");
  }

  function saveInvestmentFromMemo() {
    if (!ensureUserSelected() || !selectedCalendarDate) return;

    const month = selectedCalendarDate.slice(0, 7);
    const data = ensureMonthData(month);
    const isSellMode = document.getElementById("memoSellPanel")?.classList.contains("active");

    if (isSellMode) {
      const selectedHolding = getSelectedHoldingFromDropdown();
      const target = selectedHolding?.item;
      const sellPrice = Number(document.getElementById("memoSellPrice")?.value || 0);
      const sellMemo = document.getElementById("memoSellMemo")?.value.trim() || "";

      if (!target) {
        alert("매도할 보유 종목을 선택해주세요.");
        return;
      }

      if (sellPrice <= 0) {
        alert("매도가를 올바르게 입력해주세요.");
        return;
      }

      const sellAmount = sellPrice * target.quantity;
      const realizedProfitLoss = sellAmount - target.investmentAmount;
      const realizedReturnRate = target.investmentAmount === 0
        ? 0
        : (realizedProfitLoss / target.investmentAmount) * 100;

      const buyMonth = selectedHolding.sourceMonth;
      const buyData = selectedHolding.data;
      const targetInBuyMonth = target;

      if (!targetInBuyMonth) {
        alert("선택한 보유 종목 정보를 찾을 수 없습니다.");
        return;
      }

      Object.assign(targetInBuyMonth, {
        sellDate: selectedCalendarDate,
        sellPrice,
        sellAmount,
        realizedProfitLoss,
        realizedReturnRate,
        sellMemo,
        isSold: true,
        currentPrice: sellPrice,
        evaluationAmount: sellAmount,
        profitLoss: realizedProfitLoss,
        returnRate: realizedReturnRate
      });

      buyData.summary = null;
      data.summary = null;
      currentMonth = month;
      basicInfo = data.basicInfo;
      expenses = data.expenses || [];
      investments = data.investments || [];

      saveStorage();
      clearMemoInvestmentInputs();
      loadMonth(month);
      renderRealizedBoard();
      renderHistory();
      resetDashboard();
      renderMemoDayRecords(selectedCalendarDate);
      showMemoTab("records");
      alert("매도 내역이 저장되었습니다.");
      return;
    }

    const name = document.getElementById("memoStockName").value.trim();
    const buyPrice = Number(document.getElementById("memoBuyPrice").value);
    const quantity = Number(document.getElementById("memoQuantity").value);
    const targetReturnRate = Number(document.getElementById("memoTargetReturnRate").value);
    const stopLossRate = Number(document.getElementById("memoStopLossRate").value);
    const memo = document.getElementById("memoInvestmentMemo").value.trim();

    if (!name || buyPrice <= 0 || quantity <= 0) {
      alert("종목명, 매수가, 수량을 올바르게 입력해주세요.");
      return;
    }

    const investmentAmount = buyPrice * quantity;
    const currentPrice = buyPrice;
    const evaluationAmount = investmentAmount;
    const profitLoss = 0;
    const returnRate = 0;

    data.investments.push({
      id: Date.now(),
      buyDate: selectedCalendarDate,
      name,
      buyPrice,
      quantity,
      currentPrice,
      targetReturnRate,
      stopLossRate,
      memo,
      type: "주식",
      investmentAmount,
      evaluationAmount,
      profitLoss,
      returnRate,
      sellDate: "",
      sellPrice: 0,
      sellAmount: 0,
      realizedProfitLoss: 0,
      realizedReturnRate: 0,
      sellMemo: "",
      isSold: false
    });

    data.summary = null;
    currentMonth = month;
    basicInfo = data.basicInfo;
    expenses = data.expenses || [];
    investments = data.investments || [];

    saveStorage();
    clearMemoInvestmentInputs();
    renderLists();
    renderRealizedBoard();
    renderHistory();
    resetDashboard();
    renderMemoDayRecords(selectedCalendarDate);
    showMemoTab("records");
    alert("매수 내역이 저장되었습니다.");
  }

  function getDateData(dateText) {
    const month = dateText.slice(0, 7);
    const data = ensureMonthData(month);
    return {
      data,
      expenses: (data.expenses || []).filter(item => item.date === dateText),
      buyInvestments: (data.investments || []).filter(item => item.buyDate === dateText),
      sellInvestments: (data.investments || []).filter(item => item.isSold && item.sellDate === dateText),
      note: data.dateNotes?.[dateText] || ""
    };
  }

  function renderMemoDayRecords(dateText) {
    const box = document.getElementById("memoDayRecords");
    if (!box) return;

    const info = getDateData(dateText);
    let html = "";

    if (info.note) {
      html += `<div class="detail-row"><strong>날짜 메모</strong><br>${escapeHtml(info.note)}</div>`;
    }

    info.expenses.forEach(item => {
      html += `
        <div class="detail-row">
          <strong>소비 | ${escapeHtml(item.category)} ${formatMoney(item.amount)}</strong><br>
          메모: ${escapeHtml(item.memo || "메모 없음")}
          <div class="detail-actions">
            <button class="sub-btn" onclick="openExpenseDetail(${item.id})">보기/수정</button>
            <button class="danger-btn" onclick="deleteExpenseFromMemo(${item.id})">삭제</button>
          </div>
        </div>
      `;
    });

    info.buyInvestments.forEach(item => {
      html += `
        <div class="detail-row">
          <strong>매수 | ${escapeHtml(item.name)} ${formatMoney(item.investmentAmount)}</strong><br>
          메모: ${escapeHtml(item.memo || "메모 없음")}
          <div class="detail-actions">
            <button class="sub-btn" onclick="openInvestmentDetail(${item.id}, 'buy')">보기/수정</button>
            <button class="danger-btn" onclick="deleteInvestmentFromMemo(${item.id})">삭제</button>
          </div>
        </div>
      `;
    });

    info.sellInvestments.forEach(item => {
      html += `
        <div class="detail-row">
          <strong>매도 | ${escapeHtml(item.name)} ${formatMoney(item.realizedProfitLoss)}</strong><br>
          실현수익률: ${item.realizedReturnRate.toFixed(2)}%
          <div class="detail-actions">
            <button class="sub-btn" onclick="openInvestmentDetail(${item.id}, 'sell')">보기/수정</button>
          </div>
        </div>
      `;
    });

    box.innerHTML = html || `<div class="empty-text">이 날짜에 저장된 기록이 없습니다.</div>`;
  }

  function openExpenseDetail(id) {
    detailMode = "expense";
    detailId = id;

    const item = expenses.find(e => e.id === id);
    if (!item) return;

    document.getElementById("memoInputArea").style.display = "none";
    const detail = document.getElementById("memoDetailArea");
    detail.style.display = "block";
    document.getElementById("memoModalTitle").innerText = `${item.date} 소비 기록`;
    document.getElementById("memoModalSub").innerText = "소비 내역과 메모를 확인하고 수정할 수 있습니다.";

    detail.innerHTML = `
      <div class="memo-panel memo-detail-box">
        <h3>소비 상세</h3>
        <label class="small-label">날짜</label>
        <input type="date" id="detailExpenseDate" value="${item.date}">
        <label class="small-label">카테고리</label>
        <select id="detailExpenseCategory">
          ${["식비","카페","교통","쇼핑","문화생활","고정비","기타"].map(cat => `<option value="${cat}" ${cat === item.category ? "selected" : ""}>${cat}</option>`).join("")}
        </select>
        <label class="small-label">금액</label>
        <input type="number" id="detailExpenseAmount" value="${item.amount}">
        <label class="small-label">메모</label>
        <textarea id="detailExpenseMemo">${escapeHtml(item.memo || "")}</textarea>
        <div class="detail-actions">
          <button onclick="updateExpenseDetail()">수정 저장</button>
          <button class="danger-btn" onclick="deleteExpenseFromMemo(${item.id}); closeCalendarMemo();">삭제</button>
          <button class="sub-btn" onclick="openCalendarMemo(selectedCalendarDate)">뒤로가기</button>
          <button class="modal-close" onclick="closeCalendarMemo()">닫기</button>
        </div>
      </div>
    `;
  }

  function updateExpenseDetail() {
    const item = expenses.find(e => e.id === detailId);
    if (!item) return;

    const newDate = document.getElementById("detailExpenseDate").value;
    const newMonth = newDate.slice(0, 7);
    const amount = Number(document.getElementById("detailExpenseAmount").value);

    if (!newDate || amount <= 0) {
      alert("날짜와 금액을 올바르게 입력해주세요.");
      return;
    }

    if (newMonth !== currentMonth) {
      alert("다른 월로 이동 수정은 현재 버전에서 지원하지 않습니다. 해당 월에서 새로 입력해주세요.");
      return;
    }

    item.date = newDate;
    item.category = document.getElementById("detailExpenseCategory").value;
    item.amount = amount;
    item.memo = document.getElementById("detailExpenseMemo").value.trim();

    appData.users[currentUser].months[currentMonth].summary = null;
    saveStorage();
    renderLists();
    renderHistory();
    resetDashboard();
    selectedCalendarDate = newDate;
    renderMemoDayRecords(selectedCalendarDate);
    openExpenseDetail(item.id);
    alert("소비 기록이 수정되었습니다.");
  }

  function deleteExpenseFromMemo(id) {
    expenses = expenses.filter(item => item.id !== id);
    appData.users[currentUser].months[currentMonth].expenses = expenses;
    appData.users[currentUser].months[currentMonth].summary = null;
    saveStorage();
    renderLists();
    renderHistory();
    resetDashboard();
    if (selectedCalendarDate) renderMemoDayRecords(selectedCalendarDate);
  }

  function openInvestmentDetail(id, mode = "buy") {
    detailMode = "investment";
    detailId = id;

    const item = investments.find(i => i.id === id);
    if (!item) return;

    document.getElementById("memoInputArea").style.display = "none";
    const detail = document.getElementById("memoDetailArea");
    detail.style.display = "block";
    document.getElementById("memoModalTitle").innerText = `${mode === "sell" ? "매도" : "매수"} 기록`;
    document.getElementById("memoModalSub").innerText = "투자 내역과 메모를 확인하고 수정할 수 있습니다.";

    detail.innerHTML = `
      <div class="memo-panel memo-detail-box">
        <h3>투자 상세</h3>
        <label class="small-label">매수일</label>
        <input type="date" id="detailBuyDate" value="${item.buyDate}">
        <label class="small-label">종목명</label>
        <input type="text" id="detailStockName" value="${escapeAttr(item.name)}">
        <div class="input-row">
          <input type="number" id="detailBuyPrice" placeholder="매수가" value="${item.buyPrice}">
          <input type="number" id="detailQuantity" placeholder="수량" value="${item.quantity}">
          <input type="number" id="detailTargetReturnRate" placeholder="목표수익률" value="${item.targetReturnRate || ""}">
          <input type="number" id="detailStopLossRate" placeholder="손절 기준" value="${item.stopLossRate || ""}">
        </div>
        <label class="small-label">투자 메모</label>
        <textarea id="detailInvestmentMemo">${escapeHtml(item.memo || "")}</textarea>

        <h3 style="margin-top:18px;">매도 정보</h3>
        <div class="input-row">
          <input type="date" id="detailSellDate" value="${item.sellDate || ""}">
          <input type="number" id="detailSellPrice" placeholder="매도가" value="${item.sellPrice || ""}">
        </div>

        <div class="detail-actions">
          <button onclick="updateInvestmentDetail()">수정 저장</button>
          <button class="sub-btn" onclick="markInvestmentSoldFromDetail()">매도 저장</button>
          <button class="danger-btn" onclick="deleteInvestmentFromMemo(${item.id}); closeCalendarMemo();">삭제</button>
          <button class="sub-btn" onclick="openCalendarMemo(selectedCalendarDate)">뒤로가기</button>
          <button class="modal-close" onclick="closeCalendarMemo()">닫기</button>
        </div>
      </div>
    `;
  }

  function updateInvestmentDetail() {
    const item = investments.find(i => i.id === detailId);
    if (!item) return;

    const buyDate = document.getElementById("detailBuyDate").value;
    const buyMonth = buyDate.slice(0, 7);
    const name = document.getElementById("detailStockName").value.trim();
    const buyPrice = Number(document.getElementById("detailBuyPrice").value);
    const quantity = Number(document.getElementById("detailQuantity").value);
    if (!buyDate || buyMonth !== currentMonth) {
      alert("현재 선택 월 안의 날짜로 입력해주세요.");
      return;
    }

    if (!name || buyPrice <= 0 || quantity <= 0) {
      alert("종목명, 매수가, 수량을 올바르게 입력해주세요.");
      return;
    }

    item.buyDate = buyDate;
    item.name = name;
    item.buyPrice = buyPrice;
    item.quantity = quantity;
    item.currentPrice = item.isSold && item.sellPrice > 0 ? item.sellPrice : buyPrice;
    item.targetReturnRate = Number(document.getElementById("detailTargetReturnRate").value);
    item.stopLossRate = Number(document.getElementById("detailStopLossRate").value);
    item.memo = document.getElementById("detailInvestmentMemo").value.trim();
    item.investmentAmount = buyPrice * quantity;
    item.evaluationAmount = item.isSold && item.sellPrice > 0 ? item.sellPrice * quantity : item.investmentAmount;
    item.profitLoss = item.evaluationAmount - item.investmentAmount;
    item.returnRate = item.investmentAmount === 0 ? 0 : (item.profitLoss / item.investmentAmount) * 100;

    if (item.isSold && item.sellPrice > 0) {
      item.sellAmount = item.sellPrice * item.quantity;
      item.realizedProfitLoss = item.sellAmount - item.investmentAmount;
      item.realizedReturnRate = item.investmentAmount === 0 ? 0 : (item.realizedProfitLoss / item.investmentAmount) * 100;
    }

    appData.users[currentUser].months[currentMonth].summary = null;
    saveStorage();
    renderLists();
    renderRealizedBoard();
    renderHistory();
    resetDashboard();
    selectedCalendarDate = buyDate;
    openInvestmentDetail(item.id);
    alert("투자 기록이 수정되었습니다.");
  }

  function markInvestmentSoldFromDetail() {
    const item = investments.find(i => i.id === detailId);
    if (!item) return;

    const sellDate = document.getElementById("detailSellDate").value;
    const sellPrice = Number(document.getElementById("detailSellPrice").value);

    if (!sellDate || sellDate.slice(0, 7) !== currentMonth || sellPrice <= 0) {
      alert("현재 선택 월 안의 매도일과 매도가를 올바르게 입력해주세요.");
      return;
    }

    item.sellDate = sellDate;
    item.sellPrice = sellPrice;
    item.sellAmount = sellPrice * item.quantity;
    item.realizedProfitLoss = item.sellAmount - item.investmentAmount;
    item.realizedReturnRate = item.investmentAmount === 0 ? 0 : (item.realizedProfitLoss / item.investmentAmount) * 100;
    item.isSold = true;

    appData.users[currentUser].months[currentMonth].summary = null;
    saveStorage();
    renderLists();
    renderRealizedBoard();
    renderHistory();
    resetDashboard();
    selectedCalendarDate = sellDate;
    openInvestmentDetail(item.id, "sell");
    alert("매도 정보가 저장되었습니다.");
  }

  function deleteInvestmentFromMemo(id) {
    investments = investments.filter(item => item.id !== id);
    appData.users[currentUser].months[currentMonth].investments = investments;
    appData.users[currentUser].months[currentMonth].summary = null;
    saveStorage();
    renderLists();
    renderRealizedBoard();
    renderHistory();
    resetDashboard();
    if (selectedCalendarDate) renderMemoDayRecords(selectedCalendarDate);
  }

  function openExpenseEvent(event, id) {
    if (event) event.stopPropagation();
    const item = expenses.find(e => e.id === id);
    if (!item) return;
    selectedCalendarDate = item.date;
    document.getElementById("calendarMemoModal").style.display = "flex";
    openExpenseDetail(id);
  }

  function openInvestmentEvent(event, id, mode) {
    if (event) event.stopPropagation();
    const item = investments.find(i => i.id === id);
    if (!item) return;
    selectedCalendarDate = mode === "sell" ? item.sellDate : item.buyDate;
    document.getElementById("calendarMemoModal").style.display = "flex";
    openInvestmentDetail(id, mode);
  }

  function renderExpenseCalendar() {
    const box = document.getElementById("calendarBox");

    if (!box) return;

    if (!currentUser || !appData.users[currentUser]) {
      box.innerHTML = `<div class="empty-text">사용자를 먼저 선택해주세요.</div>`;
      return;
    }

    const targetMonth = calendarMonth || currentMonth || new Date().toISOString().slice(0, 7);
    syncCalendarPicker();

    const [year, month] = targetMonth.split("-").map(Number);
    const title = document.getElementById("calendarTitle");

    if (title) {
      title.innerText = `${year}년 ${month}월 소비 캘린더`;
    }

    const firstDay = new Date(year, month - 1, 1);
    const lastDate = new Date(year, month, 0).getDate();
    const startWeekday = firstDay.getDay();

    const eventsByDate = {};
    const noteDates = {};
    const userMonths = appData.users[currentUser].months || {};

    Object.keys(userMonths).forEach(monthKey => {
      const monthData = userMonths[monthKey];
      const monthExpenses = monthData.expenses || [];

      Object.entries(monthData.dateNotes || {}).forEach(([date, note]) => {
        if (date.startsWith(targetMonth) && String(note || "").trim()) noteDates[date] = true;
      });

      monthExpenses.forEach(item => {
        if (item.date && item.date.startsWith(targetMonth)) {
          if (!eventsByDate[item.date]) eventsByDate[item.date] = [];

          eventsByDate[item.date].push({
            className: getExpenseCalendarClass(item.category),
            text: `<span class="event-kind">${escapeHtml(item.category)}</span>${formatMoney(item.amount)}`,
            onclick: `openExpenseEvent(event, ${item.id})`
          });
        }
      });
    });

    drawCalendarGrid(box, targetMonth, startWeekday, lastDate, eventsByDate, noteDates);
  }

  function renderInvestmentCalendar() {
    const box = document.getElementById("calendarBox");

    if (!box) return;

    if (!currentUser || !appData.users[currentUser]) {
      box.innerHTML = `<div class="empty-text">사용자를 먼저 선택해주세요.</div>`;
      return;
    }

    const targetMonth = calendarMonth || currentMonth || new Date().toISOString().slice(0, 7);
    syncCalendarPicker();

    const [year, month] = targetMonth.split("-").map(Number);
    const title = document.getElementById("calendarTitle");

    if (title) {
      title.innerText = `${year}년 ${month}월 투자 캘린더`;
    }

    const firstDay = new Date(year, month - 1, 1);
    const lastDate = new Date(year, month, 0).getDate();
    const startWeekday = firstDay.getDay();

    const eventsByDate = {};
    const noteDates = {};
    const userMonths = appData.users[currentUser].months || {};

    Object.keys(userMonths).forEach(monthKey => {
      const monthData = userMonths[monthKey];

      Object.entries(monthData.dateNotes || {}).forEach(([date, note]) => {
        if (date.startsWith(targetMonth) && String(note || "").trim()) noteDates[date] = true;
      });

      const monthInvestments = monthData.investments || [];

      monthInvestments.forEach(item => {
        if (item.buyDate && item.buyDate.startsWith(targetMonth)) {
          if (!eventsByDate[item.buyDate]) eventsByDate[item.buyDate] = [];

          eventsByDate[item.buyDate].push({
            className: `calendar-buy ${getStockCalendarClass(item.name)}`,
            text: `<span class="event-kind">매수</span><strong>${escapeHtml(item.name)}</strong> ${formatMoney(item.investmentAmount)}`,
            onclick: `openInvestmentEvent(event, ${item.id}, 'buy')`
          });
        }

        if (item.isSold && item.sellDate && item.sellDate.startsWith(targetMonth)) {
          if (!eventsByDate[item.sellDate]) eventsByDate[item.sellDate] = [];

          eventsByDate[item.sellDate].push({
            className: `${item.realizedProfitLoss >= 0 ? "calendar-sell-profit" : "calendar-sell-loss"} ${getStockCalendarClass(item.name)}`,
            text: `<span class="event-kind">매도</span><strong>${escapeHtml(item.name)}</strong> ${formatMoney(item.realizedProfitLoss)}`,
            onclick: `openInvestmentEvent(event, ${item.id}, 'sell')`
          });
        }
      });
    });

    drawCalendarGrid(box, targetMonth, startWeekday, lastDate, eventsByDate, noteDates);
  }

  function drawCalendarGrid(box, targetMonth, startWeekday, lastDate, eventsByDate, noteDates = {}) {
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    let calendarHtml = `<div class="calendar-grid">`;

    weekdays.forEach(day => {
      calendarHtml += `<div class="calendar-weekday">${day}</div>`;
    });

    for (let i = 0; i < startWeekday; i++) {
      calendarHtml += `<div class="calendar-cell empty"></div>`;
    }

    for (let day = 1; day <= lastDate; day++) {
      const dateText = `${targetMonth}-${String(day).padStart(2, "0")}`;
      const events = eventsByDate[dateText] || [];
      const hasNoteClass = noteDates[dateText] ? "calendar-has-note" : "";

      calendarHtml += `
        <div class="calendar-cell ${hasNoteClass}" onclick="openCalendarMemo('${dateText}')">
          <div class="calendar-date-number">${day}</div>
          ${
            events.length === 0
              ? ""
              : events.map(event => `
                <div class="calendar-event ${event.className || ""}" onclick="${event.onclick || ""}">
                  ${event.text}
                </div>
              `).join("")
          }
        </div>
      `;
    }

    calendarHtml += `</div>`;
    box.innerHTML = calendarHtml;
  }

  function changeCalendarMonth(diff) {
    const baseMonth = calendarMonth || currentMonth || new Date().toISOString().slice(0, 7);
    const [year, month] = baseMonth.split("-").map(Number);
    const date = new Date(year, month - 1 + diff, 1);

    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, "0");

    calendarMonth = `${newYear}-${newMonth}`;
    syncCalendarPicker();
    renderCalendar();
  }

  function goCurrentCalendarMonth() {
    calendarMonth = currentMonth || new Date().toISOString().slice(0, 7);
    syncCalendarPicker();
    renderCalendar();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replaceAll("`", "&#096;");
  }


  function getAllOpenHoldings() {
    return getOpenInvestments();
  }

  function recalculateInvestmentItem(item, currentPrice) {
    item.currentPrice = Number(currentPrice || item.buyPrice || 0);
    item.investmentAmount = Number(item.buyPrice || 0) * Number(item.quantity || 0);
    item.evaluationAmount = item.currentPrice * Number(item.quantity || 0);
    item.profitLoss = item.evaluationAmount - item.investmentAmount;
    item.returnRate = item.investmentAmount === 0 ? 0 : (item.profitLoss / item.investmentAmount) * 100;
  }

  function renderHoldingsBoard() {
    const box = document.getElementById("holdingList");
    if (!box) return;

    if (!currentUser || !appData.users[currentUser]) {
      box.innerHTML = `<div class="empty-text">사용자를 먼저 선택해주세요.</div>`;
      return;
    }

    const holdings = getAllOpenHoldings().sort((a, b) => String(a.buyDate).localeCompare(String(b.buyDate)));

    if (holdings.length === 0) {
      box.innerHTML = `<div class="empty-text">현재 보유 중인 종목이 없습니다. 캘린더에서 매수 기록을 추가하면 이곳에 표시됩니다.</div>`;
      return;
    }

    box.innerHTML = holdings.map(item => {
      const profitClass = Number(item.profitLoss || 0) >= 0 ? "profit" : "loss";
      const currentPrice = Number(item.currentPrice || item.buyPrice || 0);
      const returnRate = Number(item.returnRate || 0);

      return `
        <div class="holding-card">
          <div>
            <div class="holding-card-title">
              ${escapeHtml(item.name)}
              <span class="badge">보유중</span>
              <span class="badge">${item.sourceMonth}</span>
            </div>
            <div class="holding-metrics">
              <div class="holding-metric">매수일<strong>${item.buyDate}</strong></div>
              <div class="holding-metric">매수가<strong>${formatMoney(item.buyPrice)}</strong></div>
              <div class="holding-metric">수량<strong>${item.quantity}주</strong></div>
              <div class="holding-metric">매수원금<strong>${formatMoney(item.investmentAmount)}</strong></div>
              <div class="holding-metric">현재가<strong>${formatMoney(currentPrice)}</strong></div>
              <div class="holding-metric">평가금액<strong>${formatMoney(item.evaluationAmount || 0)}</strong></div>
              <div class="holding-metric">평가손익<strong class="${profitClass}">${formatMoney(item.profitLoss || 0)} (${returnRate.toFixed(2)}%)</strong></div>
            </div>
            ${item.memo ? `<div class="memo-box">매수 메모: ${escapeHtml(item.memo)}</div>` : ""}
          </div>
          <div class="holding-actions">
            <input type="number" id="holdingPrice-${item.sourceMonth}-${item.id}" placeholder="현재가 입력" value="${currentPrice || ""}">
            <button onclick="updateHoldingCurrentPrice('${item.sourceMonth}', ${item.id})">현재가 업데이트</button>
            <button class="sub-btn" onclick="openHoldingSellFromBoard('${item.sourceMonth}', ${item.id})">이 종목 매도 기록</button>
          </div>
        </div>
      `;
    }).join("");
  }

  function updateHoldingCurrentPrice(sourceMonth, id) {
    const data = ensureMonthData(sourceMonth);
    const item = (data.investments || []).find(i => i.id === id && !i.isSold);
    const input = document.getElementById(`holdingPrice-${sourceMonth}-${id}`);
    const currentPrice = Number(input?.value || 0);

    if (!item) {
      alert("현재가를 업데이트할 보유 종목을 찾을 수 없습니다.");
      return;
    }

    if (currentPrice <= 0) {
      alert("현재가를 올바르게 입력해주세요.");
      return;
    }

    recalculateInvestmentItem(item, currentPrice);
    data.summary = null;
    saveStorage();

    if (sourceMonth === currentMonth) {
      investments = data.investments || [];
    }

    renderHoldingsBoard();
    renderLists();
    renderHistory();
    resetDashboard();
    alert("현재가가 업데이트되었습니다.");
  }

  function simulateCurrentPriceUpdate() {
    const holdings = getAllOpenHoldings();

    if (holdings.length === 0) {
      alert("시연용 현재가를 갱신할 보유 종목이 없습니다.");
      return;
    }

    holdings.forEach(item => {
      const data = ensureMonthData(item.sourceMonth);
      const original = (data.investments || []).find(i => i.id === item.id && !i.isSold);
      if (!original) return;

      let hash = 0;
      String(original.name || "").split("").forEach((char, index) => {
        hash += char.charCodeAt(0) * (index + 1);
      });

      const ratio = 0.88 + ((hash % 31) / 100); // 0.88 ~ 1.18 범위 시연용
      const demoPrice = Math.max(1, Math.round(Number(original.buyPrice || 0) * ratio));
      recalculateInvestmentItem(original, demoPrice);
      data.summary = null;
    });

    saveStorage();
    loadMonth(currentMonth || new Date().toISOString().slice(0, 7));
    renderHoldingsBoard();
    alert("시연용 현재가가 갱신되었습니다. 실제 서비스에서는 증권 API 연동으로 대체할 수 있습니다.");
  }

  function openHoldingSellFromBoard(sourceMonth, id) {
    const today = getTodayDateString();
    openCalendarMemo(today);
    showMemoTab("investment");
    showInvestmentTradeMode("sell");

    const select = document.getElementById("memoSellHoldingSelect");
    if (select) {
      select.value = `${sourceMonth}|${id}`;
      updateSelectedHoldingPreview();
    }
  }


  function formatMoney(value) {
    return Number(value).toLocaleString("ko-KR") + "원";
  }


  /* v10: 목표 관리, 오늘 날짜 강조, 다크모드 개선 */
  function updateThemeToggleLabel() {
    const btn = document.getElementById("themeToggleBtn") || document.querySelector(".fixed-theme-toggle");
    if (!btn) return;
    btn.innerText = document.body.classList.contains("dark-mode") ? "☀️ 라이트모드" : "🌙 다크모드";
  }

  function initDarkMode() {
    const isDark = localStorage.getItem("ssak3DarkMode") === "true";
    document.body.classList.toggle("dark-mode", isDark);
    updateThemeToggleLabel();
  }

  function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("ssak3DarkMode", document.body.classList.contains("dark-mode"));
    updateThemeToggleLabel();
  }

  function showTab(tabId) {
    const tabs = ["calendarTab", "goalTab", "resultTab", "reportTab", "historyTab"];
    const buttons = ["calendarTabBtn", "goalTabBtn", "resultTabBtn", "reportTabBtn", "historyTabBtn"];

    tabs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });

    buttons.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove("active");
    });

    const targetTab = document.getElementById(tabId);
    const targetBtn = document.getElementById(tabId + "Btn");
    if (targetTab) targetTab.style.display = "block";
    if (targetBtn) targetBtn.classList.add("active");

    if (tabId === "calendarTab") renderCalendar();
    if (tabId === "goalTab") renderGoalManagement();
    if (tabId === "historyTab") {
      renderHoldingsBoard();
      renderRealizedBoard();
      renderHistory();
    }
  }

  function getCurrentMonthRecord() {
    if (!currentUser || !currentMonth || !appData.users[currentUser]) return null;
    if (!appData.users[currentUser].months[currentMonth]) {
      appData.users[currentUser].months[currentMonth] = {
        basicInfo: { month: currentMonth, income: 0, availableInvestment: 0, budgetGoal: 0, savingGoal: 0 },
        expenses: [],
        investments: [],
        summary: null,
        dateNotes: {}
      };
    }
    return appData.users[currentUser].months[currentMonth];
  }

  function getMonthTotals(month) {
    const empty = { income: 0, budgetGoal: 0, availableInvestment: 0, savingGoal: 0, expenseTotal: 0, investmentTotal: 0, realizedProfit: 0, remainAfterExpense: 0, estimatedSaving: 0 };
    if (!currentUser || !appData.users[currentUser]) return empty;
    const data = appData.users[currentUser].months[month] || {};
    const basic = data.basicInfo || {};
    const monthExpenses = data.expenses || [];
    const monthInvestments = data.investments || [];
    const expenseTotal = monthExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const investmentTotal = monthInvestments.reduce((sum, item) => sum + Number(item.investmentAmount || 0), 0);
    const realizedProfit = monthInvestments.filter(item => item.isSold).reduce((sum, item) => sum + Number(item.realizedProfitLoss || 0), 0);
    const income = Number(basic.income || 0);
    const budgetGoal = Number(basic.budgetGoal || 0);
    const availableInvestment = Number(basic.availableInvestment || 0);
    const savingGoal = Number(basic.savingGoal || 0);
    return {
      income,
      budgetGoal,
      availableInvestment,
      savingGoal,
      expenseTotal,
      investmentTotal,
      realizedProfit,
      remainAfterExpense: income - expenseTotal,
      estimatedSaving: income - expenseTotal - investmentTotal
    };
  }

  function goalRate(used, target) {
    if (!target || target <= 0) return 0;
    return Math.max(0, (Number(used || 0) / Number(target)) * 100);
  }

  function progressClass(rate, inverse = false) {
    if (inverse) {
      if (rate >= 120) return "danger";
      if (rate >= 100) return "warning";
      return "";
    }
    if (rate < 50) return "danger";
    if (rate < 80) return "warning";
    return "";
  }

  function renderGoalManagement() {
    const month = currentMonth || new Date().toISOString().slice(0, 7);
    const record = getCurrentMonthRecord();
    const basic = record?.basicInfo || basicInfo || {};

    const goalMonth = document.getElementById("goalMonth");
    const goalIncome = document.getElementById("goalIncome");
    const goalBudget = document.getElementById("goalBudget");
    const goalAvailableInvestment = document.getElementById("goalAvailableInvestment");
    const goalSaving = document.getElementById("goalSaving");

    if (goalMonth) goalMonth.value = month;
    if (goalIncome) goalIncome.value = basic.income || "";
    if (goalBudget) goalBudget.value = basic.budgetGoal || "";
    if (goalAvailableInvestment) goalAvailableInvestment.value = basic.availableInvestment || "";
    if (goalSaving) goalSaving.value = basic.savingGoal || "";

    const t = getMonthTotals(month);
    const budgetRate = goalRate(t.expenseTotal, t.budgetGoal);
    const investRate = goalRate(t.investmentTotal, t.availableInvestment);
    const savingRate = goalRate(Math.max(t.estimatedSaving, 0), t.savingGoal);
    const cashRemain = t.income - t.expenseTotal - t.investmentTotal;

    const summaryBox = document.getElementById("goalSummaryGrid");
    if (summaryBox) {
      summaryBox.innerHTML = `
        <div class="goal-summary-card"><span>이번 달 소비</span><strong>${formatMoney(t.expenseTotal)}</strong></div>
        <div class="goal-summary-card"><span>소비 목표</span><strong>${formatMoney(t.budgetGoal)}</strong></div>
        <div class="goal-summary-card"><span>투자 원금</span><strong>${formatMoney(t.investmentTotal)}</strong></div>
        <div class="goal-summary-card"><span>예상 잔여금</span><strong class="${cashRemain >= 0 ? "profit" : "loss"}">${formatMoney(cashRemain)}</strong></div>
      `;
    }

    const progressBox = document.getElementById("goalProgressPanel");
    if (progressBox) {
      progressBox.innerHTML = `
        ${makeGoalProgress("소비 목표 사용률", budgetRate, `${formatMoney(t.expenseTotal)} / ${formatMoney(t.budgetGoal)}`, true)}
        ${makeGoalProgress("투자 가능 금액 사용률", investRate, `${formatMoney(t.investmentTotal)} / ${formatMoney(t.availableInvestment)}`, true)}
        ${makeGoalProgress("저축 목표 달성률", savingRate, `${formatMoney(Math.max(t.estimatedSaving, 0))} / ${formatMoney(t.savingGoal)}`, false)}
      `;
    }

    const badge = document.getElementById("goalOverallBadge");
    const advice = document.getElementById("goalAiAdvice");
    let status = "양호";
    let message = "현재 목표 흐름은 비교적 안정적입니다. 캘린더 기록을 계속 누적하면 더 정확하게 판단할 수 있습니다.";

    if (budgetRate >= 120 || investRate >= 120 || cashRemain < 0) {
      status = "위험";
      message = "이번 달은 목표 대비 지출 또는 투자 사용률이 높습니다. 추가 소비와 추가 매수 전 잔여 예산을 먼저 확인하는 것이 좋습니다.";
    } else if (budgetRate >= 100 || investRate >= 100 || (t.savingGoal > 0 && savingRate < 60)) {
      status = "주의";
      message = "목표 관리에 주의가 필요합니다. 소비 목표 초과 여부와 저축 가능 금액을 함께 확인해보세요.";
    } else if (t.savingGoal > 0 && savingRate >= 100) {
      status = "달성권";
      message = "저축 목표 달성 흐름이 좋습니다. 남은 기간에는 불필요한 변동 지출만 관리하면 좋습니다.";
    }

    if (badge) {
      badge.innerText = status;
      badge.style.background = status === "위험" ? "#ef4444" : status === "주의" ? "#f59e0b" : "#2563eb";
    }
    if (advice) advice.innerText = "AI 목표 코멘트: " + message;
  }

  function makeGoalProgress(title, rate, detail, inverse) {
    const width = Math.min(rate || 0, 130);
    const cls = progressClass(rate, inverse);
    return `
      <div class="goal-progress-row">
        <div class="goal-progress-title"><span>${title}</span><small>${detail} · ${rate.toFixed(1)}%</small></div>
        <div class="progress-bar"><div class="progress-fill ${cls}" style="width:${width}%"></div></div>
      </div>
    `;
  }

  function loadGoalMonth() {
    const month = document.getElementById("goalMonth")?.value;
    if (!month) return;
    document.getElementById("targetMonth").value = month;
    loadMonth(month);
    showTab("goalTab");
  }

  function saveGoalManagement() {
    if (!ensureUserSelected()) return;

    const month = document.getElementById("goalMonth")?.value || currentMonth || new Date().toISOString().slice(0, 7);
    const income = Number(document.getElementById("goalIncome")?.value || 0);
    const budgetGoal = Number(document.getElementById("goalBudget")?.value || 0);
    const availableInvestment = Number(document.getElementById("goalAvailableInvestment")?.value || 0);
    const savingGoal = Number(document.getElementById("goalSaving")?.value || 0);

    if (!month || income <= 0) {
      alert("목표 월과 월 수입을 올바르게 입력해주세요.");
      return;
    }

    if (month !== currentMonth) {
      document.getElementById("targetMonth").value = month;
      loadMonth(month);
    }

    basicInfo = {
      ...(basicInfo || {}),
      month,
      income,
      availableInvestment: availableInvestment >= 0 ? availableInvestment : 0,
      budgetGoal: budgetGoal >= 0 ? budgetGoal : 0,
      savingGoal: savingGoal >= 0 ? savingGoal : 0
    };

    appData.users[currentUser].months[month].basicInfo = basicInfo;
    appData.users[currentUser].months[month].summary = null;

    const targetMonthEl = document.getElementById("targetMonth");
    const incomeEl = document.getElementById("monthlyIncome");
    const availableEl = document.getElementById("availableInvestment");
    const budgetEl = document.getElementById("budgetGoal");
    if (targetMonthEl) targetMonthEl.value = month;
    if (incomeEl) incomeEl.value = income || "";
    if (availableEl) availableEl.value = availableInvestment || "";
    if (budgetEl) budgetEl.value = budgetGoal || "";

    saveCurrentMonthData();
    renderBasicInfo();
    renderGoalManagement();
    renderCalendar();
    resetDashboard();
    alert("목표 관리 정보가 저장되었습니다.");
  }

  function saveBasicInfo() {
    if (!ensureUserSelected()) return;

    const month = document.getElementById("targetMonth").value;
    const income = Number(document.getElementById("monthlyIncome").value);
    const availableInvestment = Number(document.getElementById("availableInvestment").value);
    const budgetGoal = Number(document.getElementById("budgetGoal").value);
    const oldSavingGoal = Number((appData.users[currentUser]?.months?.[month]?.basicInfo?.savingGoal) || basicInfo.savingGoal || 0);

    if (!month || income <= 0) {
      alert("분석할 월과 월 수입을 올바르게 입력해주세요.");
      return;
    }

    if (month !== currentMonth) loadMonth(month);

    basicInfo = {
      ...(basicInfo || {}),
      month,
      income,
      availableInvestment: availableInvestment >= 0 ? availableInvestment : 0,
      budgetGoal: budgetGoal >= 0 ? budgetGoal : 0,
      savingGoal: oldSavingGoal >= 0 ? oldSavingGoal : 0
    };

    appData.users[currentUser].months[month].basicInfo = basicInfo;
    appData.users[currentUser].months[month].summary = null;
    saveCurrentMonthData();
    renderBasicInfo();
    renderCalendar();
    renderGoalManagement();
    resetDashboard();

    alert("기본정보가 저장되었습니다.");
  }

  function renderBasicInfo() {
    const box = document.getElementById("basicInfoBox");
    if (!box) return;

    if (!basicInfo.month || basicInfo.income <= 0) {
      box.innerHTML = `<div class="empty-text">분석할 월, 수입, 투자 가능 금액, 목표를 입력해주세요.</div>`;
      return;
    }

    box.innerHTML = `
      <div class="item"><span>분석 월: ${basicInfo.month}</span></div>
      <div class="item"><span>월 수입: ${formatMoney(basicInfo.income)}</span></div>
      <div class="item"><span>투자 가능 금액: ${formatMoney(basicInfo.availableInvestment)}</span></div>
      <div class="item"><span>목표 소비 한도: ${formatMoney(basicInfo.budgetGoal)}</span></div>
      <div class="item"><span>저축 목표: ${formatMoney(basicInfo.savingGoal || 0)}</span></div>
    `;
  }

  function renderCalendarMonthSummary() {
    const box = document.getElementById("calendarMonthSummary");
    if (!box) return;

    if (!currentUser || !appData.users[currentUser]) {
      box.innerHTML = "";
      return;
    }

    const targetMonth = calendarMonth || currentMonth || new Date().toISOString().slice(0, 7);
    const t = getMonthTotals(targetMonth);
    const remainingInvest = t.availableInvestment - t.investmentTotal;
    const budgetRemain = t.budgetGoal - t.expenseTotal;

    box.innerHTML = `
      <div class="calendar-summary-card"><span>이번 달 소비 총액</span><strong>${formatMoney(t.expenseTotal)}</strong></div>
      <div class="calendar-summary-card"><span>소비 목표 잔여</span><strong class="${budgetRemain >= 0 ? "profit" : "loss"}">${formatMoney(budgetRemain)}</strong></div>
      <div class="calendar-summary-card"><span>이번 달 투자 원금</span><strong>${formatMoney(t.investmentTotal)}</strong></div>
      <div class="calendar-summary-card"><span>저축 예상 금액</span><strong class="${t.estimatedSaving >= 0 ? "profit" : "loss"}">${formatMoney(t.estimatedSaving)}</strong></div>
      <div class="calendar-summary-card"><span>매도 실현손익</span><strong class="${t.realizedProfit >= 0 ? "profit" : "loss"}">${formatMoney(t.realizedProfit)}</strong></div>
      <div class="calendar-summary-card"><span>남은 투자 가능 금액</span><strong class="${remainingInvest >= 0 ? "profit" : "loss"}">${formatMoney(remainingInvest)}</strong></div>
    `;
  }

  function drawCalendarGrid(box, targetMonth, startWeekday, lastDate, eventsByDate, noteDates = {}) {
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const todayText = getTodayDateString();
    let calendarHtml = `<div class="calendar-grid">`;

    weekdays.forEach(day => {
      calendarHtml += `<div class="calendar-weekday">${day}</div>`;
    });

    for (let i = 0; i < startWeekday; i++) {
      calendarHtml += `<div class="calendar-cell empty"></div>`;
    }

    for (let day = 1; day <= lastDate; day++) {
      const dateText = `${targetMonth}-${String(day).padStart(2, "0")}`;
      const events = eventsByDate[dateText] || [];
      const hasNoteClass = noteDates[dateText] ? "calendar-has-note" : "";
      const todayClass = dateText === todayText ? "calendar-today" : "";
      const todayBadge = dateText === todayText ? `<span class="today-badge">TODAY</span>` : "";

      calendarHtml += `
        <div class="calendar-cell ${hasNoteClass} ${todayClass}" onclick="openCalendarMemo('${dateText}')">
          <div class="calendar-date-number">${day}${todayBadge}</div>
          ${
            events.length === 0
              ? ""
              : events.map(event => `
                <div class="calendar-event ${event.className || ""}" onclick="${event.onclick || ""}">
                  ${event.text}
                </div>
              `).join("")
          }
        </div>
      `;
    }

    calendarHtml += `</div>`;
    box.innerHTML = calendarHtml;
  }




  /* v10: 목표 관리, 오늘 날짜 강조, 다크모드 개선 */
  function updateThemeToggleLabel() {
    const btn = document.getElementById("themeToggleBtn") || document.querySelector(".fixed-theme-toggle");
    if (!btn) return;
    btn.innerText = document.body.classList.contains("dark-mode") ? "☀️ 라이트모드" : "🌙 다크모드";
  }

  function initDarkMode() {
    const isDark = localStorage.getItem("ssak3DarkMode") === "true";
    document.body.classList.toggle("dark-mode", isDark);
    updateThemeToggleLabel();
  }

  function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("ssak3DarkMode", document.body.classList.contains("dark-mode"));
    updateThemeToggleLabel();
  }

  function showTab(tabId) {
    const tabs = ["calendarTab", "goalTab", "resultTab", "reportTab", "historyTab"];
    const buttons = ["calendarTabBtn", "goalTabBtn", "resultTabBtn", "reportTabBtn", "historyTabBtn"];

    tabs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });

    buttons.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove("active");
    });

    const targetTab = document.getElementById(tabId);
    const targetBtn = document.getElementById(tabId + "Btn");
    if (targetTab) targetTab.style.display = "block";
    if (targetBtn) targetBtn.classList.add("active");

    if (tabId === "calendarTab") renderCalendar();
    if (tabId === "goalTab") renderGoalManagement();
    if (tabId === "historyTab") {
      renderHoldingsBoard();
      renderRealizedBoard();
      renderHistory();
    }
  }

  function getCurrentMonthRecord() {
    if (!currentUser || !currentMonth || !appData.users[currentUser]) return null;
    if (!appData.users[currentUser].months[currentMonth]) {
      appData.users[currentUser].months[currentMonth] = {
        basicInfo: { month: currentMonth, income: 0, availableInvestment: 0, budgetGoal: 0, savingGoal: 0 },
        expenses: [],
        investments: [],
        summary: null,
        dateNotes: {}
      };
    }
    return appData.users[currentUser].months[currentMonth];
  }

  function getMonthTotals(month) {
    const empty = { income: 0, budgetGoal: 0, availableInvestment: 0, savingGoal: 0, expenseTotal: 0, investmentTotal: 0, realizedProfit: 0, remainAfterExpense: 0, estimatedSaving: 0 };
    if (!currentUser || !appData.users[currentUser]) return empty;
    const data = appData.users[currentUser].months[month] || {};
    const basic = data.basicInfo || {};
    const monthExpenses = data.expenses || [];
    const monthInvestments = data.investments || [];
    const expenseTotal = monthExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const investmentTotal = monthInvestments.reduce((sum, item) => sum + Number(item.investmentAmount || 0), 0);
    const realizedProfit = monthInvestments.filter(item => item.isSold).reduce((sum, item) => sum + Number(item.realizedProfitLoss || 0), 0);
    const income = Number(basic.income || 0);
    const budgetGoal = Number(basic.budgetGoal || 0);
    const availableInvestment = Number(basic.availableInvestment || 0);
    const savingGoal = Number(basic.savingGoal || 0);
    return {
      income,
      budgetGoal,
      availableInvestment,
      savingGoal,
      expenseTotal,
      investmentTotal,
      realizedProfit,
      remainAfterExpense: income - expenseTotal,
      estimatedSaving: income - expenseTotal - investmentTotal
    };
  }

  function goalRate(used, target) {
    if (!target || target <= 0) return 0;
    return Math.max(0, (Number(used || 0) / Number(target)) * 100);
  }

  function progressClass(rate, inverse = false) {
    if (inverse) {
      if (rate >= 120) return "danger";
      if (rate >= 100) return "warning";
      return "";
    }
    if (rate < 50) return "danger";
    if (rate < 80) return "warning";
    return "";
  }

  function renderGoalManagement() {
    const month = currentMonth || new Date().toISOString().slice(0, 7);
    const record = getCurrentMonthRecord();
    const basic = record?.basicInfo || basicInfo || {};

    const goalMonth = document.getElementById("goalMonth");
    const goalIncome = document.getElementById("goalIncome");
    const goalBudget = document.getElementById("goalBudget");
    const goalAvailableInvestment = document.getElementById("goalAvailableInvestment");
    const goalSaving = document.getElementById("goalSaving");

    if (goalMonth) goalMonth.value = month;
    if (goalIncome) goalIncome.value = basic.income || "";
    if (goalBudget) goalBudget.value = basic.budgetGoal || "";
    if (goalAvailableInvestment) goalAvailableInvestment.value = basic.availableInvestment || "";
    if (goalSaving) goalSaving.value = basic.savingGoal || "";

    const t = getMonthTotals(month);
    const budgetRate = goalRate(t.expenseTotal, t.budgetGoal);
    const investRate = goalRate(t.investmentTotal, t.availableInvestment);
    const savingRate = goalRate(Math.max(t.estimatedSaving, 0), t.savingGoal);
    const cashRemain = t.income - t.expenseTotal - t.investmentTotal;

    const summaryBox = document.getElementById("goalSummaryGrid");
    if (summaryBox) {
      summaryBox.innerHTML = `
        <div class="goal-summary-card"><span>이번 달 소비</span><strong>${formatMoney(t.expenseTotal)}</strong></div>
        <div class="goal-summary-card"><span>소비 목표</span><strong>${formatMoney(t.budgetGoal)}</strong></div>
        <div class="goal-summary-card"><span>투자 원금</span><strong>${formatMoney(t.investmentTotal)}</strong></div>
        <div class="goal-summary-card"><span>예상 잔여금</span><strong class="${cashRemain >= 0 ? "profit" : "loss"}">${formatMoney(cashRemain)}</strong></div>
      `;
    }

    const progressBox = document.getElementById("goalProgressPanel");
    if (progressBox) {
      progressBox.innerHTML = `
        ${makeGoalProgress("소비 목표 사용률", budgetRate, `${formatMoney(t.expenseTotal)} / ${formatMoney(t.budgetGoal)}`, true)}
        ${makeGoalProgress("투자 가능 금액 사용률", investRate, `${formatMoney(t.investmentTotal)} / ${formatMoney(t.availableInvestment)}`, true)}
        ${makeGoalProgress("저축 목표 달성률", savingRate, `${formatMoney(Math.max(t.estimatedSaving, 0))} / ${formatMoney(t.savingGoal)}`, false)}
      `;
    }

    const badge = document.getElementById("goalOverallBadge");
    const advice = document.getElementById("goalAiAdvice");
    let status = "양호";
    let message = "현재 목표 흐름은 비교적 안정적입니다. 캘린더 기록을 계속 누적하면 더 정확하게 판단할 수 있습니다.";

    if (budgetRate >= 120 || investRate >= 120 || cashRemain < 0) {
      status = "위험";
      message = "이번 달은 목표 대비 지출 또는 투자 사용률이 높습니다. 추가 소비와 추가 매수 전 잔여 예산을 먼저 확인하는 것이 좋습니다.";
    } else if (budgetRate >= 100 || investRate >= 100 || (t.savingGoal > 0 && savingRate < 60)) {
      status = "주의";
      message = "목표 관리에 주의가 필요합니다. 소비 목표 초과 여부와 저축 가능 금액을 함께 확인해보세요.";
    } else if (t.savingGoal > 0 && savingRate >= 100) {
      status = "달성권";
      message = "저축 목표 달성 흐름이 좋습니다. 남은 기간에는 불필요한 변동 지출만 관리하면 좋습니다.";
    }

    if (badge) {
      badge.innerText = status;
      badge.style.background = status === "위험" ? "#ef4444" : status === "주의" ? "#f59e0b" : "#2563eb";
    }
    if (advice) advice.innerText = "AI 목표 코멘트: " + message;
  }

  function makeGoalProgress(title, rate, detail, inverse) {
    const width = Math.min(rate || 0, 130);
    const cls = progressClass(rate, inverse);
    return `
      <div class="goal-progress-row">
        <div class="goal-progress-title"><span>${title}</span><small>${detail} · ${rate.toFixed(1)}%</small></div>
        <div class="progress-bar"><div class="progress-fill ${cls}" style="width:${width}%"></div></div>
      </div>
    `;
  }

  function loadGoalMonth() {
    const month = document.getElementById("goalMonth")?.value;
    if (!month) return;
    document.getElementById("targetMonth").value = month;
    loadMonth(month);
    showTab("goalTab");
  }

  function saveGoalManagement() {
    if (!ensureUserSelected()) return;

    const month = document.getElementById("goalMonth")?.value || currentMonth || new Date().toISOString().slice(0, 7);
    const income = Number(document.getElementById("goalIncome")?.value || 0);
    const budgetGoal = Number(document.getElementById("goalBudget")?.value || 0);
    const availableInvestment = Number(document.getElementById("goalAvailableInvestment")?.value || 0);
    const savingGoal = Number(document.getElementById("goalSaving")?.value || 0);

    if (!month || income <= 0) {
      alert("목표 월과 월 수입을 올바르게 입력해주세요.");
      return;
    }

    if (month !== currentMonth) {
      document.getElementById("targetMonth").value = month;
      loadMonth(month);
    }

    basicInfo = {
      ...(basicInfo || {}),
      month,
      income,
      availableInvestment: availableInvestment >= 0 ? availableInvestment : 0,
      budgetGoal: budgetGoal >= 0 ? budgetGoal : 0,
      savingGoal: savingGoal >= 0 ? savingGoal : 0
    };

    appData.users[currentUser].months[month].basicInfo = basicInfo;
    appData.users[currentUser].months[month].summary = null;

    const targetMonthEl = document.getElementById("targetMonth");
    const incomeEl = document.getElementById("monthlyIncome");
    const availableEl = document.getElementById("availableInvestment");
    const budgetEl = document.getElementById("budgetGoal");
    if (targetMonthEl) targetMonthEl.value = month;
    if (incomeEl) incomeEl.value = income || "";
    if (availableEl) availableEl.value = availableInvestment || "";
    if (budgetEl) budgetEl.value = budgetGoal || "";

    saveCurrentMonthData();
    renderBasicInfo();
    renderGoalManagement();
    renderCalendar();
    resetDashboard();
    alert("목표 관리 정보가 저장되었습니다.");
  }

  function saveBasicInfo() {
    if (!ensureUserSelected()) return;

    const month = document.getElementById("targetMonth").value;
    const income = Number(document.getElementById("monthlyIncome").value);
    const availableInvestment = Number(document.getElementById("availableInvestment").value);
    const budgetGoal = Number(document.getElementById("budgetGoal").value);
    const oldSavingGoal = Number((appData.users[currentUser]?.months?.[month]?.basicInfo?.savingGoal) || basicInfo.savingGoal || 0);

    if (!month || income <= 0) {
      alert("분석할 월과 월 수입을 올바르게 입력해주세요.");
      return;
    }

    if (month !== currentMonth) loadMonth(month);

    basicInfo = {
      ...(basicInfo || {}),
      month,
      income,
      availableInvestment: availableInvestment >= 0 ? availableInvestment : 0,
      budgetGoal: budgetGoal >= 0 ? budgetGoal : 0,
      savingGoal: oldSavingGoal >= 0 ? oldSavingGoal : 0
    };

    appData.users[currentUser].months[month].basicInfo = basicInfo;
    appData.users[currentUser].months[month].summary = null;
    saveCurrentMonthData();
    renderBasicInfo();
    renderCalendar();
    renderGoalManagement();
    resetDashboard();

    alert("기본정보가 저장되었습니다.");
  }

  function renderBasicInfo() {
    const box = document.getElementById("basicInfoBox");
    if (!box) return;

    if (!basicInfo.month || basicInfo.income <= 0) {
      box.innerHTML = `<div class="empty-text">분석할 월, 수입, 투자 가능 금액, 목표를 입력해주세요.</div>`;
      return;
    }

    box.innerHTML = `
      <div class="item"><span>분석 월: ${basicInfo.month}</span></div>
      <div class="item"><span>월 수입: ${formatMoney(basicInfo.income)}</span></div>
      <div class="item"><span>투자 가능 금액: ${formatMoney(basicInfo.availableInvestment)}</span></div>
      <div class="item"><span>목표 소비 한도: ${formatMoney(basicInfo.budgetGoal)}</span></div>
      <div class="item"><span>저축 목표: ${formatMoney(basicInfo.savingGoal || 0)}</span></div>
    `;
  }

  function renderCalendarMonthSummary() {
    const box = document.getElementById("calendarMonthSummary");
    if (!box) return;

    if (!currentUser || !appData.users[currentUser]) {
      box.innerHTML = "";
      return;
    }

    const targetMonth = calendarMonth || currentMonth || new Date().toISOString().slice(0, 7);
    const t = getMonthTotals(targetMonth);
    const remainingInvest = t.availableInvestment - t.investmentTotal;
    const budgetRemain = t.budgetGoal - t.expenseTotal;

    box.innerHTML = `
      <div class="calendar-summary-card"><span>이번 달 소비 총액</span><strong>${formatMoney(t.expenseTotal)}</strong></div>
      <div class="calendar-summary-card"><span>소비 목표 잔여</span><strong class="${budgetRemain >= 0 ? "profit" : "loss"}">${formatMoney(budgetRemain)}</strong></div>
      <div class="calendar-summary-card"><span>이번 달 투자 원금</span><strong>${formatMoney(t.investmentTotal)}</strong></div>
      <div class="calendar-summary-card"><span>저축 예상 금액</span><strong class="${t.estimatedSaving >= 0 ? "profit" : "loss"}">${formatMoney(t.estimatedSaving)}</strong></div>
      <div class="calendar-summary-card"><span>매도 실현손익</span><strong class="${t.realizedProfit >= 0 ? "profit" : "loss"}">${formatMoney(t.realizedProfit)}</strong></div>
      <div class="calendar-summary-card"><span>남은 투자 가능 금액</span><strong class="${remainingInvest >= 0 ? "profit" : "loss"}">${formatMoney(remainingInvest)}</strong></div>
    `;
  }

  function drawCalendarGrid(box, targetMonth, startWeekday, lastDate, eventsByDate, noteDates = {}) {
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const todayText = getTodayDateString();
    let calendarHtml = `<div class="calendar-grid">`;

    weekdays.forEach(day => {
      calendarHtml += `<div class="calendar-weekday">${day}</div>`;
    });

    for (let i = 0; i < startWeekday; i++) {
      calendarHtml += `<div class="calendar-cell empty"></div>`;
    }

    for (let day = 1; day <= lastDate; day++) {
      const dateText = `${targetMonth}-${String(day).padStart(2, "0")}`;
      const events = eventsByDate[dateText] || [];
      const hasNoteClass = noteDates[dateText] ? "calendar-has-note" : "";
      const todayClass = dateText === todayText ? "calendar-today" : "";
      const todayBadge = dateText === todayText ? `<span class="today-badge">TODAY</span>` : "";

      calendarHtml += `
        <div class="calendar-cell ${hasNoteClass} ${todayClass}" onclick="openCalendarMemo('${dateText}')">
          <div class="calendar-date-number">${day}${todayBadge}</div>
          ${
            events.length === 0
              ? ""
              : events.map(event => `
                <div class="calendar-event ${event.className || ""}" onclick="${event.onclick || ""}">
                  ${event.text}
                </div>
              `).join("")
          }
        </div>
      `;
    }

    calendarHtml += `</div>`;
    box.innerHTML = calendarHtml;
  }



  /* v11: 목표 관리 역할 정리 - 목표 입력은 목표 관리, 캘린더는 기록/요약 중심 */
  function showTab(tabId) {
    const tabs = ["calendarTab", "goalTab", "resultTab", "reportTab", "historyTab"];
    const buttons = ["calendarTabBtn", "goalTabBtn", "resultTabBtn", "reportTabBtn", "historyTabBtn"];

    tabs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });

    buttons.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove("active");
    });

    const targetTab = document.getElementById(tabId);
    const targetBtn = document.getElementById(tabId + "Btn");
    if (targetTab) targetTab.style.display = "block";
    if (targetBtn) targetBtn.classList.add("active");

    if (tabId === "calendarTab") renderCalendar();
    if (tabId === "goalTab") renderGoalManagement();
    if (tabId === "historyTab") {
      renderHoldingsBoard();
      renderRealizedBoard();
      renderHistory();
    }
  }

  function renderCalendarGoalBrief() {
    const box = document.getElementById("calendarGoalBriefBody");
    if (!box) return;

    if (!currentUser || !appData.users[currentUser]) {
      box.innerHTML = `<div class="empty-text">사용자를 먼저 선택해주세요.</div>`;
      return;
    }

    const targetMonthValue = calendarMonth || currentMonth || new Date().toISOString().slice(0, 7);
    const t = getMonthTotals(targetMonthValue);
    const budgetRemain = t.budgetGoal - t.expenseTotal;
    const investRemain = t.availableInvestment - t.investmentTotal;
    const savingNeed = t.savingGoal - Math.max(t.estimatedSaving, 0);

    box.innerHTML = `
      <div class="calendar-goal-mini-card"><span>월 수입</span><strong>${formatMoney(t.income)}</strong></div>
      <div class="calendar-goal-mini-card"><span>소비 목표 잔여</span><strong class="${budgetRemain >= 0 ? "profit" : "loss"}">${formatMoney(budgetRemain)}</strong></div>
      <div class="calendar-goal-mini-card"><span>투자 가능 잔여</span><strong class="${investRemain >= 0 ? "profit" : "loss"}">${formatMoney(investRemain)}</strong></div>
      <div class="calendar-goal-mini-card"><span>저축 목표까지</span><strong class="${savingNeed <= 0 ? "profit" : "loss"}">${formatMoney(Math.max(savingNeed, 0))}</strong></div>
    `;
  }

  function renderCalendarMonthSummary() {
    const box = document.getElementById("calendarMonthSummary");
    if (!box) return;

    if (!currentUser || !appData.users[currentUser]) {
      box.innerHTML = "";
      renderCalendarGoalBrief();
      return;
    }

    const targetMonthValue = calendarMonth || currentMonth || new Date().toISOString().slice(0, 7);
    const t = getMonthTotals(targetMonthValue);
    const remainingInvest = t.availableInvestment - t.investmentTotal;
    const budgetRemain = t.budgetGoal - t.expenseTotal;

    box.innerHTML = `
      <div class="calendar-summary-card"><span>이번 달 소비 총액</span><strong>${formatMoney(t.expenseTotal)}</strong></div>
      <div class="calendar-summary-card"><span>소비 목표 잔여</span><strong class="${budgetRemain >= 0 ? "profit" : "loss"}">${formatMoney(budgetRemain)}</strong></div>
      <div class="calendar-summary-card"><span>이번 달 투자 원금</span><strong>${formatMoney(t.investmentTotal)}</strong></div>
      <div class="calendar-summary-card"><span>저축 예상 금액</span><strong class="${t.estimatedSaving >= 0 ? "profit" : "loss"}">${formatMoney(t.estimatedSaving)}</strong></div>
      <div class="calendar-summary-card"><span>매도 실현손익</span><strong class="${t.realizedProfit >= 0 ? "profit" : "loss"}">${formatMoney(t.realizedProfit)}</strong></div>
      <div class="calendar-summary-card"><span>남은 투자 가능 금액</span><strong class="${remainingInvest >= 0 ? "profit" : "loss"}">${formatMoney(remainingInvest)}</strong></div>
    `;
    renderCalendarGoalBrief();
  }

  function loadGoalMonth() {
    const month = document.getElementById("goalMonth")?.value;
    if (!month) return;
    const targetMonthEl = document.getElementById("targetMonth");
    if (targetMonthEl) targetMonthEl.value = month;
    loadMonth(month);
    showTab("goalTab");
  }

  function saveGoalManagement() {
    if (!ensureUserSelected()) return;

    const month = document.getElementById("goalMonth")?.value || currentMonth || new Date().toISOString().slice(0, 7);
    const income = Number(document.getElementById("goalIncome")?.value || 0);
    const budgetGoal = Number(document.getElementById("goalBudget")?.value || 0);
    const availableInvestment = Number(document.getElementById("goalAvailableInvestment")?.value || 0);
    const savingGoal = Number(document.getElementById("goalSaving")?.value || 0);

    if (!month || income <= 0) {
      alert("목표 월과 월 수입을 올바르게 입력해주세요.");
      return;
    }

    if (month !== currentMonth) {
      const targetMonthEl = document.getElementById("targetMonth");
      if (targetMonthEl) targetMonthEl.value = month;
      loadMonth(month);
    }

    basicInfo = {
      ...(basicInfo || {}),
      month,
      income,
      availableInvestment: availableInvestment >= 0 ? availableInvestment : 0,
      budgetGoal: budgetGoal >= 0 ? budgetGoal : 0,
      savingGoal: savingGoal >= 0 ? savingGoal : 0
    };

    appData.users[currentUser].months[month].basicInfo = basicInfo;
    appData.users[currentUser].months[month].summary = null;

    const targetMonthEl = document.getElementById("targetMonth");
    const incomeEl = document.getElementById("monthlyIncome");
    const availableEl = document.getElementById("availableInvestment");
    const budgetEl = document.getElementById("budgetGoal");
    if (targetMonthEl) targetMonthEl.value = month;
    if (incomeEl) incomeEl.value = income || "";
    if (availableEl) availableEl.value = availableInvestment || "";
    if (budgetEl) budgetEl.value = budgetGoal || "";

    saveCurrentMonthData();
    renderBasicInfo();
    renderGoalManagement();
    renderCalendar();
    resetDashboard();
    alert("목표 관리 정보가 저장되었습니다.");
  }

  function saveBasicInfo() {
    // 캘린더의 기본정보 입력을 제거했기 때문에, 기존 호출은 목표 관리 저장으로 연결합니다.
    saveGoalManagement();
  }

  function init() {
    initDarkMode();

    const today = new Date();
    const defaultMonth = today.toISOString().slice(0, 7);

    const targetMonthEl = document.getElementById("targetMonth");
    if (targetMonthEl) targetMonthEl.value = defaultMonth;
    setReportDateToToday();

    if (currentUser && appData.users[currentUser]) {
      document.getElementById("userNameInput").value = currentUser;
      loadUser(currentUser, defaultMonth);
      showApp();
    } else {
      showUserGate();
      resetDashboard();
      drawAllEmptyCharts();
    }
  }

  function selectUser() {
    const name = document.getElementById("userNameInput").value.trim();

    if (!name) {
      alert("사용자 이름을 입력해주세요.");
      return;
    }

    if (!appData.users[name]) {
      appData.users[name] = { months: {} };
    }

    appData.lastUser = name;
    currentUser = name;
    saveStorage();

    const targetMonthEl = document.getElementById("targetMonth");
    const month = targetMonthEl?.value || calendarMonth || new Date().toISOString().slice(0, 7);
    loadUser(currentUser, month);

    alert(`${currentUser} 사용자로 시작합니다.`);
    showApp();
  }

  function loadUser(userName, month) {
    currentUser = userName;
    appData.lastUser = userName;
    saveStorage();

    document.getElementById("userNameInput").value = userName;
    const targetMonthEl = document.getElementById("targetMonth");
    if (targetMonthEl) targetMonthEl.value = month;

    loadMonth(month);
    renderCurrentUser();
    renderUserList();
    updateAppUserBar();
  }

  function updateThemeToggleLabel() {
    const btn = document.getElementById("themeToggleBtn") || document.querySelector(".fixed-theme-toggle");
    if (!btn) return;
    btn.innerText = document.body.classList.contains("dark-mode") ? "☀️ 라이트모드" : "🌙 다크모드";
  }

  function initDarkMode() {
    const isDark = localStorage.getItem("ssak3DarkMode") === "true";
    document.body.classList.toggle("dark-mode", isDark);
    updateThemeToggleLabel();
  }

  function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("ssak3DarkMode", document.body.classList.contains("dark-mode"));
    updateThemeToggleLabel();
  }


(function () {
  function getMonthDataSafe(month) {
    if (!currentUser || !appData.users[currentUser]) return null;
    return appData.users[currentUser].months?.[month] || null;
  }

  function getPreviousMonthKey(month) {
    if (!month) return "";
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  function sumExpensesByDate(month) {
    const data = getMonthDataSafe(month);
    const map = {};
    (data?.expenses || []).forEach(item => {
      if (!item.date || !item.date.startsWith(month)) return;
      map[item.date] = (map[item.date] || 0) + Number(item.amount || 0);
    });
    return map;
  }

  function sumInvestmentsByDate(month) {
    const data = getMonthDataSafe(month);
    const map = {};
    (data?.investments || []).forEach(item => {
      if (item.buyDate && item.buyDate.startsWith(month)) {
        map[item.buyDate] = (map[item.buyDate] || 0) + Number(item.investmentAmount || 0);
      }
      if (item.isSold && item.sellDate && item.sellDate.startsWith(month)) {
        map[item.sellDate] = (map[item.sellDate] || 0) + Math.abs(Number(item.sellAmount || 0));
      }
    });
    return map;
  }

  function getCategoryMap(month) {
    const data = getMonthDataSafe(month);
    const map = {};
    (data?.expenses || []).forEach(item => {
      const key = item.category || "기타";
      map[key] = (map[key] || 0) + Number(item.amount || 0);
    });
    return map;
  }

  function getCurrentMonthKeyForFeature() {
    return calendarMonth || currentMonth || new Date().toISOString().slice(0, 7);
  }

  function getAiRiskInsights() {
    const month = currentMonth || getCurrentMonthKeyForFeature();
    const data = getMonthDataSafe(month);
    if (!data) {
      return [{ level: "safe", title: "데이터 대기", body: "목표와 소비·투자 기록을 입력하면 AI 위험 감지가 표시됩니다." }];
    }

    const basic = data.basicInfo || {};
    const expensesList = data.expenses || [];
    const investmentsList = data.investments || [];
    const expenseTotal = expensesList.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const investmentTotal = investmentsList.reduce((sum, item) => sum + Number(item.investmentAmount || 0), 0);
    const budgetGoal = Number(basic.budgetGoal || 0);
    const income = Number(basic.income || 0);
    const availableInvestment = Number(basic.availableInvestment || 0);
    const savingGoal = Number(basic.savingGoal || 0);
    const estimatedSaving = income - expenseTotal - investmentTotal;
    const insights = [];

    if (expensesList.length === 0 && investmentsList.length === 0) {
      return [{ level: "safe", title: "기록 대기", body: "캘린더 날짜를 눌러 소비와 투자 기록을 입력해보세요." }];
    }

    if (budgetGoal > 0) {
      const ratio = expenseTotal / budgetGoal * 100;
      if (ratio >= 110) {
        insights.push({ level: "danger", title: "소비 목표 초과", body: `이번 달 소비가 목표의 ${ratio.toFixed(1)}%입니다. 즉시 지출 조정이 필요합니다.` });
      } else if (ratio >= 85) {
        insights.push({ level: "warning", title: "소비 목표 근접", body: `소비 목표의 ${ratio.toFixed(1)}%를 사용했습니다. 남은 기간 지출 속도를 낮추는 것이 좋습니다.` });
      } else {
        insights.push({ level: "safe", title: "소비 목표 안정", body: `소비 목표 대비 ${ratio.toFixed(1)}% 사용 중입니다. 현재 흐름은 관리 가능한 수준입니다.` });
      }
    }

    const prevMonth = getPreviousMonthKey(month);
    const currentCategory = getCategoryMap(month);
    const prevCategory = getCategoryMap(prevMonth);
    Object.keys(currentCategory).forEach(category => {
      const now = currentCategory[category] || 0;
      const prev = prevCategory[category] || 0;
      if (prev > 0) {
        const diffRate = ((now - prev) / prev) * 100;
        if (diffRate >= 35 && now >= 30000) {
          insights.push({ level: "warning", title: `${category} 지출 증가`, body: `지난달보다 ${diffRate.toFixed(1)}% 증가했습니다. 반복 소비인지 확인해보세요.` });
        }
      } else if (now >= 100000) {
        insights.push({ level: "warning", title: `${category} 신규 집중 소비`, body: `지난달에는 없던 ${formatMoney(now)} 지출이 발생했습니다.` });
      }
    });

    const dailyExpenseMap = sumExpensesByDate(month);
    const dailyValues = Object.values(dailyExpenseMap);
    if (dailyValues.length >= 3) {
      const avg = dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length;
      const max = Math.max(...dailyValues);
      const maxDate = Object.keys(dailyExpenseMap).find(date => dailyExpenseMap[date] === max);
      if (max >= avg * 2 && max >= 50000) {
        insights.push({ level: "warning", title: "특정일 과소비 감지", body: `${maxDate}에 ${formatMoney(max)} 지출이 발생했습니다. 평균 소비일보다 큰 금액입니다.` });
      }
    }

    if (availableInvestment > 0) {
      const investRatio = investmentTotal / availableInvestment * 100;
      if (investRatio > 100) {
        insights.push({ level: "danger", title: "투자 가능 금액 초과", body: `투자 가능 금액을 ${formatMoney(investmentTotal - availableInvestment)} 초과했습니다.` });
      } else if (investRatio >= 90) {
        insights.push({ level: "warning", title: "투자 여력 부족", body: `투자 가능 금액의 ${investRatio.toFixed(1)}%를 사용했습니다. 추가 매수는 신중히 보는 것이 좋습니다.` });
      }
    }

    const lossHoldings = investmentsList.filter(item => !item.isSold && Number(item.profitLoss || 0) < 0).length;
    if (lossHoldings >= 2) {
      insights.push({ level: "warning", title: "손실 종목 누적", body: `보유 중 손실 구간 종목이 ${lossHoldings}개입니다. 손절 기준과 보유 이유를 점검해보세요.` });
    }

    if (savingGoal > 0) {
      const savingRatio = estimatedSaving / savingGoal * 100;
      if (savingRatio < 50) {
        insights.push({ level: "danger", title: "저축 목표 위험", body: `현재 예상 저축액이 목표의 ${Math.max(0, savingRatio).toFixed(1)}% 수준입니다.` });
      } else if (savingRatio < 80) {
        insights.push({ level: "warning", title: "저축 목표 주의", body: `현재 속도라면 저축 목표 달성이 빠듯할 수 있습니다.` });
      }
    }

    if (insights.length === 0) {
      insights.push({ level: "safe", title: "주요 위험 없음", body: "현재 소비·투자·저축 흐름에서 큰 위험 신호는 감지되지 않았습니다." });
    }

    return insights.slice(0, 6);
  }

  window.renderAiQuickBriefing = function () {
    const appContainer = document.getElementById("appContainer");
    if (!appContainer) return;

    let box = document.getElementById("aiQuickBriefing");
    if (!box) {
      const userBar = document.querySelector(".app-user-bar");
      box = document.createElement("div");
      box.id = "aiQuickBriefing";
      box.className = "ai-briefing-bar";
      if (userBar && userBar.parentNode) {
        userBar.parentNode.insertBefore(box, userBar.nextSibling);
      } else {
        appContainer.insertBefore(box, appContainer.firstChild);
      }
    }

    const insights = getAiRiskInsights();
    const danger = insights.filter(item => item.level === "danger").length;
    const warning = insights.filter(item => item.level === "warning").length;
    const first = insights[0];
    let status = "안정";
    if (danger > 0) status = "위험";
    else if (warning > 0) status = "주의";

    const levelClass = danger > 0 ? "danger" : warning > 0 ? "warning" : "safe";
    const statusIcon = danger > 0 ? "🚨" : warning > 0 ? "⚠️" : "✅";
    const statusText = danger > 0 ? "위험 감지" : warning > 0 ? "주의 필요" : "안정 흐름";

    box.innerHTML = `
      <div class="ai-briefing-card ${levelClass}">
        <div class="ai-briefing-icon">${statusIcon}</div>
        <div class="ai-briefing-content">
          <div class="ai-briefing-header">
            <span class="ai-briefing-title">AI 한줄 브리핑</span>
            <span class="ai-briefing-status">${statusText}</span>
          </div>
          <div class="ai-briefing-main">${first.title}</div>
          <div class="ai-briefing-sub">${first.body}</div>
        </div>
        <div class="ai-briefing-tags">
          <span class="ai-briefing-pill ${levelClass}">${status}</span>
          <span class="ai-briefing-pill danger">위험 ${danger}</span>
          <span class="ai-briefing-pill warning">주의 ${warning}</span>
        </div>
      </div>
    `;
  };

  window.renderAiRiskPanel = function () {
    const resultTab = document.getElementById("resultTab");
    if (!resultTab) return;

    let panel = document.getElementById("aiRiskDetectPanel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "aiRiskDetectPanel";
      panel.className = "ai-risk-panel";
      resultTab.insertBefore(panel, resultTab.firstChild);
    }

    const insights = getAiRiskInsights();
    panel.innerHTML = `
      <h2>AI 소비·투자 위험 감지</h2>
      <p>이번 달 기록과 이전 달 흐름, 목표 기준을 바탕으로 위험 신호를 자동 감지합니다.</p>
      <div class="ai-risk-grid">
        ${insights.map(item => `
          <div class="ai-risk-card ${item.level}">
            <strong>${item.title}</strong>
            <span>${item.body}</span>
          </div>
        `).join("")}
      </div>
    `;
  };

  window.applyCalendarHeatMap = function () {
    const month = getCurrentMonthKeyForFeature();
    const map = calendarView === "investment" ? sumInvestmentsByDate(month) : sumExpensesByDate(month);
    const values = Object.values(map);
    const max = values.length ? Math.max(...values) : 0;

    document.querySelectorAll(".calendar-cell").forEach(cell => {
      cell.classList.remove("heat-1", "heat-2", "heat-3");
      if (cell.classList.contains("empty")) return;
      const onclick = cell.getAttribute("onclick") || "";
      const match = onclick.match(/(\d{4}-\d{2}-\d{2})/);
      if (!match || max <= 0) return;
      const value = map[match[1]] || 0;
      if (value <= 0) return;
      const ratio = value / max;
      if (ratio >= 0.75) cell.classList.add("heat-3");
      else if (ratio >= 0.4) cell.classList.add("heat-2");
      else cell.classList.add("heat-1");
    });

    const legend = document.getElementById("calendarLegend");
    if (legend && !document.getElementById("calendarHeatLegend")) {
      const heat = document.createElement("div");
      heat.id = "calendarHeatLegend";
      heat.className = "heat-legend";
      heat.innerHTML = `
        <span>HeatMap:</span>
        <span class="heat-dot low"></span><span>낮음</span>
        <span class="heat-dot mid"></span><span>보통</span>
        <span class="heat-dot high"></span><span>높음</span>
      `;
      legend.parentNode.insertBefore(heat, legend.nextSibling);
    }
  };

  const previousRenderCalendar = window.renderCalendar || renderCalendar;
  window.renderCalendar = function () {
    previousRenderCalendar();
    window.renderAiQuickBriefing();
    setTimeout(window.applyCalendarHeatMap, 0);
  };

  const previousApplySummary = window.applySummaryToDashboard || applySummaryToDashboard;
  window.applySummaryToDashboard = function (summary) {
    previousApplySummary(summary);
    window.renderAiQuickBriefing();
    window.renderAiRiskPanel();
    setTimeout(window.applyCalendarHeatMap, 0);
  };

  const previousResetDashboard = window.resetDashboard || resetDashboard;
  window.resetDashboard = function () {
    previousResetDashboard();
    window.renderAiQuickBriefing();
    window.renderAiRiskPanel();
    setTimeout(window.applyCalendarHeatMap, 0);
  };

  const previousShowTabFeature = window.showTab || showTab;
  window.showTab = function (tabId) {
    previousShowTabFeature(tabId);
    window.renderAiQuickBriefing();
    if (tabId === "resultTab") window.renderAiRiskPanel();
    if (tabId === "calendarTab") setTimeout(window.applyCalendarHeatMap, 0);
  };

  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(function () {
      window.renderAiQuickBriefing();
      window.renderAiRiskPanel();
      window.applyCalendarHeatMap();
    }, 160);
  });
})();
