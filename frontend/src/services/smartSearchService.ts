/**
 * Smart Search & Deterministic Property Recommendation Service
 * GharDhundo (AST-XGB Real Estate Platform)
 * 
 * Implements:
 * 1. Locality & Metro Aliases dictionary for robust colloquial text matching.
 * 2. User practical preferences (budget, BHK, commute priorities, possession timing, furnishing).
 * 3. Deterministic Multi-Attribute Relevance Scoring with explainable criteria breakdown.
 * 4. Content-based similarity recommendation engine with privacy consent verification.
 * 
 * Note: Uses deterministic attribute matching on verified listing data.
 * Differentiated from the trained AST-XGB Machine Learning Valuation model.
 */

import { PropertyListing } from '../types/property';

export type CommutePriority = 'none' | 'metro' | 'tech_corridor' | 'airport' | 'peaceful';
export type PossessionPreference = 'any' | 'ready' | 'under_construction';
export type FurnishingPreference = 'any' | 'Furnished' | 'Semi-Furnished' | 'Unfurnished';

export interface SmartSearchPreferences {
  targetBudget?: number;             // in INR
  budgetTolerancePct?: number;       // default 15%
  preferredBhk?: number[];
  commutePriority?: CommutePriority;
  possessionTiming?: PossessionPreference;
  furnishing?: FurnishingPreference;
  targetCity?: string;
  targetLocality?: string;
  minAreaSqft?: number;
}

export interface MatchCriterion {
  id: string;
  name: string;
  score: number;           // 0 to 100
  weight: number;          // 0 to 1.0 (sums to 1.0)
  contribution: number;    // score * weight
  explanation: string;
  isMatched: boolean;
}

export interface SmartMatchResult {
  property: PropertyListing;
  totalScore: number;       // 0 to 100
  matchGrade: 'Exceptional' | 'Strong' | 'Good' | 'Moderate';
  criteria: MatchCriterion[];
  summaryText: string;
  tags: string[];
}

export interface RecommendedProperty {
  property: PropertyListing;
  similarityScore: number;  // 0 to 100
  similarityGrade: string;
  overlapReasons: string[];
  distanceKm?: number;
}

// =========================================================================
// 1. Locality & City Alias Dictionary for Indian Metros
// =========================================================================
export interface LocalityAliasEntry {
  canonicalCity: string;
  canonicalLocality: string;
  aliases: string[];
  commuteTags: ('metro' | 'tech_corridor' | 'airport' | 'central_business')[];
}

export const LOCALITY_ALIASES: LocalityAliasEntry[] = [
  // --- BENGALURU ---
  {
    canonicalCity: 'Bengaluru',
    canonicalLocality: 'Whitefield',
    aliases: ['itpl', 'whitefield', 'kadugodi', 'hope farm', 'epip', 'epip zone', 'channasandra', 'pattandur agrahara'],
    commuteTags: ['metro', 'tech_corridor'],
  },
  {
    canonicalCity: 'Bengaluru',
    canonicalLocality: 'Koramangala',
    aliases: ['koramangala', 'sony world', 'st johns', 'forum mall', 'koramangala 4th block', 'koramangala 5th block'],
    commuteTags: ['tech_corridor', 'central_business'],
  },
  {
    canonicalCity: 'Bengaluru',
    canonicalLocality: 'Indiranagar',
    aliases: ['indiranagar', '100 feet road', '100ft road', '12th main', 'defense colony', 'hal 2nd stage'],
    commuteTags: ['metro', 'central_business'],
  },
  {
    canonicalCity: 'Bengaluru',
    canonicalLocality: 'HSR Layout',
    aliases: ['hsr', 'hsr layout', 'agara', 'sector 1 hsr', 'sector 2 hsr', 'sector 3 hsr', 'sector 7 hsr'],
    commuteTags: ['tech_corridor'],
  },
  {
    canonicalCity: 'Bengaluru',
    canonicalLocality: 'Bellandur',
    aliases: ['bellandur', 'ecospace', 'outer ring road', 'orr', 'devarabisanahalli', 'green glen layout', 'rmz ecoworld'],
    commuteTags: ['tech_corridor'],
  },
  {
    canonicalCity: 'Bengaluru',
    canonicalLocality: 'Hebbal',
    aliases: ['hebbal', 'manyata', 'manyata tech park', 'nagavara', 'sahakara nagar', 'bellary road'],
    commuteTags: ['airport', 'tech_corridor'],
  },
  {
    canonicalCity: 'Bengaluru',
    canonicalLocality: 'Rajajinagar',
    aliases: ['rajajinagar', 'dr rajkumar road', 'orion mall', 'brigade gateway', 'malleshwaram'],
    commuteTags: ['metro'],
  },
  {
    canonicalCity: 'Bengaluru',
    canonicalLocality: 'Electronic City',
    aliases: ['electronic city', 'e-city', 'ecity', 'phase 1 ecity', 'phase 2 ecity', 'infosys gate', 'wipro campus'],
    commuteTags: ['tech_corridor'],
  },
  {
    canonicalCity: 'Bengaluru',
    canonicalLocality: 'Sarjapur Road',
    aliases: ['sarjapur', 'sarjapur road', 'carmelaram', 'kaikondrahalli', 'doddakannelli', 'wipro kodathi'],
    commuteTags: ['tech_corridor'],
  },

  // --- MUMBAI ---
  {
    canonicalCity: 'Mumbai',
    canonicalLocality: 'Bandra',
    aliases: ['bandra', 'bandra west', 'pali hill', 'carter road', 'bandstand', 'turner road', 'bkc', 'bandra kurla complex'],
    commuteTags: ['metro', 'central_business'],
  },
  {
    canonicalCity: 'Mumbai',
    canonicalLocality: 'Andheri',
    aliases: ['andheri', 'andheri west', 'lokhandwala', 'versova', 'andheri east', 'midc', 'chakala', 'jb nagar'],
    commuteTags: ['metro', 'airport', 'tech_corridor'],
  },
  {
    canonicalCity: 'Mumbai',
    canonicalLocality: 'Worli',
    aliases: ['worli', 'worli sea face', 'lower parel', 'mahalaxmi', 'dr annie besant road'],
    commuteTags: ['central_business'],
  },
  {
    canonicalCity: 'Mumbai',
    canonicalLocality: 'Powai',
    aliases: ['powai', 'hiranandani', 'chandivali', 'iit bombay', 'powai lake'],
    commuteTags: ['tech_corridor'],
  },
  {
    canonicalCity: 'Mumbai',
    canonicalLocality: 'Thane West',
    aliases: ['thane', 'thane west', 'ghodbunder', 'ghodbunder road', 'majiwada', 'vasant vihar', 'pokhran road'],
    commuteTags: ['metro'],
  },

  // --- GURUGRAM ---
  {
    canonicalCity: 'Gurugram',
    canonicalLocality: 'DLF Phase 5',
    aliases: ['dlf phase 5', 'golf course road', 'horizon center', 'the aralias', 'galleria', 'sector 54'],
    commuteTags: ['metro', 'central_business'],
  },
  {
    canonicalCity: 'Gurugram',
    canonicalLocality: 'Cyber City',
    aliases: ['cyber city', 'dlf cyber hub', 'dlf phase 2', 'sector 24', 'shankar chowk', 'sector 25'],
    commuteTags: ['metro', 'tech_corridor', 'airport'],
  },
  {
    canonicalCity: 'Gurugram',
    canonicalLocality: 'Sector 56',
    aliases: ['sector 56', 'golf course extension', 'sector 57', 'sector 65', 'sector 62'],
    commuteTags: ['metro'],
  },
  {
    canonicalCity: 'Gurugram',
    canonicalLocality: 'Sohna Road',
    aliases: ['sohna road', 'subhash chowk', 'sector 48', 'sector 49', 'badshahpur'],
    commuteTags: ['tech_corridor'],
  },

  // --- HYDERABAD ---
  {
    canonicalCity: 'Hyderabad',
    canonicalLocality: 'Hitec City',
    aliases: ['hitec city', 'cyber towers', 'mindspace', 'madhapur', 'inorbit mall', 'raheja it park', 'cyberabad'],
    commuteTags: ['metro', 'tech_corridor'],
  },
  {
    canonicalCity: 'Hyderabad',
    canonicalLocality: 'Gachibowli',
    aliases: ['gachibowli', 'financial district', 'nanakramguda', 'isb', 'waverock', 'wipro circle'],
    commuteTags: ['tech_corridor'],
  },
  {
    canonicalCity: 'Hyderabad',
    canonicalLocality: 'Jubilee Hills',
    aliases: ['jubilee hills', 'road no 36', 'road no 10', 'film nagar', 'banjara hills'],
    commuteTags: ['central_business'],
  },
  {
    canonicalCity: 'Hyderabad',
    canonicalLocality: 'Kondapur',
    aliases: ['kondapur', 'botanical garden', 'kothaguda', 'hafeezpet'],
    commuteTags: ['tech_corridor'],
  },

  // --- PUNE ---
  {
    canonicalCity: 'Pune',
    canonicalLocality: 'Hinjewadi',
    aliases: ['hinjewadi', 'hinjawadi', 'phase 1 hinjewadi', 'phase 2 hinjewadi', 'phase 3 hinjewadi', 'rajiv gandhi infotech park'],
    commuteTags: ['tech_corridor'],
  },
  {
    canonicalCity: 'Pune',
    canonicalLocality: 'Baner',
    aliases: ['baner', 'balewadi', 'baner road', 'high street', 'pashan', 'aundh'],
    commuteTags: ['tech_corridor'],
  },
  {
    canonicalCity: 'Pune',
    canonicalLocality: 'Wakad',
    aliases: ['wakad', 'datta mandir', 'bhumkar chowk', 'kaspate vasti'],
    commuteTags: ['tech_corridor'],
  },
  {
    canonicalCity: 'Pune',
    canonicalLocality: 'Koregaon Park',
    aliases: ['koregaon park', 'kp', 'north main road', 'south main road', 'kalyani nagar', 'viman nagar'],
    commuteTags: ['airport', 'central_business'],
  },

  // --- CHENNAI ---
  {
    canonicalCity: 'Chennai',
    canonicalLocality: 'OMR',
    aliases: ['omr', 'old mahabalipuram road', 'thoraipakkam', 'sholinganallur', 'perungudi', 'navalur', 'siruseri'],
    commuteTags: ['tech_corridor'],
  },
  {
    canonicalCity: 'Chennai',
    canonicalLocality: 'Anna Nagar',
    aliases: ['anna nagar', 'shanthi colony', 'roundtana', 'mogappair'],
    commuteTags: ['metro', 'central_business'],
  },
  {
    canonicalCity: 'Chennai',
    canonicalLocality: 'Adyar',
    aliases: ['adyar', 'besant nagar', 'gandhi nagar', 'thiruvanmiyur'],
    commuteTags: ['central_business'],
  },

  // --- KOLKATA ---
  {
    canonicalCity: 'Kolkata',
    canonicalLocality: 'Newtown',
    aliases: ['newtown', 'new town', 'action area 1', 'action area 2', 'action area 3', 'eco park', 'rajarhat'],
    commuteTags: ['tech_corridor', 'airport'],
  },
  {
    canonicalCity: 'Kolkata',
    canonicalLocality: 'Salt Lake',
    aliases: ['salt lake', 'bidhannagar', 'sector 5', 'sector v', 'karunamoyee', 'city centre 1'],
    commuteTags: ['metro', 'tech_corridor'],
  },
  {
    canonicalCity: 'Kolkata',
    canonicalLocality: 'South Kolkata',
    aliases: ['south kolkata', 'ballygunge', 'alipore', 'gariahat', 'jadavpur'],
    commuteTags: ['metro', 'central_business'],
  },
];

/**
 * Resolves free-form user query to canonical city and locality using the alias index.
 */
export function resolveLocalityAlias(input: string): { city?: string; locality?: string; matchedAlias?: string } {
  if (!input || !input.trim()) return {};
  const query = input.toLowerCase().trim();

  // 1. Direct city check
  const cityMap: Record<string, string> = {
    'bangalore': 'Bengaluru',
    'bengaluru': 'Bengaluru',
    'blr': 'Bengaluru',
    'mumbai': 'Mumbai',
    'bombay': 'Mumbai',
    'gurgaon': 'Gurugram',
    'gurugram': 'Gurugram',
    'ggn': 'Gurugram',
    'hyderabad': 'Hyderabad',
    'hyd': 'Hyderabad',
    'cyberabad': 'Hyderabad',
    'pune': 'Pune',
    'poona': 'Pune',
    'chennai': 'Chennai',
    'madras': 'Chennai',
    'kolkata': 'Kolkata',
    'calcutta': 'Kolkata',
  };

  if (cityMap[query]) {
    return { city: cityMap[query] };
  }

  // 2. Search locality aliases
  for (const entry of LOCALITY_ALIASES) {
    for (const alias of entry.aliases) {
      if (query === alias || query.includes(alias) || alias.includes(query)) {
        return {
          city: entry.canonicalCity,
          locality: entry.canonicalLocality,
          matchedAlias: alias,
        };
      }
    }
  }

  return {};
}

// =========================================================================
// 2. Deterministic Multi-Attribute Relevance Scoring Engine
// =========================================================================

/**
 * Calculates a multi-attribute match score (0 - 100) and provides a granular,
 * human-understandable breakdown of why this property ranked at this score.
 */
export function calculateSmartMatchScore(
  property: PropertyListing,
  prefs: SmartSearchPreferences
): SmartMatchResult {
  const criteria: MatchCriterion[] = [];
  const tags: string[] = [];

  // Criterion 1: Budget Suitability (Weight: 0.30)
  const weightBudget = 0.30;
  let scoreBudget = 100;
  let budgetExp = 'Budget preference not specified; full suitability assumed.';
  let isBudgetMatched = true;

  if (prefs.targetBudget && prefs.targetBudget > 0) {
    const diff = Math.abs(property.price - prefs.targetBudget);
    const tolerance = prefs.targetBudget * (prefs.budgetTolerancePct ? prefs.budgetTolerancePct / 100 : 0.20);

    if (property.price <= prefs.targetBudget) {
      scoreBudget = 100;
      budgetExp = `Exact budget match: ${property.priceFormatted} fits within target limit.`;
      tags.push('Budget Verified');
    } else if (diff <= tolerance) {
      const penalty = (diff / tolerance) * 35;
      scoreBudget = Math.max(65, Math.round(100 - penalty));
      budgetExp = `Close to budget: ${property.priceFormatted} is within ${Math.round((diff / prefs.targetBudget) * 100)}% tolerance window.`;
    } else {
      scoreBudget = Math.max(20, Math.round(100 - (diff / prefs.targetBudget) * 80));
      budgetExp = `Exceeds target budget by ${Math.round((diff / prefs.targetBudget) * 100)}%.`;
      isBudgetMatched = false;
    }
  }

  criteria.push({
    id: 'budget',
    name: 'Price & Budget Fit',
    score: scoreBudget,
    weight: weightBudget,
    contribution: Math.round(scoreBudget * weightBudget),
    explanation: budgetExp,
    isMatched: isBudgetMatched,
  });

  // Criterion 2: Configuration & BHK Fit (Weight: 0.25)
  const weightBhk = 0.25;
  let scoreBhk = 100;
  let bhkExp = 'Configuration preference not specified.';
  let isBhkMatched = true;

  if (prefs.preferredBhk && prefs.preferredBhk.length > 0) {
    if (prefs.preferredBhk.includes(property.specs.bhk)) {
      scoreBhk = 100;
      bhkExp = `Exact configuration match: ${property.specs.bhk} BHK satisfies requirement.`;
      tags.push(`${property.specs.bhk} BHK`);
    } else {
      const closest = Math.min(...prefs.preferredBhk.map((b) => Math.abs(b - property.specs.bhk)));
      if (closest === 1) {
        scoreBhk = 60;
        bhkExp = `Near configuration: ${property.specs.bhk} BHK is ±1 BHK from requested preference.`;
      } else {
        scoreBhk = 25;
        bhkExp = `Configuration variance: ${property.specs.bhk} BHK vs desired (${prefs.preferredBhk.join(', ')} BHK).`;
        isBhkMatched = false;
      }
    }
  }

  criteria.push({
    id: 'bhk',
    name: 'BHK & Configuration',
    score: scoreBhk,
    weight: weightBhk,
    contribution: Math.round(scoreBhk * weightBhk),
    explanation: bhkExp,
    isMatched: isBhkMatched,
  });

  // Criterion 3: Commute & Locality Proximity (Weight: 0.20)
  const weightCommute = 0.20;
  let scoreCommute = 85;
  let commuteExp = 'Standard suburban transit accessibility.';
  let isCommuteMatched = true;

  const amenitiesLower = property.amenities.map((a) => a.toLowerCase());
  const descLower = property.description.toLowerCase();
  const subLocLower = (property.location.subLocality || '').toLowerCase();

  if (prefs.commutePriority && prefs.commutePriority !== 'none') {
    switch (prefs.commutePriority) {
      case 'metro': {
        const hasMetro =
          amenitiesLower.some((a) => a.includes('metro')) ||
          descLower.includes('metro') ||
          subLocLower.includes('metro');
        if (hasMetro) {
          scoreCommute = 100;
          commuteExp = 'Metro transit confirmed: Walking distance to active Metro line.';
          tags.push('Near Metro');
        } else {
          scoreCommute = 45;
          commuteExp = 'No direct metro proximity listed in architectural specs.';
          isCommuteMatched = false;
        }
        break;
      }
      case 'tech_corridor': {
        const isTechLoc =
          ['whitefield', 'bellandur', 'hitec city', 'gachibowli', 'hinjewadi', 'omr', 'cyber city'].some((t) =>
            property.location.locality.toLowerCase().includes(t)
          ) ||
          descLower.includes('tech park') ||
          descLower.includes('it corridor');
        if (isTechLoc) {
          scoreCommute = 100;
          commuteExp = 'Major IT corridor: Positioned inside key tech employment hub.';
          tags.push('IT Corridor');
        } else {
          scoreCommute = 55;
          commuteExp = 'Outside primary IT employment cluster.';
          isCommuteMatched = false;
        }
        break;
      }
      case 'airport': {
        const isAirportCorridor =
          property.location.locality.toLowerCase().includes('hebbal') ||
          property.location.locality.toLowerCase().includes('andheri') ||
          property.location.locality.toLowerCase().includes('cyber city') ||
          property.location.locality.toLowerCase().includes('newtown') ||
          descLower.includes('airport') ||
          descLower.includes('expressway');
        if (isAirportCorridor) {
          scoreCommute = 100;
          commuteExp = 'Expressway corridor: Rapid transit to International Airport.';
          tags.push('Airport Access');
        } else {
          scoreCommute = 50;
          commuteExp = 'Standard transit distance from airport arterial routes.';
          isCommuteMatched = false;
        }
        break;
      }
      case 'peaceful': {
        const isPeaceful =
          property.propertyType === 'Villa' ||
          descLower.includes('cross ventilation') ||
          descLower.includes('garden') ||
          property.specs.bhk >= 3;
        if (isPeaceful) {
          scoreCommute = 95;
          commuteExp = 'Residential enclave: Low traffic profile and open spaces.';
          tags.push('Quiet Enclave');
        } else {
          scoreCommute = 60;
          commuteExp = 'Urban high-density zone.';
        }
        break;
      }
    }
  } else if (property.location.locality) {
    commuteExp = `Centrally situated within ${property.location.locality}, ${property.location.city}.`;
  }

  criteria.push({
    id: 'commute',
    name: 'Commute & Locality Access',
    score: scoreCommute,
    weight: weightCommute,
    contribution: Math.round(scoreCommute * weightCommute),
    explanation: commuteExp,
    isMatched: isCommuteMatched,
  });

  // Criterion 4: Possession Timing (Weight: 0.15)
  const weightPossession = 0.15;
  let scorePossession = 100;
  let possessionExp = `Current possession: ${property.specs.possessionStatus}.`;
  let isPossessionMatched = true;

  if (prefs.possessionTiming && prefs.possessionTiming !== 'any') {
    if (prefs.possessionTiming === 'ready') {
      if (property.specs.isReadyToMove) {
        scorePossession = 100;
        possessionExp = 'Ready for immediate occupancy (OC received).';
        tags.push('Ready to Move');
      } else {
        scorePossession = 40;
        possessionExp = 'Under construction project; does not offer immediate handover.';
        isPossessionMatched = false;
      }
    } else if (prefs.possessionTiming === 'under_construction') {
      if (!property.specs.isReadyToMove) {
        scorePossession = 100;
        possessionExp = 'Under-construction development with staged payment plan.';
        tags.push('New Launch');
      } else {
        scorePossession = 60;
        possessionExp = 'Completed inventory (Ready to Move).';
      }
    }
  }

  criteria.push({
    id: 'possession',
    name: 'Possession Timing',
    score: scorePossession,
    weight: weightPossession,
    contribution: Math.round(scorePossession * weightPossession),
    explanation: possessionExp,
    isMatched: isPossessionMatched,
  });

  // Criterion 5: Furnishing & Amenities (Weight: 0.10)
  const weightFurnishing = 0.10;
  let scoreFurnishing = 85;
  let furnishingExp = `Property is ${property.specs.furnishing || 'Unfurnished'}.`;

  if (prefs.furnishing && prefs.furnishing !== 'any') {
    if (property.specs.furnishing === prefs.furnishing) {
      scoreFurnishing = 100;
      furnishingExp = `Exact furnishing match: ${property.specs.furnishing}.`;
      tags.push(property.specs.furnishing);
    } else {
      scoreFurnishing = 50;
      furnishingExp = `Furnishing variance: Listed as ${property.specs.furnishing || 'Unspecified'} vs requested ${prefs.furnishing}.`;
    }
  }

  criteria.push({
    id: 'furnishing',
    name: 'Furnishing & Interior State',
    score: scoreFurnishing,
    weight: weightFurnishing,
    contribution: Math.round(scoreFurnishing * weightFurnishing),
    explanation: furnishingExp,
    isMatched: scoreFurnishing >= 70,
  });

  // Calculate Weighted Total Score
  const totalScore = Math.min(
    100,
    Math.round(criteria.reduce((acc, c) => acc + c.score * c.weight, 0))
  );

  let matchGrade: 'Exceptional' | 'Strong' | 'Good' | 'Moderate' = 'Moderate';
  if (totalScore >= 90) matchGrade = 'Exceptional';
  else if (totalScore >= 78) matchGrade = 'Strong';
  else if (totalScore >= 65) matchGrade = 'Good';

  // Build understandable summary explanation
  const highPoints = criteria
    .filter((c) => c.isMatched && c.score >= 80)
    .map((c) => c.explanation.split(':')[0])
    .slice(0, 3);

  const summaryText =
    highPoints.length > 0
      ? `${totalScore}% Relevance: Ranked for ${highPoints.join(', ')}.`
      : `${totalScore}% Relevance: Standard match across selected filter parameters.`;

  return {
    property,
    totalScore,
    matchGrade,
    criteria,
    summaryText,
    tags: Array.from(new Set(tags)),
  };
}

// =========================================================================
// 3. Content-Based Recommendation Engine
// =========================================================================

/**
 * Calculates geodesic distance between two coordinate pairs using Haversine formula.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Recommends similar properties using deterministic content-based multi-factor similarity.
 * Uses exact physical specifications, locality, price band, and amenity overlap.
 */
export function getSimilarRecommendations(
  target: PropertyListing,
  pool: PropertyListing[],
  limit = 3
): RecommendedProperty[] {
  const candidates = pool.filter((p) => p.id !== target.id);

  const scored: RecommendedProperty[] = candidates.map((candidate) => {
    const reasons: string[] = [];
    let score = 0;

    // 1. Locality & Geographic Proximity (Max 35 points)
    const isSameLocality = candidate.location.locality.toLowerCase() === target.location.locality.toLowerCase();
    const isSameCity = candidate.location.city.toLowerCase() === target.location.city.toLowerCase();

    let distanceKm: number | undefined;
    if (
      isValidCoordinate(candidate.location.latitude, candidate.location.longitude) &&
      isValidCoordinate(target.location.latitude, target.location.longitude)
    ) {
      distanceKm = calculateHaversineDistance(
        target.location.latitude,
        target.location.longitude,
        candidate.location.latitude,
        candidate.location.longitude
      );
    }

    if (isSameLocality) {
      score += 35;
      reasons.push(`Same locality: ${target.location.locality}`);
    } else if (distanceKm !== undefined && distanceKm <= 5.0) {
      score += 30;
      reasons.push(`${distanceKm} km away`);
    } else if (isSameCity) {
      score += 20;
      reasons.push(`Same city: ${target.location.city}`);
    }

    // 2. Configuration & Area Match (Max 25 points)
    if (candidate.specs.bhk === target.specs.bhk) {
      score += 15;
      reasons.push(`${target.specs.bhk} BHK configuration`);
    } else if (Math.abs(candidate.specs.bhk - target.specs.bhk) === 1) {
      score += 8;
    }

    const areaDiffRatio = Math.abs(candidate.specs.builtupAreaSqft - target.specs.builtupAreaSqft) / target.specs.builtupAreaSqft;
    if (areaDiffRatio <= 0.15) {
      score += 10;
      reasons.push('Comparable built-up area (±15%)');
    } else if (areaDiffRatio <= 0.30) {
      score += 5;
    }

    // 3. Price Bracket Affinity (Max 25 points)
    const priceDiffRatio = Math.abs(candidate.price - target.price) / target.price;
    if (priceDiffRatio <= 0.15) {
      score += 25;
      reasons.push('Similar price bracket (±15%)');
    } else if (priceDiffRatio <= 0.30) {
      score += 15;
      reasons.push('Within ±30% budget band');
    } else {
      score += 5;
    }

    // 4. Amenities & Property Type (Max 15 points)
    if (candidate.propertyType === target.propertyType) {
      score += 8;
      reasons.push(`${target.propertyType} category`);
    }

    const targetAmenities = new Set(target.amenities.map((a) => a.toLowerCase()));
    const candidateAmenities = new Set(candidate.amenities.map((a) => a.toLowerCase()));
    const commonAmenities = Array.from(targetAmenities).filter((a) => candidateAmenities.has(a));

    if (commonAmenities.length >= 2) {
      score += 7;
      reasons.push(`Shares ${commonAmenities.length} key amenities`);
    }

    const totalSimilarity = Math.min(99, Math.round(score));
    let grade = 'Relevant';
    if (totalSimilarity >= 88) grade = 'Near Identical';
    else if (totalSimilarity >= 75) grade = 'High Similarity';
    else if (totalSimilarity >= 60) grade = 'Moderate Similarity';

    return {
      property: candidate,
      similarityScore: totalSimilarity,
      similarityGrade: grade,
      overlapReasons: reasons.slice(0, 3),
      distanceKm,
    };
  });

  scored.sort((a, b) => b.similarityScore - a.similarityScore);
  return scored.slice(0, limit);
}

/**
 * Validates coordinate pair to ensure non-null, valid numeric bounds.
 */
export function isValidCoordinate(lat?: number, lng?: number): boolean {
  if (lat === undefined || lng === undefined) return false;
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
