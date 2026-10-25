import React from 'react';
import { X, RotateCcw, Filter, MapPin, Building, IndianRupee, Layers } from 'lucide-react';
import { PropertySearchQuery } from '../../types/property';

interface CompactSearchSummaryProps {
  query: PropertySearchQuery;
  totalCount: number;
  onRemoveFilter: (key: keyof PropertySearchQuery, value?: any) => void;
  onClearAll: () => void;
}

export const CompactSearchSummary: React.FC<CompactSearchSummaryProps> = ({
  query,
  totalCount,
  onRemoveFilter,
  onClearAll,
}) => {
  // Extract active filter tags
  const activeTags: Array<{ key: keyof PropertySearchQuery; label: string; value?: any }> = [];

  if (query.mode) {
    activeTags.push({ key: 'mode', label: `Mode: ${query.mode.toUpperCase()}` });
  }

  if (query.city && query.city !== 'All Cities') {
    activeTags.push({ key: 'city', label: `City: ${query.city}` });
  }

  if (query.locality) {
    activeTags.push({ key: 'locality', label: `Locality: ${query.locality}` });
  }

  if (query.propertyType && query.propertyType !== 'All Types') {
    activeTags.push({ key: 'propertyType', label: `Type: ${query.propertyType}` });
  }

  if (query.bhk && query.bhk.length > 0) {
    activeTags.push({
      key: 'bhk',
      label: `BHK: ${query.bhk.map((b) => (b >= 4 ? '4+' : b)).join(', ')} BHK`,
    });
  }

  if (query.bathrooms && query.bathrooms.length > 0) {
    activeTags.push({
      key: 'bathrooms',
      label: `Baths: ${query.bathrooms.map((b) => (b >= 3 ? '3+' : b)).join(', ')}`,
    });
  }

  if (query.minPrice || query.maxPrice) {
    const minStr = query.minPrice ? `₹${(query.minPrice / 100000).toFixed(0)}L` : 'Min';
    const maxStr = query.maxPrice ? `₹${(query.maxPrice / 100000).toFixed(0)}L` : 'Max';
    activeTags.push({ key: 'maxPrice', label: `Budget: ${minStr} - ${maxStr}` });
  }

  if (query.minArea || query.maxArea) {
    const minA = query.minArea ? `${query.minArea} sqft` : '0';
    const maxA = query.maxArea ? `${query.maxArea} sqft` : 'Max';
    activeTags.push({ key: 'maxArea', label: `Area: ${minA} - ${maxA}` });
  }

  if (query.furnishing && query.furnishing.length > 0) {
    activeTags.push({
      key: 'furnishing',
      label: `Furnishing: ${query.furnishing.join(', ')}`,
    });
  }

  if (query.possessionStatus && query.possessionStatus.length > 0) {
    activeTags.push({
      key: 'possessionStatus',
      label: `Possession: ${query.possessionStatus.join(', ')}`,
    });
  }

  if (query.maxAgeYears !== undefined && query.maxAgeYears > 0) {
    activeTags.push({
      key: 'maxAgeYears',
      label: `Age: <= ${query.maxAgeYears} Yrs`,
    });
  }

  if (query.sellerType && query.sellerType.length > 0) {
    activeTags.push({
      key: 'sellerType',
      label: `Seller: ${query.sellerType.join(', ')}`,
    });
  }

  if (query.commutePriority && query.commutePriority !== 'none') {
    const commuteLabels: Record<string, string> = {
      metro: '🚇 Near Metro Station',
      tech_corridor: '💼 Major IT / Tech Hub',
      airport: '✈️ Airport Expressway Access',
      peaceful: '🌿 Quiet Residential Enclave',
    };
    activeTags.push({
      key: 'commutePriority',
      label: commuteLabels[query.commutePriority] || `Transit: ${query.commutePriority}`,
    });
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--gd-warm-card)',
        border: '1px solid var(--gd-warm-border)',
        borderRadius: 'var(--gd-radius-lg)',
        padding: '16px 20px',
        marginBottom: '20px',
        boxShadow: 'var(--gd-shadow-sm)',
      }}
      aria-label="Active Search Summary"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--gd-text-charcoal)' }}>
            Showing {totalCount} Properties
          </span>
          <span style={{ fontSize: '12px', color: 'var(--gd-text-muted)' }}>
            in {query.locality ? `${query.locality}, ` : ''}{query.city || 'All India'}
          </span>
        </div>

        {activeTags.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--gd-terra-600)',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: 'var(--gd-radius-sm)',
            }}
          >
            <RotateCcw size={12} />
            <span>Clear All Filters</span>
          </button>
        )}
      </div>

      {/* Applied Filter Tags Strip */}
      {activeTags.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--gd-warm-border)',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gd-text-muted)', textTransform: 'uppercase' }}>
            Active Filters:
          </span>

          {activeTags.map((tag) => (
            <span
              key={`${tag.key}-${tag.label}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: 'var(--gd-radius-full)',
                backgroundColor: 'var(--gd-terra-50)',
                border: '1px solid var(--gd-terra-200)',
                color: 'var(--gd-terra-700)',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <span>{tag.label}</span>
              <button
                type="button"
                onClick={() => onRemoveFilter(tag.key, tag.value)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--gd-terra-600)',
                  cursor: 'pointer',
                  padding: '1px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label={`Remove filter ${tag.label}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
