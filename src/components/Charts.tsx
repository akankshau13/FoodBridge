import React, { useState } from 'react';
import { CategoryPrediction, PredictionDayPoint } from '../types/foodbridge';

interface WasteForecastChartProps {
  data: PredictionDayPoint[];
}

export const WasteForecastChart: React.FC<WasteForecastChartProps> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const width = 640;
  const height = 250;
  const padLeft = 44;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 34;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const maxVal = Math.max(
    100,
    ...data.map((d) => d.predictedSurplusKg)
  );
  const yMax = Math.ceil(maxVal / 50) * 50;

  const getX = (index: number) =>
    padLeft + (index / Math.max(1, data.length - 1)) * chartW;
  const getY = (val: number) =>
    padTop + chartH - (val / yMax) * chartH;

  const surplusPoints = data.map((d, i) => `${getX(i)},${getY(d.predictedSurplusKg)}`).join(' ');
  const rescuedPoints = data.map((d, i) => `${getX(i)},${getY(d.rescuedProjectedKg)}`).join(' ');

  const rescuedAreaPath = [
    `M ${getX(0)},${padTop + chartH}`,
    ...data.map((d, i) => `L ${getX(i)},${getY(d.rescuedProjectedKg)}`),
    `L ${getX(data.length - 1)},${padTop + chartH}`,
    'Z',
  ].join(' ');

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(yMax * t));

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-5 text-xs text-[#475E51]">
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-0.5 bg-[#0F2418] inline-block" aria-hidden="true" />
            <span>Predicted Surplus (kg)</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-2.5 rounded-xs bg-[#16A34A]/30 border border-[#15803D] inline-block" aria-hidden="true" />
            <span>Projected Rescued (kg)</span>
          </span>
        </div>
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="text-xs font-mono-tabular text-[#0F2418]">
            {data[hoveredIdx].day}: {data[hoveredIdx].predictedSurplusKg} kg surplus ·{' '}
            <span className="text-[#15803D] font-semibold">
              {data[hoveredIdx].rescuedProjectedKg} kg rescued
            </span>{' '}
            · {data[hoveredIdx].unrescuedRiskKg} kg at risk
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label="7-Day Surplus Food and Rescue Forecast Chart"
      >
        {/* Horizontal Gridlines */}
        {yTicks.map((tick) => {
          const y = getY(tick);
          return (
            <g key={tick}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#E5EFE8"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-[#6B8275] text-[11px] font-mono-tabular"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Rescued Area */}
        <path d={rescuedAreaPath} fill="#16A34A" fillOpacity="0.14" />

        {/* Rescued Line */}
        <polyline
          fill="none"
          stroke="#15803D"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={rescuedPoints}
        />

        {/* Predicted Total Surplus Line */}
        <polyline
          fill="none"
          stroke="#0F2418"
          strokeWidth="2"
          strokeDasharray="5 4"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={surplusPoints}
        />

        {/* Interactive Data Points & X Axis Labels */}
        {data.map((point, idx) => {
          const cx = getX(idx);
          const cySurplus = getY(point.predictedSurplusKg);
          const cyRescued = getY(point.rescuedProjectedKg);
          const isHovered = hoveredIdx === idx;

          return (
            <g
              key={point.day}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              {/* Invisible wide hit column */}
              <rect
                x={cx - chartW / (data.length * 2)}
                y={padTop}
                width={chartW / data.length}
                height={chartH + padBottom}
                fill="transparent"
              />
              {isHovered && (
                <line
                  x1={cx}
                  y1={padTop}
                  x2={cx}
                  y2={padTop + chartH}
                  stroke="#94A3B8"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
              )}
              <circle
                cx={cx}
                cy={cySurplus}
                r={isHovered ? 5 : 3.5}
                fill="#FFFFFF"
                stroke="#0F2418"
                strokeWidth="2"
              />
              <circle
                cx={cx}
                cy={cyRescued}
                r={isHovered ? 5.5 : 4}
                fill="#15803D"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
              <text
                x={cx}
                y={height - 8}
                textAnchor="middle"
                className={`text-[11px] ${
                  isHovered ? 'fill-[#0F2418] font-semibold' : 'fill-[#6B8275]'
                }`}
              >
                {point.day}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

interface CategoryBreakdownChartProps {
  categories: CategoryPrediction[];
}

export const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({
  categories,
}) => {
  const maxKg = Math.max(1, ...categories.map((c) => c.estimatedWasteKg));

  return (
    <div className="space-y-4">
      {categories.map((item) => {
        const widthPct = Math.round((item.estimatedWasteKg / maxKg) * 100);
        const rescuedWidthPct = Math.round((widthPct * item.rescueRatePct) / 100);
        const riskHigh = item.spoilageRiskPct >= 28;

        return (
          <div key={item.category} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-[#0F2418]">{item.category}</span>
              <span className="font-mono-tabular text-xs text-[#475E51]">
                {item.estimatedWasteKg} kg/wk ·{' '}
                <span className={riskHigh ? 'text-[#B45309] font-semibold' : 'text-[#15803D]'}>
                  {item.spoilageRiskPct}% spoilage risk
                </span>
              </span>
            </div>
            <div className="h-2.5 w-full bg-[#EDF3EF] rounded-full overflow-hidden flex">
              <div
                className="h-full bg-[#15803D] transition-all duration-300"
                style={{ width: `${rescuedWidthPct}%` }}
                title={`Projected rescued: ${item.rescueRatePct}%`}
              />
              <div
                className="h-full bg-[#F59E0B]/75 transition-all duration-300"
                style={{ width: `${Math.max(0, widthPct - rescuedWidthPct)}%` }}
                title={`At-risk surplus: ${item.spoilageRiskPct}%`}
              />
            </div>
          </div>
        );
      })}
      <div className="pt-2 flex items-center gap-5 text-xs text-[#6B8275]">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#15803D] inline-block" aria-hidden="true" />
          <span>Rescued Capacity</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#F59E0B]/75 inline-block" aria-hidden="true" />
          <span>Urgent Spoilage Window</span>
        </span>
      </div>
    </div>
  );
};

interface ImpactBarChartProps {
  monthlyData: Array<{ month: string; meals: number; kg: number }>;
}

export const ImpactBarChart: React.FC<ImpactBarChartProps> = ({ monthlyData }) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const maxMeals = Math.max(1, ...monthlyData.map((m) => m.meals));

  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-3 h-44 pt-6 pb-2 border-b border-[#DCE7DF]">
        {monthlyData.map((item, idx) => {
          const heightPct = Math.max(10, Math.round((item.meals / maxMeals) * 100));
          const isActive = activeIdx === idx;
          return (
            <div
              key={item.month}
              onMouseEnter={() => setActiveIdx(idx)}
              onMouseLeave={() => setActiveIdx(null)}
              className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
            >
              <span
                className={`mb-1.5 text-[11px] font-mono-tabular transition-opacity ${
                  isActive ? 'opacity-100 text-[#0F2418] font-semibold' : 'opacity-70 text-[#6B8275]'
                }`}
              >
                {item.meals.toLocaleString()}
              </span>
              <div
                className={`w-full max-w-[44px] rounded-t-md transition-colors duration-200 ${
                  isActive ? 'bg-[#166534]' : 'bg-[#16A34A]'
                }`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between gap-3 pt-2">
        {monthlyData.map((item, idx) => (
          <div
            key={item.month}
            className={`flex-1 text-center text-xs ${
              activeIdx === idx ? 'text-[#0F2418] font-semibold' : 'text-[#6B8275]'
            }`}
          >
            {item.month}
          </div>
        ))}
      </div>
    </div>
  );
};
