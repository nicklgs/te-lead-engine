// AI helper — currently returns simulated results.
// When ANTHROPIC_API_KEY is configured, swap to real Claude API calls.

import type { Lead, SkipTrace, Comps, Buyer, CategoryId } from './types';
import { CATEGORY_MAP, ZIP_TIERS } from './constants';

// Simulated scrub results for demo
const DEMO_ADDRESSES: Record<string, string[]> = {
  '19013': ['412 W 3rd St', '1025 Morton Ave', '618 Kerlin St', '329 E 22nd St', '810 Highland Ave', '1442 Upland St'],
  '19023': ['227 Pine St', '401 Main St', '145 Chester Pike', '812 Cypress St', '534 Oak Ln'],
  '19082': ['6820 Market St', '143 S 69th St', '301 Long Ln', '7025 Terminal Sq', '425 Garrett Rd'],
  '19026': ['740 Burmont Rd', '215 Shadeland Ave', '432 State Rd', '1001 Childs Ave'],
  '19050': ['120 Lansdowne Ave', '45 Baltimore Ave', '312 Owen Ave', '88 Nyack Ave'],
};

const DEMO_OWNERS = [
  'James Wilson', 'Maria Rodriguez', 'Robert Chen', 'Patricia Davis', 'Michael Brown',
  'Linda Thompson', 'David Garcia', 'Susan Martinez', 'William Johnson', 'Jennifer Lee',
  'Charles Williams', 'Karen Taylor', 'Joseph Anderson', 'Margaret Thomas', 'Richard Jackson',
];

const DEMO_DETAILS: Record<CategoryId, string[]> = {
  tx: ['Delinquent property taxes since 2022, $4,200 owed', 'Tax lien filed, upset sale scheduled Q2 2026', 'Behind on property taxes 3 years, $8,100 total'],
  fc: ['Lis pendens filed Jan 2026, mortgage default', 'Pre-foreclosure notice, sheriff sale pending', 'Behind on payments 6 months, foreclosure filing'],
  cv: ['Multiple code violations, condemned property', 'Failed inspection — electrical and plumbing', 'Code enforcement action, boarded windows'],
  pb: ['Inherited property, probate filed Oct 2025', 'Estate sale — deceased owner, orphans court', 'Probate property, heirs seeking quick sale'],
  vc: ['Vacant 18+ months, abandoned, mail returned', 'Blighted property, vacant and boarded', 'Abandoned property, water shut off 2024'],
  fs: ['FSBO listing, 120 days on market, no offers', 'For sale by owner, motivated seller', 'FSBO — owner relocating, priced to sell'],
  dv: ['Divorce filing, court-ordered property sale', 'Separation — both parties want to sell quickly', 'Divorce decree requires property liquidation'],
  ex: ['Expired MLS listing, 180 days, two price reductions', 'Withdrawn from MLS, agent dropped listing', 'Expired listing, originally listed at $185K'],
};

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone(): string {
  return `(484) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

export async function simulateScrub(zips: string[], categories: CategoryId[]): Promise<Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>[]> {
  // Simulate API delay
  await new Promise(r => setTimeout(r, 1500));

  const leads: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  for (const zip of zips) {
    const addresses = DEMO_ADDRESSES[zip] || [`${Math.floor(Math.random() * 900) + 100} Main St`];
    for (const catId of categories) {
      const cat = CATEGORY_MAP[catId];
      if (!cat) continue;
      const numLeads = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numLeads; i++) {
        const addr = randomFrom(addresses);
        const area = ZIP_TIERS.find(z => z.zip === zip)?.area || 'Delaware County';
        leads.push({
          title: `${addr}, ${area}, PA ${zip}`,
          category: cat.label,
          categoryId: catId,
          location: `${area}, PA ${zip}`,
          zip,
          details: randomFrom(DEMO_DETAILS[catId] || ['Distressed property identified via public records']),
          sourceUrl: '',
          source: 'scrub',
          stage: 'new',
          followUp: null,
          stackedCategories: [catId],
          stackedLabels: [cat.label],
          stackCount: 1,
          isDuplicate: false,
          stackedInto: null,
          skipTrace: null,
          comps: null,
          offer: null,
          activities: [{
            id: 1,
            type: 'note',
            text: `Lead discovered via ${cat.label} scrub`,
            date: new Date(),
          }],
        });
      }
    }
  }

  return leads;
}

export async function simulateSkipTrace(lead: Lead): Promise<SkipTrace> {
  await new Promise(r => setTimeout(r, 2000));
  const owner = randomFrom(DEMO_OWNERS);
  return {
    owner,
    phones: [randomPhone(), Math.random() > 0.5 ? randomPhone() : ''].filter(Boolean),
    emails: [`${owner.toLowerCase().replace(' ', '.')}@gmail.com`],
    mailingAddress: Math.random() > 0.3
      ? `${Math.floor(Math.random() * 900) + 100} ${randomFrom(['Oak', 'Maple', 'Cedar', 'Pine', 'Elm'])} ${randomFrom(['St', 'Ave', 'Dr', 'Ln'])}, ${randomFrom(['Media', 'Springfield', 'Havertown'])}, PA`
      : lead.title,
    relatives: `${randomFrom(DEMO_OWNERS)}, ${randomFrom(DEMO_OWNERS)}`,
    notes: `Owner identified via public records. Property ${Math.random() > 0.5 ? 'appears owner-occupied' : 'appears absentee-owned'}.`,
    timestamp: new Date(),
  };
}

export async function simulateComps(lead: Lead): Promise<Comps> {
  await new Promise(r => setTimeout(r, 2000));
  const basePrice = Math.floor(Math.random() * 100000) + 80000;
  const streets = ['Walnut St', 'Chester Ave', 'Providence Rd', 'Baltimore Pike', 'Market St', 'Highland Ave'];
  const comps = Array.from({ length: Math.floor(Math.random() * 3) + 3 }, (_, i) => {
    const price = basePrice + Math.floor((Math.random() - 0.5) * 40000);
    const months = Math.floor(Math.random() * 8) + 1;
    const d = new Date();
    d.setMonth(d.getMonth() - months);
    return {
      address: `${Math.floor(Math.random() * 900) + 100} ${randomFrom(streets)}, PA`,
      soldPrice: `$${price.toLocaleString()}`,
      saleDate: d.toLocaleDateString(),
      bedBath: `${Math.floor(Math.random() * 2) + 2}bd/${Math.floor(Math.random() * 2) + 1}ba`,
      sqft: `${Math.floor(Math.random() * 800) + 900}`,
    };
  });

  const prices = comps.map(c => parseInt(c.soldPrice.replace(/[$,]/g, '')));
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const spread = Math.max(...prices) - Math.min(...prices);
  const confidence = spread < 30000 ? 'high' : spread < 60000 ? 'medium' : 'low';

  return {
    estimatedArv: avg,
    confidence: confidence as 'high' | 'medium' | 'low',
    comparables: comps,
    timestamp: new Date(),
  };
}

export async function simulateFindBuyers(zips: string[]): Promise<Omit<Buyer, 'id' | 'createdAt'>[]> {
  await new Promise(r => setTimeout(r, 2000));
  const types = ['flipper', 'landlord', 'developer', 'hedge_fund'] as const;
  const llcNames = ['Keystone Capital LLC', 'DelCo Properties LLC', 'Main Line Investments', 'Chester Housing Group',
    'PA Property Solutions', 'Liberty Home Buyers LLC', 'Patriot Real Estate Holdings', 'Tri-State Flip Co'];

  return Array.from({ length: Math.floor(Math.random() * 4) + 3 }, () => {
    const type = randomFrom([...types]);
    const name = randomFrom(llcNames);
    const low = Math.floor(Math.random() * 50 + 50) * 1000;
    const high = low + Math.floor(Math.random() * 100 + 50) * 1000;
    return {
      name,
      type,
      priceRange: `$${(low / 1000).toFixed(0)}K - $${(high / 1000).toFixed(0)}K`,
      properties: `${Math.floor(Math.random() * 20) + 1} purchases in past 12 months`,
      contact: randomPhone(),
      notes: `Active ${type} in ${zips.map(z => z).join(', ')} area. Cash buyer.`,
    };
  });
}
