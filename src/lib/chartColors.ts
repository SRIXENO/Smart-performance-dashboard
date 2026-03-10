const DEFAULT_CHART_COLORS = [
  '59 130 246',
  '16 185 129',
  '14 165 233',
  '139 92 246',
  '245 158 11',
  '244 63 94',
];

function resolveCssVar(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function getChartColor(index: number, alpha = 1) {
  const fallback = DEFAULT_CHART_COLORS[index - 1] || DEFAULT_CHART_COLORS[0];
  const rgb = resolveCssVar(`--chart-${index}`, fallback);
  if (alpha >= 1) return `rgb(${rgb})`;
  return `rgba(${rgb}, ${alpha})`;
}

export function getChartGradient(
  ctx: CanvasRenderingContext2D,
  chartArea: { top: number; bottom: number },
  index: number,
  alphaTop = 0.9,
  alphaBottom = 0.25,
) {
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, getChartColor(index, alphaTop));
  gradient.addColorStop(1, getChartColor(index, alphaBottom));
  return gradient;
}
