import React, { useMemo, useState } from 'react';
import {
  Check,
  PackageCheck,
  Plus,
  ShieldCheck,
  Truck,
  X,
} from 'lucide-react';
import {
  DonationStatus,
  DonorProfile,
  DonorType,
  FoodDonation,
  FoodRequest,
  LocationZone,
  NgoProfile,
} from '../types/foodbridge';
import { DonationStatusLabel, RequestStatusLabel } from './StatusIndicator';

interface AdminDashboardProps {
  donations: FoodDonation[];
  requests: FoodRequest[];
  donors: DonorProfile[];
  ngos: NgoProfile[];
  onApproveDonation: (donationId: string) => void;
  onRejectDonation: (donationId: string, reason: string) => void;
  onUpdateDeliveryStage: (donationId: string, nextStatus: 'In Transit' | 'Delivered') => void;
  onApproveRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
  onToggleDonorVerification: (donorId: string) => void;
  onToggleNgoVerification: (ngoId: string) => void;
  onAddDonor: (donor: Omit<DonorProfile, 'id' | 'totalDonationsCount' | 'totalKgDonated' | 'joinedDate'>) => void;
  onAddNgo: (ngo: Omit<NgoProfile, 'id' | 'mealsDistributed' | 'joinedDate'>) => void;
}

type AdminTab = 'donations' | 'requests' | 'donors' | 'ngos';

const ZONES: LocationZone[] = [
  'North Campus',
  'City Center',
  'East Market',
  'South Hub',
  'West Tech Park',
];

const DONOR_TYPES: DonorType[] = [
  'Restaurant',
  'Hotel',
  'Event Organizer',
  'Campus Mess',
  'Individual',
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  donations,
  requests,
  donors,
  ngos,
  onApproveDonation,
  onRejectDonation,
  onUpdateDeliveryStage,
  onApproveRequest,
  onDeclineRequest,
  onToggleDonorVerification,
  onToggleNgoVerification,
  onAddDonor,
  onAddNgo,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('donations');
  const [donationFilter, setDonationFilter] = useState<DonationStatus | 'All'>('All');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState(
    'Remaining shelf life below minimum safety threshold for transit.'
  );

  // Add Donor / NGO modal states
  const [showAddDonor, setShowAddDonor] = useState(false);
  const [newDonorName, setNewDonorName] = useState('');
  const [newDonorType, setNewDonorType] = useState<DonorType>('Restaurant');
  const [newDonorZone, setNewDonorZone] = useState<LocationZone>('City Center');
  const [newDonorAddress, setNewDonorAddress] = useState('');
  const [newDonorContact, setNewDonorContact] = useState('');
  const [newDonorPhone, setNewDonorPhone] = useState('');

  const [showAddNgo, setShowAddNgo] = useState(false);
  const [newNgoName, setNewNgoName] = useState('');
  const [newNgoFocus, setNewNgoFocus] = useState('');
  const [newNgoZone, setNewNgoZone] = useState<LocationZone>('North Campus');
  const [newNgoAddress, setNewNgoAddress] = useState('');
  const [newNgoCoord, setNewNgoCoord] = useState('');
  const [newNgoPhone, setNewNgoPhone] = useState('');
  const [newNgoCapacity, setNewNgoCapacity] = useState('100');

  const counts = useMemo(() => {
    return {
      pendingDonations: donations.filter((d) => d.status === 'Pending Approval').length,
      inTransit: donations.filter((d) => d.status === 'In Transit').length,
      pendingRequests: requests.filter((r) => r.status === 'Pending').length,
      verifiedDonors: donors.filter((d) => d.verified).length,
      verifiedNgos: ngos.filter((n) => n.verified).length,
    };
  }, [donations, requests, donors, ngos]);

  const visibleDonations = useMemo(() => {
    if (donationFilter === 'All') return donations;
    return donations.filter((d) => d.status === donationFilter);
  }, [donations, donationFilter]);

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingId) return;
    onRejectDonation(
      rejectingId,
      rejectReason.trim() || 'Did not meet food safety verification guidelines.'
    );
    setRejectingId(null);
  };

  const handleCreateDonor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDonorName.trim() || !newDonorContact.trim()) return;
    onAddDonor({
      name: newDonorName.trim(),
      type: newDonorType,
      zone: newDonorZone,
      address: newDonorAddress.trim() || `${newDonorZone} Main Road`,
      contactPerson: newDonorContact.trim(),
      phone: newDonorPhone.trim() || '+91 98000 00000',
      verified: true,
    });
    setNewDonorName('');
    setNewDonorAddress('');
    setNewDonorContact('');
    setNewDonorPhone('');
    setShowAddDonor(false);
  };

  const handleCreateNgo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNgoName.trim() || !newNgoCoord.trim()) return;
    onAddNgo({
      name: newNgoName.trim(),
      focusArea: newNgoFocus.trim() || 'Community Meal Distribution',
      zone: newNgoZone,
      address: newNgoAddress.trim() || `${newNgoZone} Outreach Center`,
      coordinatorName: newNgoCoord.trim(),
      phone: newNgoPhone.trim() || '+91 98000 00000',
      dailyCapacityKg: Math.max(10, Number(newNgoCapacity) || 100),
      verified: true,
    });
    setNewNgoName('');
    setNewNgoFocus('');
    setNewNgoAddress('');
    setNewNgoCoord('');
    setNewNgoPhone('');
    setShowAddNgo(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-[#15803D]">Administration Console</div>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#0F2418] tracking-tight">
            Manage Approvals, NGO Requests &amp; Partners
          </h1>
          <p className="mt-1 text-sm text-[#475E51]">
            Verify food safety submissions, approve NGO pickup requests, and oversee partner directories.
          </p>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#DCE7DF] rounded-xl p-4">
          <div className="text-xs text-[#6B8275]">Pending Donation Approvals</div>
          <div className="mt-1 font-mono-tabular text-2xl font-bold text-[#B45309]">
            {counts.pendingDonations}
          </div>
        </div>
        <div className="bg-white border border-[#DCE7DF] rounded-xl p-4">
          <div className="text-xs text-[#6B8275]">Pending NGO Requests</div>
          <div className="mt-1 font-mono-tabular text-2xl font-bold text-[#0F2418]">
            {counts.pendingRequests}
          </div>
        </div>
        <div className="bg-white border border-[#DCE7DF] rounded-xl p-4">
          <div className="text-xs text-[#6B8275]">Active Transit Deliveries</div>
          <div className="mt-1 font-mono-tabular text-2xl font-bold text-[#15803D]">
            {counts.inTransit}
          </div>
        </div>
        <div className="bg-white border border-[#DCE7DF] rounded-xl p-4">
          <div className="text-xs text-[#6B8275]">Verified Donors / NGOs</div>
          <div className="mt-1 font-mono-tabular text-2xl font-bold text-[#0F2418]">
            {counts.verifiedDonors} / {counts.verifiedNgos}
          </div>
        </div>
      </div>

      {/* Primary Workspace Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EBF3EE] rounded-lg w-fit">
        {(
          [
            { id: 'donations', label: `Donations (${donations.length})` },
            { id: 'requests', label: `NGO Requests (${requests.length})` },
            { id: 'donors', label: `Donors (${donors.length})` },
            { id: 'ngos', label: `NGOs (${ngos.length})` },
          ] as Array<{ id: AdminTab; label: string }>
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-[#0F2418] shadow-xs font-semibold'
                : 'text-[#475E51] hover:text-[#0F2418]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Donations & Delivery Management */}
      {activeTab === 'donations' && (
        <section className="bg-white border border-[#DCE7DF] rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-display text-lg font-bold text-[#0F2418]">
              Donation Verification &amp; Delivery Queue
            </h2>
            <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F2F7F4] rounded-lg">
              {(
                [
                  'All',
                  'Pending Approval',
                  'Available',
                  'Requested',
                  'In Transit',
                  'Delivered',
                  'Rejected',
                ] as const
              ).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setDonationFilter(st)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    donationFilter === st
                      ? 'bg-white text-[#0F2418] shadow-xs font-semibold'
                      : 'text-[#475E51] hover:text-[#0F2418]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCE7DF] text-xs font-medium text-[#6B8275]">
                  <th className="py-3 pr-4">Food Item &amp; Donor</th>
                  <th className="py-3 px-4">Category &amp; Zone</th>
                  <th className="py-3 px-4 text-right">Qty (kg)</th>
                  <th className="py-3 px-4 text-right">Expiry</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF3EF] text-sm">
                {visibleDonations.map((d) => (
                  <tr key={d.id} className="hover:bg-[#F9FCFA] transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="font-semibold text-[#0F2418]">{d.foodName}</div>
                      <div className="text-xs text-[#6B8275]">
                        {d.donorName} · {d.contactName}
                      </div>
                      {d.assignedNgoName && (
                        <div className="text-xs text-[#15803D]">
                          NGO: {d.assignedNgoName}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#475E51]">
                      <div>{d.category}</div>
                      <div className="text-[#6B8275]">{d.zone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular font-medium text-[#0F2418]">
                      {d.quantityKg}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular text-xs text-[#475E51]">
                      {d.expiryHours}h
                    </td>
                    <td className="py-3.5 px-4">
                      <DonationStatusLabel status={d.status} />
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        {d.status === 'Pending Approval' && (
                          <>
                            <button
                              type="button"
                              onClick={() => onApproveDonation(d.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-md transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectingId(d.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#B91C1C] bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <X className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                        {(d.status === 'Available' || d.status === 'Requested') && (
                          <button
                            type="button"
                            onClick={() => onUpdateDeliveryStage(d.id, 'In Transit')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#15803D] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Truck className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Mark In Transit</span>
                          </button>
                        )}
                        {d.status === 'In Transit' && (
                          <button
                            type="button"
                            onClick={() => onUpdateDeliveryStage(d.id, 'Delivered')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#166534] hover:bg-[#14532D] rounded-md transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <PackageCheck className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Mark Delivered</span>
                          </button>
                        )}
                        {(d.status === 'Delivered' || d.status === 'Rejected') && (
                          <span className="text-xs text-[#6B8275]">Archived</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 2: NGO Requests */}
      {activeTab === 'requests' && (
        <section className="bg-white border border-[#DCE7DF] rounded-xl p-6 space-y-5">
          <h2 className="font-display text-lg font-bold text-[#0F2418]">
            NGO Pickup Requests
          </h2>
          {requests.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#475E51]">
              No food requests have been submitted yet.
            </div>
          ) : (
            <div className="divide-y divide-[#EDF3EF]">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-display text-base font-semibold text-[#0F2418]">
                        {req.foodName}
                      </span>
                      <RequestStatusLabel status={req.status} />
                    </div>
                    <div className="text-xs sm:text-sm text-[#475E51] flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-medium text-[#0F2418]">{req.ngoName}</span>
                      <span aria-hidden="true">·</span>
                      <span>Donor: {req.donorName}</span>
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
                    {req.status === 'Pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onApproveRequest(req.id)}
                          className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Approve Dispatch</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeclineRequest(req.id)}
                          className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-[#B91C1C] bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Decline</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: Donors Directory */}
      {activeTab === 'donors' && (
        <section className="bg-white border border-[#DCE7DF] rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-lg font-bold text-[#0F2418]">
              Registered Food Donors
            </h2>
            <button
              type="button"
              onClick={() => setShowAddDonor(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Add Donor</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCE7DF] text-xs font-medium text-[#6B8275]">
                  <th className="py-3 pr-4">Organization / Donor</th>
                  <th className="py-3 px-4">Type &amp; Zone</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-right">Total Donated</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 pl-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF3EF] text-sm">
                {donors.map((donor) => (
                  <tr key={donor.id} className="hover:bg-[#F9FCFA] transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="font-semibold text-[#0F2418]">{donor.name}</div>
                      <div className="text-xs text-[#6B8275]">{donor.address}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#475E51]">
                      <div>{donor.type}</div>
                      <div className="text-[#6B8275]">{donor.zone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#475E51]">
                      <div>{donor.contactPerson}</div>
                      <div className="font-mono-tabular text-[#6B8275]">{donor.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular text-xs text-[#0F2418]">
                      <div className="font-semibold">{donor.totalKgDonated} kg</div>
                      <div className="text-[#6B8275]">{donor.totalDonationsCount} batches</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {donor.verified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803D]">
                          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-[#B45309]">Pending Review</span>
                      )}
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <button
                        type="button"
                        onClick={() => onToggleDonorVerification(donor.id)}
                        className="px-3 py-1.5 text-xs font-medium text-[#0F2418] bg-[#F2F7F4] hover:bg-[#E4EFE8] border border-[#DCE7DF] rounded-md transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {donor.verified ? 'Suspend' : 'Verify Donor'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 4: NGOs Directory */}
      {activeTab === 'ngos' && (
        <section className="bg-white border border-[#DCE7DF] rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-lg font-bold text-[#0F2418]">
              Partner NGOs &amp; Community Kitchens
            </h2>
            <button
              type="button"
              onClick={() => setShowAddNgo(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Add NGO</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCE7DF] text-xs font-medium text-[#6B8275]">
                  <th className="py-3 pr-4">NGO Name &amp; Focus</th>
                  <th className="py-3 px-4">Zone &amp; Coordinator</th>
                  <th className="py-3 px-4 text-right">Daily Capacity</th>
                  <th className="py-3 px-4 text-right">Meals Served</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 pl-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF3EF] text-sm">
                {ngos.map((ngo) => (
                  <tr key={ngo.id} className="hover:bg-[#F9FCFA] transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="font-semibold text-[#0F2418]">{ngo.name}</div>
                      <div className="text-xs text-[#6B8275]">{ngo.focusArea}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#475E51]">
                      <div>
                        {ngo.zone} · {ngo.coordinatorName}
                      </div>
                      <div className="font-mono-tabular text-[#6B8275]">{ngo.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular text-xs font-medium text-[#0F2418]">
                      {ngo.dailyCapacityKg} kg/day
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular text-xs font-semibold text-[#15803D]">
                      {ngo.mealsDistributed.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      {ngo.verified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803D]">
                          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-[#B45309]">Paused</span>
                      )}
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <button
                        type="button"
                        onClick={() => onToggleNgoVerification(ngo.id)}
                        className="px-3 py-1.5 text-xs font-medium text-[#0F2418] bg-[#F2F7F4] hover:bg-[#E4EFE8] border border-[#DCE7DF] rounded-md transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {ngo.verified ? 'Pause Partner' : 'Verify NGO'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Reject Reason Modal */}
      {rejectingId && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-modal-title"
        >
          <form
            onSubmit={handleConfirmReject}
            className="bg-white border border-[#DCE7DF] rounded-xl max-w-md w-full p-6 space-y-4 shadow-lg"
          >
            <h3 id="reject-modal-title" className="font-display text-lg font-bold text-[#0F2418]">
              Reject Donation Submission
            </h3>
            <div>
              <label htmlFor="reject-reason" className="block text-sm font-medium text-[#0F2418] mb-1.5">
                Safety / Verification Reason
              </label>
              <textarea
                id="reject-reason"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-[#DCE7DF] rounded-lg text-[#0F2418] focus:border-[#15803D] focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 text-sm font-medium text-[#475E51] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold text-white bg-[#B91C1C] hover:bg-red-800 rounded-lg cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Donor Modal */}
      {showAddDonor && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleCreateDonor}
            className="bg-white border border-[#DCE7DF] rounded-xl max-w-md w-full p-6 space-y-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#0F2418]">Add Food Donor</h3>
              <button
                type="button"
                onClick={() => setShowAddDonor(false)}
                className="text-[#6B8275] hover:text-[#0F2418] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="Organization / Donor Name"
              value={newDonorName}
              onChange={(e) => setNewDonorName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-[#DCE7DF] rounded-lg"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={newDonorType}
                onChange={(e) => setNewDonorType(e.target.value as DonorType)}
                className="px-3 py-2 text-sm border border-[#DCE7DF] rounded-lg"
              >
                {DONOR_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                value={newDonorZone}
                onChange={(e) => setNewDonorZone(e.target.value as LocationZone)}
                className="px-3 py-2 text-sm border border-[#DCE7DF] rounded-lg"
              >
                {ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              placeholder="Pickup Address"
              value={newDonorAddress}
              onChange={(e) => setNewDonorAddress(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-[#DCE7DF] rounded-lg"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Contact Person"
                value={newDonorContact}
                onChange={(e) => setNewDonorContact(e.target.value)}
                className="px-3.5 py-2 text-sm border border-[#DCE7DF] rounded-lg"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={newDonorPhone}
                onChange={(e) => setNewDonorPhone(e.target.value)}
                className="px-3.5 py-2 text-sm border border-[#DCE7DF] rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddDonor(false)}
                className="px-4 py-2 text-sm text-[#475E51] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg cursor-pointer"
              >
                Save Donor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add NGO Modal */}
      {showAddNgo && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleCreateNgo}
            className="bg-white border border-[#DCE7DF] rounded-xl max-w-md w-full p-6 space-y-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#0F2418]">Add Partner NGO</h3>
              <button
                type="button"
                onClick={() => setShowAddNgo(false)}
                className="text-[#6B8275] hover:text-[#0F2418] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="NGO / Shelter Name"
              value={newNgoName}
              onChange={(e) => setNewNgoName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-[#DCE7DF] rounded-lg"
            />
            <input
              type="text"
              placeholder="Focus Area (e.g., Youth Hostels & Night Shelters)"
              value={newNgoFocus}
              onChange={(e) => setNewNgoFocus(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-[#DCE7DF] rounded-lg"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={newNgoZone}
                onChange={(e) => setNewNgoZone(e.target.value as LocationZone)}
                className="px-3 py-2 text-sm border border-[#DCE7DF] rounded-lg"
              >
                {ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="10"
                placeholder="Daily Capacity (kg)"
                value={newNgoCapacity}
                onChange={(e) => setNewNgoCapacity(e.target.value)}
                className="px-3.5 py-2 text-sm font-mono-tabular border border-[#DCE7DF] rounded-lg"
              />
            </div>
            <input
              type="text"
              placeholder="Center Address"
              value={newNgoAddress}
              onChange={(e) => setNewNgoAddress(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-[#DCE7DF] rounded-lg"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Coordinator Name"
                value={newNgoCoord}
                onChange={(e) => setNewNgoCoord(e.target.value)}
                className="px-3.5 py-2 text-sm border border-[#DCE7DF] rounded-lg"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={newNgoPhone}
                onChange={(e) => setNewNgoPhone(e.target.value)}
                className="px-3.5 py-2 text-sm border border-[#DCE7DF] rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddNgo(false)}
                className="px-4 py-2 text-sm text-[#475E51] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg cursor-pointer"
              >
                Save NGO
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
