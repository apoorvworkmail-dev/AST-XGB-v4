import { PropertySearchQuery } from '../types/property';

export interface CategoryBreadcrumb {
  label: string;
  path?: string;
}

export interface RelatedCategoryLink {
  label: string;
  path: string;
  description: string;
}

export interface CategoryDefinition {
  id: string;
  path: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  badge: string;
  headline: string;
  subheadline: string;
  breadcrumbs: CategoryBreadcrumb[];
  filterDefaults: Partial<PropertySearchQuery>;
  isProjectCategory?: boolean;
  relatedCategories: RelatedCategoryLink[];
  recommendedLocalities: { city: string; locality: string }[];
}

export const CATEGORY_DEFINITIONS: Record<string, CategoryDefinition> = {
  // 1. New Projects & Developments
  'new-projects': {
    id: 'new-projects',
    path: '/new-projects',
    title: 'New Residential Projects & Developments',
    seoTitle: 'New Projects & Housing Developments in India | GharDhundo',
    metaDescription: 'Explore verified new residential launches and under-construction township developments across Bengaluru, Mumbai, Delhi, Hyderabad, and Pune.',
    badge: 'Verified Development Enclaves',
    headline: 'New Projects & Master-Planned Developments',
    subheadline: 'Browse township launches, high-rise residential towers, and gated villa communities across India\'s leading economic centers.',
    breadcrumbs: [
      { label: 'Home', path: '/' },
      { label: 'Projects & Developments' },
    ],
    filterDefaults: {
      mode: 'buy',
    },
    isProjectCategory: true,
    relatedCategories: [
      { label: 'Ready to Move Homes', path: '/collection/ready-to-move', description: 'Zero construction risk properties' },
      { label: 'Premium Luxury Enclaves', path: '/collection/premium-luxury', description: 'Villas and high-end sky residences' },
      { label: '7-City Market Insights', path: '/market-insights', description: 'Real-time price trends and macro factors' },
    ],
    recommendedLocalities: [
      { city: 'Bengaluru', locality: 'Whitefield' },
      { city: 'Mumbai', locality: 'Andheri East' },
      { city: 'Hyderabad', locality: 'Gachibowli' },
      { city: 'Pune', locality: 'Wakad' },
    ],
  },

  // 2. Ready to Move
  'ready-to-move': {
    id: 'ready-to-move',
    path: '/collection/ready-to-move',
    title: 'Ready to Move Properties & Apartments',
    seoTitle: 'Ready to Move Flats & Houses in Top Indian Cities | GharDhundo',
    metaDescription: 'Find ready-to-move flats and independent houses with immediate possession across top Indian metros. Filter by budget, BHK, and locality.',
    badge: 'Immediate Possession • Zero Construction Risk',
    headline: 'Ready to Move Homes Across India',
    subheadline: 'Skip construction delays with completed, occupancy-certified residential properties ready for immediate handover and living.',
    breadcrumbs: [
      { label: 'Home', path: '/' },
      { label: 'Collections', path: '/buy' },
      { label: 'Ready to Move' },
    ],
    filterDefaults: {
      mode: 'buy',
      possessionStatus: ['Ready to Move'],
    },
    relatedCategories: [
      { label: 'New Launch Projects', path: '/new-projects', description: 'Upcoming developer releases' },
      { label: 'Homes Between ₹50L - ₹1.5 Cr', path: '/budget/50-lakhs-to-1-5-cr', description: 'Mid-segment family residences' },
      { label: 'EMI Calculator', path: '/tools/emi-calculator', description: 'Plan your monthly loan obligations' },
    ],
    recommendedLocalities: [
      { city: 'Bengaluru', locality: 'Rajajinagar' },
      { city: 'Mumbai', locality: 'Bandra West' },
      { city: 'Delhi', locality: 'Dwarka' },
      { city: 'Hyderabad', locality: 'Kondapur' },
    ],
  },

  // 3. Premium & Luxury
  'premium-luxury': {
    id: 'premium-luxury',
    path: '/collection/premium-luxury',
    title: 'Premium & Luxury Homes',
    seoTitle: 'Luxury Villas & High-End Penthouses in India | GharDhundo',
    metaDescription: 'Discover luxury apartments, gated villas, and sky mansions in premier residential neighborhoods with panoramic skyline views and elite amenities.',
    badge: 'Ultra-Luxury • Architectural Distinction',
    headline: 'Luxury Living & High-End Real Estate',
    subheadline: 'Curated collection of bespoke penthouses, independent villas, and luxury sky apartments with concierge services and private facilities.',
    breadcrumbs: [
      { label: 'Home', path: '/' },
      { label: 'Collections', path: '/buy' },
      { label: 'Premium & Luxury' },
    ],
    filterDefaults: {
      mode: 'buy',
      minPrice: 15000000,
    },
    relatedCategories: [
      { label: 'Ready to Move Homes', path: '/collection/ready-to-move', description: 'Completed luxury units' },
      { label: 'Properties Above ₹1.5 Cr', path: '/budget/above-1-5-cr', description: 'High-value residences' },
      { label: 'AI Valuation Studio', path: '/ai-valuation', description: 'Evaluate fair market worth' },
    ],
    recommendedLocalities: [
      { city: 'Bengaluru', locality: 'Koramangala' },
      { city: 'Mumbai', locality: 'Bandra West' },
      { city: 'Hyderabad', locality: 'Gachibowli' },
      { city: 'Delhi', locality: 'Vasant Kunj' },
    ],
  },

  // 4. Residential Category
  'residential': {
    id: 'residential',
    path: '/category/residential',
    title: 'Residential Properties for Sale & Rent',
    seoTitle: 'Residential Flats, Apartments & Houses in India | GharDhundo',
    metaDescription: 'Browse residential apartments, builder floors, and gated villas for sale across Bengaluru, Mumbai, Delhi, Hyderabad, and Pune.',
    badge: 'Residential Catalog',
    headline: 'Residential Properties Across India',
    subheadline: 'From studio apartments to multi-level independent houses, discover residential homes aligned with your budget and lifestyle preferences.',
    breadcrumbs: [
      { label: 'Home', path: '/' },
      { label: 'Categories' },
      { label: 'Residential' },
    ],
    filterDefaults: {
      mode: 'buy',
    },
    relatedCategories: [
      { label: 'Commercial Spaces', path: '/category/commercial', description: 'Offices and business retail' },
      { label: 'Residential Plots', path: '/plots', description: 'Clear-title land parcels' },
      { label: 'Buy vs Rent Simulator', path: '/tools/buy-vs-rent', description: 'Calculate wealth comparison' },
    ],
    recommendedLocalities: [
      { city: 'Bengaluru', locality: 'Whitefield' },
      { city: 'Pune', locality: 'Baner' },
      { city: 'Chennai', locality: 'Velachery' },
      { city: 'Kolkata', locality: 'New Town' },
    ],
  },

  // 5. Commercial Category
  'commercial': {
    id: 'commercial',
    path: '/category/commercial',
    title: 'Commercial Office Spaces & Retail Shops',
    seoTitle: 'Commercial Real Estate, Office Spaces & Shops | GharDhundo',
    metaDescription: 'Explore Grade A commercial office spaces, corporate suites, and retail storefronts across prime business hubs like BKC, Cyber Towers, and ITPL.',
    badge: 'Commercial & Corporate Assets',
    headline: 'Grade A Commercial & Retail Real Estate',
    subheadline: 'High-yield commercial properties, corporate office suites, and retail enclaves positioned in central business districts.',
    breadcrumbs: [
      { label: 'Home', path: '/' },
      { label: 'Categories' },
      { label: 'Commercial' },
    ],
    filterDefaults: {
      mode: 'commercial',
    },
    relatedCategories: [
      { label: 'Commercial Rental Yields', path: '/tools/roi-calculator', description: 'Analyze Cap Rates & NOI' },
      { label: 'Residential Homes', path: '/category/residential', description: 'Apartments and villas' },
      { label: 'AI Valuation Studio', path: '/ai-valuation', description: 'Calculate commercial property valuation' },
    ],
    recommendedLocalities: [
      { city: 'Mumbai', locality: 'Bandra West' },
      { city: 'Hyderabad', locality: 'Gachibowli' },
      { city: 'Bengaluru', locality: 'Whitefield' },
    ],
  },

  // 6. Budget: Under ₹50 Lakhs
  'budget-under-50l': {
    id: 'budget-under-50l',
    path: '/budget/under-50-lakhs',
    title: 'Affordable Homes Under ₹50 Lakhs',
    seoTitle: 'Affordable Homes & Flats Under 50 Lakhs in India | GharDhundo',
    metaDescription: 'Find affordable 1 BHK and 2 BHK apartments and builder floors priced under ₹50 Lakhs in high-growth suburban corridors.',
    badge: 'Affordable Housing Segment',
    headline: 'Budget Properties Under ₹50 Lakhs',
    subheadline: 'Ideal first-time homebuyer residences and investment opportunities with accessible down payments and high rental demand.',
    breadcrumbs: [
      { label: 'Home', path: '/' },
      { label: 'Budget Bands' },
      { label: 'Under ₹50 Lakhs' },
    ],
    filterDefaults: {
      mode: 'buy',
      maxPrice: 5000000,
    },
    relatedCategories: [
      { label: 'Mid-Segment (₹50L - ₹1.5 Cr)', path: '/budget/50-lakhs-to-1-5-cr', description: 'Upgraded family homes' },
      { label: 'Loan Eligibility Estimator', path: '/tools/eligibility', description: 'Check your borrowing limit' },
      { label: 'Down-Payment Calculator', path: '/tools/down-payment', description: 'Estimate upfront costs' },
    ],
    recommendedLocalities: [
      { city: 'Pune', locality: 'Wakad' },
      { city: 'Chennai', locality: 'Velachery' },
      { city: 'Kolkata', locality: 'New Town' },
      { city: 'Delhi', locality: 'Rohini' },
    ],
  },

  // 7. Budget: ₹50 Lakhs to ₹1.5 Crore
  'budget-50l-to-1-5cr': {
    id: 'budget-50l-to-1-5cr',
    path: '/budget/50-lakhs-to-1-5-cr',
    title: 'Homes Between ₹50 Lakhs and ₹1.5 Crore',
    seoTitle: 'Flats & Apartments Between 50L to 1.5 Cr | GharDhundo',
    metaDescription: 'Browse 2 BHK and 3 BHK family homes priced between ₹50 Lakhs and ₹1.5 Crore across top metropolitan regions.',
    badge: 'Popular Mid-Market Segment',
    headline: 'Homes Between ₹50 Lakhs & ₹1.5 Crore',
    subheadline: 'The most popular residential segment in urban India, offering quality construction, modern amenities, and prime connectivity.',
    breadcrumbs: [
      { label: 'Home', path: '/' },
      { label: 'Budget Bands' },
      { label: '₹50L - ₹1.5 Cr' },
    ],
    filterDefaults: {
      mode: 'buy',
      minPrice: 5000000,
      maxPrice: 15000000,
    },
    relatedCategories: [
      { label: 'Under ₹50 Lakhs', path: '/budget/under-50-lakhs', description: 'Affordable starter homes' },
      { label: 'Above ₹1.5 Crore', path: '/budget/above-1-5-cr', description: 'Luxury developments' },
      { label: 'Home Loan EMI Calculator', path: '/tools/emi-calculator', description: 'Model monthly payments' },
    ],
    recommendedLocalities: [
      { city: 'Bengaluru', locality: 'Whitefield' },
      { city: 'Hyderabad', locality: 'Kondapur' },
      { city: 'Pune', locality: 'Wakad' },
      { city: 'Chennai', locality: 'Adayar' },
    ],
  },

  // 8. Budget: Above ₹1.5 Crore
  'budget-above-1-5cr': {
    id: 'budget-above-1-5cr',
    path: '/budget/above-1-5-cr',
    title: 'Luxury Homes Above ₹1.5 Crore',
    seoTitle: 'Luxury Homes & Villas Above 1.5 Crore | GharDhundo',
    metaDescription: 'Discover high-end luxury residences, penthouses, and gated community villas priced above ₹1.5 Crore with world-class specifications.',
    badge: 'High-Value & Luxury Real Estate',
    headline: 'Luxury Properties Above ₹1.5 Crore',
    subheadline: 'Exclusive residences featuring larger carpet areas, premium imported fittings, expansive clubhouses, and dedicated concierge services.',
    breadcrumbs: [
      { label: 'Home', path: '/' },
      { label: 'Budget Bands' },
      { label: 'Above ₹1.5 Cr' },
    ],
    filterDefaults: {
      mode: 'buy',
      minPrice: 15000000,
    },
    relatedCategories: [
      { label: 'Ready to Move Luxury', path: '/collection/ready-to-move', description: 'Immediate handover' },
      { label: 'Ultra-Luxury Enclaves', path: '/collection/premium-luxury', description: 'Bespoke residences' },
      { label: 'AST-XGB Valuation', path: '/ai-valuation', description: 'Verify market pricing integrity' },
    ],
    recommendedLocalities: [
      { city: 'Mumbai', locality: 'Bandra West' },
      { city: 'Bengaluru', locality: 'Koramangala' },
      { city: 'Hyderabad', locality: 'Gachibowli' },
      { city: 'Delhi', locality: 'Vasant Kunj' },
    ],
  },
};
