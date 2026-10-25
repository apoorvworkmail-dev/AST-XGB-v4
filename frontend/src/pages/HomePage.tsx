import React from 'react';
import { HeroSearch } from '../components/home/HeroSearch';
import { MarketPulseTicker } from '../components/home/MarketPulseTicker';
import { PopularCitiesSection } from '../components/home/PopularCitiesSection';
import { RecommendedPropertiesSection } from '../components/home/RecommendedPropertiesSection';
import { AiValuationFeatureSection } from '../components/home/AiValuationFeatureSection';
import { ToolsAndCalculatorsSection } from '../components/home/ToolsAndCalculatorsSection';
import { PropertyListing } from '../types/property';

interface HomePageProps {
  savedIds: string[];
  onToggleSave: (property: PropertyListing) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ savedIds, onToggleSave }) => {
  return (
    <main id="main-content" tabIndex={-1}>
      {/* 1. Hero Search */}
      <HeroSearch />

      {/* 2. 7-City Market Pulse Ticker */}
      <MarketPulseTicker />

      {/* 3. Popular Metros Grid */}
      <PopularCitiesSection />

      {/* 4. Recommended Property Grid */}
      <RecommendedPropertiesSection savedIds={savedIds} onToggleSave={onToggleSave} />

      {/* 5. AST-XGB AI Intelligence Feature Card */}
      <AiValuationFeatureSection />

      {/* 6. Smart Tools & Calculators */}
      <ToolsAndCalculatorsSection />
    </main>
  );
};
