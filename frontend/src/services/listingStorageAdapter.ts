/**
 * Interim Local Development Adapter for Owner Listings
 * AST-XGB Real Estate Platform (GharDhundo)
 *
 * NOTE: This is an interim prototype adapter using browser localStorage.
 * Dynamic listings submitted here are visibly labeled as:
 * '[LOCAL PROTOTYPE - PENDING SERVER SYNC]'.
 * See docs/listing-api-contract.md for the production backend contract.
 */

import { PropertyListing, PropertyType, TransactionMode, FurnishingStatus, PossessionStatus, FacingDirection } from '../types/property';

export type ListingStatus = 'draft' | 'submitted' | 'active';

export interface OwnerContactInfo {
  name: string;
  phone: string;
  email: string;
  maskPhone: boolean;
}

export interface OwnerListingData {
  id: string;
  slug: string;
  status: ListingStatus;
  role: 'Owner' | 'Agent' | 'Developer';
  mode: TransactionMode;
  propertyCategory: 'Residential' | 'Commercial' | 'Plot' | 'PG';
  propertyType: PropertyType;
  title: string;
  location: {
    city: string;
    locality: string;
    subLocality?: string;
    projectName?: string;
    landmark?: string;
    pincode?: string;
    latitude: number;
    longitude: number;
  };
  specs: {
    builtupAreaSqft: number;
    carpetAreaSqft?: number;
    bhk: number;
    bathrooms: number;
    balconies: number;
    floorNo: number;
    totalFloors: number;
    facing: FacingDirection;
    ageYears: number;
    furnishing: FurnishingStatus;
    possessionStatus: PossessionStatus;
    parking: number;
  };
  price: number;
  priceFormatted: string;
  pricePerSqft: number;
  maintenanceCharges?: number;
  isNegotiable: boolean;
  images: string[];
  amenities: string[];
  description: string;
  contact: OwnerContactInfo;
  astXgbEstimate?: {
    predictedPrice: number;
    formattedPrice: string;
    lower90: number;
    upper90: number;
    regime: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  isLocalPrototype: boolean;
}

const STORAGE_KEY = 'ast_xgb_owner_listings';

function formatInr(val: number): string {
  if (val >= 10000000) {
    return `₹ ${(val / 10000000).toFixed(2)} Cr`;
  } else if (val >= 100000) {
    return `₹ ${(val / 100000).toFixed(2)} Lakhs`;
  }
  return `₹ ${val.toLocaleString()}`;
}

export class ListingStorageAdapter {
  private getStorage(): OwnerListingData[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('Failed to parse owner listings from storage:', err);
      return [];
    }
  }

  private setStorage(items: OwnerListingData[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new Event('ast_xgb_listings_updated'));
    } catch (err) {
      console.error('Failed to write owner listings to storage (quota exceeded?):', err);
    }
  }

  public getOwnerListings(): OwnerListingData[] {
    return this.getStorage();
  }

  public getListingById(id: string): OwnerListingData | null {
    const list = this.getStorage();
    return list.find((item) => item.id === id || item.slug === id) || null;
  }

  public saveDraft(data: Partial<OwnerListingData>): OwnerListingData {
    const list = this.getStorage();
    const now = new Date().toISOString();
    const id = data.id || `owner-draft-${Date.now().toString(36)}`;
    const slug = data.slug || `draft-${id}`;

    const existingIndex = list.findIndex((i) => i.id === id);

    const price = data.price || 0;
    const area = data.specs?.builtupAreaSqft || 1;
    const ppsf = area > 0 ? Math.round(price / area) : 0;

    const fullListing: OwnerListingData = {
      id,
      slug,
      status: 'draft',
      role: data.role || 'Owner',
      mode: data.mode || 'buy',
      propertyCategory: data.propertyCategory || 'Residential',
      propertyType: data.propertyType || 'Apartment',
      title: data.title || 'Untitled Draft Listing',
      location: data.location || {
        city: 'Bengaluru',
        locality: 'Whitefield',
        latitude: 12.9698,
        longitude: 77.7499,
      },
      specs: data.specs || {
        builtupAreaSqft: 1200,
        bhk: 2,
        bathrooms: 2,
        balconies: 1,
        floorNo: 3,
        totalFloors: 10,
        facing: 'East',
        ageYears: 2,
        furnishing: 'Semi-Furnished',
        possessionStatus: 'Ready to Move',
        parking: 1,
      },
      price,
      priceFormatted: formatInr(price),
      pricePerSqft: ppsf,
      maintenanceCharges: data.maintenanceCharges || 0,
      isNegotiable: data.isNegotiable || false,
      images: data.images && data.images.length > 0 ? data.images : [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      ],
      amenities: data.amenities || ['Power Backup', 'Lift', '24x7 Security'],
      description: data.description || '',
      contact: data.contact || {
        name: 'Property Owner',
        phone: '9876543210',
        email: 'owner@example.com',
        maskPhone: true,
      },
      astXgbEstimate: data.astXgbEstimate || null,
      createdAt: data.createdAt || now,
      updatedAt: now,
      isLocalPrototype: true,
    };

    if (existingIndex >= 0) {
      list[existingIndex] = fullListing;
    } else {
      list.unshift(fullListing);
    }

    this.setStorage(list);
    return fullListing;
  }

  public submitListing(data: OwnerListingData): OwnerListingData {
    const list = this.getStorage();
    const now = new Date().toISOString();
    const id = data.id.startsWith('owner-draft-') ? `owner-pub-${Date.now().toString(36)}` : data.id;

    // Generate clean slug
    const cleanCity = data.location.city.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cleanLoc = data.location.locality.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const slug = `${data.specs.bhk}bhk-${data.propertyType.toLowerCase()}-${cleanLoc}-${cleanCity}-${id}`;

    const submittedItem: OwnerListingData = {
      ...data,
      id,
      slug,
      status: 'submitted',
      updatedAt: now,
      isLocalPrototype: true,
    };

    const existingIndex = list.findIndex((i) => i.id === data.id);
    if (existingIndex >= 0) {
      list[existingIndex] = submittedItem;
    } else {
      list.unshift(submittedItem);
    }

    this.setStorage(list);
    return submittedItem;
  }

  public deleteListing(id: string): boolean {
    const list = this.getStorage();
    const updated = list.filter((item) => item.id !== id);
    if (updated.length !== list.length) {
      this.setStorage(updated);
      return true;
    }
    return false;
  }

  /**
   * Convert OwnerListingData to PropertyListing for seamless integration
   * with SearchResultsPage, PropertyDetailPage, and SavedProperties.
   */
  public toPropertyListing(item: OwnerListingData): PropertyListing {
    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      mode: item.mode,
      propertyType: item.propertyType,
      location: {
        city: item.location.city,
        locality: item.location.locality,
        subLocality: item.location.subLocality || item.location.projectName,
        landmark: item.location.landmark,
        latitude: item.location.latitude || 12.9716,
        longitude: item.location.longitude || 77.5946,
        pincode: item.location.pincode,
      },
      specs: {
        builtupAreaSqft: item.specs.builtupAreaSqft,
        carpetAreaSqft: item.specs.carpetAreaSqft,
        bhk: item.specs.bhk,
        bathrooms: item.specs.bathrooms,
        balconies: item.specs.balconies,
        floorNo: item.specs.floorNo,
        totalFloors: item.specs.totalFloors,
        parking: item.specs.parking,
        ageYears: item.specs.ageYears,
        furnishing: item.specs.furnishing,
        facing: item.specs.facing,
        possessionStatus: item.specs.possessionStatus,
        isReadyToMove: item.specs.possessionStatus === 'Ready to Move',
        isOwnerListed: item.role === 'Owner',
      },
      price: item.price,
      priceFormatted: item.priceFormatted,
      pricePerSqft: item.pricePerSqft,
      images: item.images,
      amenities: item.amenities,
      description: item.description,
      sellerType: item.role as any,
      sellerLabel: `Direct ${item.role} Listing (Local Prototype Adapter)`,
      isVerified: false,
      isPremium: false,
      postedDate: item.createdAt.slice(0, 10),
      isDemoListing: false, // User created!
      datasetAttribution: 'Client-Submitted Record (Stored in Local Prototype Adapter)',
    };
  }
}

export const listingStorage = new ListingStorageAdapter();
