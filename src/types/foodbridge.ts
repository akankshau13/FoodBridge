export type AppView = 'home' | 'donor' | 'ngo' | 'ai-insights' | 'admin';

export type FoodCategory =
  | 'Cooked Meals'
  | 'Fresh Produce'
  | 'Bakery & Bread'
  | 'Dairy & Beverages'
  | 'Packaged & Dry';

export type DonationStatus =
  | 'Pending Approval'
  | 'Available'
  | 'Requested'
  | 'In Transit'
  | 'Delivered'
  | 'Rejected';

export type RequestStatus = 'Pending' | 'Approved' | 'Completed' | 'Declined';

export type DonorType =
  | 'Restaurant'
  | 'Hotel'
  | 'Event Organizer'
  | 'Campus Mess'
  | 'Individual';

export type LocationZone =
  | 'North Campus'
  | 'City Center'
  | 'East Market'
  | 'South Hub'
  | 'West Tech Park';

export interface FoodDonation {
  id: string;
  foodName: string;
  category: FoodCategory;
  quantityKg: number;
  servingsEstimate: number;
  expiryHours: number;
  expiryTimeLabel: string;
  pickupLocation: string;
  zone: LocationZone;
  donorName: string;
  donorType: DonorType;
  contactName: string;
  contactPhone: string;
  storageNote: string;
  status: DonationStatus;
  assignedNgoId?: string;
  assignedNgoName?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FoodRequest {
  id: string;
  donationId: string;
  foodName: string;
  donorName: string;
  ngoId: string;
  ngoName: string;
  requestedKg: number;
  pickupEta: string;
  volunteerName: string;
  notes: string;
  status: RequestStatus;
  createdAt: string;
}

export interface DonorProfile {
  id: string;
  name: string;
  type: DonorType;
  zone: LocationZone;
  address: string;
  contactPerson: string;
  phone: string;
  totalDonationsCount: number;
  totalKgDonated: number;
  verified: boolean;
  joinedDate: string;
}

export interface NgoProfile {
  id: string;
  name: string;
  focusArea: string;
  zone: LocationZone;
  address: string;
  coordinatorName: string;
  phone: string;
  dailyCapacityKg: number;
  mealsDistributed: number;
  verified: boolean;
  joinedDate: string;
}

export type ScenarioType =
  | 'Regular Weekday'
  | 'Weekend Peak'
  | 'College Welfare Fair'
  | 'Festive Banquet';

export interface PredictionDayPoint {
  day: string;
  predictedSurplusKg: number;
  rescuedProjectedKg: number;
  unrescuedRiskKg: number;
}

export interface CategoryPrediction {
  category: FoodCategory;
  estimatedWasteKg: number;
  spoilageRiskPct: number;
  rescueRatePct: number;
  avgWindowHours: number;
}

export interface AiRecommendation {
  id: string;
  title: string;
  actionSummary: string;
  targetNgo: string;
  urgency: 'High' | 'Medium' | 'Routine';
  estimatedMealsSaved: number;
  donationId?: string;
}

export interface ImpactSummary {
  totalFoodDonatedKg: number;
  totalMealsSaved: number;
  activeDonorsCount: number;
  ngosHelpedCount: number;
  co2PreventedKg: number;
}
