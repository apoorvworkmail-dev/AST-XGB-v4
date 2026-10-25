import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  MapPin,
  TrendingUp,
  Sparkles,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { DEMO_LISTINGS } from '../data/demoListings';
import { DEMO_PROJECTS } from '../data/demoProjects';
import { PropertyCard } from '../components/listing/PropertyCard';
import { ProjectCard } from '../components/listing/ProjectCard';
import { PropertyListing } from '../types/property';

interface CityHubPageProps {
  savedIds: string[];
  onToggleSave: (property: PropertyListing) => void;
}

const CITY_METADATA: Record<string, {
  name: string;
  tagline: string;
  description: string;
  avgRate: string;
  annualAppreciation: string;
  popularLocalities: string[];
  primaryDrivers: string[];
}> = {
  Bengaluru: {
    name: 'Bengaluru',
    tagline: 'India\'s Silicon Valley & Global Tech Capital',
    description: 'Driven by an expansive technology ecosystem, multinational GCCs, and high-income tech demographics, Bengaluru exhibits strong capital growth along Outer Ring Road, Whitefield, and North Bengaluru airport corridor.',
    avgRate: '₹ 7,172 / sqft',
    annualAppreciation: '+8.4% YoY',
    popularLocalities: ['Whitefield', 'Koramangala', 'Rajajinagar', 'Bellandur'],
    primaryDrivers: ['Purple & Blue Metro Line Expansion', 'Major GCC Hubs', 'Aerospace Park Devanahalli'],
  },
  Mumbai: {
    name: 'Mumbai',
    tagline: 'India\'s Premier Financial & Commercial Megacity',
    description: 'Characterized by high land values and substantial infrastructure upgrades including the Mumbai Trans Harbour Link (Atal Setu), Coastal Road, and Metro Line 3, Mumbai commands India\'s highest capital values.',
    avgRate: '₹ 14,828 / sqft',
    annualAppreciation: '+6.2% YoY',
    popularLocalities: ['Andheri East', 'Bandra West', 'Powai'],
    primaryDrivers: ['Coastal Road Corridor', 'Atal Setu (MTHL)', 'BKC Commercial Node Expansion'],
  },
  Delhi: {
    name: 'Delhi NCR',
    tagline: 'The National Capital Region & Administrative Center',
    description: 'Encompassing key micro-markets across Dwarka, Vasant Kunj, Rohini, and connecting expressway belts, Delhi NCR offers mature freehold residential pockets alongside high-capacity metro links.',
    avgRate: '₹ 10,207 / sqft',
    annualAppreciation: '+7.1% YoY',
    popularLocalities: ['Dwarka', 'Vasant Kunj', 'Rohini'],
    primaryDrivers: ['Dwarka Expressway Corridor', 'Blue & Magenta Metro Lines', 'Freehold DDA Communities'],
  },
  Hyderabad: {
    name: 'Hyderabad',
    tagline: 'High-Growth Tech Corridor & Infrastructure Benchmark',
    description: 'Supported by pro-business infrastructure, the Nehru Outer Ring Road, and massive tech campuses in HITEC City and Gachibowli, Hyderabad is one of India\'s fastest appreciating housing markets.',
    avgRate: '₹ 6,759 / sqft',
    annualAppreciation: '+10.5% YoY',
    popularLocalities: ['Gachibowli', 'Kondapur'],
    primaryDrivers: ['Financial District Expansion', 'Airport Metro Express Link', 'Robust ORR Connectivity'],
  },
  Pune: {
    name: 'Pune',
    tagline: 'Automobile, Engineering & Software Innovation Hub',
    description: 'An attractive destination for manufacturing and software professionals, Pune features thriving residential micro-markets in Wakad, Hinjewadi, and Baner with favorable rental yields.',
    avgRate: '₹ 6,120 / sqft',
    annualAppreciation: '+7.8% YoY',
    popularLocalities: ['Wakad', 'Baner'],
    primaryDrivers: ['Pune Metro Line 3 (Hinjewadi-Shivajinagar)', 'Hinjewadi IT Parks', 'Mumbai-Pune Expressway'],
  },
  Chennai: {
    name: 'Chennai',
    tagline: 'Heritage Coastal Metro & Manufacturing Epicenter',
    description: 'Known for industrial stability, educational infrastructure, and a booming IT corridor along Old Mahabalipuram Road (OMR), Chennai offers steady residential demand with strong end-user absorption.',
    avgRate: '₹ 7,450 / sqft',
    annualAppreciation: '+5.5% YoY',
    popularLocalities: ['Adayar', 'Velachery'],
    primaryDrivers: ['OMR Phase 2 IT Expressway', 'Chennai Metro Phase 2', 'Automotive Corridors'],
  },
  Kolkata: {
    name: 'Kolkata',
    tagline: 'Eastern India\'s Cultural & Technology Commercial Hub',
    description: 'Led by smart city expansion in New Town Action Areas and Sector 5 Salt Lake, Kolkata provides value-driven residential opportunities with expanding metro and social amenities.',
    avgRate: '₹ 5,945 / sqft',
    annualAppreciation: '+5.1% YoY',
    popularLocalities: ['New Town', 'Salt Lake'],
    primaryDrivers: ['East-West Metro Line 2', 'Eco Park Smart Township', 'Financial Hub New Town'],
  },
};

export const CityHubPage: React.FC<CityHubPageProps> = ({ savedIds, onToggleSave }) => {
  const { cityName } = useParams<{ cityName?: string }>();
  const [searchParams] = useSearchParams();

  // Normalize city
  const activeCityKey = useMemo(() => {
    if (!cityName) return null;
    const match = Object.keys(CITY_METADATA).find(
      (k) => k.toLowerCase() === cityName.toLowerCase() || (cityName.toLowerCase().includes('delhi') && k === 'Delhi')
    );
    return match || 'Bengaluru';
  }, [cityName]);

  const cityInfo = activeCityKey ? CITY_METADATA[activeCityKey] : null;

  useEffect(() => {
    if (cityInfo) {
      document.title = `${cityInfo.name} Real Estate, Property Prices & Trends | GharDhundo`;
    } else {
      document.title = 'Top Indian Metro Cities Real Estate Directory | GharDhundo';
    }
  }, [cityInfo]);

  // City properties and projects
  const cityProperties = useMemo(() => {
    if (!cityInfo) return [];
    return DEMO_LISTINGS.filter(
      (p) => p.location.city.toLowerCase() === cityInfo.name.toLowerCase() ||
             (cityInfo.name.includes('Delhi') && p.location.city.toLowerCase() === 'delhi')
    );
  }, [cityInfo]);

  const cityProjects = useMemo(() => {
    if (!cityInfo) return [];
    return DEMO_PROJECTS.filter(
      (p) => p.city.toLowerCase() === cityInfo.name.toLowerCase() ||
             (cityInfo.name.includes('Delhi') && p.city.toLowerCase() === 'delhi')
    );
  }, [cityInfo]);

  // If no specific city is selected: Display all 7 Metros directory
  if (!cityInfo) {
    return (
      <div className="gd-city-directory-page" style={{ minHeight: '80vh', paddingBottom: '60px' }}>
        <div style={{ backgroundColor: 'var(--gd-surface-elevated)', borderBottom: '1px solid var(--gd-border)', padding: '12px 0' }}>
          <div className="gd-container">
            <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--gd-text-muted)' }}>
              <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
              <ChevronRight size={14} />
              <span style={{ color: 'var(--gd-text-primary)', fontWeight: 600 }}>Explore Metros</span>
            </nav>
          </div>
        </div>

        <section style={{ backgroundColor: 'var(--gd-surface)', padding: '40px 0', borderBottom: '1px solid var(--gd-border)' }}>
          <div className="gd-container">
            <div style={{ maxWidth: '800px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--gd-terra-50)', color: 'var(--gd-terra-600)', border: '1px solid var(--gd-terra-200)', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, marginBottom: '14px' }}>
                <Building2 size={14} />
                <span>India&apos;s 7 Leading Real Estate Hubs</span>
              </div>
              <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--gd-text-primary)' }}>
                Metropolitan Real Estate Markets
              </h1>
              <p style={{ fontSize: '15px', color: 'var(--gd-text-muted)', lineHeight: 1.6, margin: 0 }}>
                Explore comprehensive pricing benchmarks, verified development projects, and AST-XGB market valuation trends across India&apos;s seven primary metropolitan centers.
              </p>
            </div>
          </div>
        </section>

        <div className="gd-container" style={{ marginTop: '36px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {Object.entries(CITY_METADATA).map(([key, meta]) => (
              <div
                key={key}
                style={{
                  backgroundColor: 'var(--gd-surface-elevated)',
                  borderRadius: 'var(--gd-radius-md)',
                  border: '1px solid var(--gd-border)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{meta.name}</h3>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                    {meta.annualAppreciation}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--gd-terra-600)', fontWeight: 600, marginBottom: '8px' }}>
                  {meta.tagline}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--gd-text-muted)', lineHeight: 1.5, marginBottom: '16px', flex: 1 }}>
                  {meta.description}
                </p>
                <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: 'var(--gd-surface)', border: '1px solid var(--gd-border)', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--gd-text-muted)' }}>Average Benchmark Rate</div>
                  <strong style={{ fontSize: '16px', color: 'var(--gd-text-primary)' }}>{meta.avgRate}</strong>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                  <Link
                    to={`/city/${encodeURIComponent(meta.name)}`}
                    className="gd-btn gd-btn-primary"
                    style={{ flex: 1, textAlign: 'center', padding: '8px', fontSize: '13px' }}
                  >
                    Explore {meta.name}
                  </Link>
                  <Link
                    to={`/market-insights?city=${encodeURIComponent(meta.name)}`}
                    className="gd-btn gd-btn-outline"
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                    title="View Market Intelligence"
                  >
                    Insights
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Specific City Page View
  return (
    <div className="gd-city-hub-page" style={{ minHeight: '80vh', paddingBottom: '60px' }}>
      {/* 1. Breadcrumbs */}
      <div style={{ backgroundColor: 'var(--gd-surface-elevated)', borderBottom: '1px solid var(--gd-border)', padding: '12px 0' }}>
        <div className="gd-container">
          <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--gd-text-muted)' }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
            <ChevronRight size={14} />
            <Link to="/cities" style={{ color: 'inherit', textDecoration: 'none' }}>Cities</Link>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--gd-text-primary)', fontWeight: 600 }}>{cityInfo.name}</span>
          </nav>
        </div>
      </div>

      {/* 2. City Hero Banner */}
      <section style={{ backgroundColor: 'var(--gd-surface)', padding: '36px 0', borderBottom: '1px solid var(--gd-border)' }}>
        <div className="gd-container">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
            <div style={{ maxWidth: '750px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--gd-terra-50)', color: 'var(--gd-terra-600)', border: '1px solid var(--gd-terra-200)', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, marginBottom: '12px' }}>
                <Building2 size={14} />
                <span>Metro Property Hub</span>
              </div>
              <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--gd-text-primary)' }}>
                {cityInfo.name} Real Estate &amp; Housing Market
              </h1>
              <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gd-terra-600)', margin: '0 0 12px 0' }}>
                {cityInfo.tagline}
              </p>
              <p style={{ fontSize: '14.5px', color: 'var(--gd-text-muted)', lineHeight: 1.6, margin: 0 }}>
                {cityInfo.description}
              </p>
            </div>

            {/* Benchmark Rate & Stats Box */}
            <div style={{ backgroundColor: 'var(--gd-surface-elevated)', padding: '20px 24px', borderRadius: 'var(--gd-radius-md)', border: '1px solid var(--gd-border)', minWidth: '240px' }}>
              <div style={{ fontSize: '12px', color: 'var(--gd-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Benchmark Price Rate
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gd-terra-600)', marginTop: '4px' }}>
                {cityInfo.avgRate}
              </div>
              <div style={{ fontSize: '12.5px', color: '#10b981', fontWeight: 600, marginTop: '2px' }}>
                {cityInfo.annualAppreciation} Annual Trend
              </div>
              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--gd-border)' }}>
                <Link
                  to={`/market-insights?city=${encodeURIComponent(cityInfo.name)}`}
                  className="gd-btn gd-btn-outline"
                  style={{ width: '100%', textAlign: 'center', padding: '6px 10px', fontSize: '12.5px' }}
                >
                  View Market Analytics →
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Category Jump Pills for this City */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '24px' }}>
            <Link to={`/collection/ready-to-move?city=${encodeURIComponent(cityInfo.name)}`} className="gd-bhk-pill" style={{ textDecoration: 'none', fontSize: '12.5px' }}>
              Ready to Move in {cityInfo.name}
            </Link>
            <Link to={`/new-projects?city=${encodeURIComponent(cityInfo.name)}`} className="gd-bhk-pill" style={{ textDecoration: 'none', fontSize: '12.5px' }}>
              New Projects in {cityInfo.name}
            </Link>
            <Link to={`/budget/50-lakhs-to-1-5-cr?city=${encodeURIComponent(cityInfo.name)}`} className="gd-bhk-pill" style={{ textDecoration: 'none', fontSize: '12.5px' }}>
              Homes ₹50L - ₹1.5 Cr
            </Link>
            <Link to={`/collection/premium-luxury?city=${encodeURIComponent(cityInfo.name)}`} className="gd-bhk-pill" style={{ textDecoration: 'none', fontSize: '12.5px' }}>
              Luxury Living
            </Link>
            <Link to={`/commercial?city=${encodeURIComponent(cityInfo.name)}`} className="gd-bhk-pill" style={{ textDecoration: 'none', fontSize: '12.5px' }}>
              Commercial Office
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Popular Localities & Projects */}
      <div className="gd-container" style={{ marginTop: '36px' }}>
        {/* Popular Localities Section */}
        <section style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                Top Localities in {cityInfo.name}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--gd-text-muted)', margin: '4px 0 0 0' }}>
                Inspect AST-XGB valuation distributions and verified listings by locality.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {cityInfo.popularLocalities.map((loc) => (
              <div
                key={loc}
                style={{
                  backgroundColor: 'var(--gd-surface-elevated)',
                  padding: '16px',
                  borderRadius: 'var(--gd-radius-md)',
                  border: '1px solid var(--gd-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <MapPin size={15} color="var(--gd-terra-500)" />
                  <strong style={{ fontSize: '14.5px' }}>{loc}</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', marginTop: '10px' }}>
                  <Link
                    to={`/search?city=${encodeURIComponent(cityInfo.name)}&locality=${encodeURIComponent(loc)}`}
                    style={{ color: 'var(--gd-terra-600)', textDecoration: 'none' }}
                  >
                    Browse Listings →
                  </Link>
                  <Link
                    to={`/market-insights?city=${encodeURIComponent(cityInfo.name)}&locality=${encodeURIComponent(loc)}`}
                    style={{ color: 'var(--gd-text-muted)', textDecoration: 'none' }}
                  >
                    Locality Trends →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Master Projects in this City */}
        {cityProjects.length > 0 && (
          <section style={{ marginBottom: '44px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                Featured Projects in {cityInfo.name} ({cityProjects.length})
              </h2>
              <Link to={`/new-projects?city=${encodeURIComponent(cityInfo.name)}`} className="gd-section-link" style={{ fontSize: '13px' }}>
                <span>View All Projects</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
              {cityProjects.map((proj) => (
                <ProjectCard key={proj.id} project={proj} />
              ))}
            </div>
          </section>
        )}

        {/* Active Property Listings in this City */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
              Curated Property Listings in {cityInfo.name} ({cityProperties.length})
            </h2>
            <Link to={`/search?city=${encodeURIComponent(cityInfo.name)}`} className="gd-section-link" style={{ fontSize: '13px' }}>
              <span>View All in Search</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            {cityProperties.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                isSaved={savedIds.includes(p.id)}
                onToggleSave={onToggleSave}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
