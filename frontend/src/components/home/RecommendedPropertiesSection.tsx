import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Filter, ShieldCheck, Info } from 'lucide-react';
import { DEMO_LISTINGS } from '../../data/demoListings';
import { PropertyCard } from '../listing/PropertyCard';
import { PropertyListing } from '../../types/property';

interface RecommendedPropertiesSectionProps {
  savedIds: string[];
  onToggleSave: (property: PropertyListing) => void;
}

export const RecommendedPropertiesSection: React.FC<RecommendedPropertiesSectionProps> = ({
  savedIds,
  onToggleSave,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'ready' | 'premium' | 'owner' | 'rent'>('all');

  const filteredProperties = useMemo(() => {
    switch (activeCategory) {
      case 'ready':
        return DEMO_LISTINGS.filter((p) => p.specs.isReadyToMove && p.mode === 'buy');
      case 'premium':
        return DEMO_LISTINGS.filter((p) => p.isPremium);
      case 'owner':
        return DEMO_LISTINGS.filter((p) => p.specs.isOwnerListed);
      case 'rent':
        return DEMO_LISTINGS.filter((p) => p.mode === 'rent');
      default:
        return DEMO_LISTINGS;
    }
  }, [activeCategory]);

  return (
    <section className="gd-section" style={{ backgroundColor: 'rgba(0, 0, 0, 0.015)' }}>
      <div className="gd-container">
        {/* Section Header */}
        <div className="gd-section-header">
          <div className="gd-section-title">
            <h3>Recommended Properties for You</h3>
            <p>Curated listings verified for high market liquidity and fair valuation.</p>
          </div>

          <Link to="/buy" className="gd-section-link">
            <span>Explore All {DEMO_LISTINGS.length} Properties</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Category Pill Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '28px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          {[
            { id: 'all', label: 'All Listings' },
            { id: 'ready', label: 'Ready to Move' },
            { id: 'premium', label: 'Premium Homes' },
            { id: 'owner', label: 'Direct from Owners' },
            { id: 'rent', label: 'Rental Apartments' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`gd-bhk-pill ${activeCategory === tab.id ? 'active' : ''}`}
              style={{ padding: '8px 18px', fontSize: '13.5px' }}
              onClick={() => setActiveCategory(tab.id as typeof activeCategory)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dataset Notice Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 16px',
            borderRadius: 'var(--gd-radius-md)',
            backgroundColor: 'var(--gd-terra-50)',
            border: '1px solid var(--gd-terra-200)',
            color: 'var(--gd-terra-700)',
            fontSize: '12.5px',
            marginBottom: '24px',
          }}
        >
          <Info size={16} style={{ flexShrink: 0 }} />
          <span>
            <strong>Benchmark Record Demonstration:</strong> Listed records are benchmark test samples from the 
            AST-XGB validation repository, calibrated with real market coordinates and authentic valuation parameters.
          </span>
        </div>

        {/* Property Grid */}
        {filteredProperties.length > 0 ? (
          <div className="gd-property-grid">
            {filteredProperties.slice(0, 6).map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                isSaved={savedIds.includes(property.id)}
                onToggleSave={onToggleSave}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: '48px',
              textAlign: 'center',
              backgroundColor: 'var(--gd-warm-card)',
              borderRadius: 'var(--gd-radius-lg)',
              border: '1px solid var(--gd-warm-border)',
            }}
          >
            <p style={{ color: 'var(--gd-text-muted)', fontSize: '15px' }}>
              No properties found matching this category filter.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
