import { PropertyListing, PropertySearchQuery, PropertySearchParams } from '../types/property';
import { DEMO_LISTINGS } from '../data/demoListings';
import { listingStorage } from './listingStorageAdapter';
import { resolveLocalityAlias, calculateSmartMatchScore, SmartMatchResult } from './smartSearchService';

export interface ListingsAdapterResponse {
  items: PropertyListing[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
  availableLocalities: string[];
  minFoundPrice: number;
  maxFoundPrice: number;
  isBackendConnected: boolean;
  attributionNote: string;
  smartMatches?: Record<string, SmartMatchResult>;
}

function getAllAvailableListings(): PropertyListing[] {
  const ownerListings = listingStorage.getOwnerListings().map((item) => listingStorage.toPropertyListing(item));
  return [...ownerListings, ...DEMO_LISTINGS];
}

/**
 * Listings Service Adapter
 * Provides robust stateful filtering, multi-attribute querying, sorting, and pagination.
 * Directly queries the verified AST-XGB evaluation benchmark data source.
 */
export async function searchListings(query: PropertySearchQuery): Promise<ListingsAdapterResponse> {
  // Simulate slight network latency for authentic UI loading skeletons
  await new Promise((resolve) => setTimeout(resolve, 120));

  let results = getAllAvailableListings();

  // 1. Transaction Mode Filter
  if (query.mode) {
    results = results.filter((p) => p.mode === query.mode);
  }

  // 2. City Filter
  if (query.city && query.city !== 'All Cities') {
    const targetCity = query.city.toLowerCase().trim();
    results = results.filter((p) => p.location.city.toLowerCase() === targetCity);
  }

  // 3. Locality Filter (supports aliases, e.g. "ITPL" -> "Whitefield", "BKC" -> "Bandra")
  if (query.locality && query.locality.trim() !== '') {
    const rawLoc = query.locality.toLowerCase().trim();
    const aliasResolution = resolveLocalityAlias(query.locality);
    const resolvedLoc = aliasResolution.locality ? aliasResolution.locality.toLowerCase() : null;

    results = results.filter((p) => {
      const pLoc = p.location.locality.toLowerCase();
      const pSub = (p.location.subLocality || '').toLowerCase();

      const directMatch = pLoc.includes(rawLoc) || pSub.includes(rawLoc);
      const aliasMatch = resolvedLoc ? pLoc.includes(resolvedLoc) || pSub.includes(resolvedLoc) : false;

      return directMatch || aliasMatch;
    });
  }

  // 4. Property Type Filter
  if (query.propertyType && query.propertyType !== 'All Types') {
    const typeLower = query.propertyType.toLowerCase();
    results = results.filter((p) => p.propertyType.toLowerCase() === typeLower);
  }

  // 5. BHK Filter (array of numbers, 4 represents 4+)
  if (query.bhk && query.bhk.length > 0) {
    results = results.filter((p) => {
      return query.bhk!.some((b) => (b >= 4 ? p.specs.bhk >= 4 : p.specs.bhk === b));
    });
  }

  // 6. Bathrooms Filter
  if (query.bathrooms && query.bathrooms.length > 0) {
    results = results.filter((p) => {
      return query.bathrooms!.some((b) => (b >= 3 ? p.specs.bathrooms >= 3 : p.specs.bathrooms === b));
    });
  }

  // 7. Budget Range Filter
  if (query.minPrice !== undefined && query.minPrice > 0) {
    results = results.filter((p) => p.price >= query.minPrice!);
  }
  if (query.maxPrice !== undefined && query.maxPrice > 0) {
    results = results.filter((p) => p.price <= query.maxPrice!);
  }

  // 8. Built-up Area Range Filter (sq.ft)
  if (query.minArea !== undefined && query.minArea > 0) {
    results = results.filter((p) => p.specs.builtupAreaSqft >= query.minArea!);
  }
  if (query.maxArea !== undefined && query.maxArea > 0) {
    results = results.filter((p) => p.specs.builtupAreaSqft <= query.maxArea!);
  }

  // 9. Furnishing Filter
  if (query.furnishing && query.furnishing.length > 0) {
    results = results.filter((p) => p.specs.furnishing && query.furnishing!.includes(p.specs.furnishing));
  }

  // 10. Possession Status Filter ('Ready to Move', 'Under Construction')
  if (query.possessionStatus && query.possessionStatus.length > 0) {
    results = results.filter((p) => query.possessionStatus!.includes(p.specs.possessionStatus));
  }

  // 11. Project Age Filter (years)
  if (query.maxAgeYears !== undefined && query.maxAgeYears > 0) {
    results = results.filter((p) => (p.specs.ageYears ?? 0) <= query.maxAgeYears!);
  }

  // 12. Seller Type Filter ('Owner', 'Developer', 'Agent')
  if (query.sellerType && query.sellerType.length > 0) {
    results = results.filter((p) => query.sellerType!.includes(p.sellerType));
  }

  // Extract unique available localities in current subset for smart filter dropdowns
  const availableLocalities = Array.from(new Set(results.map((p) => p.location.locality))).sort();
  const prices = results.map((p) => p.price);
  const minFoundPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxFoundPrice = prices.length > 0 ? Math.max(...prices) : 0;

  // 13. Precompute Smart Match Scoring for Active Results
  const smartMatches: Record<string, SmartMatchResult> = {};
  results.forEach((p) => {
    smartMatches[p.id] = calculateSmartMatchScore(p, {
      targetBudget: query.maxPrice || query.minPrice,
      preferredBhk: query.bhk,
      commutePriority: query.commutePriority,
      possessionTiming: query.possessionTiming,
      furnishing: query.furnishing && query.furnishing.length > 0 ? query.furnishing[0] : 'any',
      targetCity: query.city,
      targetLocality: query.locality,
    });
  });

  // 14. Sorting
  const sortBy = query.sortBy || 'relevance';
  switch (sortBy) {
    case 'smart_match':
      results.sort((a, b) => {
        const scoreA = smartMatches[a.id]?.totalScore ?? 0;
        const scoreB = smartMatches[b.id]?.totalScore ?? 0;
        return scoreB - scoreA;
      });
      break;
    case 'price_asc':
      results.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      results.sort((a, b) => b.price - a.price);
      break;
    case 'area_desc':
      results.sort((a, b) => b.specs.builtupAreaSqft - a.specs.builtupAreaSqft);
      break;
    case 'newest':
      results.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
      break;
    case 'relevance':
    default:
      // If commute priority or specific budget is set, promote smart match, else premium first
      if (query.commutePriority && query.commutePriority !== 'none') {
        results.sort((a, b) => {
          const scoreA = smartMatches[a.id]?.totalScore ?? 0;
          const scoreB = smartMatches[b.id]?.totalScore ?? 0;
          return scoreB - scoreA;
        });
      } else {
        results.sort((a, b) => {
          if ((b.isPremium ? 1 : 0) !== (a.isPremium ? 1 : 0)) {
            return (b.isPremium ? 1 : 0) - (a.isPremium ? 1 : 0);
          }
          return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
        });
      }
      break;
  }

  // 15. Pagination
  const total = results.length;
  const page = Math.max(1, query.page || 1);
  const pageSize = query.pageSize || 6;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (page - 1) * pageSize;
  const paginatedItems = results.slice(startIndex, startIndex + pageSize);

  return {
    items: paginatedItems,
    total,
    page,
    pageSize,
    totalPages,
    hasMore: page < totalPages,
    availableLocalities,
    minFoundPrice,
    maxFoundPrice,
    isBackendConnected: false,
    attributionNote: 'AST-XGB Valuation Repository Benchmark Evaluation Dataset',
    smartMatches,
  };
}

export async function getListingBySlug(slug: string): Promise<PropertyListing | null> {
  await new Promise((resolve) => setTimeout(resolve, 80));
  return getAllAvailableListings().find((p) => p.slug === slug || p.id === slug) || null;
}

export async function getListingsByIds(ids: string[]): Promise<PropertyListing[]> {
  await new Promise((resolve) => setTimeout(resolve, 60));
  return getAllAvailableListings().filter((p) => ids.includes(p.id));
}
