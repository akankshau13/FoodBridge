import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  MapPin,
  PackageCheck,
  Search,
  Truck,
  X,
} from 'lucide-react';
import {
  FoodCategory,
  FoodDonation,
  FoodRequest,
  LocationZone,
  NgoProfile,
} from '../types/foodbridge';
import { DonationStatusLabel, RequestStatusLabel } from './StatusIndicator';

interface NgoDashboardProps {
  donations: FoodDonation[];
  requests: FoodRequest[];
  ngos: NgoProfile[];
  onSubmitFoodRequest: (payload: {
    donationId: string;
    ngoId: string;
    pickupEta: string;
    volunteerName: string;
    notes: string;
  }) => void;
  onUpdateDeliveryStage: (donationId: string, nextStatus: 'In Transit' | 'Delivered') => void;
}

const CATEGORIES: Array<FoodCategory | 'All'> = [
  'All',
  'Cooked Meals',
  'Fresh Produce',
  'Bakery & Bread',
  'Dairy & Beverages',
  'Packaged & Dry',
];

const ZONES: Array<LocationZone | 'All'> = [
  'All',
  'North Campus',
  'City Center',
  'East Market',
  'South Hub',
  'West Tech Park',
];

export const NgoDashboard: React.FC<NgoDashboardProps> = ({
  donations,
  requests,
  ngos,
  onSubmitFoodRequest,
  onUpdateDeliveryStage,
}) => {
  const verifiedNgos = ngos.filter((n) => n.verified);
  const [selectedNgoId, setSelectedNgoId] = useState<string>(
    verifiedNgos[0]?.id ?? ngos[0]?.id ?? 'ngo-1'
  );

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FoodCategory | 'All'>('All');
  const [zoneFilter, setZoneFilter] = useState<LocationZone | 'All'>('All');
  const [minQtyFilter, setMinQtyFilter] = useState<number>(0);
  const [availabilityFilter, setAvailabilityFilter] = useState<
    'available' | 'urgent' | 'all'
  >('available');

  // Request Modal state
  const [claimingDonation, setClaimingDonation] = useState<FoodDonation | null>(null);
  const [pickupEta, setPickupEta] = useState('30 mins');
  const [volunteerName, setVolunteerName] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [requestFeedback, setRequestFeedback] = useState<string | null>(null);

  const activeNgo = ngos.find((n) => n.id === selectedNgoId) ?? ngos[0];

  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      if (d.status === 'Rejected' || d.status === 'Pending Approval') {
        if (availabilityFilter !== 'all') return false;
      }

      if (availabilityFilter === 'available' && d.status !== 'Available') {
        return false;
      }
      if (
        availabilityFilter === 'urgent' &&
        (d.status !== 'Available' || d.expiryHours > 5)
      ) {
        return false;
      }

      if (categoryFilter !== 'All' && d.category !== categoryFilter) {
        return false;
      }
      if (zoneFilter !== 'All' && d.zone !== zoneFilter) {
        return false;
      }
      if (d.quantityKg < minQtyFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          d.foodName.toLowerCase().includes(q) ||
          d.donorName.toLowerCase().includes(q) ||
          d.pickupLocation.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [donations, availabilityFilter, categoryFilter, zoneFilter, minQtyFilter, searchQuery]);

  const ngoRequests = useMemo(() => {
    return requests.filter((r) => r.ngoId === selectedNgoId);
  }, [requests, selectedNgoId]);

  const openClaimModal = (donation: FoodDonation) => {
    setClaimingDonation(donation);
    setVolunteerName(activeNgo?.coordinatorName ?? '');
    setPickupEta('30 mins');
    setRequestNotes('');
  };

  const handleConfirmRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimingDonation || !activeNgo) return;

    onSubmitFoodRequest({
      donationId: claimingDonation.id,
      ngoId: activeNgo.id,
      pickupEta: pickupEta.trim() || '30 mins',
      volunteerName: volunteerName.trim() || activeNgo.coordinatorName,
      notes: requestNotes.trim() || `Pickup scheduled for ${activeNgo.name}`,
    });

    setRequestFeedback(
      `Food request submitted by ${activeNgo.name} for "${claimingDonation.foodName}" (${claimingDonation.quantityKg} kg).`
    );
    setClaimingDonation(null);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('All');
    setZoneFilter('All');
    setMinQtyFilter(0);
    setAvailabilityFilter('available');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header + Active NGO Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-[#15803D]">NGO Partner Dashboard</div>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#0F2418] tracking-tight">
            Browse Available Donations &amp; Request Pickups
          </h1>
          <p className="mt-1 text-sm text-[#475E51]">
            Search verified surplus listings by food type, weight, zone, and shelf-life urgency.
          </p>
        </div>

        <div className="bg-white border border-[#DCE7DF] rounded-xl px-4 py-2.5 flex items-center gap-3 self-start lg:self-auto">
          <label htmlFor="ngo-selector" className="text-xs font-medium text-[#6B8275] whitespace-nowrap">
            Acting as NGO:
          </label>
          <select
            id="ngo-selector"
            value={selectedNgoId}
            onChange={(e) => setSelectedNgoId(e.target.value)}
            className="text-sm font-semibold text-[#0F2418] bg-transparent focus:outline-none cursor-pointer"
          >
            {ngos.map((ngo) => (
              <option key={ngo.id} value={ngo.id}>
                {ngo.name} ({ngo.zone})
              </option>
            ))}
          </select>
        </div>
      </div>

      {requestFeedback && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" aria-hidden="true" />
            <span>{requestFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setRequestFeedback(null)}
            aria-label="Dismiss notification"
            className="text-emerald-800 hover:text-emerald-950 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Multi-Filter Controls */}
      <section className="bg-white border border-[#DCE7DF] rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search
              className="w-4 h-4 text-[#6B8275] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search food name, donor, or street..."
              aria-label="Search available food donations"
              className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-[#DCE7DF] rounded-lg text-[#0F2418] placeholder:text-[#8BA093] focus:border-[#15803D] focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as FoodCategory | 'All')}
              aria-label="Filter by food category"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DCE7DF] rounded-lg text-[#0F2418] focus:border-[#15803D] focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div className="md:col-span-2">
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value as LocationZone | 'All')}
              aria-label="Filter by location zone"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DCE7DF] rounded-lg text-[#0F2418] focus:border-[#15803D] focus:outline-none"
            >
              {ZONES.map((z) => (
                <option key={z} value={z}>
                  {z === 'All' ? 'All Locations' : z}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity Filter */}
          <div className="md:col-span-2">
            <select
              value={minQtyFilter}
              onChange={(e) => setMinQtyFilter(Number(e.target.value))}
              aria-label="Filter by minimum quantity"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DCE7DF] rounded-lg text-[#0F2418] focus:border-[#15803D] focus:outline-none"
            >
              <option value={0}>Any Quantity</option>
              <option value={10}>10+ kg</option>
              <option value={20}>20+ kg</option>
              <option value={30}>30+ kg</option>
            </select>
          </div>
        </div>

        {/* Availability Segmented Tabs + Count */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F2F7F4] rounded-lg">
            <button
              type="button"
              onClick={() => setAvailabilityFilter('available')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                availabilityFilter === 'available'
                  ? 'bg-white text-[#0F2418] shadow-xs font-semibold'
                  : 'text-[#475E51] hover:text-[#0F2418]'
              }`}
            >
              Available Now
            </button>
            <button
              type="button"
              onClick={() => setAvailabilityFilter('urgent')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                availabilityFilter === 'urgent'
                  ? 'bg-white text-[#0F2418] shadow-xs font-semibold'
                  : 'text-[#475E51] hover:text-[#0F2418]'
              }`}
            >
              Expiring Soon (&le; 5h)
            </button>
            <button
              type="button"
              onClick={() => setAvailabilityFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                availabilityFilter === 'all'
                  ? 'bg-white text-[#0F2418] shadow-xs font-semibold'
                  : 'text-[#475E51] hover:text-[#0F2418]'
              }`}
            >
              All Listings
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#6B8275]">
            <span className="font-mono-tabular">
              Showing {filteredDonations.length} listing{filteredDonations.length === 1 ? '' : 's'}
            </span>
            {(searchQuery || categoryFilter !== 'All' || zoneFilter !== 'All' || minQtyFilter > 0) && (
              <button
                type="button"
                onClick={resetFilters}
                className="font-semibold text-[#15803D] hover:underline cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Available Food Listings Grid */}
      {filteredDonations.length === 0 ? (
        <div className="bg-white border border-[#DCE7DF] rounded-xl p-12 text-center space-y-3">
          <p className="font-display text-base font-semibold text-[#0F2418]">
            No donations match your current search filters
          </p>
          <p className="text-sm text-[#475E51]">
            Try broadening your location zone, quantity threshold, or switching to All Listings.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDonations.map((donation) => {
            const isAvailable = donation.status === 'Available';
            const isUrgent = donation.expiryHours <= 4;

            return (
              <article
                key={donation.id}
                className="bg-white border border-[#DCE7DF] rounded-xl p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-xs text-[#6B8275]">
                      {donation.category} · {donation.donorType}
                    </div>
                    <DonationStatusLabel status={donation.status} />
                  </div>

                  <h3 className="font-display text-base font-bold text-[#0F2418] leading-snug">
                    {donation.foodName}
                  </h3>

                  <div className="grid grid-cols-2 gap-3 py-2.5 border-y border-[#EDF3EF]">
                    <div>
                      <div className="text-[11px] text-[#6B8275]">Quantity</div>
                      <div className="font-mono-tabular text-sm font-semibold text-[#0F2418]">
                        {donation.quantityKg} kg ({donation.servingsEstimate} meals)
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#6B8275]">Expiry Window</div>
                      <div
                        className={`font-mono-tabular text-sm font-semibold flex items-center gap-1 ${
                          isUrgent ? 'text-[#B45309]' : 'text-[#0F2418]'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>{donation.expiryHours} hrs</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#475E51]">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#15803D] shrink-0 mt-0.5" aria-hidden="true" />
                      <span>
                        <strong className="font-medium text-[#0F2418]">{donation.zone}</strong> —{' '}
                        {donation.pickupLocation}
                      </span>
                    </div>
                    <div>
                      Donor: <span className="text-[#0F2418] font-medium">{donation.donorName}</span>
                    </div>
                    <div>Storage: {donation.storageNote}</div>
                    <div>
                      Contact: {donation.contactName} ({donation.contactPhone})
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  {isAvailable ? (
                    <button
                      type="button"
                      onClick={() => openClaimModal(donation)}
                      className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors cursor-pointer"
                    >
                      Request Food Pickup
                    </button>
                  ) : (
                    <div className="w-full py-2 px-3 text-center text-xs font-medium text-[#6B8275] bg-[#F7FAF8] border border-[#EDF3EF] rounded-lg">
                      {donation.assignedNgoName
                        ? `Assigned to ${donation.assignedNgoName}`
                        : `Status: ${donation.status}`}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Active NGO Requests & Delivery Confirmation */}
      <section className="bg-white border border-[#DCE7DF] rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EDF3EF]">
          <div>
            <h2 className="font-display text-lg font-bold text-[#0F2418]">
              Submitted Requests for {activeNgo?.name}
            </h2>
            <p className="text-xs sm:text-sm text-[#475E51]">
              Manage your active food requests and confirm pickup / delivery completion.
            </p>
          </div>
          <span className="font-mono-tabular text-xs text-[#6B8275]">
            {ngoRequests.length} request{ngoRequests.length === 1 ? '' : 's'}
          </span>
        </div>

        {ngoRequests.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#475E51]">
            No requests submitted under {activeNgo?.name} yet. Click &ldquo;Request Food Pickup&rdquo;
            on any available listing above to create one.
          </div>
        ) : (
          <div className="divide-y divide-[#EDF3EF]">
            {ngoRequests.map((req) => {
              const linkedDonation = donations.find((d) => d.id === req.donationId);
              return (
                <div
                  key={req.id}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-display text-sm font-bold text-[#0F2418]">
                        {req.foodName}
                      </span>
                      <RequestStatusLabel status={req.status} />
                    </div>
                    <div className="text-xs text-[#475E51] flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>From: {req.donorName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">{req.requestedKg} kg</span>
                      <span aria-hidden="true">·</span>
                      <span>Volunteer: {req.volunteerName}</span>
                      <span aria-hidden="true">·</span>
                      <span>ETA: {req.pickupEta}</span>
                    </div>
                    <div className="text-xs text-[#6B8275]">{req.notes}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {linkedDonation?.status === 'Requested' && req.status === 'Approved' && (
                      <button
                        type="button"
                        onClick={() => onUpdateDeliveryStage(linkedDonation.id, 'In Transit')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Mark Picked Up</span>
                      </button>
                    )}
                    {linkedDonation?.status === 'In Transit' && (
                      <button
                        type="button"
                        onClick={() => onUpdateDeliveryStage(linkedDonation.id, 'Delivered')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#166534] hover:bg-[#14532D] rounded-lg transition-colors cursor-pointer"
                      >
                        <PackageCheck className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Confirm Delivered</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Request Pickup Confirmation Modal */}
      {claimingDonation && activeNgo && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="claim-modal-title"
        >
          <div className="bg-white border border-[#DCE7DF] rounded-xl max-w-md w-full p-6 space-y-5 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-[#15803D]">Submit NGO Request</div>
                <h3 id="claim-modal-title" className="mt-0.5 font-display text-lg font-bold text-[#0F2418]">
                  {claimingDonation.foodName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setClaimingDonation(null)}
                aria-label="Close modal"
                className="text-[#6B8275] hover:text-[#0F2418] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-lg bg-[#F7FAF8] border border-[#DCE7DF] text-xs text-[#475E51] space-y-1">
              <div>
                Requesting NGO: <strong className="text-[#0F2418]">{activeNgo.name}</strong>
              </div>
              <div>
                Quantity: <strong className="font-mono-tabular text-[#0F2418]">{claimingDonation.quantityKg} kg</strong> ({claimingDonation.servingsEstimate} meals)
              </div>
              <div>Pickup: {claimingDonation.pickupLocation}</div>
            </div>

            <form onSubmit={handleConfirmRequest} className="space-y-4">
              <div>
                <label htmlFor="req-volunteer" className="block text-sm font-medium text-[#0F2418] mb-1">
                  Assigned Volunteer / Driver
                </label>
                <input
                  id="req-volunteer"
                  type="text"
                  required
                  value={volunteerName}
                  onChange={(e) => setVolunteerName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-[#DCE7DF] rounded-lg text-[#0F2418] focus:border-[#15803D] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="req-eta" className="block text-sm font-medium text-[#0F2418] mb-1">
                  Estimated Pickup Time
                </label>
                <input
                  id="req-eta"
                  type="text"
                  required
                  value={pickupEta}
                  onChange={(e) => setPickupEta(e.target.value)}
                  placeholder="e.g., 25 mins (Van #02)"
                  className="w-full px-3.5 py-2 text-sm border border-[#DCE7DF] rounded-lg text-[#0F2418] focus:border-[#15803D] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="req-notes" className="block text-sm font-medium text-[#0F2418] mb-1">
                  Distribution Notes (Optional)
                </label>
                <input
                  id="req-notes"
                  type="text"
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="e.g., Evening shelter meal distribution"
                  className="w-full px-3.5 py-2 text-sm border border-[#DCE7DF] rounded-lg text-[#0F2418] focus:border-[#15803D] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setClaimingDonation(null)}
                  className="px-4 py-2 text-sm font-medium text-[#475E51] hover:text-[#0F2418] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors cursor-pointer"
                >
                  Confirm Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
