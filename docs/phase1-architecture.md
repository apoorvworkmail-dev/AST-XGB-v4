# Phase 1 — GharDhundo Product Architecture

**Brand:** GharDhundo ("Find Your Home" in Hindi)
**Visual:** `Gh` logomark — terracotta house icon
**Date:** 2026-10-25
**Based on:** Phase 0 Audit findings

---

## Sitemap Diagram

![Sitemap](C:\Users\apoorv mishra\.gemini\antigravity-ide\brain\c820392e-da2c-4ae4-b61b-4bed9eae39af\sitemap_diagram_1792946503744.jpg)

---

## 1. Sitemap and Route Table

Routes follow React Router v6 conventions. Three access tiers: **Public** (no auth), **Soft-Auth** (works without auth, better with it), **Protected** (requires sign-in).

### 1.1 Top-Level Routes

| Route | Page | Tier | Description |
|---|---|---|---|
| `/` | Home | Public | Search-first hero, trending properties, featured cities, market pulse strip |
| `/buy` | Buy – Search & Browse | Public | Browse properties for sale with filters |
| `/rent` | Rent – Search & Browse | Public | Browse properties for rent |
| `/pg` | PG & Co-living | Public | PG and co-living listings |
| `/plots` | Plots & Land | Public | Residential/commercial plots |
| `/commercial` | Commercial Properties | Public | Offices, shops, warehouses |
| `/new-projects` | New Projects | Public | Under-construction developer projects |
| `/search` | Search Results | Public | Unified filtered results page (all types) |
| `/property/:slug` | Property Detail | Public | Single listing: gallery, specs, map, valuation CTA |
| `/locality/:citySlug/:localitySlug` | Locality Guide | Public | Locality overview: prices, trends, nearby, reviews |
| `/post-property` | Post Property | Soft-Auth | Lead-gen form for sellers/agents |
| `/tools/emi-calculator` | EMI Calculator | Public | Home loan EMI calculator tool |
| `/tools/compare` | Compare Properties | Public | Side-by-side property comparison |
| `/ai-valuation` | AI Valuation Studio | Public | AST-XGB price prediction entry point |
| `/ai-valuation/results` | Valuation Results | Public | Full prediction, conformal interval, SHAP |
| `/ai-valuation/market-insights` | Market Insights | Public | City-level macro indicators (market.py) |
| `/ai-valuation/model-comparison` | Multi-Model Comparison | Public | 7-model ensemble view |
| `/ai-valuation/simulator` | Scenario Simulator | Public | What-If Simulator (to be wired to real model) |
| `/ai-valuation/explain` | SHAP Explainer | Public | Feature attribution details |
| `/account/login` | Login / Register | Public | Auth page |
| `/account/saved` | Saved Properties | Protected | bookmarked listings + portfolio table |
| `/account/profile` | Profile & Settings | Protected | user preferences, notifications, API diagnostics |

### 1.2 Route Access Summary

```
PUBLIC LISTING ROUTES (no auth required)
  /   /buy   /rent   /pg   /plots   /commercial
  /new-projects   /search   /property/:slug
  /locality/:citySlug/:localitySlug
  /tools/emi-calculator   /tools/compare

AI ANALYTICS ROUTES (public — no auth; model must be running)
  /ai-valuation
  /ai-valuation/results
  /ai-valuation/market-insights
  /ai-valuation/model-comparison
  /ai-valuation/simulator
  /ai-valuation/explain

ACCOUNT / PROTECTED ROUTES (requires sign-in)
  /account/login      (redirects out if already signed in)
  /account/saved
  /account/profile

SOFT-AUTH ROUTES (works without auth, enhanced with it)
  /post-property      (form works; tracking requires auth)
```

---

## 2. Component Hierarchy

### 2.1 Shared Layout Layer

```
AppShell
├── TopNavbar                        (replaces sidebar — consumer-facing horizontal nav)
│   ├── Logo (GharDhundo wordmark)
│   ├── PrimaryNavLinks              (Buy | Rent | PG | Plots | Commercial | New Projects)
│   ├── AiNavLink                    (AI Valuation — distinct badge)
│   ├── SearchBarCompact             (collapsed search in nav)
│   ├── PostPropertyButton
│   └── AccountMenu
│       ├── SignInButton / UserAvatar
│       ├── SavedCount badge
│       └── DropdownMenu
│           ├── SavedProperties link
│           ├── Profile link
│           └── SignOut
│
├── MobileBottomNav                  (visible < 768px)
│   ├── HomeTab
│   ├── SearchTab
│   ├── AiTab
│   ├── SavedTab
│   └── AccountTab
│
├── Footer
│   ├── BrandSection
│   ├── QuickLinks (Buy | Rent | New Projects | AI Valuation)
│   ├── CityLinks
│   └── LegalLinks
│
└── ToastProvider                    (global toast notifications)
```

### 2.2 Page-Level Components

```
HomePage
├── HeroSearch                       (search-first, full-width)
│   ├── TabSwitcher                  (Buy | Rent | PG | Plots | Commercial)
│   ├── LocationInput                (city + locality autocomplete)
│   ├── BHKFilter (pill toggles)
│   ├── BudgetRange
│   └── SearchButton
├── TrendingLocalities               (horizontal scroll cards)
├── FeaturedProperties               (grid of PropertyCard)
├── NewProjectsStrip                 (horizontal scroll)
├── AiCtaBanner                      ("Get AI Valuation" entry point)
├── MarketPulseStrip                 (7-city ticker from /market-state)
└── PopularSearchLinks               (SEO tag cloud)

SearchResultsPage
├── SearchFiltersPanel               (left or top drawer)
│   ├── PropertyTypeFilter
│   ├── BudgetRangeFilter
│   ├── BHKFilter
│   ├── AreaRangeFilter
│   ├── AmenitiesFilter
│   ├── AgeFilter
│   └── ApplyResetButtons
├── SearchSortBar                    (Sort by: Relevance | Price | Date | Area)
├── ResultsCountBadge
├── PropertyCardGrid
│   └── PropertyCard                 (repeated)
├── MapViewToggle
├── PaginationBar
└── SavedSearchPrompt

PropertyDetailPage
├── ImageGallery                     (full-width lightbox)
├── PropertyHeader
│   ├── Title, PriceDisplay
│   ├── LocationBreadcrumb
│   ├── MetadataChips                (BHK | Baths | Area | Floor | Age)
│   └── SaveButton / ShareButton
├── PropertyTabNav                   (Overview | Amenities | Map | Similar)
├── PropertyOverviewPanel
├── AmenitiesList
├── LocalityMapEmbed
├── AiValuationCard                  (inline CTA → /ai-valuation with pre-filled form)
│   ├── EstimatedPrice               (from /predict if model is up)
│   └── ViewFullAnalysisButton
├── SimilarPropertiesRow
└── ContactAgentForm

LocalityDetailPage
├── LocalityHeader                   (name, city, BreadCrumb)
├── PriceIndexChart                  (from market-state data)
├── AverageRatesTable                (BHK-wise: 1BHK | 2BHK | 3BHK)
├── LocalityAmenitiesMap
├── NearbyProjectsList
├── LocalityReviewsSection
└── PropertiesInLocalityGrid

AiValuationStudioPage
├── ValuationInputForm               (migrated from App.tsx modal)
│   ├── CitySelect
│   ├── LocalitySelect               (from cityLocalities.ts)
│   ├── PropertyTypeSelect
│   ├── AreaInput
│   ├── BHKSelect
│   ├── BathroomsSelect
│   ├── AgeInput
│   ├── FloorInputs
│   └── ModelSelectionPanel          (existing component — REUSED)
├── ValuationResultCard              (shown after prediction)
│   ├── PriceDisplay
│   ├── ConformalBandIndicator
│   ├── LatencyBadge
│   └── ViewFullAnalysisLink
├── SHAPDriversPanel                 (existing pattern — to wire real TreeSHAP)
├── CounterfactualScenariosPanel     (existing — real model, REUSED)
├── MultiModelComparisonView         (existing component — REUSED)
├── WhatIfSimulatorPanel             (existing — to wire to real model)
└── MarketInsightsView               (existing component — REUSED)

SavedPropertiesPage
└── SavedPropertiesView              (existing component — REUSED with localStorage + future backend)

AccountPage
└── SettingsView                     (existing component — REUSED)

ToolsPage
├── EmiCalculator                    (new — client-side math only)
└── CompareProperties                (new — cross-property diff table)
```

### 2.3 Shared Atomic Components

```
Atoms (no external dependencies)
  Button          (variant: primary | secondary | ghost | danger; size: sm | md | lg)
  Badge           (variant: price | bhk | regime | new | verified)
  Chip            (removable filter tag)
  Spinner
  SkeletonLoader
  PriceDisplay    (format: Lakhs / Cr, locale-aware)
  StarRating
  TagList

Molecules (composed from atoms)
  PropertyCard
  LocalityCard
  ProjectCard
  SearchBar
  FilterGroup
  BHKPillGroup
  BudgetRangeSlider
  RegimeBadge     (Stable | Growth | Cooling | Shock with color coding)
  ConformalBand   (visual interval bar)
  SHAPBar         (positive / negative impact bar)
  ModelMetricRow
  ToastNotification

Organisms (page-level sections)
  HeroSearch
  PropertyCardGrid
  SearchFiltersPanel
  ImageGallery
  MarketPulseStrip
  AiValuationCard
  MultiModelComparisonView    (existing — REUSED)
  SavedPropertiesView         (existing — REUSED)
  ModelSelectionPanel         (existing — REUSED)

Layouts
  PageShell           (TopNavbar + children + Footer)
  AiShell             (PageShell with AI sidebar context)
  TwoColumnLayout     (filters left + results right)
  DetailLayout        (full-width gallery + content + sticky sidebar)
  ModalPortal         (React portal for overlay modals)

Feedback States (all components must handle)
  EmptyState          (no results, no data)
  ErrorState          (API down, fetch failed)
  LoadingSkeleton     (content-aware placeholders)
  OfflineBanner       (backend health check failed)
  ValidationError     (inline form feedback)
```

---

## 3. Design Token System

### 3.1 Color Tokens

```css
/* === PRIMITIVE PALETTE === */

/* Terracotta — Primary Action & Brand Accent */
--color-terra-50:  #FFF7F5;
--color-terra-100: #FFE8E0;
--color-terra-200: #FFC4A8;
--color-terra-300: #FF9A72;
--color-terra-400: #EA6E3C;
--color-terra-500: #C2410C;   /* PRIMARY — buttons, links, active states */
--color-terra-600: #9A3210;
--color-terra-700: #7A2710;
--color-terra-800: #5A1C0C;
--color-terra-900: #3D110A;

/* Slate — Secondary / Text / Structural */
--color-slate-50:  #F8FAFB;
--color-slate-100: #F1F5F9;
--color-slate-200: #E2E8F0;
--color-slate-300: #CBD5E1;
--color-slate-400: #94A3B8;
--color-slate-500: #64748B;
--color-slate-600: #475569;
--color-slate-700: #334155;   /* SECONDARY — headers, nav */
--color-slate-800: #1E293B;
--color-slate-900: #0F172A;

/* Warm Neutral — Page Background & Cards */
--color-warm-50:   #FAFAF8;   /* PAGE BACKGROUND */
--color-warm-100:  #F5F5F0;
--color-warm-200:  #EDEAE3;
--color-warm-300:  #D4CFBF;
--color-warm-800:  #292524;
--color-warm-900:  #1C1917;   /* BODY TEXT */

/* Semantic Tokens */
--color-bg-page:      var(--color-warm-50);
--color-bg-card:      #FFFFFF;
--color-bg-elevated:  #FFFFFF;
--color-bg-sunken:    var(--color-warm-100);

--color-text-primary:   var(--color-warm-900);     /* #1C1917 */
--color-text-secondary: var(--color-slate-600);    /* #475569 */
--color-text-muted:     var(--color-slate-400);    /* #94A3B8 */
--color-text-inverse:   #FFFFFF;

--color-accent:         var(--color-terra-500);    /* #C2410C */
--color-accent-hover:   var(--color-terra-600);    /* #9A3210 */
--color-accent-light:   var(--color-terra-50);
--color-accent-border:  var(--color-terra-200);

--color-border:         var(--color-slate-200);    /* #E2E8F0 */
--color-border-strong:  var(--color-slate-300);

/* Status Colors */
--color-success:        #16A34A;
--color-success-light:  #F0FDF4;
--color-warning:        #D97706;
--color-warning-light:  #FFFBEB;
--color-danger:         #DC2626;
--color-danger-light:   #FEF2F2;
--color-info:           #2563EB;
--color-info-light:     #EFF6FF;

/* AI / Intelligence — reserved for AI analytics views */
--color-ai-primary:     #4F46E5;   /* indigo — retained from existing system */
--color-ai-secondary:   #7C3AED;
--color-ai-light:       #EEF2FF;

/* Dark Mode Overrides */
[data-theme="dark"] {
  --color-bg-page:      #111110;
  --color-bg-card:      #1C1917;
  --color-bg-elevated:  #242220;
  --color-bg-sunken:    #0D0D0B;
  --color-text-primary: #FAFAF8;
  --color-text-secondary: #A8A29E;
  --color-text-muted:   #78716C;
  --color-border:       rgba(255,255,255,0.10);
  --color-border-strong: rgba(255,255,255,0.18);
}

/* Regime Color Map (for RegimeBadge) */
--regime-stable:  #16A34A;
--regime-growth:  #2563EB;
--regime-cooling: #D97706;
--regime-shock:   #DC2626;
```

### 3.2 Typography

```
Font Family:
  Primary:  Inter (weights: 400, 500, 600, 700)
  Mono:     JetBrains Mono (for prices, metrics, code)
  (Both already loaded in index.html via Google Fonts)

Type Scale (rem based, 1rem = 16px):
  --text-xs:   0.75rem  /  12px  — metadata, labels
  --text-sm:   0.875rem /  14px  — secondary text, tags
  --text-base: 1rem     /  16px  — body copy
  --text-lg:   1.125rem /  18px  — card titles, section leads
  --text-xl:   1.25rem  /  20px  — sub-headings
  --text-2xl:  1.5rem   /  24px  — page headings
  --text-3xl:  1.875rem /  30px  — section display
  --text-4xl:  2.25rem  /  36px  — hero display
  --text-5xl:  3rem     /  48px  — hero headline

Font Weight Aliases:
  --fw-normal:   400
  --fw-medium:   500
  --fw-semibold: 600
  --fw-bold:     700

Line Heights:
  --lh-tight:   1.25   — headlines
  --lh-snug:    1.375  — subheadings
  --lh-normal:  1.5    — body text
  --lh-relaxed: 1.625  — long-form content

Letter Spacing:
  --ls-tight:   -0.025em  — display text
  --ls-normal:   0em
  --ls-wide:     0.025em  — labels, badges
  --ls-wider:    0.05em   — ALL CAPS labels
```

### 3.3 Spacing Scale (4px base grid)

```
--space-0:   0px
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-5:   20px
--space-6:   24px
--space-8:   32px
--space-10:  40px
--space-12:  48px
--space-16:  64px
--space-20:  80px
--space-24:  96px
--space-32:  128px

/* Layout Constants */
--nav-height:       64px
--sidebar-width:    280px   (AI Valuation Studio only)
--content-max:      1280px
--card-gap:         24px
--section-gap:      80px
```

### 3.4 Breakpoints

```
--bp-sm:   640px    — large phone (landscape)
--bp-md:   768px    — tablet portrait
--bp-lg:   1024px   — tablet landscape / small desktop
--bp-xl:   1280px   — standard desktop
--bp-2xl:  1536px   — large desktop

Usage in CSS:
  @media (min-width: 640px)   { /* sm */ }
  @media (min-width: 768px)   { /* md */ }
  @media (min-width: 1024px)  { /* lg */ }
  @media (min-width: 1280px)  { /* xl */ }

Mobile-first strategy: base styles target mobile (< 640px).
MobileBottomNav visible below 768px, TopNavbar below 768px collapses to hamburger.
```

### 3.5 Border Radius

```
--radius-none: 0
--radius-sm:   4px    — subtle (input fields, table cells)
--radius-md:   8px    — buttons, chips, tags
--radius-lg:   12px   — cards, modals, panels
--radius-xl:   16px   — property cards, gallery
--radius-2xl:  24px   — hero sections, large banners
--radius-full: 9999px — pills, avatars, badges
```

### 3.6 Elevation (Box Shadows)

```
--shadow-none: none
--shadow-xs:   0 1px 2px rgba(0,0,0,0.05)
--shadow-sm:   0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)
--shadow-md:   0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05)
--shadow-lg:   0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04)
--shadow-xl:   0 20px 25px rgba(0,0,0,0.10), 0 8px 10px rgba(0,0,0,0.06)
--shadow-2xl:  0 25px 50px rgba(0,0,0,0.18)

/* Interactive States */
--shadow-card:       var(--shadow-sm)
--shadow-card-hover: var(--shadow-lg)
--shadow-modal:      var(--shadow-2xl)

/* Accent Glow (AI views) */
--shadow-ai-glow: 0 4px 14px rgba(79,70,229,0.3)
```

### 3.7 Focus States (Accessibility)

```css
/* Default focus ring — visible on all interactive elements */
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Search bar focus */
.search-input:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 0;
  box-shadow: 0 0 0 4px rgba(194, 65, 12, 0.15);
}

/* Button focus */
.btn:focus-visible {
  box-shadow: 0 0 0 3px rgba(194, 65, 12, 0.4);
  outline: none;
}
```

---

## 4. Design System Reference

![Design System Tokens](C:\Users\apoorv mishra\.gemini\antigravity-ide\brain\c820392e-da2c-4ae4-b61b-4bed9eae39af\design_system_tokens_1792946481234.jpg)

---

## 5. Route-to-Data Map

Every page's data source is identified below. Sources labelled:
- `BE:endpoint` — existing FastAPI backend endpoint
- `BE:NEW` — new backend endpoint to be created
- `STATIC` — hard-coded or local file data
- `LS` — localStorage
- `CLIENT` — client-side computation only
- `FIXTURE` — static fixture (to be replaced later)

| Route | Primary Data Source | Secondary Data | Notes |
|---|---|---|---|
| `/` | `BE:NEW /api/v1/listings/featured` | `BE:/api/v1/market-state` (FIXTURE) | Hero loads static sample properties first; market strip from market.py |
| `/buy` `/rent` `/pg` `/plots` `/commercial` `/new-projects` | `BE:NEW /api/v1/listings/search` | `STATIC: cityLocalities.ts` | Filter params as query string |
| `/search` | `BE:NEW /api/v1/listings/search` | `STATIC: cityLocalities.ts` | Shared with listing category pages |
| `/property/:slug` | `BE:NEW /api/v1/listings/:id` | `BE:/api/v1/predict` (inline AI card) | Property detail + embedded AI valuation CTA |
| `/locality/:city/:locality` | `BE:NEW /api/v1/locality/:city/:locality` | `BE:/api/v1/market-state` (FIXTURE) | Locality stats; market state prices |
| `/post-property` | `BE:NEW /api/v1/listings` (POST) | `STATIC: cityLocalities.ts` | Form submission |
| `/tools/emi-calculator` | `CLIENT` | none | Pure math, no API needed |
| `/tools/compare` | `LS` or query params | `BE:NEW /api/v1/listings/:id` | Compare 2-4 properties by ID |
| `/ai-valuation` | none (form only) | `STATIC: cityLocalities.ts` | Input form, no data on load |
| `/ai-valuation/results` | `BE:/api/v1/predict` | `BE:/api/v1/explain` `BE:/api/v1/counterfactual` | All 3 real API calls, parallel |
| `/ai-valuation/market-insights` | `BE:/api/v1/market-state` (FIXTURE) | none | Existing MarketInsightsView reused |
| `/ai-valuation/model-comparison` | `BE:/api/v1/predict` (multi-model) | none | MultiModelComparisonView reused |
| `/ai-valuation/simulator` | `BE:/api/v1/predict` (re-inference) | none | WhatIfSimulatorView — to be wired to real model |
| `/ai-valuation/explain` | `BE:/api/v1/explain` | none | SHAPDriversPanel — to wire real TreeSHAP |
| `/account/login` | `BE:NEW /api/v1/auth/login` | none | Phase 2+ |
| `/account/saved` | `LS` + `BE:NEW /api/v1/users/saved` | none | SavedPropertiesView reused; LS as fallback |
| `/account/profile` | `BE:/api/v1/health` (diagnostics) | `LS` | SettingsView reused |

---

## 6. TypeScript Shared Types

Location: `frontend/src/types/`

### 6.1 Core Domain Types

```typescript
// frontend/src/types/property.ts

export type PropertyType =
  | 'Apartment' | 'Independent House' | 'Penthouse'
  | 'Villa' | 'Builder Floor' | 'Plot' | 'Commercial';

export type ListingCategory = 'buy' | 'rent' | 'pg' | 'plots' | 'commercial' | 'new-project';

export type FurnishingStatus = 'Furnished' | 'Semi-Furnished' | 'Unfurnished';

export type FacingDirection = 'North' | 'South' | 'East' | 'West' | 'North-East' | 'North-West' | 'South-East' | 'South-West';

export type MarketRegime = 'Stable' | 'Growth' | 'Cooling' | 'Shock';

export interface PropertyLocation {
  city: string;
  locality: string;
  latitude?: number;
  longitude?: number;
  pincode?: string;
}

export interface PropertySpecs {
  builtupAreaSqft: number;
  bhk: number;
  bathrooms: number;
  balconies?: number;
  floorNo?: number;
  totalFloors?: number;
  parking?: number;
  age?: number;           // project_age in years
  furnishing?: FurnishingStatus;
  facing?: FacingDirection;
}

export interface PropertyListing {
  id: string;
  slug: string;
  title: string;
  category: ListingCategory;
  type: PropertyType;
  location: PropertyLocation;
  specs: PropertySpecs;
  price: number;          // INR
  priceFormatted: string; // "₹ 1.04 Cr"
  pricePerSqft: number;
  images: string[];       // URLs
  amenities: string[];
  isVerified: boolean;
  isNew: boolean;
  dateListed: string;     // ISO date
  agentName?: string;
  projectName?: string;   // for new-projects
}

export interface SavedProperty extends PropertyListing {
  dateSaved: string;
  notes?: string;
}
```

### 6.2 AI / Valuation Types

```typescript
// frontend/src/types/valuation.ts

export interface ValuationInput {
  city: string;
  locality?: string;
  propertyType: PropertyType;
  builtupAreaSqft: number;
  bhk: number;
  bathrooms: number;
  age?: number;
  floorNo?: number;
  totalFloors?: number;
  furnishing?: FurnishingStatus;
  selectedModels?: string[];
  ensembleMethod?: 'equal_weight' | 'performance_weighted';
}

export interface ConformalInterval {
  lower90Inr: number;
  upper90Inr: number;
  lowerFormatted: string;
  upperFormatted: string;
}

export interface ValuationResult {
  predictedPriceInr: number;
  predictedPriceFormatted: string;
  pricePerSqft: number;
  conformal: ConformalInterval;
  activeMarketRegime: MarketRegime;
  regimeConfidence: number;
  latencyMs: number;
  modelVersion: string;
  validationWarnings: string[];
  multiModelResults?: MultiModelResults;
}

export interface SHAPDriver {
  feature: string;
  shapValue: number;
  featureValue: string;
  absShap: number;
}

export interface SHAPExplanation {
  topPositiveDrivers: SHAPDriver[];
  topNegativeDrivers: SHAPDriver[];
}

export interface CounterfactualScenario {
  scenario: string;
  perturbation: string;
  predictedPriceInr: number;
  predictedPriceFormatted: string;
  deltaPriceInr: number;
  percentageChange: number;
  validity: 'VALID' | 'INVALID';
}

export interface CounterfactualResult {
  baselinePredictionInr: number;
  baselinePredictionFormatted: string;
  scenarios: CounterfactualScenario[];
}

export interface MultiModelResults {
  selectedModelsCount: number;
  ensembleMethod: string;
  ensemblePrediction: {
    predictedPriceInr: number;
    predictedPriceFormatted: string;
    pricePerSqft: number;
    weights: Record<string, number>;
  };
  individualPredictions: Record<string, IndividualModelPrediction>;
  comparisonMatrix: ComparisonMatrixRow[];
  modelSpread: ModelSpread;
  leaderboard: LeaderboardEntry[];
}

export interface IndividualModelPrediction {
  modelKey: string;
  displayName: string;
  category: string;
  predictedPriceInr: number;
  predictedPriceFormatted: string;
  pricePerSqft: number;
  latencyMs: number;
  metrics: { R2: number; MAE: number; RMSE: number; MAPE: number; rank: number; };
}

export interface ComparisonMatrixRow {
  modelKey: string;
  displayName: string;
  predictedPriceInr: number;
  predictedPriceFormatted: string;
  diffFromEnsembleInr: number;
  diffFromEnsemblePct: number;
  weight: number;
  r2Score: number;
  rmseInr: number;
  rank: number;
}

export interface ModelSpread {
  minPriceInr: number;
  maxPriceInr: number;
  meanPriceInr: number;
  medianPriceInr: number;
  stdDevInr: number;
  relativeSpreadPct: number;
  consensusRating: 'HIGH' | 'MODERATE' | 'LOW';
  disagreementWarning: string | null;
}

export interface LeaderboardEntry {
  modelKey: string;
  displayName: string;
  R2: number;
  MAE: number;
  RMSE: number;
  MAPE: number;
  rank: number;
  trainTimeSec: number;
  inferenceTimeMs: number;
}
```

### 6.3 Market Types

```typescript
// frontend/src/types/market.ts

export interface CityMarketData {
  city: string;
  locality: string;
  avgPriceInr: number;
  avgPriceFormatted: string;
  pricePerSqft: number;
  nhbHpi: number;
  yoyGrowthPct: number;
  aqi: number;
  regime: MarketRegime;
}

export interface MarketState {
  activeRegime: MarketRegime;
  growth3mPct: number;
  marketVolatility: number;
  transactionVolume90d: number;
  priceDispersion: number;
  interestRate: number;
  cityPrices: CityMarketData[];
}
```

---

## 7. Typed API Layer

Location: `frontend/src/services/`

### 7.1 Layer Structure

```
frontend/src/services/
  api.ts              — existing utils/api.ts (rename/move; no changes to logic)
  valuationService.ts — wraps /predict, /explain, /counterfactual
  marketService.ts    — wraps /market-state
  listingsService.ts  — wraps new /listings/* endpoints (future)
  healthService.ts    — wraps /health
```

### 7.2 valuationService.ts (new file)

```typescript
// frontend/src/services/valuationService.ts
import { apiFetch } from './api';
import type { ValuationInput, ValuationResult, SHAPExplanation, CounterfactualResult } from '../types/valuation';

function toApiPayload(input: ValuationInput): Record<string, unknown> {
  return {
    city: input.city,
    locality: input.locality,
    property_type: input.propertyType,
    builtup_area_sqft: input.builtupAreaSqft,
    bhk: input.bhk,
    bathrooms: input.bathrooms,
    project_age: input.age,
    floor_no: input.floorNo,
    total_floors: input.totalFloors,
    furnishing: input.furnishing,
    selected_models: input.selectedModels ?? ['xgboost'],
    ensemble_method: input.ensembleMethod ?? 'equal_weight',
  };
}

export async function fetchValuation(input: ValuationInput): Promise<ValuationResult> {
  const res = await apiFetch('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toApiPayload(input)),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? 'Valuation request failed');
  }
  return res.json();
}

export async function fetchExplanation(input: ValuationInput): Promise<SHAPExplanation> {
  const res = await apiFetch('/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toApiPayload(input)),
  });
  if (!res.ok) throw new Error('Explanation request failed');
  return res.json();
}

export async function fetchCounterfactuals(input: ValuationInput): Promise<CounterfactualResult> {
  const res = await apiFetch('/counterfactual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toApiPayload(input)),
  });
  if (!res.ok) throw new Error('Counterfactual request failed');
  return res.json();
}
```

---

## 8. Migration Plan: Dashboard → Consumer Experience

### 8.1 What Changes and What Stays

| Element | Current Location | Disposition |
|---|---|---|
| `App.tsx` layout (sidebar + main) | `frontend/src/App.tsx` | **REPLACED** with React Router + PageShell |
| `styles.css` (SaaS design tokens) | `frontend/src/styles.css` | **EXTENDED** — consumer tokens added, AI tokens preserved |
| `App.tsx` inline Overview tab | `App.tsx` L441-836 | **MOVED** to `pages/HomePage.tsx` |
| `App.tsx` inline Prediction tab | `App.tsx` L839-1130 | **MOVED** to `pages/AiValuationPage.tsx` |
| `ModelSelectionPanel.tsx` | `components/` | **REUSED** — no changes |
| `MultiModelComparisonView.tsx` | `components/` | **REUSED** — no changes |
| `PropertyAnalysisView.tsx` | `components/` | **REUSED** — moved to AI pages |
| `MarketInsightsView.tsx` | `components/` | **REUSED** — exposed at `/ai-valuation/market-insights` |
| `WhatIfSimulatorView.tsx` | `components/` | **REUSED** — exposed at `/ai-valuation/simulator`; wired to model later |
| `SavedPropertiesView.tsx` | `components/` | **REUSED** — exposed at `/account/saved` |
| `SettingsView.tsx` | `components/` | **REUSED** — exposed at `/account/profile` |
| `ApiDocsView.tsx` | `components/` | **REUSED** — exposed at `/account/profile` as developer panel |
| `ReportsView.tsx` | `components/` | **REUSED** — moved to AI studio sidebar |
| `cityLocalities.ts` | `data/` | **REUSED** — unchanged |
| `utils/api.ts` | `utils/` | **MOVED** to `services/api.ts` — no changes to logic |

### 8.2 New Files to Create (Phase 2 onwards)

```
frontend/src/
  App.tsx                         ← Install React Router, replace tab system
  pages/
    HomePage.tsx
    SearchResultsPage.tsx
    PropertyDetailPage.tsx
    LocalityDetailPage.tsx
    AiValuationPage.tsx
    AiResultsPage.tsx
    AiMarketInsightsPage.tsx
    AiModelComparisonPage.tsx
    AiSimulatorPage.tsx
    AiExplainerPage.tsx
    SavedPage.tsx
    ProfilePage.tsx
    EmiCalculatorPage.tsx
    ComparePropertiesPage.tsx
    PostPropertyPage.tsx
    LoginPage.tsx
    NotFoundPage.tsx
  layouts/
    PageShell.tsx
    AiShell.tsx
  components/
    nav/
      TopNavbar.tsx
      MobileBottomNav.tsx
      Footer.tsx
    search/
      HeroSearch.tsx
      SearchBar.tsx
      SearchFiltersPanel.tsx
      SearchSortBar.tsx
    listing/
      PropertyCard.tsx
      PropertyCardGrid.tsx
      PropertyCardSkeleton.tsx
      ImageGallery.tsx
    market/
      MarketPulseStrip.tsx
      PriceIndexChart.tsx
      LocalityCard.tsx
    ai/
      AiValuationCard.tsx           (inline embed on Property Detail)
      ValuationInputForm.tsx        (migrated from App.tsx modal)
      ConformalBandIndicator.tsx
      SHAPDriversPanel.tsx
      RegimeBadge.tsx
    shared/
      Button.tsx
      Badge.tsx
      Chip.tsx
      Spinner.tsx
      SkeletonLoader.tsx
      PriceDisplay.tsx
      EmptyState.tsx
      ErrorState.tsx
      OfflineBanner.tsx
      ToastProvider.tsx
      Modal.tsx
  types/
    property.ts
    valuation.ts
    market.ts
    index.ts
  services/
    api.ts                          (moved from utils/)
    valuationService.ts
    marketService.ts
    listingsService.ts
    healthService.ts
  hooks/
    useValuation.ts                 (wraps valuationService + loading/error state)
    useMarketState.ts
    useListings.ts
    useSavedProperties.ts
    useBackendHealth.ts
```

### 8.3 Routing Strategy

**Decision: Add React Router v6.** The current tab-based routing (`activeTab === 'Overview'`) does not support deep links, browser back/forward, or SEO. Consumer pages require real URLs.

```typescript
// frontend/src/App.tsx (new structure)
import { BrowserRouter, Routes, Route, lazy, Suspense } from 'react-router-dom';

const HomePage             = lazy(() => import('./pages/HomePage'));
const SearchResultsPage    = lazy(() => import('./pages/SearchResultsPage'));
const PropertyDetailPage   = lazy(() => import('./pages/PropertyDetailPage'));
const AiValuationPage      = lazy(() => import('./pages/AiValuationPage'));
// ... etc.

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<SkeletonLoader />}>
        <Routes>
          <Route path="/" element={<PageShell />}>
            <Route index element={<HomePage />} />
            <Route path="buy" element={<SearchResultsPage category="buy" />} />
            <Route path="rent" element={<SearchResultsPage category="rent" />} />
            <Route path="pg" element={<SearchResultsPage category="pg" />} />
            <Route path="plots" element={<SearchResultsPage category="plots" />} />
            <Route path="commercial" element={<SearchResultsPage category="commercial" />} />
            <Route path="new-projects" element={<SearchResultsPage category="new-project" />} />
            <Route path="search" element={<SearchResultsPage />} />
            <Route path="property/:slug" element={<PropertyDetailPage />} />
            <Route path="locality/:city/:locality" element={<LocalityDetailPage />} />
            <Route path="post-property" element={<PostPropertyPage />} />
            <Route path="tools">
              <Route path="emi-calculator" element={<EmiCalculatorPage />} />
              <Route path="compare" element={<ComparePropertiesPage />} />
            </Route>
          </Route>

          <Route path="/ai-valuation" element={<AiShell />}>
            <Route index element={<AiValuationPage />} />
            <Route path="results" element={<AiResultsPage />} />
            <Route path="market-insights" element={<AiMarketInsightsPage />} />
            <Route path="model-comparison" element={<AiModelComparisonPage />} />
            <Route path="simulator" element={<AiSimulatorPage />} />
            <Route path="explain" element={<AiExplainerPage />} />
          </Route>

          <Route path="/account">
            <Route path="login" element={<LoginPage />} />
            <Route path="saved" element={<ProtectedRoute><SavedPage /></ProtectedRoute>} />
            <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

**Vite `vite.config.ts` change needed:** Add `build.rollupOptions` for lazy chunk naming and ensure the dev server `historyApiFallback` handles SPA routing (already works via Vite's default).

**Vercel `vercel.json` rewrite already present** — the existing `vercel.json` needs a SPA fallback rule confirming all routes return `index.html`.

### 8.4 Preserved AI Capabilities Post-Migration

| Capability | Old Location | New Location | Status |
|---|---|---|---|
| Price prediction form | App.tsx modal | `ValuationInputForm.tsx` + `/ai-valuation` | ✅ Preserved |
| Model selection checkboxes | `ModelSelectionPanel.tsx` | Reused unchanged | ✅ Preserved |
| Conformal interval display | App.tsx inline | `ConformalBandIndicator.tsx` | ✅ Preserved |
| SHAP positive/negative bars | App.tsx inline | `SHAPDriversPanel.tsx` | ✅ Preserved (mocked until D-01 fixed) |
| Counterfactual scenarios | App.tsx inline | `CounterfactualScenariosPanel` | ✅ Preserved (real model) |
| Multi-model comparison | `MultiModelComparisonView.tsx` | Reused unchanged | ✅ Preserved |
| Market insights table | `MarketInsightsView.tsx` | Reused at `/ai-valuation/market-insights` | ✅ Preserved |
| What-If Simulator | `WhatIfSimulatorView.tsx` | Reused at `/ai-valuation/simulator` | ✅ Preserved (local until D-02 fixed) |
| Saved properties + CSV export | `SavedPropertiesView.tsx` | Reused at `/account/saved` | ✅ Preserved |
| Dark/Light theme | App.tsx + styles.css | Preserved via `[data-theme]` attribute | ✅ Preserved |
| Backend health + auto-reconnect | `checkBackendHealth` in utils/api.ts | `useBackendHealth` hook + `OfflineBanner` | ✅ Preserved |
| API docs live tester | `ApiDocsView.tsx` | Reused at `/account/profile` dev panel | ✅ Preserved |

---

## 9. Backend Additions Required (Phase 2+)

The following new FastAPI routes are needed for consumer listing pages. They do NOT affect the existing inference pipeline.

```
New Backend Endpoints (Phase 2):
  GET  /api/v1/listings/search      ?city=&category=&bhk=&min_price=&max_price=&page=
  GET  /api/v1/listings/featured    ?city=&limit=
  GET  /api/v1/listings/:id
  GET  /api/v1/locality/:city/:slug
  POST /api/v1/listings             (post property)
  GET  /api/v1/health               (already exists — no change)
  GET  /api/v1/market-state         (already exists — wire real data in Phase 3)

Phase 3+ (after real SHAP):
  POST /api/v1/explain              (replace formula with real TreeSHAP)
  POST /api/v1/market-state/live    (real NHB HPI + RBI rates)

Data Source for /listings/*:
  Option A: JSON fixture file (fastest — Phase 2 bootstrap)
  Option B: SQLite via SQLAlchemy (recommended for Phase 3+)
  Option C: Supabase or Postgres (production scale)
```

---

## 10. Accessibility Checklist

All components must satisfy these requirements before shipping:

- [ ] All interactive elements reachable by keyboard (`Tab`, `Enter`, `Space`, `Escape`)
- [ ] All images have non-empty `alt` attributes (decorative images: `alt=""`)
- [ ] Color contrast ratio >= 4.5:1 for normal text, >= 3:1 for large text (WCAG AA)
- [ ] Focus indicator visible on every interactive element (`:focus-visible`)
- [ ] Form inputs have associated `<label>` elements (not placeholder as label)
- [ ] Error messages announced via `aria-live="polite"` or `role="alert"`
- [ ] Modal traps focus and closes on `Escape`
- [ ] `<nav>` landmarks with `aria-label`
- [ ] Property price formatted as text (not image), readable by screen readers
- [ ] Search results announce count on update (`aria-live`)

---

## 11. Implementation Order (Phase 2 Kickoff Checklist)

Before any page is built, these foundations must exist:

1. **Install `react-router-dom`** — `npm install react-router-dom @types/react-router-dom`
2. **Create `frontend/src/types/`** — `property.ts`, `valuation.ts`, `market.ts`, `index.ts`
3. **Create `frontend/src/services/`** — `api.ts` (moved), `valuationService.ts`, `marketService.ts`, `healthService.ts`
4. **Add consumer design tokens** to `styles.css` — extend existing file, do NOT replace
5. **Create `PageShell.tsx`** — `TopNavbar` + `<Outlet />` + `Footer`
6. **Create `AiShell.tsx`** — preserves sidebar-style layout for AI pages
7. **Update `App.tsx`** — install React Router, preserve all existing tab views temporarily as lazy routes
8. **Verify all existing tests still pass** after router install
9. **Build `HomePage.tsx`** as first consumer page

---

*Architecture is ready for incremental Phase 2 implementation. No existing capabilities have been changed or removed.*
