import {
  AiRecommendation,
  CategoryPrediction,
  DonorProfile,
  FoodCategory,
  FoodDonation,
  ImpactSummary,
  LocationZone,
  NgoProfile,
  PredictionDayPoint,
  ScenarioType,
} from '../types/foodbridge';

const SCENARIO_MULTIPLIERS: Record<ScenarioType, number> = {
  'Regular Weekday': 1.0,
  'Weekend Peak': 1.32,
  'College Welfare Fair': 1.48,
  'Festive Banquet': 1.75,
};

const ZONE_FACTORS: Record<LocationZone | 'All Zones', number> = {
  'All Zones': 1.0,
  'North Campus': 0.28,
  'City Center': 0.31,
  'East Market': 0.16,
  'South Hub': 0.13,
  'West Tech Park': 0.12,
};

export function computeImpactSummary(
  donations: FoodDonation[],
  donors: DonorProfile[],
  ngos: NgoProfile[]
): ImpactSummary {
  const baselineHistoricalKg = 3110;
  const baselineHistoricalMeals = 11420;

  const activeInventoryKg = donations
    .filter((d) => d.status !== 'Rejected')
    .reduce((sum, d) => sum + d.quantityKg, 0);

  const activeInventoryMeals = donations
    .filter((d) => d.status !== 'Rejected')
    .reduce((sum, d) => sum + d.servingsEstimate, 0);

  const totalFoodDonatedKg = Math.round(baselineHistoricalKg + activeInventoryKg);
  const totalMealsSaved = Math.round(baselineHistoricalMeals + activeInventoryMeals);
  const activeDonorsCount = donors.filter((d) => d.verified).length;
  const ngosHelpedCount = ngos.filter((n) => n.verified).length;
  const co2PreventedKg = Math.round(totalFoodDonatedKg * 2.5);

  return {
    totalFoodDonatedKg,
    totalMealsSaved,
    activeDonorsCount,
    ngosHelpedCount,
    co2PreventedKg,
  };
}

export function generateWeeklyForecast(
  scenario: ScenarioType,
  zone: LocationZone | 'All Zones',
  ambientTempC: number,
  donations: FoodDonation[]
): PredictionDayPoint[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const basePattern = [145, 138, 162, 174, 210, 256, 232];
  const scenarioMult = SCENARIO_MULTIPLIERS[scenario];
  const zoneFactor = ZONE_FACTORS[zone];
  const liveBoost =
    donations
      .filter((d) => d.status === 'Available' || d.status === 'Pending Approval')
      .reduce((s, d) => s + d.quantityKg, 0) * 0.15;

  // Higher ambient temp increases spoilage risk unless dispatched rapidly
  const tempRiskFactor = Math.max(0.08, Math.min(0.32, (ambientTempC - 16) * 0.012));

  return days.map((day, idx) => {
    const predictedSurplusKg = Math.round(
      (basePattern[idx] * scenarioMult + liveBoost) * zoneFactor
    );
    const unrescuedRiskKg = Math.round(predictedSurplusKg * tempRiskFactor);
    const rescuedProjectedKg = Math.max(0, predictedSurplusKg - unrescuedRiskKg);

    return {
      day,
      predictedSurplusKg,
      rescuedProjectedKg,
      unrescuedRiskKg,
    };
  });
}

export function generateCategoryPredictions(
  scenario: ScenarioType,
  ambientTempC: number,
  donations: FoodDonation[]
): CategoryPrediction[] {
  const scenarioMult = SCENARIO_MULTIPLIERS[scenario];
  const tempPenalty = Math.max(0, ambientTempC - 22) * 1.4;

  const baseSpecs: Array<{
    category: FoodCategory;
    baseKg: number;
    baseSpoilage: number;
    avgWindowHours: number;
  }> = [
    { category: 'Cooked Meals', baseKg: 142, baseSpoilage: 34, avgWindowHours: 4 },
    { category: 'Fresh Produce', baseKg: 88, baseSpoilage: 24, avgWindowHours: 22 },
    { category: 'Bakery & Bread', baseKg: 64, baseSpoilage: 15, avgWindowHours: 16 },
    { category: 'Packaged & Dry', baseKg: 52, baseSpoilage: 4, avgWindowHours: 96 },
    { category: 'Dairy & Beverages', baseKg: 38, baseSpoilage: 29, avgWindowHours: 9 },
  ];

  return baseSpecs.map((spec) => {
    const liveCategoryKg = donations
      .filter((d) => d.category === spec.category && d.status !== 'Rejected')
      .reduce((sum, d) => sum + d.quantityKg, 0);

    const estimatedWasteKg = Math.round(spec.baseKg * scenarioMult + liveCategoryKg * 0.5);
    const spoilageRiskPct = Math.min(
      68,
      Math.round(spec.baseSpoilage + (spec.category === 'Packaged & Dry' ? 1 : tempPenalty))
    );
    const rescueRatePct = Math.max(32, 100 - spoilageRiskPct);

    return {
      category: spec.category,
      estimatedWasteKg,
      spoilageRiskPct,
      rescueRatePct,
      avgWindowHours: spec.avgWindowHours,
    };
  });
}

export function generateAiRecommendations(
  donations: FoodDonation[],
  ngos: NgoProfile[],
  scenario: ScenarioType
): AiRecommendation[] {
  const recs: AiRecommendation[] = [];

  const urgentAvailable = donations
    .filter(
      (d) =>
        (d.status === 'Available' || d.status === 'Pending Approval') &&
        d.expiryHours <= 6
    )
    .sort((a, b) => a.expiryHours - b.expiryHours);

  urgentAvailable.slice(0, 2).forEach((donation, index) => {
    const matchedNgo =
      ngos.find((n) => n.zone === donation.zone && n.verified) ?? ngos[0];

    recs.push({
      id: `rec-urgent-${donation.id}-${index}`,
      title: `Prioritize ${donation.foodName} (${donation.quantityKg} kg)`,
      actionSummary: `Expires in ${donation.expiryHours}h at ${donation.zone}. Dispatch insulated pickup to ${matchedNgo.name} to prevent ~${donation.servingsEstimate} meal losses.`,
      targetNgo: matchedNgo.name,
      urgency: 'High',
      estimatedMealsSaved: donation.servingsEstimate,
      donationId: donation.id,
    });
  });

  const pendingApprovals = donations.filter((d) => d.status === 'Pending Approval');
  if (pendingApprovals.length > 0) {
    const totalPendingMeals = pendingApprovals.reduce(
      (sum, d) => sum + d.servingsEstimate,
      0
    );
    recs.push({
      id: 'rec-admin-queue',
      title: `Verify ${pendingApprovals.length} pending donor submissions`,
      actionSummary: `Admin verification unlocks ${totalPendingMeals} additional meals across ${pendingApprovals
        .map((d) => d.zone)
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .join(', ')}.`,
      targetNgo: 'Admin Verification Queue',
      urgency: 'Medium',
      estimatedMealsSaved: totalPendingMeals,
    });
  }

  if (scenario === 'College Welfare Fair' || scenario === 'Festive Banquet') {
    recs.push({
      id: 'rec-scenario-surge',
      title: `Pre-stage NGO pickup vans for ${scenario}`,
      actionSummary: `Forecast model predicts +${Math.round(
        (SCENARIO_MULTIPLIERS[scenario] - 1) * 100
      )}% cooked meal surplus between 8:30 PM and 10:30 PM around North Campus & City Center.`,
      targetNgo: 'GreenPlate Shelter Network & Hope Kitchen Trust',
      urgency: 'Medium',
      estimatedMealsSaved: 310,
    });
  } else {
    recs.push({
      id: 'rec-bakery-route',
      title: 'Batch evening bakery & produce pickups on East–West corridor',
      actionSummary:
        'Combining Harvest Crust Bakery and GreenLeaf Bistro pickups on a single courier loop reduces transit time by 28 minutes.',
      targetNgo: 'Seva Youth & Elder Care Foundation',
      urgency: 'Routine',
      estimatedMealsSaved: 142,
    });
  }

  return recs;
}

export function previewNewDonationPrediction(
  category: FoodCategory,
  quantityKg: number,
  expiryHours: number,
  zone: LocationZone,
  ngos: NgoProfile[]
): {
  spoilageRisk: 'Low' | 'Moderate' | 'Urgent';
  recommendedNgo: string;
  estimatedMeals: number;
  co2SavedKg: number;
} {
  const mealsPerKg: Record<FoodCategory, number> = {
    'Cooked Meals': 3,
    'Fresh Produce': 3,
    'Bakery & Bread': 3.5,
    'Dairy & Beverages': 4,
    'Packaged & Dry': 4,
  };

  const estimatedMeals = Math.max(1, Math.round(quantityKg * mealsPerKg[category]));
  const co2SavedKg = Math.round(quantityKg * 2.5 * 10) / 10;

  let spoilageRisk: 'Low' | 'Moderate' | 'Urgent' = 'Low';
  if (expiryHours <= 4 || (category === 'Cooked Meals' && expiryHours <= 6)) {
    spoilageRisk = 'Urgent';
  } else if (expiryHours <= 16) {
    spoilageRisk = 'Moderate';
  }

  const matchedNgo = ngos.find((n) => n.zone === zone && n.verified) ?? ngos[0];

  return {
    spoilageRisk,
    recommendedNgo: matchedNgo ? matchedNgo.name : 'Hope Kitchen Trust',
    estimatedMeals,
    co2SavedKg,
  };
}
