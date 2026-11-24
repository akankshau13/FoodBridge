import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock, MapPin, PlusCircle, Truck } from 'lucide-react';
import {
  DonationStatus,
  DonorType,
  FoodCategory,
  FoodDonation,
  LocationZone,
  NgoProfile,
} from '../types/foodbridge';
import { previewNewDonationPrediction } from '../utils/predictionEngine';
import { DonationStatusLabel } from './StatusIndicator';

interface DonorDashboardProps {
  donations: FoodDonation[];
  ngos: NgoProfile[];
  onAddDonation: (
    donation: Omit<
      FoodDonation,
      'id' | 'status' | 'createdAt' | 'updatedAt' | 'servingsEstimate' | 'expiryTimeLabel'
    >
  ) => void;
  onAdvanceDonorDemoStage: (donationId: string) => void;
}

const CATEGORIES: FoodCategory[] = [
  'Cooked Meals',
  'Fresh Produce',
  'Bakery & Bread',
  'Dairy & Beverages',
  'Packaged & Dry',
];

const DONOR_TYPES: DonorType[] = [
  'Restaurant',
  'Hotel',
  'Event Organizer',
  'Campus Mess',
  'Individual',
];

const ZONES: LocationZone[] = [
  'North Campus',
  'City Center',
  'East Market',
  'South Hub',
  'West Tech Park',
];

const DELIVERY_STEPS = ['Submitted', 'Approved', 'Claimed', 'In Transit', 'Delivered'];

function getStepIndex(status: DonationStatus): number {
  switch (status) {
    case 'Pending Approval':
      return 0;
    case 'Available':
      return 1;
    case 'Requested':
      return 2;
    case 'In Transit':
      return 3;
    case 'Delivered':
      return 4;
    default:
      return -1;
  }
}

export const DonorDashboard: React.FC<DonorDashboardProps> = ({
  donations,
  ngos,
  onAddDonation,
  onAdvanceDonorDemoStage,
}) => {
  const [foodName, setFoodName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('Cooked Meals');
  const [quantityKg, setQuantityKg] = useState('18');
  const [expiryHours, setExpiryHours] = useState('4');
  const [zone, setZone] = useState<LocationZone>('North Campus');
  const [pickupLocation, setPickupLocation] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorType, setDonorType] = useState<DonorType>('Campus Mess');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [storageNote, setStorageNote] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<DonationStatus | 'All'>('All');

  const parsedKg = Math.max(1, Number(quantityKg) || 1);
  const parsedExpiry = Math.max(0.5, Number(expiryHours) || 1);

  const livePreview = useMemo(
    () => previewNewDonationPrediction(category, parsedKg, parsedExpiry, zone, ngos),
    [category, parsedKg, parsedExpiry, zone, ngos]
  );

  const filteredDonations = useMemo(() => {
    if (statusFilter === 'All') return donations;
    return donations.filter((d) => d.status === statusFilter);
  }, [donations, statusFilter]);

  const donorStats = useMemo(() => {
    const activeCount = donations.filter(
      (d) => d.status === 'Available' || d.status === 'Pending Approval'
    ).length;
    const deliveredCount = donations.filter((d) => d.status === 'Delivered').length;
    const totalKg = donations
      .filter((d) => d.status !== 'Rejected')
      .reduce((sum, d) => sum + d.quantityKg, 0);
    const totalMeals = donations
      .filter((d) => d.status !== 'Rejected')
      .reduce((sum, d) => sum + d.servingsEstimate, 0);
    return { activeCount, deliveredCount, totalKg, totalMeals };
  }, [donations]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmittedSuccess(null);

    if (!foodName.trim() || !pickupLocation.trim() || !donorName.trim() || !contactName.trim()) {
      setFormError('Please fill in food name, donor organization, pickup address, and contact name.');
      return;
    }

    const kgNum = Number(quantityKg);
    const expNum = Number(expiryHours);

    if (Number.isNaN(kgNum) || kgNum <= 0) {
      setFormError('Quantity must be greater than 0 kg.');
      return;
    }
    if (Number.isNaN(expNum) || expNum < 1) {
      setFormError('Expiry window must be at least 1 hour for safe NGO transport.');
      return;
    }
    if (!/^[+\d\s()-]{7,}$/.test(contactPhone.trim())) {
      setFormError('Please enter a valid contact phone number (at least 7 digits).');
      return;
    }

    onAddDonation({
      foodName: foodName.trim(),
      category,
      quantityKg: Math.round(kgNum),
      expiryHours: expNum,
      pickupLocation: pickupLocation.trim(),
      zone,
      donorName: donorName.trim(),
      donorType,
      contactName: contactName.trim(),
      contactPhone: contactPhone.trim(),
      storageNote: storageNote.trim() || 'Sealed clean food-grade containers',
    });

    setSubmittedSuccess(
      `"${foodName.trim()}" (${Math.round(kgNum)} kg) submitted to the Admin approval queue.`
    );
    setFoodName('');
    setPickupLocation('');
    setStorageNote('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Summary Strip */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-[#15803D]">Donor Portal</div>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#0F2418] tracking-tight">
            Register Surplus Food &amp; Track Deliveries
          </h1>
          <p className="mt-1 text-sm text-[#475E51]">
            Submit excess food from kitchens, hotels, events, or homes for verified NGO pickup.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#DCE7DF] rounded-xl p-4">
          <div className="text-xs text-[#6B8275]">Active &amp; Pending Batches</div>
          <div className="mt-1 font-mono-tabular text-2xl font-bold text-[#0F2418]">
            {donorStats.activeCount}
          </div>
        </div>
        <div className="bg-white border border-[#DCE7DF] rounded-xl p-4">
          <div className="text-xs text-[#6B8275]">Listed Volume</div>
          <div className="mt-1 font-mono-tabular text-2xl font-bold text-[#0F2418]">
            {donorStats.totalKg} kg
          </div>
        </div>
        <div className="bg-white border border-[#DCE7DF] rounded-xl p-4">
          <div className="text-xs text-[#6B8275]">Estimated Servings</div>
          <div className="mt-1 font-mono-tabular text-2xl font-bold text-[#15803D]">
            {donorStats.totalMeals} meals
          </div>
        </div>
        <div className="bg-white border border-[#DCE7DF] rounded-xl p-4">
          <div className="text-xs text-[#6B8275]">Completed Deliveries</div>
          <div className="mt-1 font-mono-tabular text-2xl font-bold text-[#0F2418]">
            {donorStats.deliveredCount}
          </div>
        </div>
      </div>

      {/* Registration Form + Live AI Prediction Preview */}
      <div id="register-surplus-form" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-8 bg-white border border-[#DCE7DF] rounded-xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#EDF3EF]">
            <h2 className="font-display text-lg font-bold text-[#0F2418]">
              Surplus Food Registration Form
            </h2>
            <span className="text-xs text-[#6B8275]">All fields validated on submit</span>
          </div>

          {formError && (
            <div
              role="alert"
              className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800"
            >
              {formError}
            </div>
          )}

          {submittedSuccess && (
            <div
              role="status"
              className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" aria-hidden="true" />
              <span>{submittedSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="food-name" className="block text-sm font-medium text-[#0F2418] mb-1.5">
                Food Name / Description
              </label>
              <input
                id="food-name"
                type="text"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="e.g., Steamed Rice, Dal Tadka & Mixed Veg Curry"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DCE7DF] rounded-lg text-[#0F2418] placeholder:text-[#8BA093] focus:border-[#15803D] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="food-category" className="block text-sm font-medium text-[#0F2418] mb-1.5">
                Food Category
              </label>
              <select
                id="food-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodCategory)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DCE7DF] rounded-lg text-[#0F2418] focus:border-[#15803D] focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="quantity-kg" className="block text-sm font-medium text-[#0F2418] mb-1.5">
                  Quantity (kg)
                </label>
                <input
                  id="quantity-kg"
                  type="number"
                  min="1"
                  max="500"
                  value={quantityKg}
                  onChange={(e) => setQuantityKg(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-mono-tabular bg-white border border-[#DCE7DF] rounded-lg text-[#0F2418] focus:border-[#15803D] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="expiry-hours" className="block text-sm font-medium text-[#0F2418] mb-1.5">
                  Expiry (hours)
                </label>
                <input
                  id="expiry-hours"
                  type="number"
                  min="1"
                  max="240"
                  step="0.5"
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-mono-tabular bg-white border border-[#DCE7DF] rounded-lg text-[#0F2418] focus:border-[#15803D] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="donor-name" className="block text-sm font-medium text-[#0F2418] mb-1.5">
                Donor Organization / Name
              </label>
              <input
                id="donor-name"
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="e.g., Central Hostel Mess or GreenBite Cafe"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DCE7DF] rounded-lg text-[#0F2418] placeholder:text-[#8BA093] focus:border-[#15803D] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="donor-type" className="block text-sm font-medium text-[#0F2418] mb-1.5">
                Donor Type
              </label>
              <select
                id="donor-type"
                value={donorType}
                onChange={(e) => setDonorType(e.target.value as DonorType)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DCE7DF] rounded-lg text-[#0F2418] focus:border-[#15803D] focus:outline-none"
              >
                {DONOR_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="pickup-zone" className="block text-sm font-medium text-[#0F2418] mb-1.5">
                Zone / Locality
              </label>
              <select
                id="pickup-zone"
                value={zone}
                onChange={(e) => setZone(e.target.value as LocationZone)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DCE7DF] rounded-lg text-[#0F2418] focus:border-[#15803D] focus:outline-none"
              >
                {ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="pickup-address" className="block text-sm font-medium text-[#0F2418] mb-1.5">
                Exact Pickup Address
              </label>
              <input
                id="pickup-address"
                type="text"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="Building, gate or street address"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DCE7DF] rounded-lg text-[#0F2418] placeholder:text-[#8BA093] focus:border-[#15803D] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="contact-name" className="block text-sm font-medium text-[#0F2418] mb-1.5">
                Contact Person
              </label>
              <input
                id="contact-name"
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Coordinator full name"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DCE7DF] rounded-lg text-[#0F2418] placeholder:text-[#8BA093] focus:border-[#15803D] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="contact-phone" className="block text-sm font-medium text-[#0F2418] mb-1.5">
                Contact Phone
              </label>
              <input
                id="contact-phone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 98XXX XXXXX"
                className="w-full px-3.5 py-2.5 text-sm font-mono-tabular bg-white border border-[#DCE7DF] rounded-lg text-[#0F2418] placeholder:text-[#8BA093] focus:border-[#15803D] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="storage-note" className="block text-sm font-medium text-[#0F2418] mb-1.5">
                Packaging &amp; Storage Condition (Optional)
              </label>
              <input
                id="storage-note"
                type="text"
                value={storageNote}
                onChange={(e) => setStorageNote(e.target.value)}
                placeholder="e.g., Sealed aluminum foil trays, refrigerated at 4°C"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DCE7DF] rounded-lg text-[#0F2418] placeholder:text-[#8BA093] focus:border-[#15803D] focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-[#6B8275]">
              New submissions enter the Admin verification queue before NGO dispatch.
            </p>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" aria-hidden="true" />
              <span>Register Surplus Food</span>
            </button>
          </div>
        </form>

        {/* AI Impact & Spoilage Estimator Sidebar */}
        <aside className="lg:col-span-4 bg-white border border-[#DCE7DF] rounded-xl p-6 space-y-5">
          <div>
            <div className="text-xs font-medium text-[#15803D]">Live Prediction Preview</div>
            <h3 className="mt-1 font-display text-lg font-bold text-[#0F2418]">
              Estimated Rescue Impact
            </h3>
            <p className="mt-1 text-xs text-[#475E51]">
              Calculated automatically from your food category, weight, and shelf life.
            </p>
          </div>

          <div className="divide-y divide-[#EDF3EF] border-y border-[#EDF3EF]">
            <div className="py-3.5 flex items-center justify-between">
              <span className="text-sm text-[#475E51]">Estimated Meals</span>
              <span className="font-mono-tabular text-base font-bold text-[#0F2418]">
                ~{livePreview.estimatedMeals} servings
              </span>
            </div>
            <div className="py-3.5 flex items-center justify-between">
              <span className="text-sm text-[#475E51]">CO₂ Waste Avoided</span>
              <span className="font-mono-tabular text-base font-semibold text-[#15803D]">
                {livePreview.co2SavedKg} kg
              </span>
            </div>
            <div className="py-3.5 flex items-center justify-between">
              <span className="text-sm text-[#475E51]">Spoilage Urgency</span>
              <span
                className={`text-sm font-semibold ${
                  livePreview.spoilageRisk === 'Urgent'
                    ? 'text-[#B91C1C]'
                    : livePreview.spoilageRisk === 'Moderate'
                    ? 'text-[#B45309]'
                    : 'text-[#15803D]'
                }`}
              >
                {livePreview.spoilageRisk}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#F7FAF8] border border-[#DCE7DF] space-y-1.5">
            <div className="text-xs font-medium text-[#6B8275]">Best Local NGO Match</div>
            <div className="font-display text-sm font-bold text-[#0F2418]">
              {livePreview.recommendedNgo}
            </div>
            <div className="text-xs text-[#475E51] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#15803D] shrink-0" aria-hidden="true" />
              <span>Prioritized for {zone} pickup corridor</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Donation & Delivery Tracking Table */}
      <section className="bg-white border border-[#DCE7DF] rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[#0F2418]">
              Registered Donations &amp; Delivery Progress
            </h2>
            <p className="text-xs sm:text-sm text-[#475E51]">
              Monitor admin approval status, NGO claims, and real-time transit stages.
            </p>
          </div>

          {/* Interactive Status Filter Controls */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F2F7F4] rounded-lg">
            {(['All', 'Pending Approval', 'Available', 'Requested', 'In Transit', 'Delivered'] as const).map(
              (tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    statusFilter === tab
                      ? 'bg-white text-[#0F2418] shadow-xs font-semibold'
                      : 'text-[#475E51] hover:text-[#0F2418]'
                  }`}
                >
                  {tab}
                </button>
              )
            )}
          </div>
        </div>

        {filteredDonations.length === 0 ? (
          <div className="py-10 text-center text-sm text-[#475E51]">
            No donations match the selected status filter.
          </div>
        ) : (
          <div className="divide-y divide-[#EDF3EF]">
            {filteredDonations.map((donation) => {
              const stepIdx = getStepIndex(donation.status);
              return (
                <div key={donation.id} className="py-5 space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-display text-base font-semibold text-[#0F2418]">
                          {donation.foodName}
                        </h3>
                        <DonationStatusLabel status={donation.status} />
                      </div>
                      <div className="text-xs sm:text-sm text-[#475E51] flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>{donation.donorName}</span>
                        <span aria-hidden="true">·</span>
                        <span>{donation.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular font-medium text-[#0F2418]">
                          {donation.quantityKg} kg ({donation.servingsEstimate} meals)
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{donation.zone}</span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-[#6B8275]">
                          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{donation.expiryHours}h left</span>
                        </span>
                      </div>
                      {donation.assignedNgoName && (
                        <div className="text-xs text-[#15803D] font-medium">
                          Assigned NGO: {donation.assignedNgoName}
                        </div>
                      )}
                      {donation.rejectionReason && (
                        <div className="text-xs text-[#B91C1C]">
                          Reason: {donation.rejectionReason}
                        </div>
                      )}
                    </div>

                    {/* Quick Demo Stage Action for Requested / In Transit items */}
                    {(donation.status === 'Requested' || donation.status === 'In Transit') && (
                      <button
                        type="button"
                        onClick={() => onAdvanceDonorDemoStage(donation.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#15803D] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start lg:self-auto"
                      >
                        <Truck className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>
                          {donation.status === 'Requested'
                            ? 'Mark Handed to Courier'
                            : 'Confirm Delivered'}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Clean Horizontal Delivery Progress Stepper */}
                  {stepIdx >= 0 && (
                    <div className="grid grid-cols-5 gap-2 pt-1">
                      {DELIVERY_STEPS.map((step, i) => {
                        const completed = i <= stepIdx;
                        return (
                          <div key={step} className="space-y-1">
                            <div
                              className={`h-1.5 rounded-full transition-colors ${
                                completed ? 'bg-[#15803D]' : 'bg-[#E5EFE8]'
                              }`}
                            />
                            <div
                              className={`text-[11px] truncate ${
                                completed ? 'text-[#0F2418] font-medium' : 'text-[#6B8275]'
                              }`}
                            >
                              {step}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
