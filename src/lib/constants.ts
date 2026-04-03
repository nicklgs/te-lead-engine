import type { CategoryId, LeadStage, BuyerType } from './types';

// Brand Colors
export const colors = {
  navy: '#1B2A4A',
  gold: '#B8985A',
  cream: '#FDFBF7',
  warmWhite: '#FFFDF9',
  sand: '#F4EFE7',
  red: '#8B1A1A',
  green: '#2D7A4F',
} as const;

// Lead Categories
export const CATEGORIES: { id: CategoryId; label: string; icon: string }[] = [
  { id: 'tx', label: 'Tax Delinquent', icon: '💰' },
  { id: 'fc', label: 'Pre-Foreclosure', icon: '🏚️' },
  { id: 'cv', label: 'Code Violations', icon: '⚠️' },
  { id: 'pb', label: 'Probate/Estate', icon: '📜' },
  { id: 'vc', label: 'Vacant', icon: '🏗️' },
  { id: 'fs', label: 'FSBO', icon: '🏷️' },
  { id: 'dv', label: 'Divorce', icon: '⚖️' },
  { id: 'ex', label: 'Expired Listing', icon: '📋' },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

// Pipeline Stages
export const STAGES: { id: LeadStage; label: string; color: string }[] = [
  { id: 'new', label: 'New', color: '#6366f1' },
  { id: 'contacted', label: 'Contacted', color: '#3b82f6' },
  { id: 'appt', label: 'Appointment', color: '#f59e0b' },
  { id: 'offer', label: 'Offer Made', color: '#f97316' },
  { id: 'contract', label: 'Under Contract', color: '#10b981' },
  { id: 'closed', label: 'Closed', color: '#2D7A4F' },
  { id: 'dead', label: 'Dead', color: '#6b7280' },
];

export const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.id, s]));

// Zip Code Tiers
export const ZIP_TIERS: { tier: 1 | 2 | 3; zip: string; area: string }[] = [
  // Tier 1
  { tier: 1, zip: '19013', area: 'Chester City' },
  { tier: 1, zip: '19023', area: 'Darby' },
  { tier: 1, zip: '19082', area: 'Upper Darby' },
  { tier: 1, zip: '19026', area: 'Drexel Hill' },
  // Tier 2
  { tier: 2, zip: '19083', area: 'Havertown' },
  { tier: 2, zip: '19064', area: 'Springfield' },
  { tier: 2, zip: '19063', area: 'Media' },
  { tier: 2, zip: '19050', area: 'Lansdowne' },
  { tier: 2, zip: '19078', area: 'Ridley Park' },
  { tier: 2, zip: '19018', area: 'Clifton Heights' },
  // Tier 3
  ...['19014','19015','19022','19029','19032','19033','19036','19039','19041','19043','19060','19061','19070','19073','19074','19076','19079','19081','19086','19094']
    .map(zip => ({ tier: 3 as const, zip, area: 'Delaware County' })),
];

export const ALL_ZIPS = ZIP_TIERS.map(z => z.zip);
export const TIER1_ZIPS = ZIP_TIERS.filter(z => z.tier === 1).map(z => z.zip);
export const TIER2_ZIPS = ZIP_TIERS.filter(z => z.tier === 2).map(z => z.zip);

export function getZipTier(zip: string): 1 | 2 | 3 {
  const entry = ZIP_TIERS.find(z => z.zip === zip);
  return entry?.tier ?? 3;
}

export function getZipArea(zip: string): string {
  return ZIP_TIERS.find(z => z.zip === zip)?.area ?? 'Delaware County';
}

// Buyer Types
export const BUYER_TYPES: { id: BuyerType; label: string }[] = [
  { id: 'flipper', label: 'Flipper' },
  { id: 'landlord', label: 'Landlord' },
  { id: 'developer', label: 'Developer' },
  { id: 'hedge_fund', label: 'Hedge Fund' },
];

// Source Types for manual add
export const SOURCE_TYPES = [
  { id: 'manual' as const, label: 'Driving for Dollars', icon: '🚗' },
  { id: 'website' as const, label: 'Website', icon: '🌐' },
  { id: 'referral' as const, label: 'Referral', icon: '🤝' },
  { id: 'phone' as const, label: 'Inbound Call', icon: '📞' },
];

// Skip Trace Manual Lookup Links
export const SKIP_TRACE_LINKS = [
  { name: 'TruePeopleSearch', url: 'https://www.truepeoplesearch.com/' },
  { name: 'FastPeopleSearch', url: 'https://www.fastpeoplesearch.com/' },
  { name: 'ThatsThem', url: 'https://thatsthem.com/' },
  { name: 'SpyDialer', url: 'https://www.spydialer.com/' },
  { name: 'DelCo Property Records', url: 'https://delcorealestate.co.delaware.pa.us/' },
  { name: 'DelCo Recorder of Deeds', url: 'https://delaware.pa.publicsearch.us/' },
  { name: 'DelCo Tax Claim Bureau', url: 'https://delcopa.gov/treasurer/backyeartaxes' },
];
