import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { PropertyListing } from '../../types/property';

interface PropertyCardProps {
  property: PropertyListing;
  isSaved?: boolean;
  onToggleSave?: (property: PropertyListing) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  isSaved = false,
  onToggleSave,
}) => {
  const {
    slug,
    title,
    location,
    specs,
    priceFormatted,
    pricePerSqft,
    images,
    isVerified,
    isDemoListing,
  } = property;

  const primaryImage =
    images && images.length > 0
      ? images[0]
      : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="gd-property-card">
      {/* Media & Badges */}
      <div className="gd-card-media">
        <Link to={`/property/${slug}`} tabIndex={-1} aria-hidden="true">
          <img src={primaryImage} alt={title} loading="lazy" />
        </Link>

        {/* Badges Row */}
        <div className="gd-card-badge-row">
          {isVerified && (
            <span className="gd-tag gd-tag-verified" title="Verified by GharDhundo">
              Verified
            </span>
          )}
          {isDemoListing && (
            <span className="gd-tag gd-tag-demo" title="Verified benchmark demonstration dataset">
              Demo Benchmark
            </span>
          )}
          {specs.isReadyToMove && (
            <span className="gd-tag gd-tag-ready">Ready to Move</span>
          )}
        </div>

        {/* Bookmark / Heart Button */}
        <button
          type="button"
          className={`gd-card-save-btn ${isSaved ? 'saved' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onToggleSave) onToggleSave(property);
          }}
          title={isSaved ? 'Remove from Saved' : 'Save Property'}
          aria-label={isSaved ? 'Remove from Saved' : 'Save Property'}
        >
          <Heart size={18} fill={isSaved ? '#ef4444' : 'none'} />
        </button>
      </div>

      {/* Body Info */}
      <div className="gd-card-body">
        <div className="gd-card-price-row">
          <span className="gd-card-price">{priceFormatted}</span>
          {pricePerSqft > 0 && (
            <span className="gd-card-rate">
              ₹{Math.round(pricePerSqft).toLocaleString()}/sq.ft
            </span>
          )}
        </div>

        <Link to={`/property/${slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h4 className="gd-card-title" title={title}>
            {title}
          </h4>
        </Link>

        <div className="gd-card-location">
          <MapPin size={13} color="var(--gd-terra-500)" />
          <span>
            {location.locality}, {location.city}
          </span>
        </div>

        {/* Specs Grid */}
        <div className="gd-card-specs">
          {specs.bhk > 0 && (
            <div className="gd-spec-item">
              <span className="label">Configuration</span>
              <span className="val">
                <Bed size={13} color="var(--gd-text-muted)" />
                {specs.bhk} BHK
              </span>
            </div>
          )}
          {specs.bathrooms > 0 && (
            <div className="gd-spec-item">
              <span className="label">Baths</span>
              <span className="val">
                <Bath size={13} color="var(--gd-text-muted)" />
                {specs.bathrooms} Bath
              </span>
            </div>
          )}
          <div className="gd-spec-item">
            <span className="label">Super Area</span>
            <span className="val">
              <Maximize2 size={13} color="var(--gd-text-muted)" />
              {specs.builtupAreaSqft} sq.ft
            </span>
          </div>
        </div>

        {/* Footer with AI Valuation Action */}
        <div className="gd-card-footer">
          <Link
            to={`/property/${slug}#ai-valuation`}
            className="gd-ai-estimate-chip"
            title="Inspect AST-XGB Valuation for this property"
          >
            <Sparkles size={12} />
            <span>AI Valuation Active</span>
          </Link>

          <Link
            to={`/property/${slug}`}
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--gd-terra-500)',
              textDecoration: 'none',
            }}
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
};
