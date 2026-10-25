import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate, useParams } from 'react-router-dom';
import {
  TrendingUp,
  MapPin,
  Building,
  Activity,
  Layers,
  ShieldCheck,
  Wind,
  BarChart2,
  Calendar,
  Search,
  ExternalLink,
  ChevronRight,
  Info,
  Sliders,
  DollarSign,
  PieChart,
  Scale,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Clock,
  Database,
  Plus,
  X,
} from 'lucide-react';
import {
  fetchMarketCities,
  fetchCityLocalities,
  fetchLocalityDetails,
  fetchMarketTrends,
  fetchLocalityComparison,
  CitySummary,
  LocalitySummaryItem,
  LocalityDetail,
  MarketTrendsData,
} from '../services/marketService';

const POPULAR_LOCALITIES_BY_CITY: Record<string, string[]> = {
  'Bengaluru': ['Whitefield', 'Electronic City', 'Indiranagar', 'HSR Layout', 'Koramangala', 'Jp Nagar'],
  'Mumbai': ['Andheri East', 'Mira Road East', 'Bandra West', 'Powai', 'Borivali West', 'Thane West'],
  'Delhi NCR': ['Dwarka', 'Rohini', 'Greater Kailash', 'Saket', 'Vasant Kunj', 'Janakpuri'],
  'Hyderabad': ['Gachibowli', 'Hitec City', 'Kondapur', 'Madhapur', 'Banjara Hills', 'Kukatpally'],
  'Pune': ['Hadapsar', 'Wakad', 'Hinjewadi', 'Kothrud', 'Baner', 'Pimpri'],
  'Chennai': ['Velachery', 'Anna Nagar', 'Adyar', 'OMR', 'Porur', 'Thiruvanmiyur'],
  'Kolkata': ['New Town', 'Salt Lake', 'Rajarhat', 'Ballygunge', 'Dum Dum', 'Behala'],
};

export const LocalityMarketInsightsPage: React.FC = () => {
  const { city: pathCity, locality: pathLocality } = useParams<{ city?: string; locality?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Selected State
  const initialCity = pathCity || searchParams.get('city') || 'Bengaluru';
  const initialLocality = pathLocality || searchParams.get('locality') || 'Whitefield';

  const [selectedCity, setSelectedCity] = useState<string>(initialCity);
  const [selectedLocality, setSelectedLocality] = useState<string>(initialLocality);

  // Data State
  const [cities, setCities] = useState<CitySummary[]>([]);
  const [localitiesList, setLocalitiesList] = useState<LocalitySummaryItem[]>([]);
  const [localityDetail, setLocalityDetail] = useState<LocalityDetail | null>(null);
  const [marketTrends, setMarketTrends] = useState<MarketTrendsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingLocalities, setLoadingLocalities] = useState<boolean>(false);

  // Search Filter in Locality Dropdown
  const [localitySearch, setLocalitySearch] = useState<string>('');
  const [isLocalityDropdownOpen, setIsLocalityDropdownOpen] = useState<boolean>(false);

  // Interactive Chart Controls
  const [trendMetric, setTrendMetric] = useState<'hpi_market' | 'carpet_area_rate_inr' | 'yoy_growth_market'>('hpi_market');
  const [trendRange, setTrendRange] = useState<'1Y' | '3Y' | '5Y' | 'ALL'>('ALL');
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  // Locality Comparison Mode
  const [comparisonLocalities, setComparisonLocalities] = useState<string[]>([]);
  const [comparisonDetails, setComparisonDetails] = useState<LocalityDetail[]>([]);
  const [loadingComparison, setLoadingComparison] = useState<boolean>(false);
  const [compareSelectorOpen, setCompareSelectorOpen] = useState<boolean>(false);

  // Synchronize state with URL path or query parameters
  useEffect(() => {
    const urlCity = pathCity || searchParams.get('city');
    const urlLoc = pathLocality || searchParams.get('locality');
    if (urlCity && urlCity !== selectedCity) {
      setSelectedCity(urlCity);
    }
    if (urlLoc && urlLoc !== selectedLocality) {
      setSelectedLocality(urlLoc);
    }
  }, [pathCity, pathLocality, searchParams]);

  // Load Cities on Mount
  useEffect(() => {
    const loadCities = async () => {
      const data = await fetchMarketCities();
      if (data && data.length > 0) {
        setCities(data);
      }
    };
    loadCities();
  }, []);

  // When selectedCity changes, fetch localities and market trends
  useEffect(() => {
    const loadCityData = async () => {
      setLoadingLocalities(true);
      const locs = await fetchCityLocalities(selectedCity);
      setLocalitiesList(locs);
      setLoadingLocalities(false);

      // Verify selected locality belongs to this city, else pick top one
      const exists = locs.some(
        (l) => l.locality.toLowerCase() === selectedLocality.toLowerCase()
      );
      if (!exists && locs.length > 0) {
        const defaultLoc = locs[0].locality;
        setSelectedLocality(defaultLoc);
        setSearchParams({ city: selectedCity, locality: defaultLoc });
      }

      // Fetch city trends
      const trends = await fetchMarketTrends(selectedCity);
      setMarketTrends(trends);
    };

    loadCityData();
  }, [selectedCity]);

  // When selectedLocality or selectedCity changes, fetch locality details
  useEffect(() => {
    if (!selectedLocality) return;
    const loadDetails = async () => {
      setLoading(true);
      const details = await fetchLocalityDetails(selectedCity, selectedLocality);
      setLocalityDetail(details);
      setLoading(false);
    };
    loadDetails();
  }, [selectedCity, selectedLocality]);

  // Handle City Change
  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    const popularLocs = POPULAR_LOCALITIES_BY_CITY[city] || [];
    const newLoc = popularLocs.length > 0 ? popularLocs[0] : '';
    setSelectedLocality(newLoc);
    setSearchParams({ city, locality: newLoc });
    setComparisonLocalities([]);
    setComparisonDetails([]);
  };

  // Handle Locality Change
  const handleLocalitySelect = (locality: string) => {
    setSelectedLocality(locality);
    setIsLocalityDropdownOpen(false);
    setLocalitySearch('');
    setSearchParams({ city: selectedCity, locality });
  };

  // Filtered Localities for Autocomplete
  const filteredLocalities = useMemo(() => {
    if (!localitySearch.trim()) return localitiesList.slice(0, 40);
    return localitiesList
      .filter((l) => l.locality.toLowerCase().includes(localitySearch.toLowerCase()))
      .slice(0, 40);
  }, [localitiesList, localitySearch]);

  // Filtered Trend Series based on selected time range
  const filteredTrendSeries = useMemo(() => {
    if (!marketTrends || !marketTrends.nhb_series) return [];
    const series = marketTrends.nhb_series;
    if (trendRange === '1Y') return series.slice(-4);
    if (trendRange === '3Y') return series.slice(-12);
    if (trendRange === '5Y') return series.slice(-20);
    return series; // ALL 33 quarters
  }, [marketTrends, trendRange]);

  // Fetch Comparison when comparisonLocalities changes
  useEffect(() => {
    if (comparisonLocalities.length === 0) {
      setComparisonDetails([]);
      return;
    }
    const loadComp = async () => {
      setLoadingComparison(true);
      // Include current locality + comparison localities
      const allLocs = [selectedLocality, ...comparisonLocalities];
      const data = await fetchLocalityComparison(selectedCity, allLocs);
      setComparisonDetails(data);
      setLoadingComparison(false);
    };
    loadComp();
  }, [comparisonLocalities, selectedLocality, selectedCity]);

  // Add locality to comparison
  const handleAddComparison = (locName: string) => {
    if (comparisonLocalities.includes(locName) || locName === selectedLocality) return;
    if (comparisonLocalities.length >= 3) {
      alert('You can compare up to 4 localities simultaneously.');
      return;
    }
    setComparisonLocalities([...comparisonLocalities, locName]);
    setCompareSelectorOpen(false);
  };

  // Remove locality from comparison
  const handleRemoveComparison = (locName: string) => {
    setComparisonLocalities(comparisonLocalities.filter((l) => l !== locName));
  };

  // Compute SVG chart coordinates
  const chartPoints = useMemo(() => {
    if (filteredTrendSeries.length === 0) return [];
    const values = filteredTrendSeries.map((d: any) => d[trendMetric]);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const padding = (maxVal - minVal) * 0.1 || 10;
    const yMin = Math.max(0, minVal - padding);
    const yMax = maxVal + padding;

    const width = 800;
    const height = 280;
    const padX = 40;
    const padY = 30;

    return filteredTrendSeries.map((d: any, idx: number) => {
      const x = padX + (idx / (filteredTrendSeries.length - 1 || 1)) * (width - 2 * padX);
      const y = height - padY - ((d[trendMetric] - yMin) / (yMax - yMin || 1)) * (height - 2 * padY);
      return {
        ...d,
        x,
        y,
        val: d[trendMetric],
      };
    });
  }, [filteredTrendSeries, trendMetric]);

  const pathD = useMemo(() => {
    if (chartPoints.length === 0) return '';
    return chartPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
  }, [chartPoints]);

  const areaD = useMemo(() => {
    if (chartPoints.length === 0) return '';
    const firstX = chartPoints[0].x;
    const lastX = chartPoints[chartPoints.length - 1].x;
    return `${pathD} L ${lastX} 250 L ${firstX} 250 Z`;
  }, [chartPoints, pathD]);

  const metricLabel =
    trendMetric === 'hpi_market'
      ? 'NHB Housing Price Index (HPI)'
      : trendMetric === 'carpet_area_rate_inr'
      ? 'Carpet Area Rate (₹ / sq ft)'
      : 'Year-over-Year Growth Rate (%)';

  const formatTrendValue = (val: number) => {
    if (trendMetric === 'carpet_area_rate_inr') return `₹ ${Math.round(val).toLocaleString()} / sq.ft`;
    if (trendMetric === 'yoy_growth_market') return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
    return val.toFixed(1);
  };

  return (
    <div className="gd-market-insights-page" style={{ padding: '32px 0 64px 0', minHeight: '85vh' }}>
      <div className="gd-container">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumbs" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--gd-text-muted)', marginBottom: '16px' }}>
          <Link to="/" style={{ color: 'var(--gd-text-muted)', textDecoration: 'none' }}>Home</Link>
          <ChevronRight size={14} />
          <Link to="/market-insights" style={{ color: 'var(--gd-text-muted)', textDecoration: 'none' }}>Market Insights</Link>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--gd-terra-600)', fontWeight: 600 }}>{selectedCity}</span>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--gd-text-primary)', fontWeight: 700 }}>{selectedLocality}</span>
        </nav>

        {/* Page Header */}
        <header style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span className="gd-badge" style={{ background: 'var(--gd-terra-100)', color: 'var(--gd-terra-700)', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                  <TrendingUp size={14} /> AST-XGB Market Intelligence
                </span>
                <span className="gd-badge" style={{ background: 'var(--gd-surface-elevated)', color: 'var(--gd-text-muted)' }}>
                  Verified Empirical Datasets
                </span>
              </div>
              <h1 style={{ fontSize: '30px', fontWeight: 800, margin: '4px 0 8px 0', letterSpacing: '-0.02em', color: 'var(--gd-text-primary)' }}>
                {selectedLocality}, {selectedCity} Real Estate Insights
              </h1>
              <p style={{ margin: 0, color: 'var(--gd-text-muted)', fontSize: '15px', maxWidth: '820px' }}>
                Empirical price distributions, historical NHB RESIDEX trends, macroeconomic benchmarks, and environmental indicators grounded in verified non-leaked data.
              </p>
            </div>

            {/* Quick Action Handoffs */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link
                to={`/search?city=${encodeURIComponent(selectedCity)}&locality=${encodeURIComponent(selectedLocality)}`}
                className="gd-btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}
              >
                <Search size={16} />
                <span>Search {selectedLocality} Listings</span>
              </Link>
              <Link
                to={`/ai-valuation?city=${encodeURIComponent(selectedCity)}&locality=${encodeURIComponent(selectedLocality)}`}
                className="gd-btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '13px' }}
              >
                <Sparkles size={16} />
                <span>Value a Property Here</span>
              </Link>
            </div>
          </div>
        </header>

        {/* 1. CITY AND LOCALITY SELECTOR */}
        <div className="gd-card" style={{ padding: '20px 24px', marginBottom: '28px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-subtle)', borderRadius: '16px' }}>
          {/* City Tabs */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gd-text-muted)', marginBottom: '10px' }}>
              Select Metropolitan City:
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata'].map((city) => {
                const isSelected = selectedCity.toLowerCase() === city.toLowerCase() || (city === 'Delhi NCR' && selectedCity.toLowerCase() === 'delhi');
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleCitySelect(city)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      border: isSelected ? '1px solid var(--gd-terra-500)' : '1px solid var(--gd-border-subtle)',
                      background: isSelected ? 'var(--gd-terra-500)' : 'var(--gd-surface-elevated)',
                      color: isSelected ? '#ffffff' : 'var(--gd-text-primary)',
                      transition: 'all 0.15s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Building size={14} opacity={isSelected ? 1 : 0.6} />
                    <span>{city}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Locality Selector with Autocomplete & Popular Chips */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gd-text-muted)' }}>
                Select Locality in {selectedCity}:
              </label>
              <span style={{ fontSize: '12px', color: 'var(--gd-text-muted)' }}>
                {localitiesList.length} verified localities available
              </span>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Autocomplete Input Container */}
              <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--gd-border-color)',
                    background: 'var(--gd-surface-elevated)',
                  }}
                >
                  <MapPin size={16} color="var(--gd-terra-500)" />
                  <input
                    type="text"
                    placeholder="Search locality..."
                    value={isLocalityDropdownOpen ? localitySearch : selectedLocality}
                    onFocus={() => {
                      setIsLocalityDropdownOpen(true);
                      setLocalitySearch('');
                    }}
                    onChange={(e) => setLocalitySearch(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '14px',
                      fontWeight: 600,
                      width: '100%',
                      color: 'var(--gd-text-primary)',
                    }}
                  />
                </div>

                {/* Dropdown Menu */}
                {isLocalityDropdownOpen && (
                  <div
                    className="gd-autocomplete-menu"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      maxHeight: '260px',
                      overflowY: 'auto',
                      zIndex: 100,
                      marginTop: '6px',
                      borderRadius: '12px',
                      border: '1px solid var(--gd-border-color)',
                      background: 'var(--gd-surface-card)',
                      boxShadow: 'var(--gd-shadow-lg)',
                      padding: '6px',
                    }}
                  >
                    {filteredLocalities.length === 0 ? (
                      <div style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: 'var(--gd-text-muted)' }}>
                        No locality match found in {selectedCity}
                      </div>
                    ) : (
                      filteredLocalities.map((item) => (
                        <button
                          key={item.locality}
                          type="button"
                          onClick={() => handleLocalitySelect(item.locality)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: item.locality === selectedLocality ? 'var(--gd-terra-100)' : 'transparent',
                            color: item.locality === selectedLocality ? 'var(--gd-terra-800)' : 'var(--gd-text-primary)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '13px',
                          }}
                        >
                          <span style={{ fontWeight: item.locality === selectedLocality ? 700 : 500 }}>
                            {item.locality}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--gd-text-muted)', background: 'var(--gd-surface-elevated)', padding: '2px 6px', borderRadius: '4px' }}>
                            N = {item.sample_size}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Popular Localities Chips */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--gd-text-muted)', fontWeight: 600 }}>Popular:</span>
                {(POPULAR_LOCALITIES_BY_CITY[selectedCity] || []).map((loc) => {
                  const isCurrent = loc.toLowerCase() === selectedLocality.toLowerCase();
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => handleLocalitySelect(loc)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: isCurrent ? 700 : 500,
                        border: isCurrent ? '1px solid var(--gd-terra-500)' : '1px solid var(--gd-border-subtle)',
                        background: isCurrent ? 'var(--gd-terra-50)' : 'var(--gd-surface-elevated)',
                        color: isCurrent ? 'var(--gd-terra-700)' : 'var(--gd-text-primary)',
                        cursor: 'pointer',
                      }}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <RefreshCw size={32} className="spin" color="var(--gd-terra-500)" style={{ margin: '0 auto 16px auto', display: 'block' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0' }}>Loading {selectedLocality} Empirical Statistics...</h3>
            <p style={{ margin: 0, color: 'var(--gd-text-muted)', fontSize: '13px' }}>Aggregating non-leaked property transactions, NHB RESIDEX trends and macro indices</p>
          </div>
        )}

        {!loading && localityDetail && (
          <>
            {/* 2. LOCALITY OVERVIEW KPI STATS */}
            <section style={{ marginBottom: '32px' }} aria-labelledby="locality-overview-heading">
              <h2 id="locality-overview-heading" style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="var(--gd-terra-500)" />
                <span>Locality Overview & Price Indicators</span>
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                {/* Median Asking Price */}
                <div className="gd-card" style={{ padding: '20px', borderRadius: '14px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gd-text-muted)', textTransform: 'uppercase' }}>
                      Median Asking Price
                    </span>
                    <DollarSign size={18} color="var(--gd-terra-500)" />
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gd-terra-600)', marginBottom: '6px' }}>
                    {localityDetail.price_stats.median_formatted}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gd-text-muted)' }}>
                    Avg: {localityDetail.price_stats.mean_formatted} • Range: {localityDetail.price_stats.min_formatted} – {localityDetail.price_stats.max_formatted}
                  </div>
                </div>

                {/* Median Price Per Sq Ft */}
                <div className="gd-card" style={{ padding: '20px', borderRadius: '14px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gd-text-muted)', textTransform: 'uppercase' }}>
                      Rate per Sq.Ft (PPSF)
                    </span>
                    <BarChart2 size={18} color="#3b82f6" />
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gd-text-primary)', marginBottom: '6px' }}>
                    ₹ {Math.round(localityDetail.ppsf_stats.median_ppsf).toLocaleString()}
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--gd-text-muted)' }}> / sq ft</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gd-text-muted)' }}>
                    IQR: ₹ {Math.round(localityDetail.ppsf_stats.p25_ppsf).toLocaleString()} – ₹ {Math.round(localityDetail.ppsf_stats.p75_ppsf).toLocaleString()}
                  </div>
                </div>

                {/* Dataset Sample Size */}
                <div className="gd-card" style={{ padding: '20px', borderRadius: '14px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gd-text-muted)', textTransform: 'uppercase' }}>
                      Observed Sample Size
                    </span>
                    <Database size={18} color="#8b5cf6" />
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gd-text-primary)', marginBottom: '6px' }}>
                    {localityDetail.sample_size}
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--gd-text-muted)' }}> listings</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gd-text-muted)' }}>
                    Non-leaked cross-sectional observations
                  </div>
                </div>

                {/* CPCB Air Quality */}
                <div className="gd-card" style={{ padding: '20px', borderRadius: '14px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gd-text-muted)', textTransform: 'uppercase' }}>
                      CPCB Air Quality (AQI)
                    </span>
                    <Wind size={18} color={localityDetail.environment.aqi <= 100 ? '#10b981' : '#f59e0b'} />
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: localityDetail.environment.aqi <= 100 ? '#10b981' : '#f59e0b', marginBottom: '6px' }}>
                    {localityDetail.environment.aqi} AQI
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gd-text-muted)' }}>
                    Rating: <strong>{localityDetail.environment.aqi_rating}</strong> (PM2.5: {localityDetail.environment.pm25} µg/m³)
                  </div>
                </div>

                {/* RERA Compliance Rate */}
                <div className="gd-card" style={{ padding: '20px', borderRadius: '14px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gd-text-muted)', textTransform: 'uppercase' }}>
                      RERA Registration
                    </span>
                    <ShieldCheck size={18} color="#10b981" />
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gd-text-primary)', marginBottom: '6px' }}>
                    {localityDetail.regulatory.rera_registered_pct}%
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gd-text-muted)' }}>
                    Status: <strong>{localityDetail.regulatory.compliance_status}</strong>
                  </div>
                </div>

                {/* NHB HPI Growth Benchmark */}
                <div className="gd-card" style={{ padding: '20px', borderRadius: '14px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gd-text-muted)', textTransform: 'uppercase' }}>
                      NHB RESIDEX Growth
                    </span>
                    <TrendingUp size={18} color="#10b981" />
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginBottom: '6px' }}>
                    +{localityDetail.macro.nhb_yoy_growth_pct}%
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gd-text-muted)' }}>
                    City HPI: {localityDetail.macro.nhb_hpi_market} ({localityDetail.macro.active_regime} Regime)
                  </div>
                </div>
              </div>
            </section>

            {/* 3. HISTORICAL RATE-TREND CHART (NHB RESIDEX) */}
            <section style={{ marginBottom: '32px' }} aria-labelledby="historical-trends-heading">
              <div className="gd-card" style={{ padding: '24px', borderRadius: '16px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)' }}>
                {/* Header with Title & Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <TrendingUp size={20} color="var(--gd-terra-500)" />
                      <h2 id="historical-trends-heading" style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--gd-text-primary)' }}>
                        Historical Housing Rate Trends — {selectedCity}
                      </h2>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--gd-text-muted)' }}>
                      Observed quarterly housing price index and carpet rates published by National Housing Bank (NHB RESIDEX, Base 2017-18=100).
                    </p>
                  </div>

                  {/* Chart Metric & Timeline Toggles */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Metric Selector */}
                    <div style={{ display: 'flex', background: 'var(--gd-surface-elevated)', padding: '4px', borderRadius: '8px', border: '1px solid var(--gd-border-subtle)' }}>
                      <button
                        type="button"
                        onClick={() => setTrendMetric('hpi_market')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: trendMetric === 'hpi_market' ? 700 : 500,
                          background: trendMetric === 'hpi_market' ? 'var(--gd-terra-500)' : 'transparent',
                          color: trendMetric === 'hpi_market' ? '#fff' : 'var(--gd-text-primary)',
                          cursor: 'pointer',
                        }}
                      >
                        HPI Index
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrendMetric('carpet_area_rate_inr')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: trendMetric === 'carpet_area_rate_inr' ? 700 : 500,
                          background: trendMetric === 'carpet_area_rate_inr' ? 'var(--gd-terra-500)' : 'transparent',
                          color: trendMetric === 'carpet_area_rate_inr' ? '#fff' : 'var(--gd-text-primary)',
                          cursor: 'pointer',
                        }}
                      >
                        Carpet Rate (₹/sqft)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrendMetric('yoy_growth_market')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: trendMetric === 'yoy_growth_market' ? 700 : 500,
                          background: trendMetric === 'yoy_growth_market' ? 'var(--gd-terra-500)' : 'transparent',
                          color: trendMetric === 'yoy_growth_market' ? '#fff' : 'var(--gd-text-primary)',
                          cursor: 'pointer',
                        }}
                      >
                        YoY Growth %
                      </button>
                    </div>

                    {/* Timeline Range */}
                    <div style={{ display: 'flex', background: 'var(--gd-surface-elevated)', padding: '4px', borderRadius: '8px', border: '1px solid var(--gd-border-subtle)' }}>
                      {(['1Y', '3Y', '5Y', 'ALL'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setTrendRange(r)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: trendRange === r ? 700 : 500,
                            background: trendRange === r ? 'var(--gd-surface-card)' : 'transparent',
                            color: trendRange === r ? 'var(--gd-terra-600)' : 'var(--gd-text-muted)',
                            boxShadow: trendRange === r ? 'var(--gd-shadow-sm)' : 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SVG Chart */}
                <div style={{ position: 'relative', width: '100%', height: '300px', background: 'var(--gd-surface-elevated)', borderRadius: '12px', padding: '16px', overflow: 'hidden' }}>
                  <svg
                    viewBox="0 0 800 280"
                    style={{ width: '100%', height: '100%', overflow: 'visible' }}
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--gd-terra-500)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="var(--gd-terra-500)" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    {[50, 100, 150, 200, 250].map((y) => (
                      <line
                        key={y}
                        x1="30"
                        y1={y}
                        x2="770"
                        y2={y}
                        stroke="var(--gd-border-subtle)"
                        strokeDasharray="4 4"
                      />
                    ))}

                    {/* Area under curve */}
                    {areaD && <path d={areaD} fill="url(#trendGradient)" />}

                    {/* Main Line */}
                    {pathD && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="var(--gd-terra-500)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Data Points */}
                    {chartPoints.map((pt: any, i: number) => {
                      const isHovered = hoveredPoint && hoveredPoint.quarter === pt.quarter;
                      return (
                        <g key={pt.quarter}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHovered ? 6 : chartPoints.length > 20 ? 3 : 4}
                            fill={isHovered ? '#ffffff' : 'var(--gd-terra-600)'}
                            stroke="var(--gd-terra-600)"
                            strokeWidth={isHovered ? 3 : 1}
                            style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                            onMouseEnter={() => setHoveredPoint(pt)}
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Interactive Tooltip Card */}
                  {hoveredPoint && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '20px',
                        right: '24px',
                        background: 'var(--gd-surface-card)',
                        border: '1px solid var(--gd-border-color)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        boxShadow: 'var(--gd-shadow-md)',
                        pointerEvents: 'none',
                        zIndex: 10,
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gd-text-muted)' }}>
                        {hoveredPoint.quarter} — {selectedCity}
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gd-terra-600)' }}>
                        {formatTrendValue(hoveredPoint.val)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--gd-text-secondary)', marginTop: '2px' }}>
                        YoY Growth: +{hoveredPoint.yoy_growth_market}% • QoQ: {hoveredPoint.qoq_growth_market}%
                      </div>
                    </div>
                  )}

                  {/* X-Axis Labels */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: 'var(--gd-text-muted)', padding: '0 12px' }}>
                    {filteredTrendSeries.length > 0 && (
                      <>
                        <span>{filteredTrendSeries[0].quarter}</span>
                        {filteredTrendSeries.length > 2 && (
                          <span>{filteredTrendSeries[Math.floor(filteredTrendSeries.length / 2)].quarter}</span>
                        )}
                        <span>{filteredTrendSeries[filteredTrendSeries.length - 1].quarter}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Ground Truth Label vs ML Distinction */}
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: 'var(--gd-text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} color="#10b981" />
                    <span><strong>Observed Empirical Data:</strong> Published by National Housing Bank. Excludes machine learning predictions.</span>
                  </div>
                  <div>
                    Last updated: <strong>{filteredTrendSeries.length > 0 ? filteredTrendSeries[filteredTrendSeries.length - 1].quarter : '2026-Q1'}</strong>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. PRICE PER SQUARE FOOT DISTRIBUTION & PROPERTY TYPE MIX */}
            <section style={{ marginBottom: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
                {/* PPSF Distribution Histogram */}
                <div className="gd-card" style={{ padding: '24px', borderRadius: '16px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <BarChart2 size={18} color="var(--gd-terra-500)" />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--gd-text-primary)' }}>
                      Price per Sq.Ft (PPSF) Distribution in {selectedLocality}
                    </h3>
                  </div>
                  <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--gd-text-muted)' }}>
                    Observed listing frequency across price-per-square-foot tiers (N = {localityDetail.sample_size}).
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {localityDetail.ppsf_histogram.map((bin) => {
                      const maxPct = Math.max(...localityDetail.ppsf_histogram.map((b) => b.pct)) || 1;
                      const barWidth = Math.max(8, (bin.pct / maxPct) * 100);
                      return (
                        <div key={bin.range} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--gd-text-primary)' }}>{bin.range}</span>
                            <span style={{ color: 'var(--gd-text-muted)' }}>
                              <strong>{bin.count}</strong> listings ({bin.pct}%)
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '10px', background: 'var(--gd-surface-elevated)', borderRadius: '5px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${barWidth}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, var(--gd-terra-400), var(--gd-terra-600))',
                                borderRadius: '5px',
                                transition: 'width 0.4s ease',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Property Type Breakdown & BHK Mix */}
                <div className="gd-card" style={{ padding: '24px', borderRadius: '16px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Building size={18} color="#3b82f6" />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--gd-text-primary)' }}>
                      Property Types & Unit Configurations
                    </h3>
                  </div>
                  <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--gd-text-muted)' }}>
                    Comparative rates across Apartments, Independent Houses, and Villas.
                  </p>

                  {/* Property Type Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left', marginBottom: '20px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--gd-border-color)', color: 'var(--gd-text-muted)' }}>
                        <th style={{ padding: '6px 8px' }}>Type</th>
                        <th style={{ padding: '6px 8px' }}>Share</th>
                        <th style={{ padding: '6px 8px' }}>Avg Price</th>
                        <th style={{ padding: '6px 8px' }}>Avg Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {localityDetail.property_types.map((pt) => (
                        <tr key={pt.type} style={{ borderBottom: '1px solid var(--gd-border-subtle)' }}>
                          <td style={{ padding: '8px', fontWeight: 600, color: 'var(--gd-text-primary)' }}>{pt.type}</td>
                          <td style={{ padding: '8px', color: 'var(--gd-text-muted)' }}>{pt.pct}% ({pt.count})</td>
                          <td style={{ padding: '8px', fontWeight: 700, color: 'var(--gd-terra-600)' }}>{pt.avg_price_formatted}</td>
                          <td style={{ padding: '8px', color: 'var(--gd-text-secondary)' }}>₹ {Math.round(pt.avg_ppsf).toLocaleString()}/sqft</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* BHK Mix Chips */}
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '8px' }}>
                      BHK Configuration Distribution:
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {localityDetail.bhk_breakdown.map((bhk) => (
                        <div
                          key={bhk.label}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            background: 'var(--gd-surface-elevated)',
                            border: '1px solid var(--gd-border-subtle)',
                            fontSize: '12px',
                          }}
                        >
                          <strong style={{ color: 'var(--gd-text-primary)' }}>{bhk.label}:</strong>{' '}
                          <span style={{ color: 'var(--gd-text-muted)' }}>{bhk.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. MACROECONOMIC & ENVIRONMENTAL CONTEXT */}
            <section style={{ marginBottom: '32px' }} aria-labelledby="macro-context-heading">
              <div className="gd-card" style={{ padding: '24px', borderRadius: '16px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Layers size={18} color="#8b5cf6" />
                  <h2 id="macro-context-heading" style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--gd-text-primary)' }}>
                    Macroeconomic Monetary & Environmental Context
                  </h2>
                </div>
                <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--gd-text-muted)' }}>
                  Empirical benchmarks from the Reserve Bank of India, MoSPI Inflation Series, and Central Pollution Control Board.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  {/* RBI Monetary Stance */}
                  <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--gd-surface-elevated)', border: '1px solid var(--gd-border-subtle)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gd-text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                      RBI Policy Corridor
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#3b82f6', marginBottom: '4px' }}>
                      {localityDetail.macro.rbi_repo_rate_pct.toFixed(2)}% Repo Rate
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gd-text-muted)', lineHeight: '1.5' }}>
                      Bank Rate: {localityDetail.macro.rbi_bank_rate_pct.toFixed(2)}% • CRR: {localityDetail.macro.rbi_crr_pct.toFixed(2)}% • SLR: {localityDetail.macro.rbi_slr_pct.toFixed(2)}%
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--gd-text-secondary)', marginTop: '8px' }}>
                      Source: RBI Monetary Policy Committee (MPC)
                    </div>
                  </div>

                  {/* MoSPI Inflation */}
                  <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--gd-surface-elevated)', border: '1px solid var(--gd-border-subtle)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gd-text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                      MoSPI Consumer Inflation
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--gd-text-primary)', marginBottom: '4px' }}>
                      +{localityDetail.macro.mospi_cpi_yoy_pct}% YoY CPI
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gd-text-muted)', lineHeight: '1.5' }}>
                      Headline CPI Index: {localityDetail.macro.mospi_cpi_index} (All-India urban/rural combined).
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--gd-text-secondary)', marginTop: '8px' }}>
                      Source: MoSPI National Statistical Office
                    </div>
                  </div>

                  {/* CPCB Air Quality Monitoring */}
                  <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--gd-surface-elevated)', border: '1px solid var(--gd-border-subtle)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gd-text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                      CPCB Ambient Air Quality
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: localityDetail.environment.aqi <= 100 ? '#10b981' : '#f59e0b', marginBottom: '4px' }}>
                      {localityDetail.environment.aqi} AQI ({localityDetail.environment.aqi_rating})
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gd-text-muted)', lineHeight: '1.5' }}>
                      30d Avg: {localityDetail.environment.aqi_30d_avg} • 90d Avg: {localityDetail.environment.aqi_90d_avg} • PM10: {localityDetail.environment.pm10} µg/m³
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--gd-text-secondary)', marginTop: '8px' }}>
                      Monitoring: {localityDetail.environment.station}
                    </div>
                  </div>
                </div>

                {/* Important Methodology Caveat */}
                <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Info size={18} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '12px', color: 'var(--gd-text-secondary)', lineHeight: '1.5' }}>
                    <strong>Econometric Disclosure:</strong> Macroeconomic indicators (RBI Repo Rates, MoSPI CPI, NHB HPI) describe the broader monetary, credit, and inflationary environment. They do not constitute direct deterministic or causal proof for an individual property’s specific price. Individual property valuations must consider spatial features, physical condition, layout, and building age.
                  </span>
                </div>
              </div>
            </section>

            {/* 6. LOCALITY-TO-LOCALITY COMPARISON */}
            <section style={{ marginBottom: '32px' }} aria-labelledby="locality-comparison-heading">
              <div className="gd-card" style={{ padding: '24px', borderRadius: '16px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Scale size={18} color="var(--gd-terra-500)" />
                      <h2 id="locality-comparison-heading" style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--gd-text-primary)' }}>
                        Locality-to-Locality Comparison
                      </h2>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--gd-text-muted)' }}>
                      Compare {selectedLocality} against other prime localities in {selectedCity} (up to 4 side-by-side).
                    </p>
                  </div>

                  {/* Add Comparison Selector */}
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => setCompareSelectorOpen(!compareSelectorOpen)}
                      className="gd-btn-secondary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Plus size={16} />
                      <span>Add Locality to Compare</span>
                    </button>

                    {compareSelectorOpen && (
                      <div
                        className="gd-autocomplete-menu"
                        style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          width: '260px',
                          maxHeight: '240px',
                          overflowY: 'auto',
                          background: 'var(--gd-surface-card)',
                          border: '1px solid var(--gd-border-color)',
                          borderRadius: '10px',
                          boxShadow: 'var(--gd-shadow-lg)',
                          padding: '6px',
                          zIndex: 100,
                          marginTop: '6px',
                        }}
                      >
                        {localitiesList
                          .filter((l) => l.locality !== selectedLocality && !comparisonLocalities.includes(l.locality))
                          .slice(0, 30)
                          .map((loc) => (
                            <button
                              key={loc.locality}
                              type="button"
                              onClick={() => handleAddComparison(loc.locality)}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '8px 10px',
                                border: 'none',
                                background: 'transparent',
                                borderRadius: '6px',
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                              }}
                            >
                              <span>{loc.locality}</span>
                              <span style={{ fontSize: '11px', color: 'var(--gd-text-muted)' }}>N={loc.sample_size}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Comparison Badges */}
                {comparisonLocalities.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--gd-text-muted)', display: 'inline-flex', alignItems: 'center' }}>
                      Comparing:
                    </span>
                    <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'var(--gd-terra-100)', color: 'var(--gd-terra-800)', fontSize: '12px', fontWeight: 700 }}>
                      {selectedLocality} (Primary)
                    </span>
                    {comparisonLocalities.map((loc) => (
                      <span
                        key={loc}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: 'var(--gd-surface-elevated)',
                          border: '1px solid var(--gd-border-color)',
                          fontSize: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>{loc}</span>
                        <X size={14} style={{ cursor: 'pointer' }} onClick={() => handleRemoveComparison(loc)} />
                      </span>
                    ))}
                  </div>
                )}

                {/* Comparison Matrix Table */}
                {comparisonDetails.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: 'var(--gd-surface-elevated)', borderBottom: '2px solid var(--gd-border-color)' }}>
                          <th style={{ padding: '12px' }}>Attribute</th>
                          {comparisonDetails.map((item, idx) => (
                            <th key={item.locality} style={{ padding: '12px', minWidth: '180px' }}>
                              <div style={{ fontWeight: 700, color: idx === 0 ? 'var(--gd-terra-600)' : 'var(--gd-text-primary)' }}>
                                {item.locality} {idx === 0 ? '(Current)' : ''}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--gd-text-muted)', fontWeight: 400 }}>
                                {item.city} • N = {item.sample_size}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid var(--gd-border-subtle)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--gd-text-muted)' }}>Median Price</td>
                          {comparisonDetails.map((item) => (
                            <td key={item.locality} style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--gd-terra-600)' }}>
                              {item.price_stats.median_formatted}
                            </td>
                          ))}
                        </tr>

                        <tr style={{ borderBottom: '1px solid var(--gd-border-subtle)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--gd-text-muted)' }}>Median Rate / Sq.Ft</td>
                          {comparisonDetails.map((item) => (
                            <td key={item.locality} style={{ padding: '10px 12px', fontWeight: 700 }}>
                              ₹ {Math.round(item.ppsf_stats.median_ppsf).toLocaleString()} / sq ft
                            </td>
                          ))}
                        </tr>

                        <tr style={{ borderBottom: '1px solid var(--gd-border-subtle)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--gd-text-muted)' }}>25th–75th IQR Rate</td>
                          {comparisonDetails.map((item) => (
                            <td key={item.locality} style={{ padding: '10px 12px', color: 'var(--gd-text-secondary)' }}>
                              ₹ {Math.round(item.ppsf_stats.p25_ppsf).toLocaleString()} – ₹ {Math.round(item.ppsf_stats.p75_ppsf).toLocaleString()}
                            </td>
                          ))}
                        </tr>

                        <tr style={{ borderBottom: '1px solid var(--gd-border-subtle)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--gd-text-muted)' }}>Top Property Type</td>
                          {comparisonDetails.map((item) => (
                            <td key={item.locality} style={{ padding: '10px 12px' }}>
                              {item.property_types.length > 0 ? `${item.property_types[0].type} (${item.property_types[0].pct}%)` : 'Not Disclosed'}
                            </td>
                          ))}
                        </tr>

                        <tr style={{ borderBottom: '1px solid var(--gd-border-subtle)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--gd-text-muted)' }}>RERA Registration</td>
                          {comparisonDetails.map((item) => (
                            <td key={item.locality} style={{ padding: '10px 12px' }}>
                              {item.regulatory.rera_registered_pct}% ({item.regulatory.compliance_status})
                            </td>
                          ))}
                        </tr>

                        <tr style={{ borderBottom: '1px solid var(--gd-border-subtle)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--gd-text-muted)' }}>Avg Metro Distance</td>
                          {comparisonDetails.map((item) => (
                            <td key={item.locality} style={{ padding: '10px 12px' }}>
                              {item.infrastructure.avg_metro_distance_km ? `${item.infrastructure.avg_metro_distance_km} km` : 'Not Disclosed'}
                            </td>
                          ))}
                        </tr>

                        <tr style={{ borderBottom: '1px solid var(--gd-border-subtle)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--gd-text-muted)' }}>CPCB Air Quality</td>
                          {comparisonDetails.map((item) => (
                            <td key={item.locality} style={{ padding: '10px 12px' }}>
                              {item.environment.aqi} AQI ({item.environment.aqi_rating})
                            </td>
                          ))}
                        </tr>

                        <tr>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--gd-text-muted)' }}>Actions</td>
                          {comparisonDetails.map((item) => (
                            <td key={item.locality} style={{ padding: '10px 12px' }}>
                              <Link
                                to={`/search?city=${encodeURIComponent(item.city)}&locality=${encodeURIComponent(item.locality)}`}
                                style={{ color: 'var(--gd-terra-600)', textDecoration: 'none', fontWeight: 600, fontSize: '12px' }}
                              >
                                View Listings →
                              </Link>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px', background: 'var(--gd-surface-elevated)', borderRadius: '10px' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--gd-text-muted)' }}>
                      Click <strong>"Add Locality to Compare"</strong> above to compare {selectedLocality} side-by-side with other neighborhoods.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* 7. DATA PROVENANCE, METHODOLOGY & UNITS DISCLOSURE */}
            <section aria-labelledby="provenance-heading">
              <div className="gd-card" style={{ padding: '24px', borderRadius: '16px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Database size={18} color="var(--gd-terra-500)" />
                  <h2 id="provenance-heading" style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--gd-text-primary)' }}>
                    Data Provenance, Units & Scientific Integrity Disclosures
                  </h2>
                </div>
                <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--gd-text-muted)' }}>
                  All metrics in this module are traceable to empirical statutory databases and verified model pipelines.
                </p>

                {/* Sources Table */}
                <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--gd-border-color)', color: 'var(--gd-text-muted)' }}>
                        <th style={{ padding: '6px 8px' }}>Data Source</th>
                        <th style={{ padding: '6px 8px' }}>Coverage</th>
                        <th style={{ padding: '6px 8px' }}>Cadence</th>
                        <th style={{ padding: '6px 8px' }}>Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {localityDetail.provenance.sources.map((src) => (
                        <tr key={src.name} style={{ borderBottom: '1px solid var(--gd-border-subtle)' }}>
                          <td style={{ padding: '8px', fontWeight: 600, color: 'var(--gd-text-primary)' }}>{src.name}</td>
                          <td style={{ padding: '8px', color: 'var(--gd-text-secondary)' }}>{src.coverage}</td>
                          <td style={{ padding: '8px', color: 'var(--gd-text-muted)' }}>{src.frequency}</td>
                          <td style={{ padding: '8px', fontWeight: 600 }}>{src.updated}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Disclosures Bullet List */}
                <div style={{ background: 'var(--gd-surface-elevated)', padding: '14px 18px', borderRadius: '10px' }}>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                    Methodology Rules:
                  </span>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--gd-text-secondary)', lineHeight: '1.6' }}>
                    {localityDetail.provenance.disclosures.map((disc, idx) => (
                      <li key={idx}>{disc}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};
