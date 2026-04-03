// TE Lead Engine — TypeScript Interfaces

export interface SkipTrace {
  owner: string;
  phones: string[];
  emails: string[];
  mailingAddress: string;
  relatives: string;
  notes: string;
  timestamp: Date;
}

export interface Comparable {
  address: string;
  soldPrice: string;
  saleDate: string;
  bedBath: string;
  sqft: string;
}

export interface Comps {
  estimatedArv: number;
  confidence: 'high' | 'medium' | 'low';
  comparables: Comparable[];
  timestamp: Date;
}

export interface Offer {
  arv: number;
  repairs: number;
  wholesaleFee: number;
  holdingCosts: number;
  maxOffer: number;
}

export interface Activity {
  id: number;
  type: 'note' | 'stage' | 'skip_trace' | 'comps' | 'offer' | 'followup' | 'call' | 'text';
  text: string;
  date: Date;
}

export type LeadStage = 'new' | 'contacted' | 'appt' | 'offer' | 'contract' | 'closed' | 'dead';
export type LeadSource = 'scrub' | 'manual' | 'website' | 'referral' | 'phone';
export type CategoryId = 'fc' | 'tx' | 'cv' | 'pb' | 'vc' | 'fs' | 'dv' | 'ex';
export type ScoreTier = 'hot' | 'warm' | 'cool' | 'cold';

export interface Lead {
  id: string;
  title: string;
  category: string;
  categoryId: CategoryId;
  location: string;
  zip: string;
  details: string;
  sourceUrl: string;
  source: LeadSource;
  stage: LeadStage;
  followUp: Date | null;
  stackedCategories: CategoryId[];
  stackedLabels: string[];
  stackCount: number;
  isDuplicate: boolean;
  stackedInto: string | null;
  skipTrace: SkipTrace | null;
  comps: Comps | null;
  offer: Offer | null;
  activities: Activity[];
  score?: number;
  scoreTier?: ScoreTier;
  createdAt: Date;
  updatedAt: Date;
}

export type BuyerType = 'flipper' | 'landlord' | 'developer' | 'hedge_fund';

export interface Buyer {
  id: string;
  name: string;
  type: BuyerType;
  priceRange: string;
  properties: string;
  contact: string;
  notes: string;
  createdAt: Date;
}

export interface ScrubHistory {
  id: string;
  date: Date;
  zipsSearched: string[];
  categoriesSearched: string[];
  leadsFound: number;
  newLeads: number;
  duration: number;
}
