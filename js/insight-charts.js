/* v13 fix: 차트/AI 카드/히스토리 타임라인 실행 보강 */
(function () {
  let balanceTrendChartFixed = null;
  let monthlyFocusChartFixed = null;

  function getMonthTotalsFixed(month) {
    if (!currentUser || !appData.users[currentUser]) {
      return { income: 0, expense: 0, investment: 0, evaluation: 0, realized: 0, saving: 0 };
    }

    const data = appData.users[currentUser].months?.[month] || {};
    const basic = data.basicInfo || {};
    const monthExpenses = data.expenses || [];
    const monthInvestments = data.investments || [];

    const income = Number(basic.income || 0);
    const expense = monthExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const investment = monthInvestments.reduce((sum, item) => sum + Number(item.investmentAmount || 0), 0);
    const evaluation = monthInvestments.reduce((sum, item) => sum + Number(item.evaluationAmount || 0), 0);
    const realized = monthInvestments
      .filter(item => item.isSold)
      .reduce((sum, item) => sum + Number(item.realizedProfitLoss || 0), 0);

    return {
      income,
      expense,
      investment,
      evaluation,
      realized,
      saving: income - expense - investment
    };
  }

  window.drawEnhancedResultCharts = function () {
    if (typeof Chart === "undefined") return;

    const balanceCtx = document.getElementById("balanceTrendChart");
    const focusCtx = document.getElementById("monthlyFocusChart");

    if (balanceCtx) {
      if (balanceTrendChartFixed) balanceTrendChartFixed.destroy();

      const months = currentUser && appData.users[currentUser]
        ? Object.keys(appData.users[currentUser].months || {}).sort()
        : [];

      const labels = months.length ? months : ["데이터 없음"];
      const expenseData = months.map(month => getMonthTotalsFixed(month).expense);
      const investData = months.map(month => getMonthTotalsFixed(month).investment);
      const savingData = months.map(month => Math.max(getMonthTotalsFixed(month).saving, 0));

      balanceTrendChartFixed = new Chart(balanceCtx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            { label: "소비", data: expenseData.length ? expenseData : [0] },
            { label: "투자", data: investData.length ? investData : [0] },
            { label: "예상 저축", data: savingData.length ? savingData : [0] }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom" } },
          scales: { y: { beginAtZero: true } }
        }
      });
    }

    if (focusCtx) {
      if (monthlyFocusChartFixed) monthlyFocusChartFixed.destroy();

      const month = currentMonth || calendarMonth || new Date().toISOString().slice(0, 7);
      const data = currentUser && appData.users[currentUser]
        ? appData.users[currentUser].months?.[month]
        : null;

      const categoryMap = {};
      (data?.expenses || []).forEach(item => {
        const key = item.category || "기타";
        categoryMap[key] = (categoryMap[key] || 0) + Number(item.amount || 0);
      });

      const totals = getMonthTotalsFixed(month);
      if (totals.investment > 0) {
        categoryMap["투자 원금"] = totals.investment;
      }

      const labels = Object.keys(categoryMap);
      const values = Object.values(categoryMap);

      monthlyFocusChartFixed = new Chart(focusCtx, {
        type: "doughnut",
        data: {
          labels: labels.length ? labels : ["데이터 없음"],
          datasets: [{ data: values.length ? values : [1] }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom" } }
        }
      });
    }
  };

  window.renderAIReportCardsFromText = function (reportText) {
    const box = document.getElementById("aiReportCards");
    if (!box) return;

    const text = String(reportText || "").trim();
    if (!text) {
      box.innerHTML = `<div class="ai-report-card muted">AI 리포트를 실행하면 핵심 요약 카드가 표시됩니다.</div>`;
      return;
    }

    const readLine = (label) => {
      const line = text.split("\n").find(row => row.includes(label));
      return line ? line.replace(/^[-\s]*/, "").replace(label, "").trim() : "";
    };

    const totalExpense = readLine("총 소비 금액:") || "소비 데이터가 부족합니다.";
    const investment = readLine("투자 원금:") || readLine("투자 원금 합계:") || "투자 데이터가 부족합니다.";
    const risk = readLine("위험도 등급:") || readLine("금융 위험도 점수:") || "분석 후 표시됩니다.";
    const comment = readLine("AI 한줄 코멘트:") || "리포트를 실행하면 한줄 평가가 표시됩니다.";

    const cards = [
      { title: "소비 요약", body: totalExpense, level: text.includes("소비율이 높은") || text.includes("초과") ? "warning" : "safe" },
      { title: "투자 요약", body: investment, level: text.includes("손실") || text.includes("마이너스") ? "warning" : "safe" },
      { title: "위험도", body: risk, level: text.includes("위험도 등급: 높음") || text.includes("고위험") ? "danger" : "safe" },
      { title: "이번 달 한줄 평가", body: comment, level: "muted" }
    ];

    box.innerHTML = cards.map(card => `
      <div class="ai-report-card ${card.level}">
        <strong>${card.title}</strong>
        <span>${card.body}</span>
      </div>
    `).join("");
  };

  const originalApplySummary = window.applySummaryToDashboard || applySummaryToDashboard;
  window.applySummaryToDashboard = function (summary) {
    originalApplySummary(summary);
    window.drawEnhancedResultCharts();
    window.renderAIReportCardsFromText(summary?.report || "");
  };

  const originalReset = window.resetDashboard || resetDashboard;
  window.resetDashboard = function () {
    originalReset();
    window.drawEnhancedResultCharts();
    window.renderAIReportCardsFromText("");
  };

  const originalShowTab = window.showTab || showTab;
  window.showTab = function (tabId) {
    originalShowTab(tabId);
    if (tabId === "resultTab") {
      setTimeout(window.drawEnhancedResultCharts, 0);
    }
    if (tabId === "reportTab") {
      window.renderAIReportCardsFromText(document.getElementById("aiReport")?.innerText || "");
    }
  };

  ["showDailyReport", "showWeeklyReport", "showMonthlyReport", "showYearlyReport"].forEach(fnName => {
    const original = window[fnName];
    if (typeof original === "function") {
      window[fnName] = function () {
        original();
        window.renderAIReportCardsFromText(document.getElementById("aiReport")?.innerText || "");
      };
    }
  });

  const originalRenderHistory = window.renderHistory || renderHistory;
  window.renderHistory = function () {
    const box = document.getElementById("historyList");
    if (!box || !currentUser || !appData.users[currentUser]) {
      originalRenderHistory();
      return;
    }

    const months = Object.keys(appData.users[currentUser].months || {}).sort().reverse();
    if (months.length === 0) {
      originalRenderHistory();
      return;
    }

    box.innerHTML = `<div class="history-timeline">${months.map(month => {
      const totals = getMonthTotalsFixed(month);
      const data = appData.users[currentUser].months[month] || {};
      const profitLoss = totals.evaluation - totals.investment;
      const riskText = data.summary?.risk ? `${data.summary.risk.score}점 (${data.summary.risk.level})` : "분석 전";

      return `
        <div class="history-timeline-item">
          <div class="history-dot">${month.slice(5)}</div>
          <div class="history-timeline-card">
            <div class="history-timeline-head">
              <h3>${month}</h3>
              <span class="history-status-pill">${riskText}</span>
            </div>
            <div class="history-chip-row">
              <div class="history-chip"><span>수입</span><strong>${formatMoney(totals.income)}</strong></div>
              <div class="history-chip"><span>소비</span><strong>${formatMoney(totals.expense)}</strong></div>
              <div class="history-chip"><span>투자 원금</span><strong>${formatMoney(totals.investment)}</strong></div>
              <div class="history-chip"><span>평가 손익</span><strong class="${profitLoss >= 0 ? "profit" : "loss"}">${formatMoney(profitLoss)}</strong></div>
              <div class="history-chip"><span>실현 손익</span><strong class="${totals.realized >= 0 ? "profit" : "loss"}">${formatMoney(totals.realized)}</strong></div>
              <div class="history-chip"><span>예상 저축</span><strong class="${totals.saving >= 0 ? "profit" : "loss"}">${formatMoney(totals.saving)}</strong></div>
            </div>
            <div class="history-actions">
              <button onclick="selectHistoryMonth('${month}')">이 달 불러오기</button>
              <button class="sub-btn" onclick="showTab('resultTab')">분석결과 보기</button>
              <button class="danger-btn" onclick="deleteMonthData('${month}')">삭제</button>
            </div>
          </div>
        </div>
      `;
    }).join("")}</div>`;
  };

  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(function () {
      window.drawEnhancedResultCharts();
      window.renderAIReportCardsFromText(document.getElementById("aiReport")?.innerText || "");
    }, 100);
  });
})();

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
