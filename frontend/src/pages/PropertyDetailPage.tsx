import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Calendar,
  Compass,
  Building,
  Heart,
  Share2,
  Sparkles,
  ShieldCheck,
  Phone,
  Calculator,
  ChevronRight,
  CheckCircle2,
  Info,
  Scale,
  Maximize,
  Layers,
  Car,
  Clock,
  Printer,
  SlidersHorizontal,
} from 'lucide-react';
import { getListingBySlug } from '../services/listingsAdapter';
import { PropertyListing } from '../types/property';
import { PropertyLightboxModal } from '../components/listing/PropertyLightboxModal';
import { FloorPlanViewer } from '../components/listing/FloorPlanViewer';
import { LocalityContextCard } from '../components/listing/LocalityContextCard';
import { InquiryModal } from '../components/listing/InquiryModal';
import { AstXgbValuationCard } from '../components/listing/AstXgbValuationCard';
import { SimilarProperties } from '../components/listing/SimilarProperties';

interface PropertyDetailPageProps {
  savedIds: string[];
  onToggleSave: (property: PropertyListing) => void;
}

export const PropertyDetailPage: React.FC<PropertyDetailPageProps> = ({
  savedIds,
  onToggleSave,
}) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug) {
      setLoading(true);
      getListingBySlug(slug)
        .then((prop) => {
          setProperty(prop);
          setActiveImageIndex(0);
          setLoading(false);
        })
        .catch(() => {
          setProperty(null);
          setLoading(false);
        });
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="gd-consumer-app" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="gd-container">
          <div className="spin" style={{ display: 'inline-block', width: '36px', height: '36px', border: '3px solid var(--gd-warm-border)', borderTopColor: 'var(--gd-terra-500)', borderRadius: '50%', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gd-text-charcoal)' }}>Loading Property Details...</h3>
          <p style={{ color: 'var(--gd-text-muted)', fontSize: '13px' }}>Retrieving benchmark record and architectural specifications</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="gd-consumer-app" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="gd-container" style={{ maxWidth: '560px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--gd-warm-bg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: 'var(--gd-text-muted)' }}>
            <Building size={32} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gd-text-charcoal)', marginBottom: '8px' }}>
            Property Listing Not Found
          </h2>
          <p style={{ color: 'var(--gd-text-muted)', marginBottom: '24px', fontSize: '14px', lineHeight: 1.5 }}>
            The requested property record (<strong>{slug}</strong>) could not be located in the AST-XGB evaluation benchmark repository.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/buy" className="gd-btn-search" style={{ display: 'inline-flex', textDecoration: 'none' }}>
              Browse Available Listings
            </Link>
            <Link to="/ai-valuation" className="gd-btn-search" style={{ display: 'inline-flex', background: 'var(--gd-warm-bg)', color: 'var(--gd-text-charcoal)', border: '1px solid var(--gd-warm-border)', textDecoration: 'none' }}>
              Open AI Valuation Studio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isSaved = savedIds.includes(property.id);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCompare = () => {
    navigate(`/tools/compare?ids=${property.id}`);
  };

  // Rough indicative EMI calculation: 80% LTV, 8.5% p.a., 20 years
  const principal = property.price * 0.8;
  const monthlyRate = 8.5 / 12 / 100;
  const tenureMonths = 240;
  const emiAmount = Math.round(
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1)
  );

  return (
    <div className="gd-consumer-app" style={{ paddingBottom: '90px' }}>
      {/* Lightbox Modal */}
      <PropertyLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={property.images}
        activeIndex={activeImageIndex}
        onIndexChange={setActiveImageIndex}
        propertyTitle={property.title}
      />

      {/* Inquiry / Contact Modal */}
      <InquiryModal
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
        property={property}
      />

      {/* Breadcrumb Header Bar */}
      <div style={{ backgroundColor: 'var(--gd-warm-card)', borderBottom: '1px solid var(--gd-warm-border)', padding: '14px 0' }}>
        <div className="gd-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            {/* Breadcrumb links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--gd-text-muted)' }}>
              <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
              <ChevronRight size={13} />
              <Link to={`/search?city=${encodeURIComponent(property.location.city)}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                {property.location.city}
              </Link>
              <ChevronRight size={13} />
              <Link to={`/search?city=${encodeURIComponent(property.location.city)}&locality=${encodeURIComponent(property.location.locality)}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                {property.location.locality}
              </Link>
              <ChevronRight size={13} />
              <span style={{ color: 'var(--gd-text-charcoal)', fontWeight: 600, maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {property.title}
              </span>
            </div>

            {/* Top Quick Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="gd-icon-btn"
                onClick={handleShare}
                title="Copy property share link"
                aria-label="Share listing"
              >
                <Share2 size={16} />
              </button>
              {copied && <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700 }}>Link Copied!</span>}

              <button
                type="button"
                className={`gd-icon-btn ${isSaved ? 'saved' : ''}`}
                onClick={() => onToggleSave(property)}
                title={isSaved ? 'Remove from Saved' : 'Save Property'}
                aria-label="Save listing"
              >
                <Heart size={16} fill={isSaved ? '#ef4444' : 'none'} color={isSaved ? '#ef4444' : 'currentColor'} />
              </button>

              <button
                type="button"
                className="gd-icon-btn"
                onClick={handleCompare}
                title="Compare this property"
                aria-label="Compare property"
              >
                <Scale size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="gd-container" style={{ paddingTop: '24px' }}>
        {/* Title, Address & Price Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {property.isVerified && <span className="gd-tag gd-tag-verified">Verified</span>}
              {property.isDemoListing && <span className="gd-tag gd-tag-demo">Benchmark Dataset Record</span>}
              <span className="gd-tag" style={{ background: 'var(--gd-terra-50)', color: 'var(--gd-terra-600)', border: '1px solid var(--gd-terra-200)' }}>
                {property.propertyType}
              </span>
              <span className="gd-tag" style={{ textTransform: 'capitalize' }}>
                For {property.mode}
              </span>
            </div>

            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--gd-text-charcoal)', lineHeight: 1.25 }}>
              {property.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gd-text-slate)', fontSize: '14.5px' }}>
              <MapPin size={16} color="var(--gd-terra-500)" style={{ flexShrink: 0 }} />
              <span>
                {property.location.subLocality ? `${property.location.subLocality}, ` : ''}
                {property.location.locality}, {property.location.city} {property.location.pincode ? `- ${property.location.pincode}` : ''}
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--gd-text-charcoal)', fontFamily: 'JetBrains Mono, monospace' }}>
              {property.priceFormatted}
            </div>
            {property.pricePerSqft > 0 && (
              <div style={{ fontSize: '13.5px', color: 'var(--gd-text-muted)', fontWeight: 600 }}>
                ₹{Math.round(property.pricePerSqft).toLocaleString()} per sq.ft
              </div>
            )}
            <div style={{ fontSize: '12px', color: 'var(--gd-terra-600)', fontWeight: 600, marginTop: '2px' }}>
              Est. EMI ₹{emiAmount.toLocaleString()}/mo
            </div>
          </div>
        </div>

        {/* Media Gallery with Lightbox Button */}
        <div style={{ marginBottom: '32px' }}>
          <div
            style={{
              height: '460px',
              borderRadius: 'var(--gd-radius-xl)',
              overflow: 'hidden',
              backgroundColor: '#0f172a',
              marginBottom: '12px',
              position: 'relative',
              cursor: 'pointer',
            }}
            onClick={() => setIsLightboxOpen(true)}
            title="Click to view fullscreen gallery"
          >
            <img
              src={property.images[activeImageIndex] || property.images[0]}
              alt={property.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {/* View Fullscreen Pill */}
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                background: 'rgba(15, 23, 42, 0.85)',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '999px',
                fontSize: '12.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <Maximize size={14} />
              <span>View All {property.images.length} Photos</span>
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                background: 'rgba(15, 23, 42, 0.75)',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 600,
              }}
            >
              Photo {activeImageIndex + 1} of {property.images.length}
            </div>
          </div>

          {/* Thumbnails Strip */}
          {property.images.length > 1 && (
            <div style={{ display: 'flex', gap: '10px' }}>
              {property.images.map((img, idx) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  style={{
                    width: '84px',
                    height: '62px',
                    borderRadius: 'var(--gd-radius-md)',
                    overflow: 'hidden',
                    border: activeImageIndex === idx ? '2.5px solid var(--gd-terra-500)' : '1px solid var(--gd-warm-border)',
                    padding: 0,
                    cursor: 'pointer',
                    opacity: activeImageIndex === idx ? 1 : 0.75,
                  }}
                >
                  <img src={img} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2-Column Responsive Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '32px', alignItems: 'start' }} className="gd-property-detail-grid">
          {/* Left Column: Facts, About, Amenities, Floor Plan, Locality, Similar, Provenance */}
          <div>
            {/* Property Facts Overview (Graceful Missing Data Handling) */}
            <div
              style={{
                backgroundColor: 'var(--gd-warm-card)',
                border: '1px solid var(--gd-warm-border)',
                borderRadius: 'var(--gd-radius-lg)',
                padding: '24px',
                marginBottom: '28px',
                boxShadow: 'var(--gd-shadow-sm)',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--gd-text-charcoal)' }}>
                Property Facts &amp; Specifications
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
                {/* Built-up Area */}
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--gd-text-muted)', fontWeight: 700 }}>
                    Super Built-up Area
                  </span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gd-text-charcoal)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <Maximize2 size={16} color="var(--gd-terra-500)" />
                    {property.specs.builtupAreaSqft} sq.ft
                  </div>
                </div>

                {/* Carpet Area (if known) */}
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--gd-text-muted)', fontWeight: 700 }}>
                    Carpet Area
                  </span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gd-text-charcoal)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <Maximize size={16} color="var(--gd-terra-500)" />
                    {property.specs.carpetAreaSqft ? `${property.specs.carpetAreaSqft} sq.ft` : 'Not Disclosed'}
                  </div>
                </div>

                {/* Bedrooms / Configuration */}
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--gd-text-muted)', fontWeight: 700 }}>
                    Configuration
                  </span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gd-text-charcoal)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <Bed size={16} color="var(--gd-terra-500)" />
                    {property.specs.bhk > 0 ? `${property.specs.bhk} Bedrooms` : 'Studio / Open'}
                  </div>
                </div>

                {/* Bathrooms */}
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--gd-text-muted)', fontWeight: 700 }}>
                    Bathrooms
                  </span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gd-text-charcoal)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <Bath size={16} color="var(--gd-terra-500)" />
                    {property.specs.bathrooms > 0 ? `${property.specs.bathrooms} Baths` : 'Not Disclosed'}
                  </div>
                </div>

                {/* Balconies */}
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--gd-text-muted)', fontWeight: 700 }}>
                    Balconies
                  </span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gd-text-charcoal)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <Building size={16} color="var(--gd-terra-500)" />
                    {property.specs.balconies !== undefined ? `${property.specs.balconies} Balconies` : 'Not Specified'}
                  </div>
                </div>

                {/* Floor Level */}
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--gd-text-muted)', fontWeight: 700 }}>
                    Floor Level
                  </span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gd-text-charcoal)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <Layers size={16} color="var(--gd-terra-500)" />
                    {property.specs.floorNo !== undefined
                      ? `${property.specs.floorNo}th of ${property.specs.totalFloors || 10} Floors`
                      : 'Not Disclosed'}
                  </div>
                </div>

                {/* Facing Direction */}
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--gd-text-muted)', fontWeight: 700 }}>
                    Facing Direction
                  </span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gd-text-charcoal)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <Compass size={16} color="var(--gd-terra-500)" />
                    {property.specs.facing || 'East'}
                  </div>
                </div>

                {/* Property Age */}
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--gd-text-muted)', fontWeight: 700 }}>
                    Property Age
                  </span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gd-text-charcoal)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <Calendar size={16} color="var(--gd-terra-500)" />
                    {property.specs.ageYears !== undefined ? `${property.specs.ageYears} Years` : 'New Construction'}
                  </div>
                </div>

                {/* Furnishing Status */}
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--gd-text-muted)', fontWeight: 700 }}>
                    Furnishing Status
                  </span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gd-text-charcoal)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <Building size={16} color="var(--gd-terra-500)" />
                    {property.specs.furnishing || 'Unfurnished'}
                  </div>
                </div>

                {/* Possession Status */}
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--gd-text-muted)', fontWeight: 700 }}>
                    Possession Status
                  </span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <CheckCircle2 size={16} color="#10b981" />
                    {property.specs.possessionStatus || (property.specs.isReadyToMove ? 'Ready to Move' : 'Under Construction')}
                  </div>
                </div>

                {/* Parking Spaces */}
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--gd-text-muted)', fontWeight: 700 }}>
                    Reserved Parking
                  </span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gd-text-charcoal)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <Car size={16} color="var(--gd-terra-500)" />
                    {property.specs.parking !== undefined ? `${property.specs.parking} Covered Slot(s)` : 'Available / Open'}
                  </div>
                </div>

                {/* Listing Type / Seller */}
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--gd-text-muted)', fontWeight: 700 }}>
                    Seller Category
                  </span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gd-text-charcoal)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <ShieldCheck size={16} color="var(--gd-terra-500)" />
                    {property.sellerType}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div
              style={{
                backgroundColor: 'var(--gd-warm-card)',
                border: '1px solid var(--gd-warm-border)',
                borderRadius: 'var(--gd-radius-lg)',
                padding: '24px',
                marginBottom: '28px',
                boxShadow: 'var(--gd-shadow-sm)',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--gd-text-charcoal)' }}>
                About This Property
              </h3>
              <p style={{ fontSize: '14.5px', color: 'var(--gd-text-slate)', lineHeight: 1.7, margin: 0 }}>
                {property.description}
              </p>
            </div>

            {/* Amenities & Features */}
            <div
              style={{
                backgroundColor: 'var(--gd-warm-card)',
                border: '1px solid var(--gd-warm-border)',
                borderRadius: 'var(--gd-radius-lg)',
                padding: '24px',
                marginBottom: '28px',
                boxShadow: 'var(--gd-shadow-sm)',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--gd-text-charcoal)' }}>
                Amenities &amp; Project Facilities
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {property.amenities.map((item) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--gd-text-charcoal)' }}>
                    <CheckCircle2 size={16} color="#10b981" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Architectural Floor Plan Viewer */}
            <FloorPlanViewer specs={property.specs} propertyType={property.propertyType} />

            {/* Location & Locality Intelligence */}
            <LocalityContextCard location={property.location} propertyTitle={property.title} />

            {/* Similar Properties */}
            <SimilarProperties currentProperty={property} savedIds={savedIds} onToggleSave={onToggleSave} />

            {/* Dataset Provenance & Freshness Box */}
            <div
              style={{
                backgroundColor: 'var(--gd-warm-card)',
                border: '1px solid var(--gd-warm-border)',
                borderRadius: 'var(--gd-radius-lg)',
                padding: '20px',
                fontSize: '12.5px',
                color: 'var(--gd-text-muted)',
                lineHeight: 1.6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: 'var(--gd-text-charcoal)', marginBottom: '6px' }}>
                <ShieldCheck size={16} color="var(--gd-terra-500)" />
                <span>Dataset Provenance &amp; Benchmark Audit Details</span>
              </div>
              <div>
                <strong>Catalog Record ID:</strong> <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{property.id}</span> • <strong>Audited Date:</strong> {property.postedDate} • <strong>Attribution:</strong> {property.datasetAttribution}
              </div>
              <div style={{ marginTop: '4px' }}>
                {property.isDemoListing ? (
                  'This listing is maintained as a verified evaluation benchmark for the AST-XGB multi-model real estate valuation framework. Specifications and GPS coordinates are preserved for algorithmic research.'
                ) : (
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                    Notice: This listing was created through the Post Property Portal and is stored in the local prototype adapter (session-scoped). It is pending production cloud database synchronization.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (Sticky Desktop Sidebar): Asking Price, Inquire CTA, AST-XGB Card, Seller Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '80px' }}>
            {/* Asking Price & Actions Card */}
            <div
              style={{
                backgroundColor: 'var(--gd-warm-card)',
                border: '1px solid var(--gd-warm-border)',
                borderRadius: 'var(--gd-radius-xl)',
                padding: '24px',
                boxShadow: 'var(--gd-shadow-md)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--gd-text-muted)', fontWeight: 800 }}>
                  Seller's Asking Price
                </span>
                <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700 }}>
                  Negotiable
                </span>
              </div>

              <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--gd-text-charcoal)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px' }}>
                {property.priceFormatted}
              </div>

              {property.pricePerSqft > 0 && (
                <div style={{ fontSize: '13px', color: 'var(--gd-text-muted)', marginBottom: '16px' }}>
                  ₹{Math.round(property.pricePerSqft).toLocaleString()} per sq.ft • All-inclusive indicative
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                <button
                  type="button"
                  className="gd-btn-search"
                  onClick={() => setIsInquiryModalOpen(true)}
                  style={{ width: '100%', justifyContent: 'center', height: '46px', fontSize: '14.5px' }}
                >
                  <Phone size={16} />
                  <span>Schedule Visit / Inquire</span>
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => onToggleSave(property)}
                    style={{
                      height: '40px',
                      borderRadius: 'var(--gd-radius-md)',
                      border: '1px solid var(--gd-warm-border)',
                      background: 'var(--gd-warm-bg)',
                      color: isSaved ? '#ef4444' : 'var(--gd-text-charcoal)',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Heart size={16} fill={isSaved ? '#ef4444' : 'none'} color={isSaved ? '#ef4444' : 'currentColor'} />
                    <span>{isSaved ? 'Saved' : 'Save'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCompare}
                    style={{
                      height: '40px',
                      borderRadius: 'var(--gd-radius-md)',
                      border: '1px solid var(--gd-warm-border)',
                      background: 'var(--gd-warm-bg)',
                      color: 'var(--gd-text-charcoal)',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Scale size={16} />
                    <span>Compare</span>
                  </button>
                </div>
              </div>

              {/* EMI Calculator Teaser */}
              <div style={{ background: 'var(--gd-warm-bg)', border: '1px solid var(--gd-warm-border)', borderRadius: '8px', padding: '12px', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--gd-text-slate)', fontWeight: 600 }}>Estimated Home Loan EMI</span>
                  <Link to="/tools/emi-calculator" style={{ color: 'var(--gd-terra-600)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Calculator size={13} />
                    Customize
                  </Link>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gd-text-charcoal)' }}>
                  ₹{emiAmount.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--gd-text-muted)' }}>/ month @ 8.5% for 20 yrs</span>
                </div>
              </div>
            </div>

            {/* AST-XGB Dedicated AI Valuation Card */}
            <AstXgbValuationCard property={property} />

            {/* Seller / Attribution Card */}
            <div
              style={{
                backgroundColor: 'var(--gd-warm-card)',
                border: '1px solid var(--gd-warm-border)',
                borderRadius: 'var(--gd-radius-lg)',
                padding: '20px',
                boxShadow: 'var(--gd-shadow-sm)',
              }}
            >
              <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--gd-text-charcoal)' }}>
                Listing Representative
              </h4>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--gd-terra-50)', color: 'var(--gd-terra-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                  {property.sellerType[0]}
                </div>
                <div>
                  <strong style={{ fontSize: '13.5px', color: 'var(--gd-text-charcoal)', display: 'block' }}>
                    {property.sellerLabel}
                  </strong>
                  <span style={{ fontSize: '12px', color: 'var(--gd-text-muted)' }}>
                    Type: {property.sellerType} • Benchmark Verified
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--gd-text-slate)', lineHeight: 1.5 }}>
                Authentic structural and geospatial parameters verified against local municipal records for machine learning evaluation.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Primary Action Area (< 768px) */}
      <div className="gd-mobile-action-bar">
        <div>
          <div style={{ fontSize: '17px', fontWeight: 900, color: 'var(--gd-text-charcoal)', fontFamily: 'JetBrains Mono, monospace' }}>
            {property.priceFormatted}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--gd-text-muted)' }}>
            {property.specs.bhk > 0 ? `${property.specs.bhk} BHK • ` : ''}{property.specs.builtupAreaSqft} sq.ft
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => onToggleSave(property)}
            className="gd-icon-btn"
            style={{ width: '38px', height: '38px' }}
            title="Save property"
          >
            <Heart size={16} fill={isSaved ? '#ef4444' : 'none'} color={isSaved ? '#ef4444' : 'currentColor'} />
          </button>

          <button
            type="button"
            onClick={() => setIsInquiryModalOpen(true)}
            className="gd-btn-search"
            style={{ height: '38px', padding: '0 16px', fontSize: '13px' }}
          >
            Inquire Now
          </button>
        </div>
      </div>
    </div>
  );
};
