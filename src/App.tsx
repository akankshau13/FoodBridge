import { useEffect, useMemo, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { AiInsightsView } from './components/AiInsightsView';
import { DonorDashboard } from './components/DonorDashboard';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { Navbar } from './components/Navbar';
import { NgoDashboard } from './components/NgoDashboard';
import {
  INITIAL_DONATIONS,
  INITIAL_DONORS,
  INITIAL_NGOS,
  INITIAL_REQUESTS,
} from './data/mockData';
import {
  AppView,
  DonorProfile,
  FoodDonation,
  FoodRequest,
  NgoProfile,
} from './types/foodbridge';
import { computeImpactSummary } from './utils/predictionEngine';

interface BootstrapPayload {
  donations: FoodDonation[];
  requests: FoodRequest[];
  donors: DonorProfile[];
  ngos: NgoProfile[];
}

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [donations, setDonations] = useState<FoodDonation[]>(INITIAL_DONATIONS);
  const [requests, setRequests] = useState<FoodRequest[]>(INITIAL_REQUESTS);
  const [donors, setDonors] = useState<DonorProfile[]>(INITIAL_DONORS);
  const [ngos, setNgos] = useState<NgoProfile[]>(INITIAL_NGOS);
  const [dbConnected, setDbConnected] = useState<boolean>(false);
  const [dbNotice, setDbNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadFromDb() {
      try {
        const res = await fetch('/api/bootstrap');
        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as { error?: string };
          if (active) {
            setDbConnected(false);
            setDbNotice(
              errBody.error ||
                'PostgreSQL connection pending. Add DATABASE_URL in Settings > Secrets to enable persistent database sync.'
            );
          }
          return;
        }
        const data = (await res.json()) as BootstrapPayload;
        if (active) {
          setDonations(data.donations);
          setRequests(data.requests);
          setDonors(data.donors);
          setNgos(data.ngos);
          setDbConnected(true);
          setDbNotice(null);
        }
      } catch {
        if (active) {
          setDbConnected(false);
          setDbNotice(
            'Database server unreachable; running with local demonstration data.'
          );
        }
      }
    }
    loadFromDb();
    return () => {
      active = false;
    };
  }, []);

  const impact = useMemo(
    () => computeImpactSummary(donations, donors, ngos),
    [donations, donors, ngos]
  );

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartDonation = () => {
    setCurrentView('donor');
    setTimeout(() => {
      const el = document.getElementById('register-surplus-form');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const handleAddDonation = async (
    input: Omit<
      FoodDonation,
      'id' | 'status' | 'createdAt' | 'updatedAt' | 'servingsEstimate' | 'expiryTimeLabel'
    >
  ) => {
    if (dbConnected) {
      try {
        const res = await fetch('/api/donations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        if (res.ok) {
          const created = (await res.json()) as FoodDonation;
          setDonations((prev) => [created, ...prev]);
          return;
        }
      } catch {
        // Fall through to update notification if request fails
      }
    }

    const servingsEstimate = Math.max(1, Math.round(input.quantityKg * 3));
    const newDonation: FoodDonation = {
      ...input,
      id: `don-${Date.now()}`,
      servingsEstimate,
      expiryTimeLabel: `In ${input.expiryHours} hrs`,
      status: 'Pending Approval',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    setDonations((prev) => [newDonation, ...prev]);
  };

  const updateDonationStatus = async (
    donationId: string,
    status: 'Available' | 'Rejected' | 'In Transit' | 'Delivered',
    rejectionReason?: string
  ) => {
    if (dbConnected) {
      try {
        const res = await fetch(`/api/donations/${encodeURIComponent(donationId)}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, rejectionReason }),
        });
        if (res.ok) {
          const updated = (await res.json()) as FoodDonation;
          setDonations((prev) =>
            prev.map((d) => (d.id === donationId ? updated : d))
          );
          if (status === 'Delivered') {
            setRequests((prev) =>
              prev.map((r) =>
                r.donationId === donationId && r.status !== 'Declined'
                  ? { ...r, status: 'Completed', pickupEta: 'Delivered & Verified' }
                  : r
              )
            );
          }
          return;
        }
      } catch {
        // Ignore network error fallback
      }
    }

    setDonations((prev) =>
      prev.map((d) =>
        d.id === donationId
          ? {
              ...d,
              status,
              rejectionReason: status === 'Rejected' ? rejectionReason : d.rejectionReason,
              updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            }
          : d
      )
    );
    if (status === 'Delivered') {
      setRequests((prev) =>
        prev.map((r) =>
          r.donationId === donationId && r.status !== 'Declined'
            ? { ...r, status: 'Completed', pickupEta: 'Delivered & Verified' }
            : r
        )
      );
    }
  };

  const handleApproveDonation = (donationId: string) => {
    void updateDonationStatus(donationId, 'Available');
  };

  const handleRejectDonation = (donationId: string, reason: string) => {
    void updateDonationStatus(donationId, 'Rejected', reason);
  };

  const handleSubmitFoodRequest = async (payload: {
    donationId: string;
    ngoId: string;
    pickupEta: string;
    volunteerName: string;
    notes: string;
  }) => {
    if (dbConnected) {
      try {
        const res = await fetch('/api/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            request: FoodRequest;
            donation: FoodDonation;
          };
          setRequests((prev) => [data.request, ...prev]);
          setDonations((prev) =>
            prev.map((d) => (d.id === data.donation.id ? data.donation : d))
          );
          return;
        }
      } catch {
        // Fallback below if offline
      }
    }

    const targetDonation = donations.find((d) => d.id === payload.donationId);
    const targetNgo = ngos.find((n) => n.id === payload.ngoId);
    if (!targetDonation || !targetNgo) return;

    const newReq: FoodRequest = {
      id: `req-${Date.now()}`,
      donationId: targetDonation.id,
      foodName: targetDonation.foodName,
      donorName: targetDonation.donorName,
      ngoId: targetNgo.id,
      ngoName: targetNgo.name,
      requestedKg: targetDonation.quantityKg,
      pickupEta: payload.pickupEta,
      volunteerName: payload.volunteerName,
      notes: payload.notes,
      status: 'Pending',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };

    setRequests((prev) => [newReq, ...prev]);
    setDonations((prev) =>
      prev.map((d) =>
        d.id === targetDonation.id
          ? {
              ...d,
              status: 'Requested',
              assignedNgoId: targetNgo.id,
              assignedNgoName: targetNgo.name,
              updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            }
          : d
      )
    );
  };

  const handleUpdateRequestStatus = async (
    requestId: string,
    status: 'Approved' | 'Declined'
  ) => {
    if (dbConnected) {
      try {
        const res = await fetch(`/api/requests/${encodeURIComponent(requestId)}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            request: FoodRequest;
            donation: FoodDonation | null;
          };
          setRequests((prev) =>
            prev.map((r) => (r.id === requestId ? data.request : r))
          );
          if (data.donation) {
            const updatedDon = data.donation;
            setDonations((prev) =>
              prev.map((d) => (d.id === updatedDon.id ? updatedDon : d))
            );
          }
          return;
        }
      } catch {
        // Fallback below
      }
    }

    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status } : r))
    );
    if (status === 'Declined') {
      setDonations((prev) =>
        prev.map((d) =>
          d.id === req.donationId && d.status === 'Requested'
            ? {
                ...d,
                status: 'Available',
                assignedNgoId: undefined,
                assignedNgoName: undefined,
                updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
              }
            : d
        )
      );
    }
  };

  const handleApproveRequest = (requestId: string) => {
    void handleUpdateRequestStatus(requestId, 'Approved');
  };

  const handleDeclineRequest = (requestId: string) => {
    void handleUpdateRequestStatus(requestId, 'Declined');
  };

  const handleUpdateDeliveryStage = (
    donationId: string,
    nextStatus: 'In Transit' | 'Delivered'
  ) => {
    void updateDonationStatus(donationId, nextStatus);
  };

  const handleAdvanceDonorDemoStage = (donationId: string) => {
    const donation = donations.find((d) => d.id === donationId);
    if (!donation) return;
    if (donation.status === 'Requested') {
      handleUpdateDeliveryStage(donationId, 'In Transit');
    } else if (donation.status === 'In Transit') {
      handleUpdateDeliveryStage(donationId, 'Delivered');
    }
  };

  const handleToggleDonorVerification = async (donorId: string) => {
    if (dbConnected) {
      try {
        const res = await fetch(`/api/donors/${encodeURIComponent(donorId)}/verify`, {
          method: 'PATCH',
        });
        if (res.ok) {
          const updated = (await res.json()) as DonorProfile;
          setDonors((prev) => prev.map((d) => (d.id === donorId ? updated : d)));
          return;
        }
      } catch {
        // Fallback below
      }
    }
    setDonors((prev) =>
      prev.map((d) => (d.id === donorId ? { ...d, verified: !d.verified } : d))
    );
  };

  const handleToggleNgoVerification = async (ngoId: string) => {
    if (dbConnected) {
      try {
        const res = await fetch(`/api/ngos/${encodeURIComponent(ngoId)}/verify`, {
          method: 'PATCH',
        });
        if (res.ok) {
          const updated = (await res.json()) as NgoProfile;
          setNgos((prev) => prev.map((n) => (n.id === ngoId ? updated : n)));
          return;
        }
      } catch {
        // Fallback below
      }
    }
    setNgos((prev) =>
      prev.map((n) => (n.id === ngoId ? { ...n, verified: !n.verified } : n))
    );
  };

  const handleAddDonor = async (
    donor: Omit<DonorProfile, 'id' | 'totalDonationsCount' | 'totalKgDonated' | 'joinedDate'>
  ) => {
    if (dbConnected) {
      try {
        const res = await fetch('/api/donors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(donor),
        });
        if (res.ok) {
          const created = (await res.json()) as DonorProfile;
          setDonors((prev) => [created, ...prev]);
          return;
        }
      } catch {
        // Fallback below
      }
    }

    const created: DonorProfile = {
      ...donor,
      id: `dnr-${Date.now()}`,
      totalDonationsCount: 0,
      totalKgDonated: 0,
      joinedDate: new Date().toISOString().slice(0, 10),
    };
    setDonors((prev) => [created, ...prev]);
  };

  const handleAddNgo = async (
    ngo: Omit<NgoProfile, 'id' | 'mealsDistributed' | 'joinedDate'>
  ) => {
    if (dbConnected) {
      try {
        const res = await fetch('/api/ngos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ngo),
        });
        if (res.ok) {
          const created = (await res.json()) as NgoProfile;
          setNgos((prev) => [created, ...prev]);
          return;
        }
      } catch {
        // Fallback below
      }
    }

    const created: NgoProfile = {
      ...ngo,
      id: `ngo-${Date.now()}`,
      mealsDistributed: 0,
      joinedDate: new Date().toISOString().slice(0, 10),
    };
    setNgos((prev) => [created, ...prev]);
  };

  const handleResetDemo = async () => {
    if (dbConnected) {
      try {
        const res = await fetch('/api/reset', { method: 'POST' });
        if (res.ok) {
          const data = (await res.json()) as BootstrapPayload;
          setDonations(data.donations);
          setRequests(data.requests);
          setDonors(data.donors);
          setNgos(data.ngos);
          setCurrentView('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      } catch {
        // Fallback below
      }
    }

    setDonations(INITIAL_DONATIONS);
    setRequests(INITIAL_REQUESTS);
    setDonors(INITIAL_DONORS);
    setNgos(INITIAL_NGOS);
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FAF8] text-[#0F2418]">
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onStartDonation={handleStartDonation}
      />

      {dbNotice && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center text-xs sm:text-sm text-amber-900">
          {dbNotice}
        </div>
      )}

      <main className="flex-1">
        {currentView === 'home' && (
          <HomeView
            impact={impact}
            donations={donations}
            onNavigate={handleNavigate}
            onStartDonation={handleStartDonation}
          />
        )}

        {currentView === 'donor' && (
          <DonorDashboard
            donations={donations}
            ngos={ngos}
            onAddDonation={handleAddDonation}
            onAdvanceDonorDemoStage={handleAdvanceDonorDemoStage}
          />
        )}

        {currentView === 'ngo' && (
          <NgoDashboard
            donations={donations}
            requests={requests}
            ngos={ngos}
            onSubmitFoodRequest={handleSubmitFoodRequest}
            onUpdateDeliveryStage={handleUpdateDeliveryStage}
          />
        )}

        {currentView === 'ai-insights' && (
          <AiInsightsView
            donations={donations}
            ngos={ngos}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard
            donations={donations}
            requests={requests}
            donors={donors}
            ngos={ngos}
            onApproveDonation={handleApproveDonation}
            onRejectDonation={handleRejectDonation}
            onUpdateDeliveryStage={handleUpdateDeliveryStage}
            onApproveRequest={handleApproveRequest}
            onDeclineRequest={handleDeclineRequest}
            onToggleDonorVerification={handleToggleDonorVerification}
            onToggleNgoVerification={handleToggleNgoVerification}
            onAddDonor={handleAddDonor}
            onAddNgo={handleAddNgo}
          />
        )}
      </main>

      <Footer onNavigate={handleNavigate} onResetDemo={handleResetDemo} />
    </div>
  );
}
