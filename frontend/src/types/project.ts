export type ProjectStatus = 'Under Construction' | 'Ready to Move' | 'New Launch';

export interface ProjectConfiguration {
  bhk: string;
  carpetAreaSqft: number;
  builtupAreaSqft: number;
  priceStartingInr: number;
  priceFormatted: string;
}

export interface ProjectEntity {
  id: string;
  slug: string;
  name: string;
  developer: string;
  city: string;
  locality: string;
  subLocality?: string;
  address: string;
  status: ProjectStatus;
  launchYear: number;
  possessionDate: string; // e.g. "Dec 2026" or "Ready to Move"
  reraStatus: string;     // Transparent disclosure, e.g. "State RERA: Registration Under Verification with Authority"
  reraId?: string;        // Only when officially verified; omitted or noted if pending
  configurations: ProjectConfiguration[];
  bhkTypes: string[];     // ['2 BHK', '3 BHK', '4 BHK']
  priceMin: number;
  priceMax: number;
  priceRangeFormatted: string; // e.g. "₹ 1.25 Cr - ₹ 2.45 Cr"
  totalAcres?: number;
  totalTowers?: number;
  totalUnits?: number;
  amenities: string[];
  images: string[];
  coverImage: string;
  overview: string;
  highlights: string[];
  latitude: number;
  longitude: number;
  isDemoProject: boolean;
  datasetAttribution: string;
}
