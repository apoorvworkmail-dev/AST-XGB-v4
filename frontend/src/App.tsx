import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TopNavbar } from './components/nav/TopNavbar';
import { Footer } from './components/nav/Footer';
import { HomePage } from './pages/HomePage';
import { AuthProvider } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { PropertyListing } from './types/property';
import { storageAdapter } from './services/storageAdapter';

// Lazy-load secondary and heavy route pages to optimize bundle splitting and initial paint
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage').then(m => ({ default: m.SearchResultsPage })));
const PropertyDetailPage = lazy(() => import('./pages/PropertyDetailPage').then(m => ({ default: m.PropertyDetailPage })));
const AiValuationStudioPage = lazy(() => import('./pages/AiValuationStudioPage').then(m => ({ default: m.AiValuationStudioPage })));
const ToolsPage = lazy(() => import('./pages/ToolsPage').then(m => ({ default: m.ToolsPage })));
const PostPropertyPage = lazy(() => import('./pages/PostPropertyPage').then(m => ({ default: m.PostPropertyPage })));
const SavedPropertiesPage = lazy(() => import('./pages/SavedPropertiesPage').then(m => ({ default: m.SavedPropertiesPage })));
const LocalityMarketInsightsPage = lazy(() => import('./pages/LocalityMarketInsightsPage').then(m => ({ default: m.LocalityMarketInsightsPage })));
const DiscoveryCategoryPage = lazy(() => import('./pages/DiscoveryCategoryPage').then(m => ({ default: m.DiscoveryCategoryPage })));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage').then(m => ({ default: m.ProjectDetailPage })));
const CityHubPage = lazy(() => import('./pages/CityHubPage').then(m => ({ default: m.CityHubPage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then(m => ({ default: m.AccountPage })));

const RouteLoadingFallback = () => (
  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '1rem' }}>
    <div style={{ width: 44, height: 44, border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Loading GharDhundo...</span>
  </div>
);

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [savedIds, setSavedIds] = useState<string[]>([]);

  // Initialize theme from document attribute or localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('ast_xgb_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const handleSetTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('ast_xgb_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Initialize saved property IDs from storageAdapter and listen for cross-component updates
  useEffect(() => {
    setSavedIds(storageAdapter.getSavedPropertyIds());

    const handleStorageUpdate = () => {
      setSavedIds(storageAdapter.getSavedPropertyIds());
    };

    window.addEventListener('ast_xgb_storage_update', handleStorageUpdate);
    return () => window.removeEventListener('ast_xgb_storage_update', handleStorageUpdate);
  }, []);

  const handleToggleSave = (property: PropertyListing) => {
    const { updatedIds } = storageAdapter.toggleSavePropertyId(property.id);
    setSavedIds(updatedIds);
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="gd-consumer-app" data-theme={theme}>
          {/* Header & Sticky Top Navbar */}
          <TopNavbar
            theme={theme}
            setTheme={handleSetTheme}
            savedCount={savedIds.length}
          />

          {/* Authentication Modal */}
          <AuthModal />

        {/* Application Page Routes */}
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            {/* Consumer Discovery Home */}
            <Route
              path="/"
              element={<HomePage savedIds={savedIds} onToggleSave={handleToggleSave} />}
            />

          {/* Transaction Mode Discovery Routes */}
          <Route
            path="/buy"
            element={<SearchResultsPage defaultMode="buy" savedIds={savedIds} onToggleSave={handleToggleSave} />}
          />
          <Route
            path="/rent"
            element={<SearchResultsPage defaultMode="rent" savedIds={savedIds} onToggleSave={handleToggleSave} />}
          />
          <Route
            path="/pg"
            element={<SearchResultsPage defaultMode="pg" savedIds={savedIds} onToggleSave={handleToggleSave} />}
          />
          <Route
            path="/plots"
            element={<SearchResultsPage defaultMode="plots" savedIds={savedIds} onToggleSave={handleToggleSave} />}
          />
          <Route
            path="/commercial"
            element={<DiscoveryCategoryPage categoryId="commercial" savedIds={savedIds} onToggleSave={handleToggleSave} />}
          />

          {/* New Projects & Developments Routes */}
          <Route
            path="/new-projects"
            element={<DiscoveryCategoryPage categoryId="new-projects" savedIds={savedIds} onToggleSave={handleToggleSave} />}
          />
          <Route
            path="/projects"
            element={<DiscoveryCategoryPage categoryId="new-projects" savedIds={savedIds} onToggleSave={handleToggleSave} />}
          />
          <Route
            path="/project/:slug"
            element={<ProjectDetailPage savedIds={savedIds} onToggleSave={handleToggleSave} />}
          />
          <Route
            path="/projects/:slug"
            element={<ProjectDetailPage savedIds={savedIds} onToggleSave={handleToggleSave} />}
          />

          {/* Popular Cities Directory & City Hubs */}
          <Route
            path="/cities"
            element={<CityHubPage savedIds={savedIds} onToggleSave={handleToggleSave} />}
          />
          <Route
            path="/city/:cityName"
            element={<CityHubPage savedIds={savedIds} onToggleSave={handleToggleSave} />}
          />

          {/* Curated Categories & Collections */}
          <Route
            path="/category/residential"
            element={<DiscoveryCategoryPage categoryId="residential" savedIds={savedIds} onToggleSave={handleToggleSave} />}
          />
          <Route
            path="/residential"
            element={<DiscoveryCategoryPage categoryId="residential" savedIds={savedIds} onToggleSave={handleToggleSave} />}
          />
          <Route
            path="/category/commercial"
            element={<DiscoveryCategoryPage categoryId="commercial" savedIds={savedIds} onToggleSave={handleToggleSave} />}
          />
          <Route
            path="/collection/ready-to-move"
            element={<DiscoveryCategoryPage categoryId="ready-to-move" savedIds={savedIds} onToggleSave={handleToggleSave} />}
          />
          <Route
            path="/ready-to-move"
            element={<DiscoveryCategoryPage categoryId="ready-to-move" savedIds={savedIds} onToggleSave={handleToggleSave} />}
          />
          <Route
            path="/collection/premium-luxury"
            element={<DiscoveryCategoryPage categoryId="premium-luxury" savedIds={savedIds} onToggleSave={handleToggleSave} />}
          />

          {/* Budget Band Routes */}
          <Route
            path="/budget/under-50-lakhs"
            element={<DiscoveryCategoryPage categoryId="budget-under-50l" savedIds={savedIds} onToggleSave={handleToggleSave} />}
          />
          <Route
            path="/budget/50-lakhs-to-1-5-cr"
            element={<DiscoveryCategoryPage categoryId="budget-50l-to-1-5cr" savedIds={savedIds} onToggleSave={handleToggleSave} />}
          />
          <Route
            path="/budget/above-1-5-cr"
            element={<DiscoveryCategoryPage categoryId="budget-above-1-5cr" savedIds={savedIds} onToggleSave={handleToggleSave} />}
          />

          {/* Dynamic Reusable Category & Collection Fallback */}
          <Route
            path="/collection/:categorySlug"
            element={<DiscoveryCategoryPage savedIds={savedIds} onToggleSave={handleToggleSave} />}
          />
          <Route
            path="/category/:categorySlug"
            element={<DiscoveryCategoryPage savedIds={savedIds} onToggleSave={handleToggleSave} />}
          />

          {/* Unified Search Results */}
          <Route
            path="/search"
            element={<SearchResultsPage savedIds={savedIds} onToggleSave={handleToggleSave} />}
          />

          {/* Property Detail View */}
          <Route
            path="/property/:slug"
            element={<PropertyDetailPage savedIds={savedIds} onToggleSave={handleToggleSave} />}
          />

          {/* AST-XGB Multi-Model AI Valuation Studio */}
          <Route path="/ai-valuation" element={<AiValuationStudioPage />} />
          <Route path="/ai-valuation/*" element={<AiValuationStudioPage />} />

          {/* Locality & Market Intelligence Routes */}
          <Route path="/market-insights" element={<LocalityMarketInsightsPage />} />
          <Route path="/locality-insights" element={<LocalityMarketInsightsPage />} />
          <Route path="/locality/:city/:locality" element={<LocalityMarketInsightsPage />} />
          <Route path="/locality/:locality" element={<LocalityMarketInsightsPage />} />
          <Route path="/locality" element={<LocalityMarketInsightsPage />} />

          {/* Tools & Calculators */}
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/tools/emi-calculator" element={<ToolsPage />} />
          <Route path="/tools/eligibility" element={<ToolsPage />} />
          <Route path="/tools/down-payment" element={<ToolsPage />} />
          <Route path="/tools/buy-vs-rent" element={<ToolsPage />} />
          <Route path="/tools/roi-calculator" element={<ToolsPage />} />
          <Route path="/tools/roi" element={<ToolsPage />} />
          <Route path="/tools/compare" element={<ToolsPage />} />

          {/* Post Property Portal */}
          <Route path="/post-property" element={<PostPropertyPage />} />

          {/* User Account & Settings */}
          <Route
            path="/account/saved"
            element={
              <SavedPropertiesPage
                savedIds={savedIds}
                onToggleSave={handleToggleSave}
                onClearSaved={() => setSavedIds([])}
              />
            }
          />
          <Route
            path="/account/profile"
            element={
              <AccountPage
                theme={theme}
                setTheme={handleSetTheme}
                savedIds={savedIds}
                onToggleSave={handleToggleSave}
              />
            }
          />
          <Route
            path="/account"
            element={
              <AccountPage
                theme={theme}
                setTheme={handleSetTheme}
                savedIds={savedIds}
                onToggleSave={handleToggleSave}
              />
            }
          />

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>

        {/* Footer */}
        <Footer />
      </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
