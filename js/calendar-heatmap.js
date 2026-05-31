(function () {
  function getVisibleCalendarMonth() {
    if (typeof calendarMonth !== "undefined" && calendarMonth) return calendarMonth;
    if (typeof currentMonth !== "undefined" && currentMonth) return currentMonth;
    return new Date().toISOString().slice(0, 7);
  }

  function getExpenseMap(month) {
    const map = {};
    const userMonths = currentUser && appData.users[currentUser] ? appData.users[currentUser].months || {} : {};
    Object.keys(userMonths).forEach(monthKey => {
      (userMonths[monthKey].expenses || []).forEach(item => {
        if (item.date && item.date.startsWith(month)) {
          map[item.date] = (map[item.date] || 0) + Number(item.amount || 0);
        }
      });
    });
    return map;
  }

  function getInvestmentMap(month) {
    const map = {};
    const userMonths = currentUser && appData.users[currentUser] ? appData.users[currentUser].months || {} : {};
    Object.keys(userMonths).forEach(monthKey => {
      (userMonths[monthKey].investments || []).forEach(item => {
        if (item.buyDate && item.buyDate.startsWith(month)) {
          map[item.buyDate] = (map[item.buyDate] || 0) + Number(item.investmentAmount || 0);
        }
        if (item.isSold && item.sellDate && item.sellDate.startsWith(month)) {
          map[item.sellDate] = (map[item.sellDate] || 0) + Math.abs(Number(item.sellAmount || item.realizedProfitLoss || 0));
        }
      });
    });
    return map;
  }

  function moneyText(value) {
    try { return Number(value).toLocaleString("ko-KR") + "원"; }
    catch (e) { return value + "원"; }
  }

  window.applyCalendarHeatMap = function () {
    const month = getVisibleCalendarMonth();
    const isInvestment = typeof calendarView !== "undefined" && calendarView === "investment";
    const map = isInvestment ? getInvestmentMap(month) : getExpenseMap(month);
    const max = Math.max(0, ...Object.values(map));

    document.querySelectorAll(".calendar-cell").forEach(cell => {
      cell.classList.remove("heat-active", "heat-1", "heat-2", "heat-3");
      cell.style.removeProperty("--heat-bg");
      cell.style.removeProperty("--heat-border");
      cell.style.removeProperty("--heat-shadow");
      cell.style.removeProperty("--heat-overlay");
      const number = cell.querySelector(".calendar-date-number");
      if (number) number.removeAttribute("data-heat-label");

      if (cell.classList.contains("empty") || max <= 0) return;
      const onclick = cell.getAttribute("onclick") || "";
      const match = onclick.match(/(\d{4}-\d{2}-\d{2})/);
      if (!match) return;

      const value = map[match[1]] || 0;
      if (value <= 0) return;

      const ratio = value / max;
      const alpha = ratio >= 0.75 ? 0.42 : ratio >= 0.4 ? 0.27 : 0.14;
      const borderAlpha = ratio >= 0.75 ? 0.72 : ratio >= 0.4 ? 0.48 : 0.28;
      const rgb = isInvestment ? "37,99,235" : "239,68,68";

      cell.classList.add("heat-active", ratio >= 0.75 ? "heat-3" : ratio >= 0.4 ? "heat-2" : "heat-1");
      cell.style.setProperty("--heat-bg", `rgba(${rgb}, ${alpha})`);
      cell.style.setProperty("--heat-border", `rgba(${rgb}, ${borderAlpha})`);
      cell.style.setProperty("--heat-shadow", `rgba(${rgb}, ${Math.min(alpha + 0.08, 0.55)})`);
      cell.style.setProperty("--heat-overlay", `linear-gradient(135deg, rgba(${rgb}, ${Math.min(alpha + 0.08, 0.55)}), rgba(255,255,255,0.08))`);
      if (number) number.setAttribute("data-heat-label", moneyText(value));
    });

    const switchBox = document.querySelector(".calendar-switch");
    if (switchBox) {
      let heat = document.getElementById("calendarHeatLegend");
      if (!heat) {
        heat = document.createElement("div");
        heat.id = "calendarHeatLegend";
        heat.className = "heat-legend";
        switchBox.insertAdjacentElement("afterend", heat);
      }
      heat.innerHTML = isInvestment
        ? `<span>투자 HeatMap:</span><span class="heat-dot invest low"></span><span>낮음</span><span class="heat-dot invest mid"></span><span>보통</span><span class="heat-dot invest high"></span><span>높음</span>`
        : `<span>소비 HeatMap:</span><span class="heat-dot low"></span><span>낮음</span><span class="heat-dot mid"></span><span>보통</span><span class="heat-dot high"></span><span>높음</span>`;
    }
  };

  const oldRenderCalendar = window.renderCalendar || (typeof renderCalendar === "function" ? renderCalendar : null);
  if (oldRenderCalendar) {
    window.renderCalendar = function () {
      oldRenderCalendar();
      setTimeout(window.applyCalendarHeatMap, 0);
    };
  }

  ["showCalendarView", "changeCalendarMonth", "goCurrentCalendarMonth", "renderLists", "saveCurrentMonthData"].forEach(name => {
    const oldFn = window[name] || (typeof globalThis[name] === "function" ? globalThis[name] : null);
    if (!oldFn) return;
    window[name] = function () {
      const result = oldFn.apply(this, arguments);
      setTimeout(window.applyCalendarHeatMap, 0);
      return result;
    };
  });

  setTimeout(window.applyCalendarHeatMap, 200);
})();
