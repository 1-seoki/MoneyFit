(function () {
  function addStyleOnce() {
    if (document.getElementById("visibleFeaturePatchStyle")) return;
    const style = document.createElement("style");
    style.id = "visibleFeaturePatchStyle";
    style.textContent = `
      .emotion-helper-text { font-size: 12px; color: #64748b; margin: 4px 0 8px; }
      .visible-feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 14px; margin-top: 14px; }
      .visible-feature-card { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px; line-height: 1.55; }
      .visible-feature-card.highlight { background: linear-gradient(135deg, #eef4ff, #f8fafc); border-color: #bfdbfe; }
      .visible-feature-title { font-weight: 800; color: #111827; margin-bottom: 6px; }
      .visible-feature-value { font-size: 24px; font-weight: 900; color: #2563eb; margin: 5px 0; }
      .visible-feature-sub { color: #64748b; font-size: 13px; }
      .visible-meter { width: 100%; height: 10px; background: #e5e7eb; border-radius: 999px; overflow: hidden; margin-top: 10px; }
      .visible-meter-fill { height: 100%; width: 0%; border-radius: 999px; background: linear-gradient(90deg, #22c55e, #2563eb, #ef4444); transition: width 0.35s ease; }
      .visible-badge-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-top: 14px; }
      .visible-badge { border-radius: 16px; padding: 15px; border: 1px solid #bfdbfe; background: #eff6ff; min-height: 110px; }
      .visible-badge.locked { background: #f8fafc; border-color: #e5e7eb; opacity: 0.68; }
      .visible-badge-icon { font-size: 25px; margin-bottom: 6px; }
      .visible-badge-title { font-weight: 800; color: #111827; margin-bottom: 5px; }
      .visible-badge-desc { color: #64748b; font-size: 12px; line-height: 1.45; }
      .mood-chip { display:inline-block; padding:3px 8px; border-radius:999px; background:#f1f5f9; color:#334155; font-size:12px; font-weight:800; margin-left:5px; }
      body.dark-mode .visible-feature-card, body.dark-mode .visible-badge.locked { background:#0f172a; border-color:#334155; color:#e5e7eb; }
      body.dark-mode .visible-feature-card.highlight, body.dark-mode .visible-badge { background:#172554; border-color:#334155; color:#e5e7eb; }
      body.dark-mode .visible-feature-title, body.dark-mode .visible-badge-title { color:#f8fafc; }
      body.dark-mode .visible-feature-sub, body.dark-mode .visible-badge-desc, body.dark-mode .emotion-helper-text { color:#cbd5e1; }
    `;
    document.head.appendChild(style);
  }

  function moodLabel(value) {
    return { satisfied: "😀 만족", normal: "😐 보통", regret: "😥 후회" }[value] || "";
  }

  function getCurrentFinanceData() {
    if (window.currentUser && window.currentMonth && window.appData?.users?.[window.currentUser]?.months?.[window.currentMonth]) {
      return window.appData.users[window.currentUser].months[window.currentMonth];
    }
    return { expenses: window.expenses || [], investments: window.investments || [], basicInfo: window.basicInfo || {} };
  }

  function ensureMoodSelectVisible() {
    const amountInput = document.getElementById("memoExpenseAmount");
    if (!amountInput || document.getElementById("memoExpenseMood")) return;
    amountInput.insertAdjacentHTML("afterend", `
      <label class="small-label">소비 감정</label>
      <select id="memoExpenseMood">
        <option value="">선택 안 함</option>
        <option value="satisfied">😀 만족 소비</option>
        <option value="normal">😐 보통 소비</option>
        <option value="regret">😥 후회 소비</option>
      </select>
      <div class="emotion-helper-text">소비 당시의 감정을 남기면 AI 리포트에서 후회 소비와 만족 소비를 분석합니다.</div>
    `);
  }

  function ensureResultPanelsVisible() {
    const resultTab = document.getElementById("resultTab");
    if (!resultTab) return;
    if (!document.getElementById("visibleInvestorProfileSection")) {
      const insertTarget = resultTab.querySelector(".result-insight-charts") || resultTab.querySelector(".grid-2") || resultTab.firstElementChild;
      const html = `
        <div class="section" id="visibleInvestorProfileSection">
          <h2>투자 성향 분석</h2>
          <p>매수·매도 빈도, 손익률, 손실 종목 수, 투자 메모를 기준으로 현재 투자 성향을 자동 판단합니다.</p>
          <div id="visibleInvestorProfileBox" class="visible-feature-grid"></div>
        </div>
        <div class="section" id="visibleEmotionBadgeSection">
          <h2>감정 소비 분석 · 금융 습관 배지</h2>
          <p>소비 감정 태그와 기록 습관을 바탕으로 소비 패턴과 금융 습관 배지를 보여줍니다.</p>
          <div id="visibleEmotionSummaryBox" class="visible-feature-grid"></div>
          <div id="visibleBadgeGrid" class="visible-badge-grid"></div>
        </div>
      `;
      if (insertTarget) insertTarget.insertAdjacentHTML("beforebegin", html);
      else resultTab.insertAdjacentHTML("beforeend", html);
    }
  }

  function getInvestorProfile(data) {
    const list = data.investments || [];
    const active = list.filter(i => !i.isSold);
    const sold = list.filter(i => i.isSold);
    const tradeCount = list.length;
    const soldCount = sold.length;
    const lossCount = active.filter(i => Number(i.profitLoss || 0) < 0).length;
    const totalInvestment = list.reduce((s, i) => s + Number(i.investmentAmount || 0), 0);
    const totalEvaluation = list.reduce((s, i) => s + Number(i.evaluationAmount || 0), 0);
    const avgReturn = totalInvestment ? ((totalEvaluation - totalInvestment) / totalInvestment) * 100 : 0;
    const memoCount = list.filter(i => String(i.memo || "").trim()).length;

    let type = "안정 관찰형";
    let score = 35;
    let comment = "투자 기록이 많지 않아 보수적으로 관찰하는 단계입니다.";
    if (tradeCount >= 5 || soldCount >= 3) {
      type = "적극 매매형"; score = 78; comment = "매수·매도 빈도가 높은 편이라 거래 기준을 명확히 기록하는 것이 좋습니다.";
    } else if (lossCount >= 2 || avgReturn <= -7) {
      type = "리스크 점검형"; score = 68; comment = "손실 구간 종목이 있어 손절 기준과 보유 이유 점검이 필요합니다.";
    } else if (tradeCount >= 2) {
      type = "균형 투자형"; score = 56; comment = "투자 기록이 쌓이고 있으며 수익률과 매매 근거를 함께 관리하면 좋습니다.";
    }
    if (memoCount >= 2) comment += " 투자 메모가 있어 판단 근거 관리가 잘 되고 있습니다.";
    return { type, score, comment, tradeCount, soldCount, lossCount, avgReturn, memoCount };
  }

  function renderVisibleFeatures() {
    addStyleOnce();
    ensureMoodSelectVisible();
    ensureResultPanelsVisible();

    const data = getCurrentFinanceData();
    const expenses = data.expenses || [];
    const investments = data.investments || [];
    const profile = getInvestorProfile(data);
    const moodCount = expenses.filter(e => e.mood).length;
    const regretCount = expenses.filter(e => e.mood === "regret").length;
    const satisfiedCount = expenses.filter(e => e.mood === "satisfied").length;
    const normalCount = expenses.filter(e => e.mood === "normal").length;
    const totalExpense = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const categories = new Set(expenses.map(e => e.category)).size;
    const memoInvestments = investments.filter(i => String(i.memo || "").trim()).length;
    const soldProfit = investments.filter(i => i.isSold && Number(i.realizedProfitLoss || 0) > 0).length;

    const investorBox = document.getElementById("visibleInvestorProfileBox");
    if (investorBox) {
      investorBox.innerHTML = `
        <div class="visible-feature-card highlight">
          <div class="visible-feature-title">현재 투자 성향</div>
          <div class="visible-feature-value">${profile.type}</div>
          <div class="visible-feature-sub">${profile.comment}</div>
          <div class="visible-meter"><div class="visible-meter-fill" style="width:${profile.score}%"></div></div>
        </div>
        <div class="visible-feature-card">
          <div class="visible-feature-title">매매 기록</div>
          <div class="visible-feature-value">${profile.tradeCount}건</div>
          <div class="visible-feature-sub">매도 완료 ${profile.soldCount}건 · 손실 보유 ${profile.lossCount}개</div>
        </div>
        <div class="visible-feature-card">
          <div class="visible-feature-title">평균 평가수익률</div>
          <div class="visible-feature-value">${profile.avgReturn.toFixed(2)}%</div>
          <div class="visible-feature-sub">투자 메모 ${profile.memoCount}건 기록</div>
        </div>
      `;
    }

    const emotionBox = document.getElementById("visibleEmotionSummaryBox");
    if (emotionBox) {
      const regretRatio = moodCount ? (regretCount / moodCount) * 100 : 0;
      emotionBox.innerHTML = `
        <div class="visible-feature-card highlight">
          <div class="visible-feature-title">감정 소비 기록</div>
          <div class="visible-feature-value">${moodCount}건</div>
          <div class="visible-feature-sub">😀 만족 ${satisfiedCount}건 · 😐 보통 ${normalCount}건 · 😥 후회 ${regretCount}건</div>
        </div>
        <div class="visible-feature-card">
          <div class="visible-feature-title">후회 소비 비율</div>
          <div class="visible-feature-value">${regretRatio.toFixed(1)}%</div>
          <div class="visible-feature-sub">후회 소비가 반복되면 AI 리포트에서 주의 신호로 활용됩니다.</div>
        </div>
        <div class="visible-feature-card">
          <div class="visible-feature-title">이번 달 소비 기록</div>
          <div class="visible-feature-value">${expenses.length}건</div>
          <div class="visible-feature-sub">총 ${typeof formatMoney === 'function' ? formatMoney(totalExpense) : totalExpense + '원'} · 카테고리 ${categories}개</div>
        </div>
      `;
    }

    const badges = [
      { icon: "🔥", title: "기록 루틴 시작", unlocked: expenses.length + investments.length >= 3, desc: `전체 기록 ${expenses.length + investments.length}건` },
      { icon: "🎯", title: "소비 목표 관리", unlocked: Number(data.basicInfo?.budgetGoal || 0) > 0, desc: "월 소비 목표를 설정했습니다." },
      { icon: "😊", title: "감정 소비 체크", unlocked: moodCount >= 2, desc: `감정 태그 ${moodCount}건 기록` },
      { icon: "🧠", title: "후회 소비 인식", unlocked: regretCount >= 1, desc: `후회 소비 ${regretCount}건을 기록했습니다.` },
      { icon: "🧩", title: "소비 분산 관리", unlocked: categories >= 4, desc: `${categories}개 카테고리에 분산 기록` },
      { icon: "📝", title: "투자 근거 기록", unlocked: memoInvestments >= 2, desc: `투자 메모 ${memoInvestments}건` },
      { icon: "🏅", title: "수익 실현 경험", unlocked: soldProfit >= 1, desc: `수익 매도 ${soldProfit}건` }
    ];
    const badgeGrid = document.getElementById("visibleBadgeGrid");
    if (badgeGrid) {
      badgeGrid.innerHTML = badges.map(b => `
        <div class="visible-badge ${b.unlocked ? "" : "locked"}">
          <div class="visible-badge-icon">${b.unlocked ? b.icon : "🔒"}</div>
          <div class="visible-badge-title">${b.title}</div>
          <div class="visible-badge-desc">${b.desc}</div>
        </div>
      `).join("");
    }
  }

  function patchFunction(name, after) {
    const oldFn = window[name];
    if (typeof oldFn !== "function" || oldFn.__visibleFeaturePatched) return;
    const newFn = function (...args) {
      const result = oldFn.apply(this, args);
      setTimeout(after, 0);
      return result;
    };
    newFn.__visibleFeaturePatched = true;
    window[name] = newFn;
  }

  function patchExpenseSaveForMood() {
    const oldSave = window.saveExpenseFromMemo;
    if (typeof oldSave !== "function" || oldSave.__moodPatched) return;
    const newSave = function (...args) {
      const mood = document.getElementById("memoExpenseMood")?.value || "";
      const beforeData = getCurrentFinanceData();
      const beforeIds = new Set((beforeData.expenses || []).map(e => e.id));
      const result = oldSave.apply(this, args);
      setTimeout(() => {
        const data = getCurrentFinanceData();
        const added = (data.expenses || []).find(e => !beforeIds.has(e.id));
        if (added && mood) {
          added.mood = mood;
          if (typeof saveStorage === "function") saveStorage();
        }
        const moodEl = document.getElementById("memoExpenseMood");
        if (moodEl) moodEl.value = "";
        renderVisibleFeatures();
      }, 0);
      return result;
    };
    newSave.__moodPatched = true;
    window.saveExpenseFromMemo = newSave;
  }

  function initVisibleFeaturePatch() {
    addStyleOnce();
    ensureMoodSelectVisible();
    ensureResultPanelsVisible();
    patchExpenseSaveForMood();
    ["showTab", "renderLists", "resetDashboard", "applySummaryToDashboard", "analyzeFinance", "openCalendarMemo", "renderMemoDayRecords"].forEach(name => patchFunction(name, renderVisibleFeatures));
    renderVisibleFeatures();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initVisibleFeaturePatch);
  else initVisibleFeaturePatch();
})();
