import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Building2,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Sparkles,
  ArrowRight,
  Phone,
  Mail,
  Share2,
  HelpCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { DEMO_PROJECTS } from '../data/demoProjects';
import { DEMO_LISTINGS } from '../data/demoListings';
import { ProjectEntity } from '../types/project';
import { PropertyCard } from '../components/listing/PropertyCard';
import { PropertyListing } from '../types/property';

interface ProjectDetailPageProps {
  savedIds: string[];
  onToggleSave: (property: PropertyListing) => void;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  savedIds,
  onToggleSave,
}) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectEntity | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [inquirySent, setInquirySent] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ name: '', phone: '', email: '', preferredBhk: '3 BHK' });

  useEffect(() => {
    const found = DEMO_PROJECTS.find((p) => p.slug === slug || p.id === slug);
    if (found) {
      setProject(found);
      setSelectedImage(found.coverImage);
      document.title = `${found.name} by ${found.developer} in ${found.locality}, ${found.city} | GharDhundo`;
    } else {
      setProject(null);
    }
  }, [slug]);

  if (!project) {
    return (
      <div className="gd-container" style={{ padding: '80px 20px', textAlign: 'center', minHeight: '60vh' }}>
        <Building2 size={48} color="var(--gd-text-muted)" style={{ margin: '0 auto 16px auto' }} />
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Project Not Found</h2>
        <p style={{ color: 'var(--gd-text-muted)', fontSize: '15px', maxWidth: '480px', margin: '0 auto 24px auto' }}>
          The requested development project does not exist or may have been unlisted.
        </p>
        <Link to="/new-projects" className="gd-btn gd-btn-primary">
          Browse All New Projects
        </Link>
      </div>
    );
  }

  // Find units or similar listings in the same city/locality
  const relatedUnits = DEMO_LISTINGS.filter(
    (l) => l.location.city.toLowerCase() === project.city.toLowerCase() &&
           l.location.locality.toLowerCase() === project.locality.toLowerCase()
  );

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.name || !inquiryForm.phone) return;
    setInquirySent(true);
  };

  return (
    <div className="gd-project-detail-page" style={{ paddingBottom: '80px' }}>
      {/* 1. Breadcrumbs */}
      <div style={{ backgroundColor: 'var(--gd-surface-elevated)', borderBottom: '1px solid var(--gd-border)', padding: '12px 0' }}>
        <div className="gd-container">
          <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--gd-text-muted)' }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
            <ChevronRight size={14} />
            <Link to="/new-projects" style={{ color: 'inherit', textDecoration: 'none' }}>New Projects</Link>
            <ChevronRight size={14} />
            <Link to={`/search?city=${encodeURIComponent(project.city)}`} style={{ color: 'inherit', textDecoration: 'none' }}>{project.city}</Link>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--gd-text-primary)', fontWeight: 600 }}>{project.name}</span>
          </nav>
        </div>
      </div>

      <div className="gd-container" style={{ marginTop: '28px' }}>
        {/* 2. Top Header Section */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span
                style={{
                  backgroundColor: project.status === 'Ready to Move' ? '#10b981' : '#f59e0b',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '11.5px',
                  padding: '4px 10px',
                  borderRadius: '4px',
                }}
              >
                {project.status}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--gd-text-muted)' }}>
                By <strong>{project.developer}</strong>
              </span>
              <span style={{ fontSize: '11px', backgroundColor: 'var(--gd-surface-elevated)', border: '1px solid var(--gd-border)', padding: '2px 8px', borderRadius: '4px', color: 'var(--gd-text-muted)' }}>
                Launched {project.launchYear}
              </span>
            </div>

            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--gd-text-primary)' }}>
              {project.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gd-text-muted)', fontSize: '14px' }}>
              <MapPin size={15} color="var(--gd-terra-500)" />
              <span>{project.address}</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--gd-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Indicative Price Range
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--gd-terra-600)' }}>
              {project.priceRangeFormatted}
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--gd-text-muted)', marginTop: '2px' }}>
              Configurations: {project.bhkTypes.join(', ')}
            </div>
          </div>
        </div>

        {/* 3. Image Gallery */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '32px' }}>
          <div style={{ height: '420px', borderRadius: 'var(--gd-radius-md)', overflow: 'hidden', backgroundColor: '#000' }}>
            <img
              src={selectedImage}
              alt={project.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {project.images.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedImage(img)}
                style={{
                  height: '130px',
                  borderRadius: 'var(--gd-radius-md)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: selectedImage === img ? '2px solid var(--gd-terra-500)' : '2px solid transparent',
                  opacity: selectedImage === img ? 1 : 0.8,
                  transition: 'opacity 0.2s ease',
                }}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>

        {/* 4. RERA Regulatory Disclosure Box */}
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--gd-radius-md)',
            backgroundColor: 'var(--gd-surface-elevated)',
            border: '1px solid var(--gd-border)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            marginBottom: '36px',
          }}
        >
          <ShieldCheck size={22} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--gd-text-primary)' }}>
              Regulatory &amp; RERA Verification Status
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--gd-text-muted)', margin: '0 0 6px 0', lineHeight: 1.5 }}>
              {project.reraStatus}
            </p>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              Policy Notice: We do not fabricate builder registration numbers or completion certificates. Always confirm registration filings on the respective state RERA authority portal before financial commitments.
            </span>
          </div>
        </div>

        {/* 5. Main Content Grid: Details vs Side Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '36px' }}>
          {/* Left Column: Details & Configurations */}
          <div>
            {/* Overview */}
            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Project Overview</h2>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--gd-text-secondary)' }}>
                {project.overview}
              </p>
            </section>

            {/* Key Highlights */}
            <section style={{ marginBottom: '36px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '14px' }}>Development Highlights</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {project.highlights.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px' }}>
                    <CheckCircle2 size={16} color="var(--gd-terra-500)" style={{ flexShrink: 0 }} />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Unit Configuration Matrix */}
            <section style={{ marginBottom: '36px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '14px' }}>
                Available Configurations &amp; Floor Areas
              </h3>
              <div style={{ overflowX: 'auto', border: '1px solid var(--gd-border)', borderRadius: 'var(--gd-radius-md)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--gd-surface-elevated)', textAlign: 'left', borderBottom: '1px solid var(--gd-border)' }}>
                      <th style={{ padding: '12px 16px' }}>Unit Type</th>
                      <th style={{ padding: '12px 16px' }}>Carpet Area</th>
                      <th style={{ padding: '12px 16px' }}>Super Built-up</th>
                      <th style={{ padding: '12px 16px' }}>Starting Price</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.configurations.map((cfg, idx) => (
                      <tr key={idx} style={{ borderBottom: idx < project.configurations.length - 1 ? '1px solid var(--gd-border)' : 'none' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{cfg.bhk}</td>
                        <td style={{ padding: '12px 16px' }}>{cfg.carpetAreaSqft} sqft</td>
                        <td style={{ padding: '12px 16px' }}>{cfg.builtupAreaSqft} sqft</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--gd-terra-600)' }}>{cfg.priceFormatted}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <Link
                            to={`/ai-valuation?city=${encodeURIComponent(project.city)}&locality=${encodeURIComponent(project.locality)}&area=${cfg.builtupAreaSqft}&bhk=${cfg.bhk.charAt(0)}`}
                            className="gd-btn gd-btn-outline"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                          >
                            AI Valuation
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Verified Amenities */}
            <section style={{ marginBottom: '36px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '14px' }}>Verified Amenities &amp; Facilities</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {project.amenities.map((amenity, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--gd-radius-md)',
                      backgroundColor: 'var(--gd-surface-elevated)',
                      border: '1px solid var(--gd-border)',
                      fontSize: '13px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <CheckCircle2 size={14} color="#10b981" />
                    <span>{amenity}</span>
                  </span>
                ))}
              </div>
            </section>

            {/* AST-XGB Valuation Intelligence Gateway */}
            <section
              style={{
                padding: '24px',
                borderRadius: 'var(--gd-radius-md)',
                background: 'linear-gradient(135deg, rgba(235, 94, 40, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
                border: '1px solid rgba(235, 94, 40, 0.2)',
                marginBottom: '36px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Sparkles size={18} color="var(--gd-terra-500)" />
                <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                  Estimate Fair Market Worth with AST-XGB
                </h4>
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--gd-text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                Evaluate unit pricing in <strong>{project.name}</strong> using our 7-model multi-ensemble algorithm, calibrated with conformal uncertainty intervals and macro regime indicators for {project.locality}.
              </p>
              <Link
                to={`/ai-valuation?city=${encodeURIComponent(project.city)}&locality=${encodeURIComponent(project.locality)}&bhk=3&area=1650`}
                className="gd-btn gd-btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <span>Launch Valuation Studio</span>
                <ArrowRight size={15} />
              </Link>
            </section>

            {/* Units Listed in this Locality */}
            {relatedUnits.length > 0 && (
              <section>
                <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '14px' }}>
                  Available Units in {project.locality}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  {relatedUnits.map((u) => (
                    <PropertyCard
                      key={u.id}
                      property={u}
                      isSaved={savedIds.includes(u.id)}
                      onToggleSave={onToggleSave}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Project Facts & Direct Inquiry Panel */}
          <div>
            <div style={{ position: 'sticky', top: '88px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Project Quick Facts Card */}
              <div style={{ backgroundColor: 'var(--gd-surface-elevated)', padding: '22px', borderRadius: 'var(--gd-radius-md)', border: '1px solid var(--gd-border)' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Project Specifications</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--gd-border)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--gd-text-muted)' }}>Status:</span>
                    <strong style={{ color: project.status === 'Ready to Move' ? '#10b981' : '#f59e0b' }}>{project.status}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--gd-border)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--gd-text-muted)' }}>Possession:</span>
                    <strong>{project.possessionDate}</strong>
                  </div>
                  {project.totalAcres && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--gd-border)', paddingBottom: '8px' }}>
                      <span style={{ color: 'var(--gd-text-muted)' }}>Total Land Area:</span>
                      <strong>{project.totalAcres} Acres</strong>
                    </div>
                  )}
                  {project.totalTowers && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--gd-border)', paddingBottom: '8px' }}>
                      <span style={{ color: 'var(--gd-text-muted)' }}>Total Towers:</span>
                      <strong>{project.totalTowers} Towers</strong>
                    </div>
                  )}
                  {project.totalUnits && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--gd-border)', paddingBottom: '8px' }}>
                      <span style={{ color: 'var(--gd-text-muted)' }}>Total Units:</span>
                      <strong>{project.totalUnits} Residences</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gd-text-muted)' }}>Locality Insights:</span>
                    <Link to={`/market-insights?city=${encodeURIComponent(project.city)}&locality=${encodeURIComponent(project.locality)}`} style={{ color: 'var(--gd-terra-600)', textDecoration: 'none', fontWeight: 600 }}>
                      View Trends →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Developer Inquiry Form */}
              <div style={{ backgroundColor: 'var(--gd-surface-elevated)', padding: '22px', borderRadius: 'var(--gd-radius-md)', border: '1px solid var(--gd-border)' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>Connect with Developer</h4>
                <p style={{ fontSize: '12.5px', color: 'var(--gd-text-muted)', marginBottom: '16px' }}>
                  Request official project brochure, floor plans, and site visit scheduling.
                </p>

                {inquirySent ? (
                  <div style={{ padding: '16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '8px', textAlign: 'center' }}>
                    <CheckCircle2 size={28} color="#10b981" style={{ margin: '0 auto 8px auto' }} />
                    <strong style={{ display: 'block', fontSize: '14px', color: '#10b981' }}>Inquiry Received</strong>
                    <span style={{ fontSize: '12px', color: 'var(--gd-text-secondary)' }}>
                      Our advisory team will share verified documentation shortly.
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <input
                        type="text"
                        placeholder="Your Full Name"
                        required
                        value={inquiryForm.name}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                        className="gd-input"
                        style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        placeholder="Mobile Number (+91)"
                        required
                        value={inquiryForm.phone}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                        className="gd-input"
                        style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <select
                        value={inquiryForm.preferredBhk}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, preferredBhk: e.target.value })}
                        className="gd-select"
                        style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
                      >
                        {project.bhkTypes.map((bhk) => (
                          <option key={bhk} value={bhk}>Interested in {bhk}</option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" className="gd-btn gd-btn-primary" style={{ width: '100%', padding: '10px', fontSize: '13.5px', marginTop: '4px' }}>
                      Request Brochure &amp; Floor Plans
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
