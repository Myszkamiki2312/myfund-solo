export function renderDashboard(deps) {
  const {
    dom,
    state,
    computeMetrics,
    dashboardSeries,
    dashboardComparisonSeries,
    formatMoney,
    formatPercent,
    drawLineChart,
    getVisibleLineChartModel,
    escapeHtml,
    formatFloat,
    renderTable,
    scheduleMetricsRefresh
  } = deps;

  const portfolioId = dom.dashboardPortfolioSelect.value || "";
  const metrics = computeMetrics(portfolioId);
  const series = Array.isArray(dashboardSeries) ? dashboardSeries : [];

  dom.statMarketValue.textContent = formatMoney(metrics.marketValue);
  dom.statCash.textContent = formatMoney(metrics.cashTotal);
  dom.statNetWorth.textContent = formatMoney(metrics.netWorth);
  dom.statTotalPl.textContent = formatMoney(metrics.totalPL);
  dom.statTotalPl.style.color = metrics.totalPL >= 0 ? "var(--brand-strong)" : "var(--danger)";

  const chartView = getVisibleLineChartModel(
    "dashboard",
    series.map((point) => point.date),
    series.map((point) => point.marketValue),
    {
      comparisonSeries: Array.isArray(dashboardComparisonSeries) ? dashboardComparisonSeries : [],
      comparisonVisibility: "return-only"
    }
  );

  drawLineChart(
    dom.dashboardChart,
    chartView.labels,
    chartView.values,
    {
      color: "#0e7a64",
      valueFormatter: (value) => (chartView.mode === "return" ? formatPercent(value) : formatMoney(value)),
      seriesName: "Portfel",
      series: chartView.comparisonSeries,
      interaction: chartView.interaction
    }
  );

  const rows = metrics.holdings.map((holding) => [
    escapeHtml(holding.ticker),
    escapeHtml(holding.name),
    escapeHtml(holding.type),
    formatFloat(holding.qty),
    formatMoney(holding.price, holding.currency),
    formatMoney(holding.value),
    formatMoney(holding.unrealized),
    `${formatFloat(holding.share)}%`
  ]);
  renderTable(
    dom.dashboardDetails,
    ["Ticker", "Nazwa", "Typ", "Ilość", "Cena", "Wartość", "Niezrealizowany P/L", "Udział"],
    rows
  );

  scheduleMetricsRefresh(portfolioId);
}
