import React, { useMemo, useState } from 'react';
import { ArrowRight, BarChart3, ThermometerSun } from 'lucide-react';
import {
  AppView,
  FoodDonation,
  LocationZone,
  NgoProfile,
  ScenarioType,
} from '../types/foodbridge';
import {
  generateAiRecommendations,
  generateCategoryPredictions,
  generateWeeklyForecast,
} from '../utils/predictionEngine';
import { CategoryBreakdownChart, WasteForecastChart } from './Charts';

interface AiInsightsViewProps {
  donations: FoodDonation[];
  ngos: NgoProfile[];
  onNavigate: (view: AppView) => void;
}

const SCENARIOS: ScenarioType[] = [
  'Regular Weekday',
  'Weekend Peak',
  'College Welfare Fair',
  'Festive Banquet',
];

const ZONES: Array<LocationZone | 'All Zones'> = [
  'All Zones',
  'North Campus',
  'City Center',
  'East Market',
  'South Hub',
  'West Tech Park',
];

export const AiInsightsView: React.FC<AiInsightsViewProps> = ({
  donations,
  ngos,
  onNavigate,
}) => {
  const [scenario, setScenario] = useState<ScenarioType>('College Welfare Fair');
  const [selectedZone, setSelectedZone] = useState<LocationZone | 'All Zones'>('All Zones');
  const [ambientTempC, setAmbientTempC] = useState<number>(26);

  const weeklyForecast = useMemo(
    () => generateWeeklyForecast(scenario, selectedZone, ambientTempC, donations),
    [scenario, selectedZone, ambientTempC, donations]
  );

  const categoryBreakdown = useMemo(
    () => generateCategoryPredictions(scenario, ambientTempC, donations),
    [scenario, ambientTempC, donations]
  );

  const recommendations = useMemo(
    () => generateAiRecommendations(donations, ngos, scenario),
    [donations, ngos, scenario]
  );

  const totals = useMemo(() => {
    const surplusKg = weeklyForecast.reduce((s, d) => s + d.predictedSurplusKg, 0);
    const rescuedKg = weeklyForecast.reduce((s, d) => s + d.rescuedProjectedKg, 0);
    const atRiskKg = weeklyForecast.reduce((s, d) => s + d.unrescuedRiskKg, 0);
    const efficiencyPct = surplusKg > 0 ? Math.round((rescuedKg / surplusKg) * 100) : 0;
    return { surplusKg, rescuedKg, atRiskKg, efficiencyPct };
  }, [weeklyForecast]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-[#15803D]">
            AI Food Waste Prediction Engine
          </div>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#0F2418] tracking-tight">
            Surplus Trends, Spoilage Risk &amp; Dispatch Insights
          </h1>
          <p className="mt-1 text-sm text-[#475E51]">
            Simulate campus events, seasonal banquet surges, and ambient temperature to guide proactive NGO pickups.
          </p>
        </div>
      </div>

      {/* Interactive Prediction Scenario Controls */}
      <section className="bg-white border border-[#DCE7DF] rounded-xl p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        <div className="md:col-span-5 space-y-1.5">
          <div className="text-xs font-medium text-[#6B8275]">Event &amp; Demand Scenario</div>
          <div className="flex flex-wrap gap-1 p-1 bg-[#F2F7F4] rounded-lg">
            {SCENARIOS.map((sc) => (
              <button
                key={sc}
                type="button"
                onClick={() => setScenario(sc)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  scenario === sc
                    ? 'bg-white text-[#0F2418] shadow-xs font-semibold'
                    : 'text-[#475E51] hover:text-[#0F2418]'
                }`}
              >
                {sc}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-3 space-y-1.5">
          <label htmlFor="ai-zone" className="block text-xs font-medium text-[#6B8275]">
            Focus Locality
          </label>
          <select
            id="ai-zone"
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value as LocationZone | 'All Zones')}
            className="w-full px-3.5 py-2 text-sm bg-white border border-[#DCE7DF] rounded-lg text-[#0F2418] focus:border-[#15803D] focus:outline-none"
          >
            {ZONES.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#6B8275] inline-flex items-center gap-1.5">
              <ThermometerSun className="w-3.5 h-3.5 text-[#15803D]" aria-hidden="true" />
              <span>Ambient Kitchen / Transit Temp</span>
            </span>
            <span className="font-mono-tabular font-semibold text-[#0F2418]">
              {ambientTempC}°C
            </span>
          </div>
          <input
            type="range"
            min="16"
            max="38"
            value={ambientTempC}
            onChange={(e) => setAmbientTempC(Number(e.target.value))}
            aria-label="Ambient temperature in Celsius"
            className="w-full accent-[#15803D] cursor-pointer"
          />
        </div>
      </section>

      {/* Forecast Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#DCE7DF] rounded-xl p-5">
          <div className="text-xs text-[#6B8275]">Estimated Weekly Surplus</div>
          <div className="mt-1 font-mono-tabular text-2xl font-bold text-[#0F2418]">
            {totals.surplusKg.toLocaleString()} kg
          </div>
          <div className="mt-1 text-xs text-[#475E51]">
            ~{Math.round(totals.surplusKg * 3.1).toLocaleString()} meals equivalent
          </div>
        </div>

        <div className="bg-white border border-[#DCE7DF] rounded-xl p-5">
          <div className="text-xs text-[#6B8275]">Projected Rescued Volume</div>
          <div className="mt-1 font-mono-tabular text-2xl font-bold text-[#15803D]">
            {totals.rescuedKg.toLocaleString()} kg
          </div>
          <div className="mt-1 text-xs text-[#475E51]">Within safe NGO delivery window</div>
        </div>

        <div className="bg-white border border-[#DCE7DF] rounded-xl p-5">
          <div className="text-xs text-[#6B8275]">Unrescued Spoilage Risk</div>
          <div className="mt-1 font-mono-tabular text-2xl font-bold text-[#B45309]">
            {totals.atRiskKg.toLocaleString()} kg
          </div>
          <div className="mt-1 text-xs text-[#475E51]">
            Requires rapid dispatch (&le; 4h)
          </div>
        </div>

        <div className="bg-white border border-[#DCE7DF] rounded-xl p-5">
          <div className="text-xs text-[#6B8275]">Forecast Rescue Efficiency</div>
          <div className="mt-1 font-mono-tabular text-2xl font-bold text-[#0F2418]">
            {totals.efficiencyPct}%
          </div>
          <div className="mt-1 text-xs text-[#15803D]">
            Driven by {selectedZone} courier routing
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-[#DCE7DF] rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold text-[#0F2418]">
                7-Day Surplus &amp; Rescue Forecast
              </h2>
              <p className="text-xs sm:text-sm text-[#475E51]">
                Hover over any day to inspect predicted surplus vs. rescue capacity under{' '}
                {scenario}.
              </p>
            </div>
            <BarChart3 className="w-5 h-5 text-[#15803D] shrink-0" aria-hidden="true" />
          </div>

          <WasteForecastChart data={weeklyForecast} />
        </div>

        <div className="lg:col-span-5 bg-white border border-[#DCE7DF] rounded-xl p-6 space-y-5">
          <div>
            <h2 className="font-display text-lg font-bold text-[#0F2418]">
              Category Spoilage Risk Breakdown
            </h2>
            <p className="text-xs sm:text-sm text-[#475E51]">
              Cooked meals and dairy degrade fastest at {ambientTempC}°C; dry goods retain high
              rescue rates.
            </p>
          </div>

          <CategoryBreakdownChart categories={categoryBreakdown} />
        </div>
      </div>

      {/* Actionable AI Donation & Redistribution Recommendations */}
      <section className="bg-white border border-[#DCE7DF] rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EDF3EF]">
          <div>
            <h2 className="font-display text-lg font-bold text-[#0F2418]">
              Recommended Redistribution Actions
            </h2>
            <p className="text-xs sm:text-sm text-[#475E51]">
              Generated from current expiring batches, pending approvals, and {scenario} demand.
            </p>
          </div>
        </div>

        <div className="divide-y divide-[#EDF3EF]">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`text-xs font-semibold ${
                      rec.urgency === 'High'
                        ? 'text-[#B91C1C]'
                        : rec.urgency === 'Medium'
                        ? 'text-[#B45309]'
                        : 'text-[#15803D]'
                    }`}
                  >
                    {rec.urgency} Priority
                  </span>
                  <span aria-hidden="true" className="text-[#CBD5E1]">
                    ·
                  </span>
                  <h3 className="font-display text-base font-semibold text-[#0F2418]">
                    {rec.title}
                  </h3>
                </div>
                <p className="text-sm text-[#475E51] max-w-3xl">{rec.actionSummary}</p>
                <div className="text-xs text-[#6B8275] flex flex-wrap items-center gap-x-2">
                  <span>Target: {rec.targetNgo}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular text-[#15803D] font-medium">
                    +{rec.estimatedMealsSaved} meals protected
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  onNavigate(rec.id === 'rec-admin-queue' ? 'admin' : 'ngo')
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-[#15803D] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start md:self-auto"
              >
                <span>
                  {rec.id === 'rec-admin-queue' ? 'Review in Admin' : 'Open in NGO Feed'}
                </span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
