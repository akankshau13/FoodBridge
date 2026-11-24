import React, { useState } from 'react';
import { ArrowRight, Leaf, ShieldCheck, TrendingUp, Utensils } from 'lucide-react';
import { AppView, FoodDonation, ImpactSummary } from '../types/foodbridge';
import { ImpactBarChart } from './Charts';
import { DonationStatusLabel } from './StatusIndicator';

interface HomeViewProps {
  impact: ImpactSummary;
  donations: FoodDonation[];
  onNavigate: (view: AppView) => void;
  onStartDonation: () => void;
}

const MONTHLY_IMPACT_DATA = [
  { month: 'Jun', meals: 1420, kg: 410 },
  { month: 'Jul', meals: 1860, kg: 540 },
  { month: 'Aug', meals: 2150, kg: 625 },
  { month: 'Sep', meals: 2490, kg: 720 },
  { month: 'Oct', meals: 2910, kg: 845 },
  { month: 'Nov', meals: 3340, kg: 970 },
];

export const HomeView: React.FC<HomeViewProps> = ({
  impact,
  donations,
  onNavigate,
  onStartDonation,
}) => {
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [prepImgFailed, setPrepImgFailed] = useState(false);
  const [distImgFailed, setDistImgFailed] = useState(false);

  const availableHighlights = donations
    .filter((d) => d.status === 'Available')
    .slice(0, 3);

  return (
    <div className="space-y-16 pb-8">
      {/* Hero Split Section */}
      <section className="bg-white border-b border-[#DCE7DF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Left Content Column */}
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <div className="text-sm font-medium text-[#15803D]">
                Community Food Rescue · Campus &amp; City Network
              </div>

              <h1
                className="font-display font-bold tracking-tight text-[#0F2418] leading-[1.12]"
                style={{
                  fontSize: 'clamp(2.25rem, 4vw, 3.35rem)',
                  textWrap: 'balance',
                }}
              >
                Turn daily surplus meals into reliable community nutrition
              </h1>

              <p className="text-base sm:text-lg text-[#475E51] leading-relaxed max-w-xl">
                FoodBridge connects campus messes, restaurants, hotels, and event
                organizers with verified local NGOs. Predict surplus volume before
                spoilage happens and coordinate rapid, tracked pickups.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <button
                  type="button"
                  onClick={onStartDonation}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Donate Surplus Food</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('ngo')}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[#0F2418] bg-[#F2F7F4] hover:bg-[#E4EFE8] border border-[#DCE7DF] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Browse Available Food</span>
                </button>
              </div>
            </div>

            {/* Right Visual Column */}
            <div className="lg:col-span-6 flex">
              <div className="relative w-full min-h-[300px] lg:min-h-[380px] rounded-xl overflow-hidden border border-[#DCE7DF] bg-[#EAF3ED]">
                {!heroImgFailed ? (
                  <img
                    src="/src/assets/images/hero_community_kitchen_1795503916569.jpg"
                    alt="Fresh surplus leafy greens, produce, artisan bread, and sealed community meal trays packed in wooden crates"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-full lg:h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-emerald-50 to-emerald-100">
                    <Leaf className="w-12 h-12 text-[#15803D] mb-3" aria-hidden="true" />
                    <p className="font-display font-semibold text-[#0F2418]">
                      Fresh Surplus Food Redistribution
                    </p>
                  </div>
                )}
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none"
                />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      Verified Cold-Chain &amp; Hot-Meal Handoffs
                    </p>
                    <p className="text-xs text-emerald-100">
                      Same-day dispatch within 3–6 hour freshness windows
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('ai-insights')}
                    className="text-xs font-semibold text-white underline underline-offset-4 hover:text-emerald-200 cursor-pointer whitespace-nowrap"
                  >
                    View AI Forecast
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Full-Width 4-Column Community Impact KPI Strip */}
          <div className="mt-10 pt-8 border-t border-[#DCE7DF] grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="text-xs font-medium text-[#6B8275]">
                Total Food Donated
              </div>
              <div className="mt-1 font-mono-tabular text-2xl sm:text-3xl font-semibold text-[#0F2418]">
                {impact.totalFoodDonatedKg.toLocaleString()} kg
              </div>
              <div className="mt-1 text-xs text-[#15803D]">
                {impact.co2PreventedKg.toLocaleString()} kg CO₂ emissions avoided
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-[#6B8275]">
                Community Meals Saved
              </div>
              <div className="mt-1 font-mono-tabular text-2xl sm:text-3xl font-semibold text-[#0F2418]">
                {impact.totalMealsSaved.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-[#475E51]">
                Verified portions delivered
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-[#6B8275]">
                Active Food Donors
              </div>
              <div className="mt-1 font-mono-tabular text-2xl sm:text-3xl font-semibold text-[#0F2418]">
                {impact.activeDonorsCount}
              </div>
              <div className="mt-1 text-xs text-[#475E51]">
                Hostels, hotels, bakeries &amp; events
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-[#6B8275]">
                Partner NGOs Helped
              </div>
              <div className="mt-1 font-mono-tabular text-2xl sm:text-3xl font-semibold text-[#0F2418]">
                {impact.ngosHelpedCount}
              </div>
              <div className="mt-1 text-xs text-[#475E51]">
                Shelters &amp; community pantries
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Workflows + Visual Proof */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2
              className="font-display text-2xl sm:text-3xl font-bold text-[#0F2418] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Three dedicated portals working in sync
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#475E51] max-w-2xl">
              Built for rapid coordination between surplus kitchens, verified charity
              coordinators, and welfare fair administrators.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('admin')}
            className="text-sm font-semibold text-[#15803D] hover:text-[#166534] inline-flex items-center gap-1.5 self-start md:self-auto cursor-pointer whitespace-nowrap"
          >
            <span>Open Admin Console</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Donor Portal */}
          <div className="bg-white border border-[#DCE7DF] rounded-xl overflow-hidden flex flex-col">
            <div className="h-44 bg-[#EAF3ED] overflow-hidden border-b border-[#DCE7DF]">
              {!prepImgFailed ? (
                <img
                  src="/src/assets/images/donor_restaurant_prep_1795503917576.jpg"
                  alt="Restaurant prep table with labeled recyclable meal containers and fresh bread ready for pickup"
                  referrerPolicy="no-referrer"
                  onError={() => setPrepImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Utensils className="w-8 h-8 text-[#15803D]" aria-hidden="true" />
                </div>
              )}
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="text-xs font-medium text-[#6B8275]">
                  01. For Restaurants, Hostels &amp; Events
                </div>
                <h3 className="mt-1.5 font-display text-lg font-bold text-[#0F2418]">
                  Donor Surplus Registration
                </h3>
                <p className="mt-2 text-sm text-[#475E51] leading-relaxed">
                  Log food category, weight, safe expiry window, and pickup address in
                  under 45 seconds. Receive instant spoilage risk scores and NGO match
                  suggestions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('donor')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#15803D] hover:text-[#166534] cursor-pointer self-start"
              >
                <span>Open Donor Portal</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Card 2: NGO Portal */}
          <div className="bg-white border border-[#DCE7DF] rounded-xl overflow-hidden flex flex-col">
            <div className="h-44 bg-[#EAF3ED] overflow-hidden border-b border-[#DCE7DF]">
              {!distImgFailed ? (
                <img
                  src="/src/assets/images/impact_meal_distribution_1795503917407.jpg"
                  alt="Student volunteers and NGO coordinators organizing fresh produce and meal boxes outdoors"
                  referrerPolicy="no-referrer"
                  onError={() => setDistImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-[#15803D]" aria-hidden="true" />
                </div>
              )}
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="text-xs font-medium text-[#6B8275]">
                  02. For Verified NGOs &amp; Shelters
                </div>
                <h3 className="mt-1.5 font-display text-lg font-bold text-[#0F2418]">
                  Live Browse, Filter &amp; Claim
                </h3>
                <p className="mt-2 text-sm text-[#475E51] leading-relaxed">
                  Search nearby donations by category, quantity, location zone, and
                  remaining shelf life. Submit pickup requests with courier ETA and
                  track delivery completion.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('ngo')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#15803D] hover:text-[#166534] cursor-pointer self-start"
              >
                <span>Browse NGO Feed</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Card 3: AI Prediction & Admin */}
          <div className="bg-white border border-[#DCE7DF] rounded-xl p-6 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#6B8275]">
                  03. Predictive Wastage Analytics
                </span>
                <TrendingUp className="w-4 h-4 text-[#15803D]" aria-hidden="true" />
              </div>
              <h3 className="mt-1.5 font-display text-lg font-bold text-[#0F2418]">
                6-Month Meals Rescued Trend
              </h3>
              <p className="mt-1.5 text-sm text-[#475E51]">
                Forecasting weekly hostel &amp; banquet surplus cuts unrescued spoilage
                by 38%.
              </p>
              <div className="mt-4">
                <ImpactBarChart monthlyData={MONTHLY_IMPACT_DATA} />
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('ai-insights')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#15803D] hover:text-[#166534] cursor-pointer self-start"
            >
              <span>Explore AI Prediction Dashboard</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Live Available Food Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#DCE7DF] rounded-xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EDF3EF]">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0F2418]">
                Currently Available Surplus Listings
              </h2>
              <p className="mt-1 text-sm text-[#475E51]">
                Approved donations ready for immediate NGO pickup request.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('ngo')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#15803D] bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <span>View All Listings</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {availableHighlights.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#475E51]">
              All currently approved food batches have been claimed or delivered. Register a
              new donation in the Donor Portal to test live matching.
            </div>
          ) : (
            <div className="divide-y divide-[#EDF3EF]">
              {availableHighlights.map((item) => (
                <div
                  key={item.id}
                  className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-display text-base font-semibold text-[#0F2418]">
                        {item.foodName}
                      </h3>
                      <DonationStatusLabel status={item.status} />
                    </div>
                    <div className="text-xs sm:text-sm text-[#475E51] flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>{item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular font-medium text-[#0F2418]">
                        {item.quantityKg} kg ({item.servingsEstimate} meals)
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.zone}</span>
                      <span aria-hidden="true">·</span>
                      <span>Donor: {item.donorName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-left md:text-right">
                      <div className="text-xs text-[#6B8275]">Expires in</div>
                      <div className="font-mono-tabular text-sm font-semibold text-[#B45309]">
                        {item.expiryHours} hrs
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('ngo')}
                      className="px-4 py-2 text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Claim in NGO Portal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
