import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import {
  ChevronRight,
  Filter,
  Search,
  Sparkles,
  Building2,
  MapPin,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { CATEGORY_DEFINITIONS, CategoryDefinition } from '../data/categoryDefinitions';
import { DEMO_PROJECTS } from '../data/demoProjects';
import { DEMO_LISTINGS } from '../data/demoListings';
import { searchListings, ListingsAdapterResponse } from '../services/listingsAdapter';
import { PropertyCard } from '../components/listing/PropertyCard';
import { ProjectCard } from '../components/listing/ProjectCard';
import { PropertyListing, PropertySearchQuery, SortOption } from '../types/property';
import { ProjectEntity } from '../types/project';

interface DiscoveryCategoryPageProps {
  categoryId?: string;
  savedIds: string[];
  onToggleSave: (property: PropertyListing) => void;
}

export const DiscoveryCategoryPage: React.FC<DiscoveryCategoryPageProps> = ({
  categoryId: propCategoryId,
  savedIds,
  onToggleSave,
}) => {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Resolve category configuration
  const activeCategoryId = propCategoryId || categorySlug || 'new-projects';
  const categoryDef: CategoryDefinition = useMemo(() => {
    return CATEGORY_DEFINITIONS[activeCategoryId] || CATEGORY_DEFINITIONS['new-projects'];
  }, [activeCategoryId]);

  // Update SEO title on mount or category change
  useEffect(() => {
    document.title = categoryDef.seoTitle;
  }, [categoryDef]);

  // City and BHK quick filters
  const selectedCity = searchParams.get('city') || 'All Cities';
  const selectedBhk = searchParams.get('bhk') ? searchParams.get('bhk')!.split(',').map(Number) : [];
  const selectedSort = (searchParams.get('sort') as SortOption) || 'relevance';
  const currentPage = searchParams.get('page') ? Number(searchParams.get('page')) : 1;

  // View mode for project category ('projects' vs 'units')
  const [projectTab, setProjectTab] = useState<'projects' | 'units'>('projects');

  // Listings state for property categories
  const [listingsData, setListingsData] = useState<ListingsAdapterResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Compute query for searchListings
  const effectiveQuery: PropertySearchQuery = useMemo(() => {
    const base = { ...categoryDef.filterDefaults };
    if (selectedCity !== 'All Cities') {
      base.city = selectedCity;
    }
    if (selectedBhk.length > 0) {
      base.bhk = selectedBhk;
    }
    base.sortBy = selectedSort;
    base.page = currentPage;
    base.pageSize = 6;
    return base as PropertySearchQuery;
  }, [categoryDef, selectedCity, selectedBhk, selectedSort, currentPage]);

  // Fetch listings for non-project views or unit tabs
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    searchListings(effectiveQuery)
      .then((res) => {
        if (!isCancelled) {
          setListingsData(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [effectiveQuery]);

  // Filter projects if category is projects
  const filteredProjects: ProjectEntity[] = useMemo(() => {
    if (!categoryDef.isProjectCategory) return [];
    return DEMO_PROJECTS.filter((proj) => {
      if (selectedCity !== 'All Cities' && proj.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      if (selectedBhk.length > 0) {
        const matchesBhk = selectedBhk.some((b) => proj.bhkTypes.some((bt) => bt.includes(`${b} BHK`)));
        if (!matchesBhk) return false;
      }
      return true;
    });
  }, [categoryDef, selectedCity, selectedBhk]);

  // Suggested Alternatives if zero results match
  const suggestedAlternatives: PropertyListing[] = useMemo(() => {
    if (listingsData && listingsData.total > 0) return [];
    // Suggest high-quality demo listings
    if (selectedCity !== 'All Cities') {
      const cityMatches = DEMO_LISTINGS.filter((l) => l.location.city.toLowerCase() === selectedCity.toLowerCase());
      if (cityMatches.length > 0) return cityMatches.slice(0, 3);
    }
    return DEMO_LISTINGS.slice(0, 3);
  }, [listingsData, selectedCity]);

  // Handler for updating search parameters
  const updateFilterParam = (key: string, val: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!val || val === 'All Cities' || val === 'all') {
      next.delete(key);
    } else {
      next.set(key, val);
    }
    next.delete('page'); // Reset to page 1 on filter change
    setSearchParams(next);
  };

  const handleToggleBhk = (bhkVal: number) => {
    let nextBhk = [...selectedBhk];
    if (nextBhk.includes(bhkVal)) {
      nextBhk = nextBhk.filter((b) => b !== bhkVal);
    } else {
      nextBhk.push(bhkVal);
    }
    updateFilterParam('bhk', nextBhk.length > 0 ? nextBhk.join(',') : null);
  };

  const handleResetFilters = () => {
    const next = new URLSearchParams();
    setSearchParams(next);
  };

  return (
    <div className="gd-discovery-category-page" style={{ minHeight: '80vh', paddingBottom: '60px' }}>
      {/* 1. Breadcrumb Bar */}
      <div style={{ backgroundColor: 'var(--gd-surface-elevated)', borderBottom: '1px solid var(--gd-border)', padding: '12px 0' }}>
        <div className="gd-container">
          <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--gd-text-muted)' }}>
            {categoryDef.breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {crumb.path ? (
                  <Link to={crumb.path} style={{ color: 'inherit', textDecoration: 'none' }} className="hover:underline">
                    {crumb.label}
                  </Link>
                ) : (
                  <span style={{ color: 'var(--gd-text-primary)', fontWeight: 600 }}>{crumb.label}</span>
                )}
                {idx < categoryDef.breadcrumbs.length - 1 && <ChevronRight size={14} />}
              </React.Fragment>
            ))}
          </nav>
        </div>
      </div>

      {/* 2. Hero Header Section */}
      <section style={{ backgroundColor: 'var(--gd-surface)', padding: '36px 0 28px 0', borderBottom: '1px solid var(--gd-border)' }}>
        <div className="gd-container">
          <div style={{ maxWidth: '850px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--gd-terra-50)', color: 'var(--gd-terra-600)', border: '1px solid var(--gd-terra-200)', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, marginBottom: '14px' }}>
              <ShieldCheck size={14} />
              <span>{categoryDef.badge}</span>
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 10px 0', color: 'var(--gd-text-primary)', letterSpacing: '-0.5px' }}>
              {categoryDef.headline}
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--gd-text-muted)', lineHeight: 1.6, margin: 0 }}>
              {categoryDef.subheadline}
            </p>
          </div>

          {/* Quick Filters Toolbar */}
          <div style={{ marginTop: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', backgroundColor: 'var(--gd-surface-elevated)', padding: '14px 18px', borderRadius: 'var(--gd-radius-md)', border: '1px solid var(--gd-border)' }}>
            {/* City Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={15} color="var(--gd-terra-500)" />
              <select
                value={selectedCity}
                onChange={(e) => updateFilterParam('city', e.target.value)}
                className="gd-select"
                style={{ padding: '6px 12px', fontSize: '13.5px', borderRadius: '6px', minWidth: '150px' }}
                aria-label="Filter by city"
              >
                <option value="All Cities">All Metros (7 Cities)</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi">Delhi NCR</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Pune">Pune</option>
                <option value="Chennai">Chennai</option>
                <option value="Kolkata">Kolkata</option>
              </select>
            </div>

            {/* BHK Filter Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--gd-text-muted)', marginLeft: '8px' }}>BHK:</span>
              {[1, 2, 3, 4].map((bhkNum) => (
                <button
                  key={bhkNum}
                  type="button"
                  onClick={() => handleToggleBhk(bhkNum)}
                  className={`gd-bhk-pill ${selectedBhk.includes(bhkNum) ? 'active' : ''}`}
                  style={{ padding: '4px 12px', fontSize: '12.5px' }}
                >
                  {bhkNum} BHK
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12.5px', color: 'var(--gd-text-muted)' }}>Sort by:</span>
              <select
                value={selectedSort}
                onChange={(e) => updateFilterParam('sort', e.target.value)}
                className="gd-select"
                style={{ padding: '6px 10px', fontSize: '13px', borderRadius: '6px' }}
                aria-label="Sort options"
              >
                <option value="relevance">Relevance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="area_desc">Built-up Area: High to Low</option>
                <option value="newest">Newly Listed</option>
              </select>

              {(selectedCity !== 'All Cities' || selectedBhk.length > 0 || selectedSort !== 'relevance') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="gd-btn gd-btn-outline"
                  style={{ padding: '6px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  title="Reset all filters"
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Discovery Feed Area */}
      <div className="gd-container" style={{ marginTop: '32px' }}>
        {/* If Project Category: Render Project Tabs & Content */}
        {categoryDef.isProjectCategory ? (
          <div>
            {/* View Selector (Projects vs Unit Listings) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setProjectTab('projects')}
                  className={`gd-bhk-pill ${projectTab === 'projects' ? 'active' : ''}`}
                  style={{ padding: '8px 16px', fontSize: '13.5px' }}
                >
                  <Building2 size={14} style={{ marginRight: '6px', verticalAlign: '-2px' }} />
                  Master Developments ({filteredProjects.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProjectTab('units')}
                  className={`gd-bhk-pill ${projectTab === 'units' ? 'active' : ''}`}
                  style={{ padding: '8px 16px', fontSize: '13.5px' }}
                >
                  Individual Units for Sale ({listingsData?.total || 0})
                </button>
              </div>

              <div style={{ fontSize: '13px', color: 'var(--gd-text-muted)' }}>
                Showing <strong>{projectTab === 'projects' ? filteredProjects.length : listingsData?.items.length || 0}</strong> verified results
              </div>
            </div>

            {projectTab === 'projects' ? (
              filteredProjects.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
                  {filteredProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <div className="gd-empty-state" style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--gd-surface)', borderRadius: 'var(--gd-radius-md)', border: '1px solid var(--gd-border)' }}>
                  <Building2 size={44} color="var(--gd-text-muted)" style={{ margin: '0 auto 16px auto' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No Master Developments Found in {selectedCity}</h3>
                  <p style={{ color: 'var(--gd-text-muted)', fontSize: '14px', maxWidth: '480px', margin: '0 auto 20px auto' }}>
                    We do not fabricate unverified real estate projects. Try switching the city filter or reset your BHK selection.
                  </p>
                  <button type="button" onClick={handleResetFilters} className="gd-btn gd-btn-primary">
                    View All Indian Projects
                  </button>
                </div>
              )
            ) : (
              /* Units Tab */
              loading ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>Loading matching units...</div>
              ) : listingsData && listingsData.items.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                  {listingsData.items.map((item) => (
                    <PropertyCard
                      key={item.id}
                      property={item}
                      isSaved={savedIds.includes(item.id)}
                      onToggleSave={onToggleSave}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>No individual units matching these parameters.</div>
              )
            )}
          </div>
        ) : (
          /* Standard Category Feed (Ready to Move, Luxury, Budget Bands, etc.) */
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--gd-text-primary)' }}>
                {selectedCity !== 'All Cities' ? `${categoryDef.title} in ${selectedCity}` : categoryDef.title}
              </h2>
              <span style={{ fontSize: '13px', color: 'var(--gd-text-muted)' }}>
                Showing <strong>{listingsData?.items.length || 0}</strong> of <strong>{listingsData?.total || 0}</strong> properties
              </span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--gd-text-muted)' }}>
                Searching curated property records...
              </div>
            ) : listingsData && listingsData.items.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                {listingsData.items.map((item) => (
                  <PropertyCard
                    key={item.id}
                    property={item}
                    isSaved={savedIds.includes(item.id)}
                    onToggleSave={onToggleSave}
                  />
                ))}
              </div>
            ) : (
              /* Empty State with Suggested Alternatives */
              <div style={{ backgroundColor: 'var(--gd-surface)', padding: '40px', borderRadius: 'var(--gd-radius-md)', border: '1px solid var(--gd-border)' }}>
                <div style={{ textAlign: 'center', maxWidth: '520px', margin: '0 auto 36px auto' }}>
                  <AlertCircle size={40} color="var(--gd-terra-500)" style={{ margin: '0 auto 12px auto' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                    No Direct Matches in this Category
                  </h3>
                  <p style={{ color: 'var(--gd-text-muted)', fontSize: '14px', lineHeight: 1.5 }}>
                    We uphold strict data authenticity standards and do not synthesize phantom property records. 
                    Try loosening your budget filters, or browse suggested alternatives below:
                  </p>
                  <button type="button" onClick={handleResetFilters} className="gd-btn gd-btn-outline" style={{ marginTop: '12px' }}>
                    Reset Filters
                  </button>
                </div>

                {/* Suggested Alternatives Section */}
                {suggestedAlternatives.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderTop: '1px solid var(--gd-border)', paddingTop: '24px' }}>
                      <Sparkles size={16} color="var(--gd-terra-500)" />
                      <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>
                        Suggested Alternative Properties You May Consider
                      </h4>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                      {suggestedAlternatives.map((alt) => (
                        <PropertyCard
                          key={alt.id}
                          property={alt}
                          isSaved={savedIds.includes(alt.id)}
                          onToggleSave={onToggleSave}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. Related Collections & Cross-Navigation Links */}
        <section style={{ marginTop: '56px', paddingTop: '32px', borderTop: '1px solid var(--gd-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {/* Related Collections */}
            <div style={{ backgroundColor: 'var(--gd-surface-elevated)', padding: '24px', borderRadius: 'var(--gd-radius-md)', border: '1px solid var(--gd-border)' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} color="var(--gd-terra-500)" />
                <span>Related Categories & Collections</span>
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {categoryDef.relatedCategories.map((rel) => (
                  <li key={rel.path}>
                    <Link to={rel.path} style={{ textDecoration: 'none', color: 'inherit' }} className="hover:text-terra">
                      <strong style={{ fontSize: '13.5px', color: 'var(--gd-terra-600)' }}>{rel.label}</strong>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--gd-text-muted)' }}>{rel.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Locality Intelligence */}
            <div style={{ backgroundColor: 'var(--gd-surface-elevated)', padding: '24px', borderRadius: 'var(--gd-radius-md)', border: '1px solid var(--gd-border)' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} color="#8b5cf6" />
                <span>Explore Locality Pricing Intelligence</span>
              </h4>
              <p style={{ fontSize: '12.5px', color: 'var(--gd-text-muted)', marginBottom: '12px' }}>
                Inspect AST-XGB price per square foot distributions, historical appreciation trends, and macro factors:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {categoryDef.recommendedLocalities.map((loc) => (
                  <Link
                    key={`${loc.city}-${loc.locality}`}
                    to={`/market-insights?city=${encodeURIComponent(loc.city)}&locality=${encodeURIComponent(loc.locality)}`}
                    className="gd-bhk-pill"
                    style={{ fontSize: '12.5px', padding: '6px 12px', textDecoration: 'none' }}
                  >
                    {loc.locality}, {loc.city} →
                  </Link>
                ))}
              </div>
            </div>

            {/* Financial Planning Gateway */}
            <div style={{ backgroundColor: 'var(--gd-surface-elevated)', padding: '24px', borderRadius: 'var(--gd-radius-md)', border: '1px solid var(--gd-border)' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="#10b981" />
                <span>Financial Advice & AI Tools</span>
              </h4>
              <p style={{ fontSize: '12.5px', color: 'var(--gd-text-muted)', marginBottom: '12px' }}>
                Calculate your purchasing power, monthly loan EMI, and verify fair valuation with AST-XGB:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link to="/tools/emi-calculator" style={{ fontSize: '13px', color: 'var(--gd-terra-600)', textDecoration: 'none' }}>
                  → Home Loan EMI Calculator
                </Link>
                <Link to="/tools/eligibility" style={{ fontSize: '13px', color: 'var(--gd-terra-600)', textDecoration: 'none' }}>
                  → FOIR Loan Eligibility Estimator
                </Link>
                <Link to="/ai-valuation" style={{ fontSize: '13px', color: 'var(--gd-terra-600)', textDecoration: 'none' }}>
                  → AST-XGB AI Valuation Studio
                </Link>
              </div>
            </div>
          </div>

          {/* Benchmark Attribution Notice */}
          <div style={{ marginTop: '32px', padding: '14px 18px', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 'var(--gd-radius-md)', border: '1px solid var(--gd-border)', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--gd-text-muted)' }}>
            <HelpCircle size={18} style={{ flexShrink: 0 }} />
            <span>
              <strong>Data Authenticity Commitment:</strong> All properties and development master projects listed on this platform represent calibrated benchmark records from the AST-XGB Machine Learning Model Repository. No fabricated developer endorsements, fictional RERA registrations, or phantom inventories are presented.
            </span>
          </div>
        </section>
      </div>
    </div>
  );
};
