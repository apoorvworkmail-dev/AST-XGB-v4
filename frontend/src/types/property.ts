export type PropertyType =
  | 'Apartment'
  | 'Independent House'
  | 'Villa'
  | 'Penthouse'
  | 'Builder Floor'
  | 'Plot'
  | 'Commercial Office'
  | 'Commercial Shop';

export type TransactionMode = 'buy' | 'rent' | 'pg' | 'plots' | 'commercial';

export type FurnishingStatus = 'Furnished' | 'Semi-Furnished' | 'Unfurnished';

export type PossessionStatus = 'Ready to Move' | 'Under Construction';

export type SellerType = 'Owner' | 'Developer' | 'Agent' | 'Research Benchmark';

export type FacingDirection = 'North' | 'South' | 'East' | 'West' | 'North-East' | 'North-West' | 'South-East' | 'South-West';

export type MarketRegime = 'Stable' | 'Growth' | 'Cooling' | 'Shock';

export interface PropertyLocation {
  city: string;
  locality: string;
  subLocality?: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  pincode?: string;
}

export interface PropertySpecs {
  builtupAreaSqft: number;
  carpetAreaSqft?: number;
  bhk: number;
  bathrooms: number;
  balconies?: number;
  floorNo?: number;
  totalFloors?: number;
  parking?: number;
  ageYears?: number;
  furnishing?: FurnishingStatus;
  facing?: FacingDirection;
  possessionStatus: PossessionStatus;
  isReadyToMove: boolean;
  isOwnerListed: boolean;
}

export interface PropertyListing {
  id: string;
  slug: string;
  title: string;
  mode: TransactionMode;
  propertyType: PropertyType;
  location: PropertyLocation;
  specs: PropertySpecs;
  price: number;              // In INR
  priceFormatted: string;     // e.g. "₹ 1.45 Cr"
  pricePerSqft: number;       // In INR
  images: string[];
  amenities: string[];
  description: string;
  sellerType: SellerType;
  sellerLabel: string;        // e.g. "AST-XGB Benchmark Record (Owner Category)"
  isVerified?: boolean;
  isPremium?: boolean;
  postedDate: string;
  isDemoListing: boolean;     // Explicit flag for evaluation / research data
  datasetAttribution: string; // "AST-XGB Valuation Repository Benchmark Dataset"
}

export type SortOption = 'relevance' | 'smart_match' | 'price_asc' | 'price_desc' | 'area_desc' | 'newest';

export interface PropertySearchQuery {
  mode?: TransactionMode;
  city?: string;
  locality?: string;
  propertyType?: string;
  bhk?: number[];
  bathrooms?: number[];
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  furnishing?: FurnishingStatus[];
  possessionStatus?: PossessionStatus[];
  maxAgeYears?: number;
  sellerType?: SellerType[];
  commutePriority?: 'none' | 'metro' | 'tech_corridor' | 'airport' | 'peaceful';
  possessionTiming?: 'any' | 'ready' | 'under_construction';
  sortBy?: SortOption;
  page?: number;
  pageSize?: number;
}

export type PropertySearchParams = PropertySearchQuery;
