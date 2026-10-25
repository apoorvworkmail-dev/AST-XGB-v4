import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  MapPin,
  IndianRupee,
  CheckCircle2,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  Trash2,
  Eye,
  Edit3,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Shield,
  Layers,
  ChevronLeft,
  ChevronRight,
  Info,
  Clock,
  User,
  Phone,
  Mail,
  Lock,
  Check,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { CITY_LOCALITIES } from '../data/cityLocalities';
import {
  listingStorage,
  OwnerListingData,
  ListingStatus,
} from '../services/listingStorageAdapter';
import { runPrediction } from '../services/valuationService';
import { PropertyType, TransactionMode, FurnishingStatus, PossessionStatus, FacingDirection } from '../types/property';

const COMMON_AMENITIES = [
  'Power Backup',
  'Lift',
  '24x7 Security',
  'Gated Community',
  'Clubhouse',
  'Gymnasium',
  'Swimming Pool',
  'Gas Pipeline',
  'Reserved Parking',
  'Water Storage',
  'Rainwater Harvesting',
  'Park / Garden',
  'Visitor Parking',
  'Pet Friendly',
];

const PRESET_DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80',
];

export const PostPropertyPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active View Tab: 'form' | 'preview' | 'manage' | 'confirmed'
  const initialTab = (searchParams.get('tab') as any) || 'form';
  const [activeTab, setActiveTab] = useState<'form' | 'preview' | 'manage' | 'confirmed'>(initialTab);

  // Form Step: 1 = Basic Info, 2 = Location, 3 = Specs & Amenities, 4 = Price & AI Valuation, 5 = Media & Contact
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Editing existing listing ID if any
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [role, setRole] = useState<'Owner' | 'Agent' | 'Developer'>('Owner');
  const [mode, setMode] = useState<TransactionMode>('buy');
  const [propertyCategory, setPropertyCategory] = useState<'Residential' | 'Commercial' | 'Plot' | 'PG'>('Residential');
  const [propertyType, setPropertyType] = useState<PropertyType>('Apartment');
  const [title, setTitle] = useState('');

  // Location
  const [city, setCity] = useState('Bengaluru');
  const [locality, setLocality] = useState('Whitefield');
  const [subLocality, setSubLocality] = useState('');
  const [projectName, setProjectName] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');

  // Specs
  const [builtupArea, setBuiltupArea] = useState<string>('1450');
  const [carpetArea, setCarpetArea] = useState<string>('1200');
  const [bhk, setBhk] = useState<number>(3);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [balconies, setBalconies] = useState<number>(1);
  const [floorNo, setFloorNo] = useState<number>(4);
  const [totalFloors, setTotalFloors] = useState<number>(12);
  const [facing, setFacing] = useState<FacingDirection>('East');
  const [ageYears, setAgeYears] = useState<number>(2);
  const [furnishing, setFurnishing] = useState<FurnishingStatus>('Semi-Furnished');
  const [possessionStatus, setPossessionStatus] = useState<PossessionStatus>('Ready to Move');
  const [parking, setParking] = useState<number>(1);

  // Amenities
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Power Backup',
    'Lift',
    '24x7 Security',
    'Gated Community',
  ]);

  // Pricing & Expected Financials
  const [price, setPrice] = useState<string>('11500000');
  const [maintenanceCharges, setMaintenanceCharges] = useState<string>('3500');
  const [isNegotiable, setIsNegotiable] = useState<boolean>(true);

  // Description & Contact
  const [description, setDescription] = useState(
    'Spacious, well-ventilated apartment with modular kitchen, premium fixtures, and excellent cross-ventilation. Located in a prime gated society close to schools, healthcare, and IT corridors.'
  );
  const [contactName, setContactName] = useState('Apoorv Mishra');
  const [contactPhone, setContactPhone] = useState('9876543210');
  const [contactEmail, setContactEmail] = useState('apoorvworkmail@gmail.com');
  const [maskPhone, setMaskPhone] = useState<boolean>(true);

  // Photos
  const [images, setImages] = useState<string[]>([PRESET_DEMO_IMAGES[0], PRESET_DEMO_IMAGES[1]]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AST-XGB Valuation Check state
  const [evaluatingAi, setEvaluatingAi] = useState(false);
  const [aiEstimate, setAiEstimate] = useState<{
    predictedPrice: number;
    formattedPrice: string;
    lower90: number;
    upper90: number;
    regime: string;
  } | null>(null);

  // Validation Errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Submitted Reference ID
  const [confirmedId, setConfirmedId] = useState<string>('');

  // Owner's listings from local storage
  const [myListings, setMyListings] = useState<OwnerListingData[]>([]);

  // Load My Listings
  const refreshMyListings = () => {
    setMyListings(listingStorage.getOwnerListings());
  };

  useEffect(() => {
    refreshMyListings();
    const handleUpdate = () => refreshMyListings();
    window.addEventListener('ast_xgb_listings_updated', handleUpdate);
    return () => window.removeEventListener('ast_xgb_listings_updated', handleUpdate);
  }, []);

  // Synchronize Tab with URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['form', 'preview', 'manage', 'confirmed'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  const setViewTab = (tab: 'form' | 'preview' | 'manage' | 'confirmed') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const localities = CITY_LOCALITIES[city] || ['Whitefield', 'Koramangala', 'Indiranagar'];

  // Auto-generate title if blank
  useEffect(() => {
    if (!title || title.includes('BHK')) {
      const modeLabel = mode === 'buy' ? 'For Sale' : 'For Rent';
      setTitle(`${bhk} BHK ${propertyType} ${modeLabel} in ${locality}`);
    }
  }, [bhk, propertyType, mode, locality]);

  // Image Upload Handler (Strict Security & Validation)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
    const newImages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate Content Type
      if (!allowedTypes.includes(file.type)) {
        alert(`File "${file.name}" rejected: Only JPG, PNG, and WebP images are permitted.`);
        continue;
      }

      // Validate File Size
      if (file.size > maxSizeBytes) {
        alert(`File "${file.name}" exceeds the 5.0 MB maximum size limit.`);
        continue;
      }

      // Create safe object URL (never store as executable)
      const objectUrl = URL.createObjectURL(file);
      newImages.push(objectUrl);
    }

    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages].slice(0, 10)); // Max 10
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMakeCoverImage = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
  };

  const handleAddPresetPhoto = () => {
    const unused = PRESET_DEMO_IMAGES.find((img) => !images.includes(img)) || PRESET_DEMO_IMAGES[0];
    setImages((prev) => [...prev, unused]);
  };

  // Toggle Amenities
  const handleToggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  // Run AI Valuation Check
  const handleEvaluateAiBenchmark = async () => {
    setEvaluatingAi(true);
    try {
      const areaNum = Number(builtupArea) || 1450;
      const res = await runPrediction({
        city,
        locality,
        propertyType,
        builtupAreaSqft: areaNum,
        bhk,
        bathrooms,
        age: ageYears,
        floorNo,
        totalFloors,
        parking,
        furnishing,
        facing,
        selectedModels: ['xgboost'],
        ensembleMethod: 'equal_weight',
      });

      if (res) {
        setAiEstimate({
          predictedPrice: res.predictedPriceInr,
          formattedPrice: res.predictedPriceFormatted,
          lower90: res.conformal?.lower90Inr || res.predictedPriceInr * 0.9,
          upper90: res.conformal?.upper90Inr || res.predictedPriceInr * 1.1,
          regime: res.activeMarketRegime || 'Growth',
        });
      }
    } catch (err) {
      console.warn('AI valuation benchmark check failed:', err);
    } finally {
      setEvaluatingAi(false);
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) errors.title = 'Listing title is required.';
    if (!city.trim()) errors.city = 'City is required.';
    if (!locality.trim()) errors.locality = 'Locality is required.';

    const numArea = Number(builtupArea);
    if (!numArea || numArea <= 100) errors.builtupArea = 'Enter a valid built-up area (>= 100 sq.ft).';

    const numCarpet = Number(carpetArea);
    if (numCarpet && numCarpet > numArea) {
      errors.carpetArea = 'Carpet area cannot exceed total built-up area.';
    }

    const numPrice = Number(price);
    if (!numPrice || numPrice <= 0) errors.price = 'Please enter a valid asking price or rent.';

    if (floorNo > totalFloors) {
      errors.floorNo = 'Floor number cannot exceed total building floors.';
    }

    if (!contactName.trim()) errors.contactName = 'Contact name is required.';
    if (!contactPhone.trim() || contactPhone.length < 10) {
      errors.contactPhone = 'Enter a valid 10-digit mobile number.';
    }

    if (images.length === 0) {
      errors.images = 'Please upload or select at least 1 property photo.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Compile Current Form to Data Model
  const compileListingData = (status: ListingStatus = 'draft'): OwnerListingData => {
    const numPrice = Number(price) || 0;
    const numArea = Number(builtupArea) || 1450;
    const ppsf = numArea > 0 ? Math.round(numPrice / numArea) : 0;

    const id = editingId || `owner-${Date.now().toString(36)}`;
    const cleanCity = city.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cleanLoc = locality.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const slug = `${bhk}bhk-${propertyType.toLowerCase()}-${cleanLoc}-${cleanCity}-${id}`;

    return {
      id,
      slug,
      status,
      role,
      mode,
      propertyCategory,
      propertyType,
      title: title || `${bhk} BHK ${propertyType} in ${locality}`,
      location: {
        city,
        locality,
        subLocality: subLocality || projectName,
        projectName,
        landmark,
        pincode,
        latitude: 12.9716,
        longitude: 77.5946,
      },
      specs: {
        builtupAreaSqft: numArea,
        carpetAreaSqft: Number(carpetArea) || numArea * 0.82,
        bhk,
        bathrooms,
        balconies,
        floorNo,
        totalFloors,
        facing,
        ageYears,
        furnishing,
        possessionStatus,
        parking,
      },
      price: numPrice,
      priceFormatted:
        numPrice >= 10000000
          ? `₹ ${(numPrice / 10000000).toFixed(2)} Cr`
          : `₹ ${(numPrice / 100000).toFixed(2)} Lakhs`,
      pricePerSqft: ppsf,
      maintenanceCharges: Number(maintenanceCharges) || 0,
      isNegotiable,
      images: images.length > 0 ? images : [PRESET_DEMO_IMAGES[0]],
      amenities: selectedAmenities,
      description,
      contact: {
        name: contactName,
        phone: contactPhone,
        email: contactEmail,
        maskPhone,
      },
      astXgbEstimate: aiEstimate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isLocalPrototype: true,
    };
  };

  // Save as Draft
  const handleSaveDraft = () => {
    const draftData = compileListingData('draft');
    const saved = listingStorage.saveDraft(draftData);
    setEditingId(saved.id);
    alert('Listing draft saved to your local session portfolio!');
    refreshMyListings();
  };

  // Proceed to Preview
  const handleProceedToPreview = () => {
    if (validateForm()) {
      setViewTab('preview');
    }
  };

  // Final Submit
  const handleConfirmAndSubmit = () => {
    if (!validateForm()) {
      setViewTab('form');
      return;
    }

    const data = compileListingData('submitted');
    const submitted = listingStorage.submitListing(data);
    setConfirmedId(submitted.id);
    setEditingId(null);
    refreshMyListings();
    setViewTab('confirmed');
  };

  // Edit an existing listing
  const handleEditExisting = (item: OwnerListingData) => {
    setEditingId(item.id);
    setRole(item.role);
    setMode(item.mode);
    setPropertyCategory(item.propertyCategory);
    setPropertyType(item.propertyType);
    setTitle(item.title);
    setCity(item.location.city);
    setLocality(item.location.locality);
    setSubLocality(item.location.subLocality || '');
    setProjectName(item.location.projectName || '');
    setLandmark(item.location.landmark || '');
    setPincode(item.location.pincode || '');
    setBuiltupArea(String(item.specs.builtupAreaSqft));
    setCarpetArea(String(item.specs.carpetAreaSqft || ''));
    setBhk(item.specs.bhk);
    setBathrooms(item.specs.bathrooms);
    setBalconies(item.specs.balconies);
    setFloorNo(item.specs.floorNo);
    setTotalFloors(item.specs.totalFloors);
    setFacing(item.specs.facing);
    setAgeYears(item.specs.ageYears);
    setFurnishing(item.specs.furnishing);
    setPossessionStatus(item.specs.possessionStatus);
    setParking(item.specs.parking);
    setSelectedAmenities(item.amenities);
    setPrice(String(item.price));
    setMaintenanceCharges(String(item.maintenanceCharges || ''));
    setIsNegotiable(item.isNegotiable);
    setDescription(item.description);
    setContactName(item.contact.name);
    setContactPhone(item.contact.phone);
    setContactEmail(item.contact.email);
    setMaskPhone(item.contact.maskPhone);
    setImages(item.images);
    setAiEstimate(item.astXgbEstimate || null);
    setCurrentStep(1);
    setViewTab('form');
  };

  const handleDeleteListing = (id: string) => {
    if (confirm('Are you sure you want to delete this listing from your session?')) {
      listingStorage.deleteListing(id);
      refreshMyListings();
    }
  };

  // Current compiled model for live preview
  const currentPreviewData = compileListingData('draft');

  return (
    <div className="gd-consumer-app" style={{ minHeight: 'calc(100vh - 68px)', padding: '32px 0 64px 0' }}>
      <div className="gd-container" style={{ maxWidth: activeTab === 'preview' ? '1120px' : '920px' }}>
        {/* Navigation & Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="gd-badge" style={{ background: 'var(--gd-terra-100)', color: 'var(--gd-terra-800)', fontWeight: 700 }}>
                Owner &amp; Partner Portal
              </span>
              <span className="gd-badge" style={{ background: 'var(--gd-surface-elevated)', color: 'var(--gd-text-muted)' }}>
                Prototype Adapter Mode
              </span>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '2px 0 0 0', color: 'var(--gd-text-primary)' }}>
              {activeTab === 'manage' ? 'My Property Listings' : activeTab === 'preview' ? 'Listing Live Preview' : 'Post Your Property'}
            </h1>
          </div>

          {/* Tab Navigation */}
          <div style={{ display: 'flex', background: 'var(--gd-surface-card)', padding: '4px', borderRadius: '10px', border: '1px solid var(--gd-border-color)' }}>
            <button
              type="button"
              onClick={() => setViewTab('form')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '13px',
                fontWeight: activeTab === 'form' ? 700 : 500,
                background: activeTab === 'form' ? 'var(--gd-terra-500)' : 'transparent',
                color: activeTab === 'form' ? '#ffffff' : 'var(--gd-text-primary)',
                cursor: 'pointer',
              }}
            >
              Post Listing
            </button>
            <button
              type="button"
              onClick={() => setViewTab('manage')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '13px',
                fontWeight: activeTab === 'manage' ? 700 : 500,
                background: activeTab === 'manage' ? 'var(--gd-terra-500)' : 'transparent',
                color: activeTab === 'manage' ? '#ffffff' : 'var(--gd-text-primary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>My Listings</span>
              {myListings.length > 0 && (
                <span style={{ fontSize: '11px', background: activeTab === 'manage' ? 'rgba(255,255,255,0.3)' : 'var(--gd-surface-elevated)', padding: '2px 6px', borderRadius: '10px' }}>
                  {myListings.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Prototype Architecture Disclaimer Banner */}
        <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <Info size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '12px', color: 'var(--gd-text-secondary)', lineHeight: '1.5' }}>
            <strong>Local Development Adapter Mode:</strong> Listings submitted through this interface are validated, previewed, and persisted in your browser's local adapter (`listingStorageAdapter.ts`). To publish listings permanently to the cloud, see our documented backend REST contract in <code style={{ background: 'var(--gd-surface-card)', padding: '2px 4px', borderRadius: '4px' }}>docs/listing-api-contract.md</code>.
          </div>
        </div>

        {/* =========================================================================
            TAB 1: POST PROPERTY FORM (MULTI-STEP WIZARD)
           ========================================================================= */}
        {activeTab === 'form' && (
          <div className="gd-card" style={{ padding: '28px 32px', borderRadius: '16px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)' }}>
            {/* Step Indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '28px', borderBottom: '1px solid var(--gd-border-subtle)', paddingBottom: '16px' }}>
              {[
                { step: 1, title: 'Basic & Role' },
                { step: 2, title: 'Location' },
                { step: 3, title: 'Specifications' },
                { step: 4, title: 'Pricing & AST-XGB' },
                { step: 5, title: 'Photos & Contact' },
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setCurrentStep(s.step)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: currentStep === s.step ? 'var(--gd-terra-600)' : currentStep > s.step ? '#10b981' : 'var(--gd-text-muted)',
                    fontWeight: currentStep === s.step ? 700 : 500,
                    fontSize: '13px',
                  }}
                >
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: currentStep === s.step ? 'var(--gd-terra-500)' : currentStep > s.step ? '#10b981' : 'var(--gd-surface-elevated)',
                      color: currentStep >= s.step ? '#ffffff' : 'var(--gd-text-muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {currentStep > s.step ? <Check size={14} /> : s.step}
                  </span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>

            {/* Validation Errors Notice */}
            {Object.keys(validationErrors).length > 0 && (
              <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                  <AlertCircle size={16} />
                  <span>Please resolve the following fields before proceeding:</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#b91c1c' }}>
                  {Object.values(validationErrors).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* STEP 1: BASIC INFORMATION & ROLE */}
            {currentStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {/* User Role */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '8px' }}>
                    I am posting as:
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {(['Owner', 'Agent', 'Developer'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '10px',
                          border: role === r ? '2px solid var(--gd-terra-500)' : '1px solid var(--gd-border-color)',
                          background: role === r ? 'var(--gd-terra-50)' : 'var(--gd-surface-elevated)',
                          color: role === r ? 'var(--gd-terra-800)' : 'var(--gd-text-primary)',
                          fontWeight: role === r ? 700 : 500,
                          cursor: 'pointer',
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transaction Mode */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '8px' }}>
                    Transaction Intent:
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {[
                      { id: 'buy', label: 'Sell Property' },
                      { id: 'rent', label: 'Rent / Lease Out' },
                      { id: 'commercial', label: 'Commercial' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMode(m.id as any)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '10px',
                          border: mode === m.id ? '2px solid var(--gd-terra-500)' : '1px solid var(--gd-border-color)',
                          background: mode === m.id ? 'var(--gd-terra-50)' : 'var(--gd-surface-elevated)',
                          color: mode === m.id ? 'var(--gd-terra-800)' : 'var(--gd-text-primary)',
                          fontWeight: mode === m.id ? 700 : 500,
                          cursor: 'pointer',
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Property Type */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '8px' }}>
                    Property Type:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                    {([
                      'Apartment',
                      'Independent House',
                      'Villa',
                      'Penthouse',
                      'Builder Floor',
                      'Commercial Office',
                      'Commercial Shop',
                      'Plot',
                    ] as PropertyType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setPropertyType(t)}
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          border: propertyType === t ? '1.5px solid var(--gd-terra-500)' : '1px solid var(--gd-border-color)',
                          background: propertyType === t ? 'var(--gd-terra-50)' : 'var(--gd-surface-elevated)',
                          color: propertyType === t ? 'var(--gd-terra-800)' : 'var(--gd-text-primary)',
                          fontSize: '12px',
                          fontWeight: propertyType === t ? 700 : 500,
                          cursor: 'pointer',
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Listing Title */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                    Listing Title:
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. 3 BHK Luxury Apartment in Whitefield"
                    className="gd-search-input"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px' }}
                  />
                </div>
              </div>
            )}

            {/* STEP 2: LOCATION & PROJECT */}
            {currentStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* City */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                      City:
                    </label>
                    <select
                      value={city}
                      onChange={(e) => {
                        const newCity = e.target.value;
                        setCity(newCity);
                        const firstLoc = CITY_LOCALITIES[newCity]?.[0] || '';
                        setLocality(firstLoc);
                      }}
                      className="gd-search-input"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px' }}
                    >
                      {['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Locality */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                      Locality:
                    </label>
                    <select
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      className="gd-search-input"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px' }}
                    >
                      {localities.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Project / Society Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                      Project or Society Name (Optional):
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="e.g. Prestige Boulevard"
                      className="gd-search-input"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px' }}
                    />
                  </div>

                  {/* Sub-locality / Street */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                      Sub-Locality / Street:
                    </label>
                    <input
                      type="text"
                      value={subLocality}
                      onChange={(e) => setSubLocality(e.target.value)}
                      placeholder="e.g. ITPL Main Road"
                      className="gd-search-input"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                  {/* Landmark */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                      Nearby Landmark:
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near Hope Farm Metro Station"
                      className="gd-search-input"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px' }}
                    />
                  </div>

                  {/* Pincode */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                      Pincode:
                    </label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="e.g. 560066"
                      className="gd-search-input"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: SPECIFICATIONS & AMENITIES */}
            {currentStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {/* Area Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                      Super Built-up Area (Sq.Ft) *:
                    </label>
                    <input
                      type="number"
                      value={builtupArea}
                      onChange={(e) => setBuiltupArea(e.target.value)}
                      className="gd-search-input"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                      Carpet Area (Sq.Ft):
                    </label>
                    <input
                      type="number"
                      value={carpetArea}
                      onChange={(e) => setCarpetArea(e.target.value)}
                      className="gd-search-input"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px' }}
                    />
                  </div>
                </div>

                {/* Bedrooms & Bathrooms */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                      Bedrooms (BHK):
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setBhk(n)}
                          style={{
                            flex: 1,
                            padding: '8px 0',
                            borderRadius: '6px',
                            border: bhk === n ? '2px solid var(--gd-terra-500)' : '1px solid var(--gd-border-color)',
                            background: bhk === n ? 'var(--gd-terra-50)' : 'var(--gd-surface-elevated)',
                            color: bhk === n ? 'var(--gd-terra-800)' : 'var(--gd-text-primary)',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                      Bathrooms:
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[1, 2, 3, 4].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setBathrooms(n)}
                          style={{
                            flex: 1,
                            padding: '8px 0',
                            borderRadius: '6px',
                            border: bathrooms === n ? '2px solid var(--gd-terra-500)' : '1px solid var(--gd-border-color)',
                            background: bathrooms === n ? 'var(--gd-terra-50)' : 'var(--gd-surface-elevated)',
                            color: bathrooms === n ? 'var(--gd-terra-800)' : 'var(--gd-text-primary)',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                      Balconies:
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[0, 1, 2, 3].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setBalconies(n)}
                          style={{
                            flex: 1,
                            padding: '8px 0',
                            borderRadius: '6px',
                            border: balconies === n ? '2px solid var(--gd-terra-500)' : '1px solid var(--gd-border-color)',
                            background: balconies === n ? 'var(--gd-terra-50)' : 'var(--gd-surface-elevated)',
                            color: balconies === n ? 'var(--gd-terra-800)' : 'var(--gd-text-primary)',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floor Info, Age & Furnishing */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                      Floor Number:
                    </label>
                    <input
                      type="number"
                      value={floorNo}
                      onChange={(e) => setFloorNo(Number(e.target.value))}
                      className="gd-search-input"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                      Total Floors:
                    </label>
                    <input
                      type="number"
                      value={totalFloors}
                      onChange={(e) => setTotalFloors(Number(e.target.value))}
                      className="gd-search-input"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                      Facing Direction:
                    </label>
                    <select
                      value={facing}
                      onChange={(e) => setFacing(e.target.value as any)}
                      className="gd-search-input"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px' }}
                    >
                      {['North', 'East', 'South', 'West', 'North-East', 'North-West', 'South-East', 'South-West'].map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                      Furnishing:
                    </label>
                    <select
                      value={furnishing}
                      onChange={(e) => setFurnishing(e.target.value as any)}
                      className="gd-search-input"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px' }}
                    >
                      <option value="Unfurnished">Unfurnished</option>
                      <option value="Semi-Furnished">Semi-Furnished</option>
                      <option value="Furnished">Fully Furnished</option>
                    </select>
                  </div>
                </div>

                {/* Amenities Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '10px' }}>
                    Key Amenities & Facilities:
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {COMMON_AMENITIES.map((am) => {
                      const isSelected = selectedAmenities.includes(am);
                      return (
                        <button
                          key={am}
                          type="button"
                          onClick={() => handleToggleAmenity(am)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: isSelected ? '1.5px solid var(--gd-terra-500)' : '1px solid var(--gd-border-color)',
                            background: isSelected ? 'var(--gd-terra-50)' : 'var(--gd-surface-elevated)',
                            color: isSelected ? 'var(--gd-terra-800)' : 'var(--gd-text-primary)',
                            fontSize: '12px',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span style={{ width: '12px', height: '12px', borderRadius: '2px', border: '1px solid var(--gd-border-color)', background: isSelected ? 'var(--gd-terra-500)' : 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isSelected && <Check size={10} color="#fff" />}
                          </span>
                          <span>{am}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: PRICING & AST-XGB VALUATION BENCHMARK */}
            {currentStep === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Expected Price / Rent */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                      {mode === 'buy' ? 'Total Expected Asking Price (₹) *:' : 'Monthly Expected Rent (₹) *:'}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <IndianRupee size={16} color="var(--gd-text-muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="e.g. 11500000"
                        className="gd-search-input"
                        style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '15px', fontWeight: 700 }}
                      />
                    </div>
                    {Number(price) > 0 && (
                      <span style={{ fontSize: '12px', color: 'var(--gd-terra-600)', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                        {Number(price) >= 10000000
                          ? `₹ ${(Number(price) / 10000000).toFixed(2)} Cr`
                          : `₹ ${(Number(price) / 100000).toFixed(2)} Lakhs`}
                        {Number(builtupArea) > 0 && ` (₹ ${Math.round(Number(price) / Number(builtupArea)).toLocaleString()} / sq.ft)`}
                      </span>
                    )}
                  </div>

                  {/* Monthly Maintenance */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                      Monthly Maintenance Charges (₹):
                    </label>
                    <input
                      type="number"
                      value={maintenanceCharges}
                      onChange={(e) => setMaintenanceCharges(e.target.value)}
                      placeholder="e.g. 3500"
                      className="gd-search-input"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '14px' }}
                    />
                  </div>
                </div>

                {/* Price Negotiable Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    id="isNegotiable"
                    checked={isNegotiable}
                    onChange={(e) => setIsNegotiable(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="isNegotiable" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gd-text-primary)', cursor: 'pointer' }}>
                    Price is slightly negotiable for serious buyers
                  </label>
                </div>

                {/* AST-XGB Fair Value Benchmark Evaluation Panel */}
                <div style={{ padding: '20px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(16, 185, 129, 0.08))', border: '1px solid rgba(79, 70, 229, 0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={18} color="var(--gd-ai-indigo)" />
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--gd-text-primary)' }}>
                          AST-XGB Algorithmic Fair Value Check
                        </h4>
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--gd-text-muted)' }}>
                        Compare your expected price against the XGBoost spatial baseline and 90% conformal prediction interval.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleEvaluateAiBenchmark}
                      disabled={evaluatingAi}
                      className="gd-btn-secondary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: evaluatingAi ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {evaluatingAi ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} />}
                      <span>{evaluatingAi ? 'Evaluating...' : 'Check Fair Value'}</span>
                    </button>
                  </div>

                  {aiEstimate ? (
                    <div style={{ background: 'var(--gd-surface-card)', padding: '16px', borderRadius: '10px', border: '1px solid var(--gd-border-color)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '12px' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--gd-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                            AI Fair Value
                          </span>
                          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--gd-ai-indigo)' }}>
                            {aiEstimate.formattedPrice}
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--gd-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                            90% Conformal Range
                          </span>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gd-text-primary)' }}>
                            ₹ {(aiEstimate.lower90 / 10000000).toFixed(2)} Cr – ₹ {(aiEstimate.upper90 / 10000000).toFixed(2)} Cr
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--gd-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                            Market Regime
                          </span>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>
                            {aiEstimate.regime} Regime
                          </div>
                        </div>
                      </div>

                      {/* Pricing Alignment Feedback */}
                      {Number(price) > 0 && (
                        <div style={{ fontSize: '12px', color: 'var(--gd-text-secondary)', borderTop: '1px solid var(--gd-border-subtle)', paddingTop: '10px' }}>
                          {Number(price) <= aiEstimate.upper90 && Number(price) >= aiEstimate.lower90 ? (
                            <span style={{ color: '#10b981', fontWeight: 600 }}>
                              ✓ Your asking price is well-aligned within the 90% conformal statistical confidence band.
                            </span>
                          ) : Number(price) > aiEstimate.upper90 ? (
                            <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                              ⚠ Your asking price is higher than the 90% conformal upper bound. Consider highlighting premium amenities or unique specifications.
                            </span>
                          ) : (
                            <span style={{ color: '#3b82f6', fontWeight: 600 }}>
                              ⚡ Your asking price is attractively priced below the model baseline, which may attract rapid inquiries.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--gd-text-muted)', fontStyle: 'italic' }}>
                      Click "Check Fair Value" above to see instant ML valuation for this {bhk} BHK in {locality}, {city}.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 5: PHOTOS, DESCRIPTION & CONTACT */}
            {currentStep === 5 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {/* Photo Upload Area */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)' }}>
                      Property Photos ({images.length}/10) *:
                    </label>
                    <button
                      type="button"
                      onClick={handleAddPresetPhoto}
                      style={{ fontSize: '12px', color: 'var(--gd-terra-600)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                      + Add Preset Photo
                    </button>
                  </div>

                  {/* Dropzone / Upload button */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed var(--gd-border-color)',
                      borderRadius: '12px',
                      padding: '24px',
                      textAlign: 'center',
                      background: 'var(--gd-surface-elevated)',
                      cursor: 'pointer',
                      marginBottom: '16px',
                    }}
                  >
                    <Upload size={28} color="var(--gd-terra-500)" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gd-text-primary)' }}>
                      Click to upload photos from your device
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gd-text-muted)', marginTop: '4px' }}>
                      Supports JPG, PNG, and WebP (Max 5.0 MB per image).
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </div>

                  {/* Image Thumbnails with Reorder & Delete */}
                  {images.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                      {images.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: 'relative',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            border: idx === 0 ? '2px solid var(--gd-terra-500)' : '1px solid var(--gd-border-color)',
                            height: '100px',
                          }}
                        >
                          <img
                            src={imgUrl}
                            alt={`Preview ${idx}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          {idx === 0 && (
                            <span
                              style={{
                                position: 'absolute',
                                top: '4px',
                                left: '4px',
                                background: 'var(--gd-terra-500)',
                                color: '#fff',
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              Cover
                            </span>
                          )}
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '4px',
                              right: '4px',
                              display: 'flex',
                              gap: '4px',
                            }}
                          >
                            {idx !== 0 && (
                              <button
                                type="button"
                                title="Make Cover Photo"
                                onClick={() => handleMakeCoverImage(idx)}
                                style={{
                                  background: 'rgba(0,0,0,0.6)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '2px 4px',
                                  fontSize: '10px',
                                  cursor: 'pointer',
                                }}
                              >
                                Set Cover
                              </button>
                            )}
                            <button
                              type="button"
                              title="Delete photo"
                              onClick={() => handleRemoveImage(idx)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.85)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Property Description */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
                    Property Description:
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your property highlights, nearby transit, community perks, etc."
                    className="gd-search-input"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '13px', lineHeight: '1.5' }}
                  />
                </div>

                {/* Owner Contact Information */}
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--gd-text-primary)' }}>
                    Contact Information &amp; Privacy
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--gd-text-muted)', marginBottom: '4px' }}>
                        Your Full Name *:
                      </label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="gd-search-input"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '13px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--gd-text-muted)', marginBottom: '4px' }}>
                        Mobile Phone Number *:
                      </label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="gd-search-input"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '13px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--gd-text-muted)', marginBottom: '4px' }}>
                        Email Address:
                      </label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="gd-search-input"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--gd-border-color)', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  {/* Phone Masking Privacy Checkbox */}
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="maskPhone"
                      checked={maskPhone}
                      onChange={(e) => setMaskPhone(e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <label htmlFor="maskPhone" style={{ fontSize: '12px', color: 'var(--gd-text-secondary)', cursor: 'pointer' }}>
                      <strong>Protect my contact details:</strong> Mask direct phone number from unauthenticated crawlers (require verified inquiry to connect).
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Form Footer Buttons (Step Navigation & Actions) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--gd-border-subtle)', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="gd-btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}
                  >
                    <ChevronLeft size={16} />
                    <span>Previous Step</span>
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="gd-btn-secondary"
                  style={{ padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}
                >
                  Save as Draft
                </button>

                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="gd-btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700 }}
                  >
                    <span>Next Step</span>
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleProceedToPreview}
                    className="gd-btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 800 }}
                  >
                    <Eye size={16} />
                    <span>Review &amp; Preview</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: LIVE PREVIEW MODE
           ========================================================================= */}
        {activeTab === 'preview' && (
          <div>
            {/* Live Preview Header Toolbar */}
            <div
              style={{
                background: 'var(--gd-surface-card)',
                border: '1px solid var(--gd-border-color)',
                borderRadius: '14px',
                padding: '16px 20px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="gd-badge" style={{ background: '#3b82f6', color: '#fff', fontWeight: 800 }}>
                  LIVE PREVIEW
                </span>
                <span style={{ fontSize: '13px', color: 'var(--gd-text-muted)' }}>
                  This is how buyers will see your listing. Verify all specifications before submission.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setViewTab('form')}
                  className="gd-btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}
                >
                  <Edit3 size={14} />
                  <span>Back to Edit</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAndSubmit}
                  className="gd-btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 800 }}
                >
                  <CheckCircle2 size={16} />
                  <span>Confirm &amp; Submit Listing</span>
                </button>
              </div>
            </div>

            {/* High-Fidelity Listing Display (Matching PropertyDetailPage) */}
            <div className="gd-card" style={{ padding: '28px', borderRadius: '16px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)', marginBottom: '24px' }}>
              {/* Photo Gallery Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: currentPreviewData.images.length > 1 ? '2fr 1fr' : '1fr', gap: '12px', height: '340px', borderRadius: '14px', overflow: 'hidden', marginBottom: '24px' }}>
                <img
                  src={currentPreviewData.images[0]}
                  alt="Primary Cover"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {currentPreviewData.images.length > 1 && (
                  <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '12px', height: '100%' }}>
                    <img
                      src={currentPreviewData.images[1]}
                      alt="Second Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {currentPreviewData.images[2] ? (
                      <img
                        src={currentPreviewData.images[2]}
                        alt="Third Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ background: 'var(--gd-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gd-text-muted)', fontSize: '12px' }}>
                        AST-XGB Verified Listing
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Title & Key Pricing Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <span className="gd-badge" style={{ background: 'var(--gd-terra-100)', color: 'var(--gd-terra-800)', fontWeight: 700 }}>
                      Direct {currentPreviewData.role}
                    </span>
                    <span className="gd-badge" style={{ background: 'var(--gd-surface-elevated)', color: 'var(--gd-text-muted)' }}>
                      {currentPreviewData.specs.possessionStatus}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--gd-text-primary)' }}>
                    {currentPreviewData.title}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--gd-text-muted)' }}>
                    <MapPin size={16} color="var(--gd-terra-500)" />
                    <span>{currentPreviewData.location.locality}, {currentPreviewData.location.city}</span>
                    {currentPreviewData.location.subLocality && <span>• {currentPreviewData.location.subLocality}</span>}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--gd-terra-600)' }}>
                    {currentPreviewData.priceFormatted}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--gd-text-muted)' }}>
                    ₹ {currentPreviewData.pricePerSqft.toLocaleString()} / sq ft
                  </div>
                </div>
              </div>

              {/* Key Specs Matrix */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', padding: '16px', background: 'var(--gd-surface-elevated)', borderRadius: '12px', marginBottom: '24px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--gd-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Built-up Area</span>
                  <div style={{ fontSize: '15px', fontWeight: 800 }}>{currentPreviewData.specs.builtupAreaSqft} sq.ft</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--gd-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Bedrooms</span>
                  <div style={{ fontSize: '15px', fontWeight: 800 }}>{currentPreviewData.specs.bhk} BHK</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--gd-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Bathrooms</span>
                  <div style={{ fontSize: '15px', fontWeight: 800 }}>{currentPreviewData.specs.bathrooms} Baths</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--gd-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Floor</span>
                  <div style={{ fontSize: '15px', fontWeight: 800 }}>{currentPreviewData.specs.floorNo} of {currentPreviewData.specs.totalFloors}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--gd-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Furnishing</span>
                  <div style={{ fontSize: '15px', fontWeight: 800 }}>{currentPreviewData.specs.furnishing}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--gd-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Facing</span>
                  <div style={{ fontSize: '15px', fontWeight: 800 }}>{currentPreviewData.specs.facing}</div>
                </div>
              </div>

              {/* Description & Amenities */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0' }}>About This Property</h4>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: 'var(--gd-text-secondary)' }}>
                  {currentPreviewData.description}
                </p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 10px 0' }}>Amenities</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {currentPreviewData.amenities.map((am) => (
                    <span
                      key={am}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: 'var(--gd-surface-elevated)',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: '1px solid var(--gd-border-subtle)',
                      }}
                    >
                      {am}
                    </span>
                  ))}
                </div>
              </div>

              {/* Owner Contact Preview Box */}
              <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--gd-surface-elevated)', border: '1px solid var(--gd-border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gd-text-muted)' }}>LISTED BY {currentPreviewData.role.toUpperCase()}</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gd-text-primary)' }}>{currentPreviewData.contact.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--gd-text-secondary)' }}>
                    Phone: {currentPreviewData.contact.maskPhone ? '+91 98••• ••210 (Masked for privacy)' : currentPreviewData.contact.phone}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setViewTab('form')} className="gd-btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                    Edit Details
                  </button>
                  <button type="button" onClick={handleConfirmAndSubmit} className="gd-btn-primary" style={{ padding: '8px 20px', fontSize: '13px', fontWeight: 700 }}>
                    Confirm &amp; Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: MY LISTINGS (OWNER DASHBOARD)
           ========================================================================= */}
        {activeTab === 'manage' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--gd-text-muted)' }}>
                Manage all draft and prototype listings created during this session.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setViewTab('form');
                }}
                className="gd-btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700 }}
              >
                <Plus size={16} />
                <span>Post Another Listing</span>
              </button>
            </div>

            {myListings.length === 0 ? (
              <div className="gd-card" style={{ padding: '48px', textAlign: 'center', borderRadius: '16px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)' }}>
                <Building2 size={36} color="var(--gd-text-muted)" style={{ margin: '0 auto 12px auto' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0' }}>No Listings Found</h3>
                <p style={{ fontSize: '13px', color: 'var(--gd-text-muted)', margin: '0 0 20px 0' }}>
                  You have not created any property listings yet in this browser session.
                </p>
                <button
                  type="button"
                  onClick={() => setViewTab('form')}
                  className="gd-btn-primary"
                  style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 700 }}
                >
                  Create Your First Listing
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {myListings.map((item) => (
                  <div
                    key={item.id}
                    className="gd-card"
                    style={{
                      padding: '20px',
                      borderRadius: '14px',
                      background: 'var(--gd-surface-card)',
                      border: '1px solid var(--gd-border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <img
                        src={item.images[0] || PRESET_DEMO_IMAGES[0]}
                        alt={item.title}
                        style={{ width: '100px', height: '80px', borderRadius: '8px', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: item.status === 'submitted' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: item.status === 'submitted' ? '#10b981' : '#f59e0b',
                            }}
                          >
                            {item.status === 'submitted' ? 'Submitted (Prototype Sync)' : 'Draft'}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--gd-text-muted)' }}>
                            ID: {item.id} • {item.location.city}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--gd-text-primary)' }}>
                          {item.title}
                        </h4>
                        <div style={{ fontSize: '13px', color: 'var(--gd-text-muted)' }}>
                          <strong>{item.priceFormatted}</strong> (₹ {item.pricePerSqft.toLocaleString()} / sq.ft) • {item.specs.bhk} BHK • {item.specs.builtupAreaSqft} sq.ft
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link
                        to={`/property/${item.slug}`}
                        className="gd-btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', fontSize: '12px', textDecoration: 'none', fontWeight: 600 }}
                      >
                        <Eye size={14} />
                        <span>Public View</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleEditExisting(item)}
                        className="gd-btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', fontSize: '12px', fontWeight: 600 }}
                      >
                        <Edit3 size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteListing(item.id)}
                        className="gd-btn-secondary"
                        style={{ color: '#ef4444', padding: '8px 10px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 4: CONFIRMATION SCREEN
           ========================================================================= */}
        {activeTab === 'confirmed' && (
          <div className="gd-card" style={{ padding: '48px', borderRadius: '16px', background: 'var(--gd-surface-card)', border: '1px solid var(--gd-border-color)', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--gd-text-primary)' }}>
              Listing Saved to Local Prototype Adapter!
            </h2>
            <p style={{ color: 'var(--gd-text-secondary)', fontSize: '14px', maxWidth: '560px', margin: '0 auto 20px auto', lineHeight: '1.6' }}>
              Your listing reference <strong>{confirmedId}</strong> has been successfully cached and added to the local discovery index. Prospective buyers in your session can now find it via Search and Property Details.
            </p>

            <div style={{ background: 'var(--gd-surface-elevated)', padding: '14px 20px', borderRadius: '10px', maxWidth: '540px', margin: '0 auto 28px auto', fontSize: '12px', color: 'var(--gd-text-muted)', textAlign: 'left' }}>
              <strong>Production Cloud Sync Notice:</strong>
              <div style={{ marginTop: '4px', lineHeight: '1.5' }}>
                Because the backend is configured in statutory inference mode without live cloud database storage, this listing is currently stored client-side. To persist listings across multi-tenant user accounts and cloud storage, implement the endpoints documented in <code style={{ color: 'var(--gd-terra-600)' }}>docs/listing-api-contract.md</code>.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setViewTab('manage')}
                className="gd-btn-secondary"
                style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 600 }}
              >
                View in My Listings
              </button>
              <Link
                to="/search"
                className="gd-btn-primary"
                style={{ padding: '10px 22px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}
              >
                Search Listings Index
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
