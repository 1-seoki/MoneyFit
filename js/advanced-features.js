(function () {
  const NEXT_FEATURE_STYLE_ID = "nextPriorityFeatureStyles";

  function injectNextPriorityStyles() {
    if (document.getElementById(NEXT_FEATURE_STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = NEXT_FEATURE_STYLE_ID;
    style.innerHTML = `
      .extra-insight-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 14px;
        margin-top: 14px;
      }

      .extra-insight-card {
        background: #f8fafc;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        padding: 16px;
        line-height: 1.55;
        position: relative;
        overflow: hidden;
      }

      .extra-insight-card::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 5px;
        height: 100%;
        background: #2563eb;
      }

      .extra-insight-card strong {
        display: block;
        color: #2563eb;
        margin-bottom: 6px;
        font-size: 15px;
      }

      .extra-insight-main {
        font-size: 22px;
        font-weight: 800;
        color: #111827;
        margin: 4px 0 6px;
      }

      .extra-insight-sub {
        color: #64748b;
        font-size: 13px;
      }

      .achievement-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
        margin-top: 14px;
      }

      .achievement-badge {
        border-radius: 16px;
        padding: 14px;
        background: linear-gradient(135deg, #eff6ff, #ffffff);
        border: 1px solid #bfdbfe;
        min-height: 96px;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);
      }

      .achievement-badge.locked {
        background: #f8fafc;
        border-color: #e5e7eb;
        opacity: 0.58;
        box-shadow: none;
      }

      .achievement-icon {
        font-size: 24px;
        margin-bottom: 6px;
      }

      .achievement-title {
        font-weight: 800;
        margin-bottom: 4px;
      }

      .achievement-desc {
        color: #64748b;
        font-size: 13px;
        line-height: 1.45;
      }

      .mood-select,
      .mood-inline {
        width: 100%;
      }

      .mood-chip {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 999px;
        background: #f1f5f9;
        color: #334155;
        font-size: 12px;
        font-weight: 700;
        margin-left: 4px;
      }

      .investor-profile-meter {
        width: 100%;
        height: 9px;
        background: #e5e7eb;
        border-radius: 999px;
        overflow: hidden;
        margin-top: 8px;
      }

      .investor-profile-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #22c55e, #2563eb, #ef4444);
        border-radius: 999px;
        transition: width 0.35s ease;
      }

      body.dark-mode .extra-insight-card,
      body.dark-mode .achievement-badge.locked {
        background: #0f172a;
        border-color: #334155;
        color: #e5e7eb;
      }

      body.dark-mode .achievement-badge {
        background: linear-gradient(135deg, rgba(30,64,175,0.35), rgba(15,23,42,0.95));
        border-color: #334155;
        color: #e5e7eb;
      }

      body.dark-mode .extra-insight-main,
      body.dark-mode .achievement-title {
        color: #f8fafc;
      }

      body.dark-mode .extra-insight-sub,
      body.dark-mode .achievement-desc {
        color: #cbd5e1;
      }

      body.dark-mode .mood-chip {
        background: #334155;
        color: #e5e7eb;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureNextPriorityPanels() {
    injectNextPriorityStyles();

    const resultTab = document.getElementById("resultTab");
    if (resultTab && !document.getElementById("investorProfileSection")) {
      const target = resultTab.querySelector(".grid-2") || resultTab.firstElementChild;
      const html = `
        <div class="section" id="investorProfileSection">
          <h2>투자 성향 분석</h2>
          <p>매수·매도 기록, 손익률, 손실 종목 수를 바탕으로 현재 투자 성향을 자동으로 판단합니다.</p>
          <div id="investorProfileCards" class="extra-insight-grid"></div>
        </div>
        <div class="section" id="achievementSection">
          <h2>금융 습관 배지</h2>
          <p>소비 기록, 목표 관리, 투자 메모 같은 행동을 기준으로 배지를 부여합니다.</p>
          <div id="achievementBadgeGrid" class="achievement-grid"></div>
        </div>
      `;

      if (target) {
        target.insertAdjacentHTML("beforebegin", html);
      } else {
        resultTab.insertAdjacentHTML("beforeend", html);
      }
    }

    const amountInput = document.getElementById("memoExpenseAmount");
    if (amountInput && !document.getElementById("memoExpenseMood")) {
      amountInput.insertAdjacentHTML("afterend", `
        <label class="small-label">소비 감정</label>
        <select id="memoExpenseMood" class="mood-select">
          <option value="">선택 안 함</option>
          <option value="satisfied">😀 만족 소비</option>
          <option value="normal">😐 보통 소비</option>
          <option value="regret">😥 후회 소비</option>
        </select>
      `);
    }
  }

  function getCurrentDataSafe() {
    if (!currentUser || !currentMonth || !appData.users[currentUser]) return null;
    return appData.users[currentUser].months[currentMonth] || null;
  }

  function moodLabel(value) {
    const map = {
      satisfied: "😀 만족",
      normal: "😐 보통",
      regret: "😥 후회"
    };
    return map[value] || "";
  }

  function getInvestorProfile() {
    const data = getCurrentDataSafe();
    const list = data?.investments || investments || [];
    const active = list.filter(item => !item.isSold);
    const sold = list.filter(item => item.isSold);
    const tradeCount = list.length;
    const soldCount = sold.length;
    const lossCount = active.filter(item => Number(item.profitLoss || 0) < 0).length;
    const totalInvestment = list.reduce((sum, item) => sum + Number(item.investmentAmount || 0), 0);
    const totalProfit = list.reduce((sum, item) => sum + Number(item.profitLoss || 0), 0);
    const avgReturn = totalInvestment === 0 ? 0 : (totalProfit / totalInvestment) * 100;
    const memoCount = list.filter(item => item.memo && item.memo.trim()).length;

    let score = 35;
    score += Math.min(tradeCount * 8, 30);
    score += Math.min(soldCount * 6, 18);
    if (avgReturn > 5) score += 10;
    if (lossCount >= 2) score += 12;
    if (score > 100) score = 100;

    let type = "안정 관찰형";
    let comment = "거래 기록이 많지 않아 안정적으로 관찰하는 흐름입니다.";

    if (tradeCount >= 5 || score >= 75) {
      type = "적극 매매형";
      comment = "매수·매도 기록이 활발해 투자 빈도와 기준 관리가 중요합니다.";
    } else if (avgReturn >= 8 && soldCount > 0) {
      type = "수익 실현형";
      comment = "수익 구간에서 매도 기록이 있어 목표수익률 기준을 계속 관리하면 좋습니다.";
    } else if (lossCount >= 2 || avgReturn < -5) {
      type = "리스크 점검형";
      comment = "손실 종목이 있어 손절 기준과 보유 이유를 점검할 필요가 있습니다.";
    } else if (tradeCount >= 2) {
      type = "균형 투자형";
      comment = "투자 활동은 있지만 과도하지 않아 목표와 손절 기준을 함께 관리하기 좋습니다.";
    }

    return { type, comment, score, tradeCount, soldCount, lossCount, avgReturn, memoCount };
  }

  function renderInvestorProfilePanel() {
    ensureNextPriorityPanels();
    const box = document.getElementById("investorProfileCards");
    if (!box) return;

    const profile = getInvestorProfile();
    box.innerHTML = `
      <div class="extra-insight-card">
        <strong>현재 투자 성향</strong>
        <div class="extra-insight-main">${profile.type}</div>
        <div class="extra-insight-sub">${profile.comment}</div>
        <div class="investor-profile-meter"><div class="investor-profile-fill" style="width:${profile.score}%"></div></div>
      </div>
      <div class="extra-insight-card">
        <strong>매매 활동</strong>
        <div class="extra-insight-main">${profile.tradeCount}건</div>
        <div class="extra-insight-sub">매도 완료 ${profile.soldCount}건 · 투자 메모 ${profile.memoCount}건</div>
      </div>
      <div class="extra-insight-card">
        <strong>손익 흐름</strong>
        <div class="extra-insight-main">${profile.avgReturn.toFixed(2)}%</div>
        <div class="extra-insight-sub">보유 손실 종목 ${profile.lossCount}개 기준으로 리스크를 판단합니다.</div>
      </div>
    `;
  }

  function getAchievementData() {
    const data = getCurrentDataSafe();
    const expenseList = data?.expenses || expenses || [];
    const investmentList = data?.investments || investments || [];
    const income = Number(data?.basicInfo?.income || basicInfo.income || 0);
    const budgetGoal = Number(data?.basicInfo?.budgetGoal || basicInfo.budgetGoal || 0);
    const totalExpense = expenseList.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const expenseDays = new Set(expenseList.map(item => item.date)).size;
    const categories = new Set(expenseList.map(item => item.category)).size;
    const moodCount = expenseList.filter(item => item.mood).length;
    const regretCount = expenseList.filter(item => item.mood === "regret").length;
    const memoInvestments = investmentList.filter(item => item.memo && item.memo.trim()).length;
    const soldProfit = investmentList.filter(item => item.isSold && Number(item.realizedProfitLoss || 0) > 0).length;
    const cashRemain = income - totalExpense;

    return [
      {
        icon: "🗓️",
        title: "기록 루틴 시작",
        unlocked: expenseDays >= 3,
        desc: `${expenseDays}일 기록 완료 · 3일 이상이면 달성`
      },
      {
        icon: "🎯",
        title: "소비 목표 관리",
        unlocked: budgetGoal > 0 && totalExpense <= budgetGoal,
        desc: budgetGoal > 0 ? `목표 대비 ${formatMoney(Math.max(budgetGoal - totalExpense, 0))} 여유` : "소비 목표를 먼저 설정하세요"
      },
      {
        icon: "💸",
        title: "후회 소비 체크",
        unlocked: moodCount >= 3,
        desc: `감정 태그 ${moodCount}건 · 후회 소비 ${regretCount}건`
      },
      {
        icon: "📊",
        title: "분산 소비러",
        unlocked: categories >= 4,
        desc: `${categories}개 소비 카테고리에 분산 기록`
      },
      {
        icon: "📝",
        title: "투자 근거 기록",
        unlocked: memoInvestments >= 2,
        desc: `투자 메모 ${memoInvestments}건 · 판단 근거 기록`
      },
      {
        icon: "🏅",
        title: "수익 실현 경험",
        unlocked: soldProfit >= 1,
        desc: `수익 매도 ${soldProfit}건 기록`
      }
    ];
  }

  function renderAchievementPanel() {
    ensureNextPriorityPanels();
    const box = document.getElementById("achievementBadgeGrid");
    if (!box) return;

    box.innerHTML = getAchievementData().map(item => `
      <div class="achievement-badge ${item.unlocked ? "" : "locked"}">
        <div class="achievement-icon">${item.unlocked ? item.icon : "🔒"}</div>
        <div class="achievement-title">${item.title}</div>
        <div class="achievement-desc">${item.desc}</div>
      </div>
    `).join("");
  }

  function renderNextPriorityFeatures() {
    ensureNextPriorityPanels();
    renderInvestorProfilePanel();
    renderAchievementPanel();
  }

  const oldApplySummaryToDashboard = window.applySummaryToDashboard;
  if (typeof oldApplySummaryToDashboard === "function") {
    window.applySummaryToDashboard = function (...args) {
      const result = oldApplySummaryToDashboard.apply(this, args);
      renderNextPriorityFeatures();
      return result;
    };
  }

  const oldResetDashboard = window.resetDashboard;
  if (typeof oldResetDashboard === "function") {
    window.resetDashboard = function (...args) {
      const result = oldResetDashboard.apply(this, args);
      renderNextPriorityFeatures();
      return result;
    };
  }

  const oldRenderLists = window.renderLists;
  if (typeof oldRenderLists === "function") {
    window.renderLists = function (...args) {
      const result = oldRenderLists.apply(this, args);
      renderNextPriorityFeatures();
      return result;
    };
  }

  const oldOpenCalendarMemo = window.openCalendarMemo;
  if (typeof oldOpenCalendarMemo === "function") {
    window.openCalendarMemo = function (...args) {
      const result = oldOpenCalendarMemo.apply(this, args);
      ensureNextPriorityPanels();
      const mood = document.getElementById("memoExpenseMood");
      if (mood) mood.value = "";
      return result;
    };
  }

  window.saveExpenseFromMemo = function () {
    if (!ensureUserSelected() || !selectedCalendarDate) return;

    const month = selectedCalendarDate.slice(0, 7);
    const data = ensureMonthData(month);

    const category = document.getElementById("memoExpenseCategory").value;
    const amount = Number(document.getElementById("memoExpenseAmount").value);
    const memo = document.getElementById("memoExpenseMemo").value.trim();
    const mood = document.getElementById("memoExpenseMood")?.value || "";

    if (amount <= 0) {
      alert("소비 금액을 올바르게 입력해주세요.");
      return;
    }

    data.expenses.push({
      id: Date.now(),
      date: selectedCalendarDate,
      category,
      amount,
      memo,
      mood
    });

    data.summary = null;
    currentMonth = month;
    basicInfo = data.basicInfo;
    expenses = data.expenses || [];
    investments = data.investments || [];

    saveStorage();
    clearMemoExpenseInputs();
    const moodSelect = document.getElementById("memoExpenseMood");
    if (moodSelect) moodSelect.value = "";
    renderLists();
    renderHistory();
    resetDashboard();
    renderMemoDayRecords(selectedCalendarDate);
    renderNextPriorityFeatures();
    showMemoTab("records");
    alert("소비 내역이 저장되었습니다.");
  };

  const oldOpenExpenseDetail = window.openExpenseDetail;
  if (typeof oldOpenExpenseDetail === "function") {
    window.openExpenseDetail = function (id) {
      const result = oldOpenExpenseDetail.apply(this, arguments);
      const item = expenses.find(e => e.id === id);
      const memoArea = document.getElementById("detailExpenseMemo");
      if (memoArea && !document.getElementById("detailExpenseMood")) {
        memoArea.insertAdjacentHTML("beforebegin", `
          <label class="small-label">소비 감정</label>
          <select id="detailExpenseMood" class="mood-inline">
            <option value="" ${!item?.mood ? "selected" : ""}>선택 안 함</option>
            <option value="satisfied" ${item?.mood === "satisfied" ? "selected" : ""}>😀 만족 소비</option>
            <option value="normal" ${item?.mood === "normal" ? "selected" : ""}>😐 보통 소비</option>
            <option value="regret" ${item?.mood === "regret" ? "selected" : ""}>😥 후회 소비</option>
          </select>
        `);
      }
      return result;
    };
  }

  const oldUpdateExpenseDetail = window.updateExpenseDetail;
  if (typeof oldUpdateExpenseDetail === "function") {
    window.updateExpenseDetail = function (...args) {
      const item = expenses.find(e => e.id === detailId);
      if (item) item.mood = document.getElementById("detailExpenseMood")?.value || "";
      const result = oldUpdateExpenseDetail.apply(this, args);
      renderNextPriorityFeatures();
      return result;
    };
  }

  window.renderMemoDayRecords = function (dateText) {
    const box = document.getElementById("memoDayRecords");
    if (!box) return;

    const info = getDateData(dateText);
    let html = "";

    if (info.note) {
      html += `<div class="detail-row"><strong>날짜 메모</strong><br>${escapeHtml(info.note)}</div>`;
    }

    info.expenses.forEach(item => {
      const mood = moodLabel(item.mood);
      html += `
        <div class="detail-row">
          <strong>소비 | ${escapeHtml(item.category)} ${formatMoney(item.amount)}${mood ? `<span class="mood-chip">${mood}</span>` : ""}</strong><br>
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
  };

  const oldGenerateAIReport = window.generateAIReport;
  if (typeof oldGenerateAIReport === "function") {
    window.generateAIReport = function (...args) {
      let report = oldGenerateAIReport.apply(this, args);
      const data = getCurrentDataSafe();
      const expenseList = data?.expenses || expenses || [];
      const moodCount = expenseList.filter(item => item.mood).length;
      const regretCount = expenseList.filter(item => item.mood === "regret").length;
      const satisfiedCount = expenseList.filter(item => item.mood === "satisfied").length;
      const profile = getInvestorProfile();

      report += "\n12. 감정 소비 및 투자 성향 추가 분석\n";
      if (moodCount > 0) {
        report += `- 감정 태그가 입력된 소비: ${moodCount}건\n`;
        report += `- 만족 소비: ${satisfiedCount}건 / 후회 소비: ${regretCount}건\n`;
        if (regretCount >= 2) {
          report += "→ 후회 소비가 반복되고 있어 해당 카테고리의 소비 전 체크가 필요합니다.\n";
        } else if (satisfiedCount > regretCount) {
          report += "→ 만족 소비 비중이 높아 소비의 필요성과 체감 만족도가 비교적 잘 맞는 편입니다.\n";
        } else {
          report += "→ 감정 태그를 더 누적하면 충동 소비와 만족 소비를 구분해볼 수 있습니다.\n";
        }
      } else {
        report += "- 감정 태그가 아직 없어 후회 소비 분석은 제한적입니다.\n";
      }

      report += `- 투자 성향 판단: ${profile.type}\n`;
      report += `- 투자 성향 코멘트: ${profile.comment}\n`;
      return report;
    };
  }

  setTimeout(renderNextPriorityFeatures, 0);
})();
