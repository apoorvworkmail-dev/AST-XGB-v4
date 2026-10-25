import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Calculator,
  Scale,
  ArrowRight,
  IndianRupee,
  Check,
  Building,
  MapPin,
  Maximize2,
  Bed,
  Bath,
  Compass,
  Sparkles,
  X,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Share2,
  RotateCcw,
  TrendingUp,
  Percent,
  Home,
  Briefcase,
  DollarSign,
  PieChart,
  HelpCircle,
  Info,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { getListingsByIds } from '../services/listingsAdapter';
import { storageAdapter, MAX_COMPARE_LIMIT } from '../services/storageAdapter';
import { PropertyListing } from '../types/property';
import { runPrediction } from '../services/valuationService';
import { ValuationResult } from '../types/valuation';
import {
  calculateHomeLoanEmi,
  calculateLoanEligibility,
  calculateDownPayment,
  calculateBuyVsRent,
  calculateRentalYield,
} from '../utils/financialCalculations';

export type ToolTab = 'emi' | 'eligibility' | 'down-payment' | 'buy-vs-rent' | 'roi' | 'compare';

export const ToolsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine initial tab from pathname or query param
  const getInitialTab = (): ToolTab => {
    if (location.pathname.includes('/compare')) return 'compare';
    if (location.pathname.includes('/emi-calculator')) return 'emi';
    if (location.pathname.includes('/eligibility')) return 'eligibility';
    if (location.pathname.includes('/down-payment')) return 'down-payment';
    if (location.pathname.includes('/buy-vs-rent')) return 'buy-vs-rent';
    if (location.pathname.includes('/roi-calculator') || location.pathname.includes('/roi')) return 'roi';
    const tabParam = searchParams.get('tab') as ToolTab;
    if (['emi', 'eligibility', 'down-payment', 'buy-vs-rent', 'roi', 'compare'].includes(tabParam)) {
      return tabParam;
    }
    return 'emi';
  };

  const [activeTab, setActiveTab] = useState<ToolTab>(getInitialTab());

  useEffect(() => {
    const tabParam = searchParams.get('tab') as ToolTab;
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleSelectTab = (newTab: ToolTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // =========================================================================
  // 1. HOME LOAN EMI CALCULATOR STATE
  // =========================================================================
  const [emiPrincipal, setEmiPrincipal] = useState<number>(7500000);
  const [emiTenureYears, setEmiTenureYears] = useState<number>(20);
  const [emiInterestRate, setEmiInterestRate] = useState<number>(8.5);
  const [showAmortization, setShowAmortization] = useState<boolean>(false);

  const emiResult = calculateHomeLoanEmi(emiPrincipal, emiInterestRate, emiTenureYears);

  const handleResetEmi = () => {
    setEmiPrincipal(7500000);
    setEmiTenureYears(20);
    setEmiInterestRate(8.5);
    setShowAmortization(false);
  };

  // =========================================================================
  // 2. LOAN ELIGIBILITY ESTIMATOR STATE
  // =========================================================================
  const [eligMonthlyIncome, setEligMonthlyIncome] = useState<number>(150000);
  const [eligExistingEmis, setEligExistingEmis] = useState<number>(20000);
  const [eligTenureYears, setEligTenureYears] = useState<number>(25);
  const [eligInterestRate, setEligInterestRate] = useState<number>(8.5);
  const [eligFoirPct, setEligFoirPct] = useState<number>(50);

  const eligResult = calculateLoanEligibility(
    eligMonthlyIncome,
    eligExistingEmis,
    eligTenureYears,
    eligInterestRate,
    eligFoirPct
  );

  const handleResetEligibility = () => {
    setEligMonthlyIncome(150000);
    setEligExistingEmis(20000);
    setEligTenureYears(25);
    setEligInterestRate(8.5);
    setEligFoirPct(50);
  };

  // =========================================================================
  // 3. DOWN-PAYMENT CALCULATOR STATE
  // =========================================================================
  const [dpPropertyPrice, setDpPropertyPrice] = useState<number>(10000000);
  const [dpPercentage, setDpPercentage] = useState<number>(20);
  const [dpStampDutyPct, setDpStampDutyPct] = useState<number>(5.6); // Karnataka default
  const [dpRegistrationPct, setDpRegistrationPct] = useState<number>(1.0);
  const [dpLegalFees, setDpLegalFees] = useState<number>(45000);
  const [dpRenovationPct, setDpRenovationPct] = useState<number>(3.0);

  const dpResult = calculateDownPayment(
    dpPropertyPrice,
    dpPercentage,
    dpStampDutyPct,
    dpRegistrationPct,
    dpLegalFees,
    dpRenovationPct
  );

  const handleResetDownPayment = () => {
    setDpPropertyPrice(10000000);
    setDpPercentage(20);
    setDpStampDutyPct(5.6);
    setDpRegistrationPct(1.0);
    setDpLegalFees(45000);
    setDpRenovationPct(3.0);
  };

  // =========================================================================
  // 4. BUY-VERSUS-RENT SIMULATION STATE
  // =========================================================================
  const [bvrMonthlyRent, setBvrMonthlyRent] = useState<number>(35000);
  const [bvrRentGrowthPct, setBvrRentGrowthPct] = useState<number>(6.0);
  const [bvrPurchasePrice, setBvrPurchasePrice] = useState<number>(12000000);
  const [bvrDownPaymentPct, setBvrDownPaymentPct] = useState<number>(20);
  const [bvrInterestRate, setBvrInterestRate] = useState<number>(8.5);
  const [bvrLoanTenureYears, setBvrLoanTenureYears] = useState<number>(20);
  const [bvrMonthlyMaintenance, setBvrMonthlyMaintenance] = useState<number>(4000);
  const [bvrTransactionCostPct, setBvrTransactionCostPct] = useState<number>(6.6); // Stamp duty + Reg
  const [bvrPropertyAppreciationPct, setBvrPropertyAppreciationPct] = useState<number>(5.5);
  const [bvrInvestmentReturnPct, setBvrInvestmentReturnPct] = useState<number>(10.0); // Mutual funds/equity
  const [bvrHoldingPeriodYears, setBvrHoldingPeriodYears] = useState<number>(10);

  const bvrResult = calculateBuyVsRent({
    monthlyRent: bvrMonthlyRent,
    annualRentGrowthPct: bvrRentGrowthPct,
    purchasePrice: bvrPurchasePrice,
    downPaymentPct: bvrDownPaymentPct,
    homeLoanInterestRate: bvrInterestRate,
    loanTenureYears: bvrLoanTenureYears,
    monthlyMaintenance: bvrMonthlyMaintenance,
    transactionCostPct: bvrTransactionCostPct,
    propertyAppreciationPct: bvrPropertyAppreciationPct,
    investmentReturnPct: bvrInvestmentReturnPct,
    holdingPeriodYears: bvrHoldingPeriodYears,
  });

  const handleResetBuyVsRent = () => {
    setBvrMonthlyRent(35000);
    setBvrRentGrowthPct(6.0);
    setBvrPurchasePrice(12000000);
    setBvrDownPaymentPct(20);
    setBvrInterestRate(8.5);
    setBvrLoanTenureYears(20);
    setBvrMonthlyMaintenance(4000);
    setBvrTransactionCostPct(6.6);
    setBvrPropertyAppreciationPct(5.5);
    setBvrInvestmentReturnPct(10.0);
    setBvrHoldingPeriodYears(10);
  };

  // =========================================================================
  // 5. INVESTMENT ROI & RENTAL YIELD STATE
  // =========================================================================
  const [roiPurchasePrice, setRoiPurchasePrice] = useState<number>(8500000);
  const [roiStampDuty, setRoiStampDuty] = useState<number>(510000);
  const [roiRenovation, setRoiRenovation] = useState<number>(250000);
  const [roiMonthlyRent, setRoiMonthlyRent] = useState<number>(28000);
  const [roiVacancyPct, setRoiVacancyPct] = useState<number>(5.0); // ~1 month vacancy every 20 months
  const [roiPropertyTax, setRoiPropertyTax] = useState<number>(15000);
  const [roiMaintenance, setRoiMaintenance] = useState<number>(36000);
  const [roiInsurance, setRoiInsurance] = useState<number>(6000);
  const [roiLoanEmiTotal, setRoiLoanEmiTotal] = useState<number>(0); // Unencumbered or Financed

  const roiResult = calculateRentalYield({
    purchasePrice: roiPurchasePrice,
    stampDutyAndRegistration: roiStampDuty,
    renovationInteriorCost: roiRenovation,
    monthlyAskingRent: roiMonthlyRent,
    vacancyAllowancePct: roiVacancyPct,
    annualPropertyTax: roiPropertyTax,
    annualMaintenanceCost: roiMaintenance,
    annualInsurance: roiInsurance,
    annualLoanEmiTotal: roiLoanEmiTotal,
    initialCashInvested: roiPurchasePrice + roiStampDuty + roiRenovation,
  });

  const handleResetRoi = () => {
    setRoiPurchasePrice(8500000);
    setRoiStampDuty(510000);
    setRoiRenovation(250000);
    setRoiMonthlyRent(28000);
    setRoiVacancyPct(5.0);
    setRoiPropertyTax(15000);
    setRoiMaintenance(36000);
    setRoiInsurance(6000);
    setRoiLoanEmiTotal(0);
  };

  // =========================================================================
  // 6. PROPERTY COMPARISON TAB STATE (PRESERVED FROM PHASE 6)
  // =========================================================================
  const idsParam = searchParams.get('ids');
  const [comparedProps, setComparedProps] = useState<PropertyListing[]>([]);
  const [valuations, setValuations] = useState<Record<string, ValuationResult | null>>({});
  const [loadingValuations, setLoadingValuations] = useState(false);
  const [shortlistedProps, setShortlistedProps] = useState<PropertyListing[]>([]);

  useEffect(() => {
    let ids: string[] = [];
    if (idsParam) {
      ids = idsParam.split(',').filter(Boolean).slice(0, MAX_COMPARE_LIMIT);
    } else {
      ids = storageAdapter.getComparedPropertyIds();
    }

    if (ids.length > 0) {
      getListingsByIds(ids).then((props) => {
        setComparedProps(props);
        storageAdapter.setComparedPropertyIds(props.map((p) => p.id));
      });
    } else {
      setComparedProps([]);
    }
  }, [idsParam]);

  useEffect(() => {
    const savedIds = storageAdapter.getSavedPropertyIds();
    if (savedIds.length > 0) {
      getListingsByIds(savedIds).then((items) => setShortlistedProps(items));
    }
  }, []);

  useEffect(() => {
    if (comparedProps.length === 0) return;
    setLoadingValuations(true);
    const promises = comparedProps.map((p) => {
      const isCompatible =
        ['Apartment', 'Independent House', 'Villa', 'Penthouse', 'Builder Floor'].includes(p.propertyType) &&
        p.specs.builtupAreaSqft >= 100;

      if (!isCompatible) {
        return Promise.resolve({ id: p.id, result: null });
      }

      return runPrediction({
        city: p.location.city,
        locality: p.location.locality,
        propertyType: p.propertyType,
        builtupAreaSqft: p.specs.builtupAreaSqft,
        bhk: p.specs.bhk || 2,
        bathrooms: p.specs.bathrooms || 2,
        age: p.specs.ageYears ?? 3,
        floorNo: p.specs.floorNo ?? 3,
        totalFloors: p.specs.totalFloors ?? 10,
        parking: p.specs.parking ?? 1,
        furnishing: p.specs.furnishing || 'Unfurnished',
        facing: p.specs.facing || 'North',
        selectedModels: ['xgboost'],
        ensembleMethod: 'equal_weight',
      })
        .then((res) => ({ id: p.id, result: res }))
        .catch(() => ({ id: p.id, result: null }));
    });

    Promise.all(promises).then((results) => {
      const valMap: Record<string, ValuationResult | null> = {};
      results.forEach((r) => {
        valMap[r.id] = r.result;
      });
      setValuations(valMap);
      setLoadingValuations(false);
    });
  }, [comparedProps]);

  const handleRemoveCompareItem = (idToRemove: string) => {
    const updated = comparedProps.filter((p) => p.id !== idToRemove);
    setComparedProps(updated);
    storageAdapter.setComparedPropertyIds(updated.map((p) => p.id));
    const newIdsStr = updated.map((p) => p.id).join(',');
    setSearchParams(newIdsStr ? { tab: 'compare', ids: newIdsStr } : { tab: 'compare' });
  };

  const handleClearCompare = () => {
    setComparedProps([]);
    storageAdapter.setComparedPropertyIds([]);
    setSearchParams({ tab: 'compare' });
  };

  const checkDifference = (values: any[]) => {
    if (values.length <= 1) return false;
    const first = JSON.stringify(values[0]);
    return values.some((v) => JSON.stringify(v) !== first);
  };

  const comparisonAttributes = [
    { label: 'Total Price', getter: (p: PropertyListing) => p.priceFormatted },
    { label: 'Price per Sq.Ft', getter: (p: PropertyListing) => `₹ ${p.pricePerSqft.toLocaleString()} / sq ft` },
    { label: 'Property Type', getter: (p: PropertyListing) => p.propertyType },
    { label: 'Super Built-up Area', getter: (p: PropertyListing) => `${p.specs.builtupAreaSqft} sq.ft` },
    { label: 'Carpet Area', getter: (p: PropertyListing) => (p.specs.carpetAreaSqft ? `${p.specs.carpetAreaSqft} sq.ft` : 'Not Disclosed') },
    { label: 'Bedrooms (BHK)', getter: (p: PropertyListing) => `${p.specs.bhk} BHK` },
    { label: 'Bathrooms', getter: (p: PropertyListing) => `${p.specs.bathrooms} Baths` },
    { label: 'Age of Property', getter: (p: PropertyListing) => (p.specs.ageYears !== undefined ? `${p.specs.ageYears} Years` : 'New / Not Disclosed') },
    { label: 'Floor Level', getter: (p: PropertyListing) => (p.specs.floorNo !== undefined ? `${p.specs.floorNo} of ${p.specs.totalFloors || '—'}` : 'Not Disclosed') },
    { label: 'Furnishing Status', getter: (p: PropertyListing) => p.specs.furnishing || 'Unfurnished' },
    { label: 'Possession Status', getter: (p: PropertyListing) => p.specs.possessionStatus },
    { label: 'Facing Direction', getter: (p: PropertyListing) => p.specs.facing || 'Not Disclosed' },
    { label: 'Locality & City', getter: (p: PropertyListing) => `${p.location.locality}, ${p.location.city}` },
    { label: 'Top Amenities', getter: (p: PropertyListing) => (p.amenities && p.amenities.length > 0 ? p.amenities.slice(0, 4).join(', ') : 'Not Disclosed') },
  ];

  return (
    <div className="gd-consumer-app" style={{ minHeight: 'calc(100vh - 68px)', padding: '32px 0 64px 0' }}>
      <div className="gd-container">
        {/* Header and Title */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="gd-badge" style={{ background: 'var(--gd-terra-100)', color: 'var(--gd-terra-800)', fontWeight: 700 }}>
              Financial Modeling &amp; Discovery Suite
            </span>
            <span className="gd-badge" style={{ background: 'var(--gd-surface-elevated)', color: 'var(--gd-text-muted)' }}>
              Validated Formula Engine
            </span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '2px 0 6px 0', color: 'var(--gd-text-primary)' }}>
            Real Estate Financial Calculators &amp; Tools
          </h1>
          <p style={{ margin: 0, color: 'var(--gd-text-muted)', fontSize: '14.5px', maxWidth: '780px' }}>
            Formula-driven financial calculations, bank eligibility estimators, buy-versus-rent net worth models, and side-by-side property comparisons.
          </p>
        </div>

        {/* Global Tools Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '28px',
            borderBottom: '1px solid var(--gd-border-color)',
          }}
        >
          {[
            { id: 'emi', label: 'Home Loan EMI', icon: Calculator },
            { id: 'eligibility', label: 'Loan Eligibility', icon: Briefcase },
            { id: 'down-payment', label: 'Down Payment & Closing', icon: IndianRupee },
            { id: 'buy-vs-rent', label: 'Buy vs. Rent Simulator', icon: Home },
            { id: 'roi', label: 'Investment ROI & Yield', icon: Percent },
            { id: 'compare', label: `Property Comparison (${comparedProps.length})`, icon: Scale },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id as ToolTab)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--gd-terra-500)' : '1px solid var(--gd-border-subtle)',
                  background: isSelected ? 'var(--gd-terra-500)' : 'var(--gd-surface-card)',
                  color: isSelected ? '#ffffff' : 'var(--gd-text-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            TOOL 1: HOME LOAN EMI CALCULATOR
           ========================================================================= */}
        {activeTab === 'emi' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '28px' }}>
            {/* Input Controls Card */}
            <div className="gd-card" style={{ padding: '28px', borderRadius: '16px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calculator size={20} color="var(--gd-terra-500)" />
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Home Loan EMI Parameters</h3>
                </div>
                <button
                  type="button"
                  onClick={handleResetEmi}
                  className="gd-btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', fontSize: '12px' }}
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {/* Principal Amount */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                    <label style={{ fontWeight: 700, color: 'var(--gd-text-primary)' }}>Loan Amount (Principal)</label>
                    <span style={{ fontWeight: 800, color: 'var(--gd-terra-600)', fontSize: '15px' }}>
                      ₹ {emiPrincipal.toLocaleString()} ({emiPrincipal >= 10000000 ? `₹ ${(emiPrincipal / 10000000).toFixed(2)} Cr` : `₹ ${(emiPrincipal / 100000).toFixed(2)} L`})
                    </span>
                  </div>
                  <input
                    type="range"
                    min="500000"
                    max="50000000"
                    step="250000"
                    value={emiPrincipal}
                    onChange={(e) => setEmiPrincipal(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--gd-terra-500)', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--gd-text-muted)', marginTop: '4px' }}>
                    <span>₹ 5 Lakhs</span>
                    <span>₹ 5 Crores</span>
                  </div>
                </div>

                {/* Interest Rate */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                    <label style={{ fontWeight: 700, color: 'var(--gd-text-primary)' }}>Annual Interest Rate (% p.a.)</label>
                    <span style={{ fontWeight: 800, color: 'var(--gd-terra-600)', fontSize: '15px' }}>
                      {emiInterestRate}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="6.0"
                    max="15.0"
                    step="0.05"
                    value={emiInterestRate}
                    onChange={(e) => setEmiInterestRate(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--gd-terra-500)', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--gd-text-muted)', marginTop: '4px' }}>
                    <span>6.0% (RBI benchmark)</span>
                    <span>15.0%</span>
                  </div>
                </div>

                {/* Tenure Years */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                    <label style={{ fontWeight: 700, color: 'var(--gd-text-primary)' }}>Loan Tenure</label>
                    <span style={{ fontWeight: 800, color: 'var(--gd-terra-600)', fontSize: '15px' }}>
                      {emiTenureYears} Years ({emiTenureYears * 12} Months)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="30"
                    step="1"
                    value={emiTenureYears}
                    onChange={(e) => setEmiTenureYears(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--gd-terra-500)', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--gd-text-muted)', marginTop: '4px' }}>
                    <span>3 Years</span>
                    <span>30 Years</span>
                  </div>
                </div>
              </div>

              {/* Methodology Box */}
              <div style={{ marginTop: '24px', padding: '14px', borderRadius: '10px', background: 'var(--gd-surface-elevated)', border: '1px solid var(--gd-border-subtle)', fontSize: '12px', color: 'var(--gd-text-muted)', lineHeight: '1.5' }}>
                <strong>Formula Definition:</strong> Standard monthly reducing balance amortization: <br />
                <code style={{ color: 'var(--gd-text-primary)' }}>EMI = [P × r × (1+r)^n] / [(1+r)^n - 1]</code> where <code style={{ color: 'var(--gd-text-primary)' }}>r = Annual Rate / 12 / 100</code>.
              </div>
            </div>

            {/* Results & Breakdown Card */}
            <div className="gd-card" style={{ padding: '28px', borderRadius: '16px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ textAlign: 'center', padding: '20px 0', borderBottom: '1px solid var(--gd-border-subtle)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)' }}>
                    Monthly Installment (EMI)
                  </span>
                  <div style={{ fontSize: '42px', fontWeight: 900, color: 'var(--gd-terra-600)', margin: '6px 0' }}>
                    ₹ {emiResult.monthlyEmi.toLocaleString()}
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--gd-text-muted)' }}>
                    Payable for {emiResult.totalMonths} months
                  </span>
                </div>

                {/* Proportional Split Bar */}
                <div style={{ margin: '20px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--gd-terra-600)', fontWeight: 700 }}>
                      Principal: {Math.round((emiResult.principalAmount / emiResult.totalPayment) * 100)}%
                    </span>
                    <span style={{ color: '#3b82f6', fontWeight: 700 }}>
                      Interest: {Math.round((emiResult.totalInterest / emiResult.totalPayment) * 100)}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '12px', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${(emiResult.principalAmount / emiResult.totalPayment) * 100}%`, background: 'var(--gd-terra-500)' }} />
                    <div style={{ width: `${(emiResult.totalInterest / emiResult.totalPayment) * 100}%`, background: '#3b82f6' }} />
                  </div>
                </div>

                {/* Financial Summary Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gd-text-muted)' }}>Loan Principal:</span>
                    <strong style={{ color: 'var(--gd-text-primary)' }}>₹ {emiResult.principalAmount.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gd-text-muted)' }}>Total Interest Payable:</span>
                    <strong style={{ color: '#3b82f6' }}>₹ {emiResult.totalInterest.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--gd-border-subtle)', paddingTop: '10px', fontSize: '15px' }}>
                    <span style={{ fontWeight: 800 }}>Total Loan Repayment:</span>
                    <strong style={{ color: 'var(--gd-terra-600)', fontWeight: 800 }}>₹ {emiResult.totalPayment.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowAmortization(!showAmortization)}
                  className="gd-btn-secondary"
                  style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: 600 }}
                >
                  {showAmortization ? 'Hide Amortization Schedule' : 'View Year-by-Year Schedule'}
                </button>
                <Link
                  to="/buy"
                  className="gd-btn-primary"
                  style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}
                >
                  Browse Homes
                </Link>
              </div>
            </div>

            {/* Optional Amortization Table */}
            {showAmortization && (
              <div style={{ gridColumn: '1 / -1' }} className="gd-card">
                <div style={{ padding: '20px', borderBottom: '1px solid var(--gd-border-color)' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
                    Yearly Loan Amortization Schedule ({emiTenureYears} Years)
                  </h4>
                </div>
                <div style={{ overflowX: 'auto', padding: '16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--gd-border-color)', color: 'var(--gd-text-muted)' }}>
                        <th style={{ padding: '8px' }}>Year</th>
                        <th style={{ padding: '8px' }}>Principal Paid</th>
                        <th style={{ padding: '8px' }}>Interest Paid</th>
                        <th style={{ padding: '8px' }}>Total Outflow</th>
                        <th style={{ padding: '8px' }}>Ending Loan Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emiResult.amortizationSchedule.map((row) => (
                        <tr key={row.year} style={{ borderBottom: '1px solid var(--gd-border-subtle)' }}>
                          <td style={{ padding: '8px', fontWeight: 700 }}>Year {row.year}</td>
                          <td style={{ padding: '8px', color: 'var(--gd-terra-600)' }}>₹ {row.principalPaid.toLocaleString()}</td>
                          <td style={{ padding: '8px', color: '#3b82f6' }}>₹ {row.interestPaid.toLocaleString()}</td>
                          <td style={{ padding: '8px', fontWeight: 600 }}>₹ {(row.principalPaid + row.interestPaid).toLocaleString()}</td>
                          <td style={{ padding: '8px', fontWeight: 700, color: 'var(--gd-text-primary)' }}>₹ {row.endingBalance.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TOOL 2: LOAN ELIGIBILITY ESTIMATOR
           ========================================================================= */}
        {activeTab === 'eligibility' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '28px' }}>
            {/* Eligibility Inputs */}
            <div className="gd-card" style={{ padding: '28px', borderRadius: '16px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={20} color="var(--gd-terra-500)" />
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Applicant Income &amp; Obligations</h3>
                </div>
                <button
                  type="button"
                  onClick={handleResetEligibility}
                  className="gd-btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', fontSize: '12px' }}
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                    Net Monthly In-Hand Income (₹):
                  </label>
                  <input
                    type="number"
                    value={eligMonthlyIncome}
                    onChange={(e) => setEligMonthlyIncome(Number(e.target.value))}
                    className="gd-search-input"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '15px', fontWeight: 700 }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--gd-text-muted)', marginTop: '4px', display: 'block' }}>
                    e.g. ₹ {(eligMonthlyIncome / 100000).toFixed(2)} Lakhs / month
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                    Existing Monthly Loan EMIs / Obligations (₹):
                  </label>
                  <input
                    type="number"
                    value={eligExistingEmis}
                    onChange={(e) => setEligExistingEmis(Number(e.target.value))}
                    className="gd-search-input"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '15px' }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--gd-text-muted)', marginTop: '4px', display: 'block' }}>
                    Car loans, personal loans, or credit card EMIs
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                      Loan Tenure:
                    </label>
                    <select
                      value={eligTenureYears}
                      onChange={(e) => setEligTenureYears(Number(e.target.value))}
                      className="gd-search-input"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px' }}
                    >
                      {[10, 15, 20, 25, 30].map((y) => (
                        <option key={y} value={y}>{y} Years</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                      Interest Rate (% p.a.):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={eligInterestRate}
                      onChange={(e) => setEligInterestRate(Number(e.target.value))}
                      className="gd-search-input"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <label style={{ fontWeight: 700, color: 'var(--gd-text-muted)', textTransform: 'uppercase' }}>
                      Fixed Obligation to Income Ratio (FOIR):
                    </label>
                    <span style={{ fontWeight: 800, color: 'var(--gd-terra-600)' }}>{eligFoirPct}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="65"
                    step="5"
                    value={eligFoirPct}
                    onChange={(e) => setEligFoirPct(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--gd-terra-500)', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--gd-text-muted)', marginTop: '4px' }}>
                    <span>40% (Conservative)</span>
                    <span>50% (Standard)</span>
                    <span>65% (High Income)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Eligibility Results Card */}
            <div className="gd-card" style={{ padding: '28px', borderRadius: '16px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ textAlign: 'center', padding: '20px 0', borderBottom: '1px solid var(--gd-border-subtle)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)' }}>
                    Maximum Estimated Loan Amount
                  </span>
                  <div style={{ fontSize: '38px', fontWeight: 900, color: 'var(--gd-terra-600)', margin: '6px 0' }}>
                    ₹ {(eligResult.maxLoanAmount / 10000000).toFixed(2)} Cr
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--gd-text-muted)' }}>
                    (₹ {eligResult.maxLoanAmount.toLocaleString()})
                  </span>
                </div>

                <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gd-text-muted)' }}>Max Allowable Monthly EMI:</span>
                    <strong style={{ color: 'var(--gd-text-primary)' }}>₹ {eligResult.maxAllowableEmi.toLocaleString()} / month</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gd-text-muted)' }}>Indicative Property Budget (80% LTV):</span>
                    <strong style={{ color: '#10b981', fontSize: '15px' }}>₹ {(eligResult.indicativeHomeBudget / 10000000).toFixed(2)} Cr</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gd-text-muted)' }}>Required 20% Down-Payment:</span>
                    <strong style={{ color: 'var(--gd-text-primary)' }}>₹ {((eligResult.indicativeHomeBudget * 0.2) / 100000).toFixed(2)} Lakhs</strong>
                  </div>
                </div>

                {/* Statutory Banking Disclaimer */}
                <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '12px', color: 'var(--gd-text-secondary)', lineHeight: '1.5' }}>
                  <Info size={14} color="#3b82f6" style={{ marginRight: '6px', verticalAlign: '-2px' }} />
                  <strong>Important Banking Disclosure:</strong> Loan eligibility is an indicative estimation derived from standard banking FOIR formulas. It does not constitute a sanction letter or binding commitment of credit. Actual loan sanction depends on credit score (CIBIL), employer category, legal title verification, and individual lender risk policies.
                </div>
              </div>

              <div style={{ marginTop: '24px' }}>
                <Link
                  to={`/search?maxPrice=${eligResult.indicativeHomeBudget}`}
                  className="gd-btn-primary"
                  style={{ display: 'block', width: '100%', padding: '12px', textAlign: 'center', textDecoration: 'none', fontWeight: 700 }}
                >
                  Explore Homes Within ₹ {(eligResult.indicativeHomeBudget / 10000000).toFixed(2)} Cr
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TOOL 3: DOWN-PAYMENT & CLOSING COSTS CALCULATOR
           ========================================================================= */}
        {activeTab === 'down-payment' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '28px' }}>
            {/* Input Card */}
            <div className="gd-card" style={{ padding: '28px', borderRadius: '16px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IndianRupee size={20} color="var(--gd-terra-500)" />
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Purchase &amp; Closing Parameters</h3>
                </div>
                <button
                  type="button"
                  onClick={handleResetDownPayment}
                  className="gd-btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', fontSize: '12px' }}
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                    Total Property Agreed Price (₹):
                  </label>
                  <input
                    type="number"
                    value={dpPropertyPrice}
                    onChange={(e) => setDpPropertyPrice(Number(e.target.value))}
                    className="gd-search-input"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '15px', fontWeight: 700 }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--gd-terra-600)', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                    {dpPropertyPrice >= 10000000 ? `₹ ${(dpPropertyPrice / 10000000).toFixed(2)} Cr` : `₹ ${(dpPropertyPrice / 100000).toFixed(2)} Lakhs`}
                  </span>
                </div>

                {/* Down Payment % Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <label style={{ fontWeight: 700, color: 'var(--gd-text-primary)' }}>Down Payment Contribution</label>
                    <span style={{ fontWeight: 800, color: 'var(--gd-terra-600)' }}>{dpPercentage}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={dpPercentage}
                    onChange={(e) => setDpPercentage(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--gd-terra-500)', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--gd-text-muted)', marginTop: '4px' }}>
                    <span>10% (Minimum LTV 90%)</span>
                    <span>20% (Standard)</span>
                    <span>50%</span>
                  </div>
                </div>

                {/* State Stamp Duty Preset */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                      Stamp Duty Rate (%):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={dpStampDutyPct}
                      onChange={(e) => setDpStampDutyPct(Number(e.target.value))}
                      className="gd-search-input"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px' }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--gd-text-muted)' }}>KA: 5.6%, MH: 6-7%, DL: 6%</span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                      Registration Fee (%):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={dpRegistrationPct}
                      onChange={(e) => setDpRegistrationPct(Number(e.target.value))}
                      className="gd-search-input"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px' }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--gd-text-muted)' }}>Standard 1.0%</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                      Legal / Processing (₹):
                    </label>
                    <input
                      type="number"
                      value={dpLegalFees}
                      onChange={(e) => setDpLegalFees(Number(e.target.value))}
                      className="gd-search-input"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                      Renovation Buffer (%):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={dpRenovationPct}
                      onChange={(e) => setDpRenovationPct(Number(e.target.value))}
                      className="gd-search-input"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Results Card */}
            <div className="gd-card" style={{ padding: '28px', borderRadius: '16px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ textAlign: 'center', padding: '20px 0', borderBottom: '1px solid var(--gd-border-subtle)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)' }}>
                    Total Upfront Cash Required
                  </span>
                  <div style={{ fontSize: '38px', fontWeight: 900, color: 'var(--gd-terra-600)', margin: '6px 0' }}>
                    ₹ {(dpResult.totalUpfrontCashRequired / 100000).toFixed(2)} Lakhs
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--gd-text-muted)' }}>
                    (₹ {dpResult.totalUpfrontCashRequired.toLocaleString()})
                  </span>
                </div>

                <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gd-text-muted)' }}>Down Payment to Seller ({dpResult.downPaymentPct}%):</span>
                    <strong style={{ color: 'var(--gd-text-primary)' }}>₹ {dpResult.downPaymentAmount.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gd-text-muted)' }}>Government Stamp Duty ({dpResult.stampDutyPct}%):</span>
                    <strong style={{ color: 'var(--gd-text-primary)' }}>₹ {dpResult.stampDutyAmount.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gd-text-muted)' }}>Registration Charges:</span>
                    <strong style={{ color: 'var(--gd-text-primary)' }}>₹ {dpResult.registrationAmount.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gd-text-muted)' }}>Legal &amp; Loan Processing:</span>
                    <strong style={{ color: 'var(--gd-text-primary)' }}>₹ {dpResult.legalProcessingAmount.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gd-text-muted)' }}>Interior / Moving Contingency:</span>
                    <strong style={{ color: 'var(--gd-text-primary)' }}>₹ {dpResult.renovationContingency.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--gd-border-subtle)', paddingTop: '10px' }}>
                    <span style={{ fontWeight: 700 }}>Bank Home Loan Required:</span>
                    <strong style={{ color: '#3b82f6', fontWeight: 800 }}>₹ {dpResult.loanAmountRequired.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEmiPrincipal(dpResult.loanAmountRequired);
                    handleSelectTab('emi');
                  }}
                  className="gd-btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '13px', fontWeight: 700 }}
                >
                  Calculate EMI for ₹ {(dpResult.loanAmountRequired / 10000000).toFixed(2)} Cr Loan →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TOOL 4: BUY-VERSUS-RENT SIMULATOR
           ========================================================================= */}
        {activeTab === 'buy-vs-rent' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '28px' }}>
              {/* Simulator Parameters */}
              <div className="gd-card" style={{ padding: '28px', borderRadius: '16px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Home size={20} color="var(--gd-terra-500)" />
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Buy vs. Rent Assumptions</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetBuyVsRent}
                    className="gd-btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', fontSize: '12px' }}
                  >
                    <RotateCcw size={12} />
                    <span>Reset</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Purchase Price vs Current Rent */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '4px' }}>
                        Property Purchase Price (₹):
                      </label>
                      <input
                        type="number"
                        value={bvrPurchasePrice}
                        onChange={(e) => setBvrPurchasePrice(Number(e.target.value))}
                        className="gd-search-input"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '4px' }}>
                        Monthly Rent for Similar Home (₹):
                      </label>
                      <input
                        type="number"
                        value={bvrMonthlyRent}
                        onChange={(e) => setBvrMonthlyRent(Number(e.target.value))}
                        className="gd-search-input"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px', fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  {/* Growth Rates */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '4px' }}>
                        Property Appreciation (% p.a.):
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={bvrPropertyAppreciationPct}
                        onChange={(e) => setBvrPropertyAppreciationPct(Number(e.target.value))}
                        className="gd-search-input"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '4px' }}>
                        Annual Rent Inflation (% p.a.):
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={bvrRentGrowthPct}
                        onChange={(e) => setBvrRentGrowthPct(Number(e.target.value))}
                        className="gd-search-input"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px' }}
                      />
                    </div>
                  </div>

                  {/* Alternative Investment Return */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <label style={{ fontWeight: 700, color: 'var(--gd-text-primary)' }}>Renter's Investment Return (% p.a.)</label>
                      <span style={{ fontWeight: 800, color: '#3b82f6' }}>{bvrInvestmentReturnPct}% (Equity/MFs)</span>
                    </div>
                    <input
                      type="range"
                      min="6.0"
                      max="14.0"
                      step="0.5"
                      value={bvrInvestmentReturnPct}
                      onChange={(e) => setBvrInvestmentReturnPct(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#3b82f6', cursor: 'pointer' }}
                    />
                  </div>

                  {/* Holding Period */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <label style={{ fontWeight: 700, color: 'var(--gd-text-primary)' }}>Holding Period</label>
                      <span style={{ fontWeight: 800, color: 'var(--gd-terra-600)' }}>{bvrHoldingPeriodYears} Years</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="25"
                      step="1"
                      value={bvrHoldingPeriodYears}
                      onChange={(e) => setBvrHoldingPeriodYears(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--gd-terra-500)', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>

              {/* Simulation Outcome Card */}
              <div className="gd-card" style={{ padding: '28px', borderRadius: '16px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid var(--gd-border-subtle)' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)' }}>
                      Financial Verdict at Year {bvrHoldingPeriodYears}
                    </span>
                    <div style={{ fontSize: '32px', fontWeight: 900, color: bvrResult.winningScenario === 'Buying' ? '#10b981' : '#3b82f6', margin: '6px 0' }}>
                      {bvrResult.winningScenario} is Financially Advantageous
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--gd-text-secondary)' }}>
                      Estimated Net Worth Edge: <strong>₹ {(bvrResult.netAdvantageAmount / 100000).toFixed(2)} Lakhs</strong>
                    </div>
                  </div>

                  <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)' }}>
                      <span><strong>Buyer's Net Worth:</strong> (Property Value - Remaining Loan)</span>
                      <strong style={{ color: '#10b981', fontSize: '15px' }}>₹ {(bvrResult.buyingNetWorthFinal / 10000000).toFixed(2)} Cr</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.08)' }}>
                      <span><strong>Renter's Net Worth:</strong> (Invested Down Payment + Cashflow Savings)</span>
                      <strong style={{ color: '#3b82f6', fontSize: '15px' }}>₹ {(bvrResult.rentingNetWorthFinal / 10000000).toFixed(2)} Cr</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--gd-text-muted)' }}>Break-Even Horizon:</span>
                      <strong>{bvrResult.breakEvenYear ? `Year ${bvrResult.breakEvenYear}` : 'Beyond Holding Period'}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--gd-surface-elevated)', border: '1px solid var(--gd-border-subtle)', fontSize: '12px', color: 'var(--gd-text-muted)', lineHeight: '1.5' }}>
                  <strong>Disclaimer:</strong> This comparative simulation assumes regular disciplined investment of down-payment savings and cashflow differences at the stated return rate. Real estate liquidity, capital gains taxes, and equity market volatility are not accounted for.
                </div>
              </div>
            </div>

            {/* Yearly Net Worth Table */}
            <div className="gd-card" style={{ padding: '20px', borderRadius: '16px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)' }}>
              <h4 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 800 }}>
                Year-by-Year Cumulative Net Worth Comparison
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--gd-border-color)', color: 'var(--gd-text-muted)' }}>
                      <th style={{ padding: '8px' }}>Year</th>
                      <th style={{ padding: '8px' }}>Property Value</th>
                      <th style={{ padding: '8px' }}>Remaining Loan</th>
                      <th style={{ padding: '8px' }}>Buyer Net Worth</th>
                      <th style={{ padding: '8px' }}>Annual Rent</th>
                      <th style={{ padding: '8px' }}>Renter Net Worth</th>
                      <th style={{ padding: '8px' }}>Advantage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bvrResult.yearlyBreakdown.map((row) => {
                      const diff = row.buyingNetWorth - row.rentingNetWorth;
                      return (
                        <tr key={row.year} style={{ borderBottom: '1px solid var(--gd-border-subtle)' }}>
                          <td style={{ padding: '8px', fontWeight: 700 }}>Year {row.year}</td>
                          <td style={{ padding: '8px' }}>₹ {(row.propertyValue / 10000000).toFixed(2)} Cr</td>
                          <td style={{ padding: '8px', color: 'var(--gd-text-muted)' }}>₹ {(row.remainingLoan / 100000).toFixed(2)} L</td>
                          <td style={{ padding: '8px', fontWeight: 700, color: '#10b981' }}>₹ {(row.buyingNetWorth / 10000000).toFixed(2)} Cr</td>
                          <td style={{ padding: '8px', color: 'var(--gd-text-muted)' }}>₹ {row.rentAnnual.toLocaleString()}</td>
                          <td style={{ padding: '8px', fontWeight: 700, color: '#3b82f6' }}>₹ {(row.rentingNetWorth / 10000000).toFixed(2)} Cr</td>
                          <td style={{ padding: '8px', fontWeight: 800, color: diff >= 0 ? '#10b981' : '#3b82f6' }}>
                            {diff >= 0 ? `+₹ ${(diff / 100000).toFixed(1)} L (Buy)` : `-₹ ${(Math.abs(diff) / 100000).toFixed(1)} L (Rent)`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TOOL 5: INVESTMENT ROI & RENTAL YIELD CALCULATOR
           ========================================================================= */}
        {activeTab === 'roi' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '28px' }}>
            {/* Input Parameters */}
            <div className="gd-card" style={{ padding: '28px', borderRadius: '16px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Percent size={20} color="var(--gd-terra-500)" />
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Rental Yield &amp; Operating Expenses</h3>
                </div>
                <button
                  type="button"
                  onClick={handleResetRoi}
                  className="gd-btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', fontSize: '12px' }}
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '4px' }}>
                    Purchase Price (₹):
                  </label>
                  <input
                    type="number"
                    value={roiPurchasePrice}
                    onChange={(e) => setRoiPurchasePrice(Number(e.target.value))}
                    className="gd-search-input"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px', fontWeight: 700 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '4px' }}>
                      Stamp Duty &amp; Reg (₹):
                    </label>
                    <input
                      type="number"
                      value={roiStampDuty}
                      onChange={(e) => setRoiStampDuty(Number(e.target.value))}
                      className="gd-search-input"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '4px' }}>
                      Fit-outs / Furnishing (₹):
                    </label>
                    <input
                      type="number"
                      value={roiRenovation}
                      onChange={(e) => setRoiRenovation(Number(e.target.value))}
                      className="gd-search-input"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '4px' }}>
                    Expected Monthly Asking Rent (₹):
                  </label>
                  <input
                    type="number"
                    value={roiMonthlyRent}
                    onChange={(e) => setRoiMonthlyRent(Number(e.target.value))}
                    className="gd-search-input"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '15px', fontWeight: 700 }}
                  />
                </div>

                {/* Operating Expenses */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '4px' }}>
                      Vacancy (%):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={roiVacancyPct}
                      onChange={(e) => setRoiVacancyPct(Number(e.target.value))}
                      className="gd-search-input"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--gd-border-color)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '4px' }}>
                      Property Tax (₹/yr):
                    </label>
                    <input
                      type="number"
                      value={roiPropertyTax}
                      onChange={(e) => setRoiPropertyTax(Number(e.target.value))}
                      className="gd-search-input"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--gd-border-color)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '4px' }}>
                      Maintenance (₹/yr):
                    </label>
                    <input
                      type="number"
                      value={roiMaintenance}
                      onChange={(e) => setRoiMaintenance(Number(e.target.value))}
                      className="gd-search-input"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--gd-border-color)', fontSize: '13px' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Yield Output Card */}
            <div className="gd-card" style={{ padding: '28px', borderRadius: '16px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid var(--gd-border-subtle)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)' }}>
                    Net Rental Yield (Capitalization Rate)
                  </span>
                  <div style={{ fontSize: '42px', fontWeight: 900, color: 'var(--gd-terra-600)', margin: '6px 0' }}>
                    {roiResult.netRentalYieldPct}%
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--gd-text-muted)' }}>
                    Gross Yield: {roiResult.grossRentalYieldPct}% (Pre-expenses)
                  </span>
                </div>

                <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gd-text-muted)' }}>Total Acquisition Outflow:</span>
                    <strong style={{ color: 'var(--gd-text-primary)' }}>₹ {roiResult.totalInvestmentCost.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gd-text-muted)' }}>Annual Gross Rental Income:</span>
                    <strong style={{ color: 'var(--gd-text-primary)' }}>₹ {roiResult.grossAnnualRent.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gd-text-muted)' }}>Annual Operating Expenses &amp; Vacancy:</span>
                    <strong style={{ color: '#ef4444' }}>-₹ {(roiResult.totalAnnualExpenses + (roiResult.grossAnnualRent * roiVacancyPct) / 100).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--gd-border-subtle)', paddingTop: '10px' }}>
                    <span style={{ fontWeight: 700 }}>Net Operating Income (NOI):</span>
                    <strong style={{ color: '#10b981', fontWeight: 800 }}>₹ {roiResult.netOperatingIncome.toLocaleString()} / year</strong>
                  </div>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', fontSize: '12px', color: 'var(--gd-text-secondary)', lineHeight: '1.5' }}>
                  <AlertCircle size={14} color="#f59e0b" style={{ marginRight: '6px', verticalAlign: '-2px' }} />
                  <strong>Rental Income Disclosure:</strong> Expected asking rents are indicative market estimates and should not be treated as guaranteed contracted rental income. Net yield accounts for typical property tax, society maintenance, and tenant turnover vacancy.
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <Link
                  to="/market-insights"
                  className="gd-btn-primary"
                  style={{ display: 'block', width: '100%', padding: '12px', textAlign: 'center', textDecoration: 'none', fontWeight: 700 }}
                >
                  Inspect City-wide Rental Yields in Market Insights →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TOOL 6: PROPERTY COMPARISON MATRIX (PHASE 6 PRESERVED)
           ========================================================================= */}
        {activeTab === 'compare' && (
          <div>
            {comparedProps.length > 0 ? (
              <div
                style={{
                  backgroundColor: 'var(--gd-warm-card)',
                  border: '1px solid var(--gd-warm-border)',
                  borderRadius: 'var(--gd-radius-xl)',
                  overflow: 'hidden',
                  boxShadow: 'var(--gd-shadow-sm)',
                }}
              >
                {/* Comparison Action Toolbar */}
                <div
                  style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid var(--gd-warm-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--gd-warm-bg)',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Scale size={20} color="var(--gd-terra-500)" />
                    <strong style={{ fontSize: '15px', color: 'var(--gd-text-charcoal)' }}>
                      Comparing {comparedProps.length} of {MAX_COMPARE_LIMIT} Properties
                    </strong>
                    <span style={{ fontSize: '12px', color: 'var(--gd-text-muted)' }}>
                      • Differences highlighted in subtle amber
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={handleClearCompare}
                      className="gd-btn-secondary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px' }}
                    >
                      <Trash2 size={14} />
                      <span>Clear Comparison</span>
                    </button>
                    <Link
                      to="/buy"
                      className="gd-btn-primary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '12px', textDecoration: 'none', fontWeight: 700 }}
                    >
                      <Plus size={14} />
                      <span>Add Property</span>
                    </Link>
                  </div>
                </div>

                {/* Comparison Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'var(--gd-surface-elevated)', borderBottom: '2px solid var(--gd-border-color)' }}>
                        <th style={{ padding: '16px 20px', width: '220px', minWidth: '180px', color: 'var(--gd-text-muted)' }}>
                          Feature / Spec
                        </th>
                        {comparedProps.map((p) => (
                          <th key={p.id} style={{ padding: '16px 20px', minWidth: '240px', verticalAlign: 'top' }}>
                            <div style={{ position: 'relative' }}>
                              <button
                                type="button"
                                title="Remove property"
                                onClick={() => handleRemoveCompareItem(p.id)}
                                style={{
                                  position: 'absolute',
                                  top: '-4px',
                                  right: '-4px',
                                  background: 'var(--gd-surface-elevated)',
                                  border: '1px solid var(--gd-border-color)',
                                  borderRadius: '50%',
                                  width: '24px',
                                  height: '24px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                }}
                              >
                                <X size={14} />
                              </button>
                              <img
                                src={p.images[0]}
                                alt={p.title}
                                style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }}
                              />
                              <Link
                                to={`/property/${p.slug}`}
                                style={{ color: 'var(--gd-text-primary)', textDecoration: 'none', fontWeight: 800, fontSize: '14px', display: 'block' }}
                              >
                                {p.title}
                              </Link>
                              <div style={{ fontSize: '12px', color: 'var(--gd-text-muted)', marginTop: '2px' }}>
                                {p.location.locality}, {p.location.city}
                              </div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* AST-XGB Fair Value Row */}
                      <tr style={{ background: 'rgba(79, 70, 229, 0.05)', borderBottom: '1px solid var(--gd-border-subtle)' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 800, color: 'var(--gd-ai-indigo)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Sparkles size={16} />
                            <span>AST-XGB Fair Value</span>
                          </div>
                        </td>
                        {comparedProps.map((p) => {
                          const val = valuations[p.id];
                          if (loadingValuations) {
                            return <td key={p.id} style={{ padding: '14px 20px', color: 'var(--gd-text-muted)', fontStyle: 'italic' }}>Evaluating...</td>;
                          }
                          if (!val) {
                            return <td key={p.id} style={{ padding: '14px 20px', color: 'var(--gd-text-muted)' }}>Residential model active</td>;
                          }
                          const delta = ((p.price - val.predictedPriceInr) / val.predictedPriceInr) * 100;
                          return (
                            <td key={p.id} style={{ padding: '14px 20px' }}>
                              <div style={{ fontWeight: 800, color: 'var(--gd-ai-indigo)', fontSize: '15px' }}>
                                {val.predictedPriceFormatted}
                              </div>
                              <div style={{ fontSize: '11px', color: delta > 0 ? '#f59e0b' : '#10b981', fontWeight: 700, marginTop: '2px' }}>
                                {delta > 0 ? `+${delta.toFixed(1)}% vs Model` : `${delta.toFixed(1)}% vs Model`}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Attributes */}
                      {comparisonAttributes.map((attr) => {
                        const values = comparedProps.map((p) => attr.getter(p));
                        const isDiff = checkDifference(values);
                        return (
                          <tr
                            key={attr.label}
                            style={{
                              borderBottom: '1px solid var(--gd-border-subtle)',
                              background: isDiff ? 'rgba(245, 158, 11, 0.04)' : 'transparent',
                            }}
                          >
                            <td style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--gd-text-muted)' }}>
                              {attr.label}
                            </td>
                            {comparedProps.map((p) => (
                              <td key={p.id} style={{ padding: '12px 20px', color: 'var(--gd-text-primary)' }}>
                                {attr.getter(p)}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="gd-card" style={{ padding: '60px 24px', textAlign: 'center', borderRadius: '16px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)' }}>
                <Scale size={42} color="var(--gd-terra-500)" style={{ margin: '0 auto 16px auto', display: 'block' }} />
                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0' }}>
                  No Properties Selected for Comparison
                </h3>
                <p style={{ color: 'var(--gd-text-muted)', fontSize: '14px', maxWidth: '480px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
                  Select up to 4 listings across search results or from your shortlisted portfolio to view a side-by-side spec and fair value comparison.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <Link to="/buy" className="gd-btn-primary" style={{ textDecoration: 'none', padding: '10px 20px', fontWeight: 700 }}>
                    Browse Listings to Compare
                  </Link>
                  <Link to="/account/saved" className="gd-btn-secondary" style={{ textDecoration: 'none', padding: '10px 20px', fontWeight: 600 }}>
                    View Shortlisted Portfolio
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Global Valuation Studio Handoff Banner */}
        <div
          style={{
            marginTop: '36px',
            padding: '24px 28px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(16, 185, 129, 0.08))',
            border: '1px solid rgba(79, 70, 229, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Sparkles size={18} color="var(--gd-ai-indigo)" />
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--gd-text-primary)' }}>
                Need an Algorithmic AI Property Valuation?
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--gd-text-muted)' }}>
              Evaluate any property across 7 Indian metros with conformal prediction intervals and SHAP explainability.
            </p>
          </div>

          <Link
            to="/ai-valuation"
            className="gd-btn-primary"
            style={{
              padding: '10px 22px',
              borderRadius: '10px',
              fontSize: '13.5px',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Launch AI Valuation Studio</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};
