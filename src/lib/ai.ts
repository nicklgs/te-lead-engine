// AI / data-source helpers
// Real scrub: set BATCHLEADS_API_KEY in .env.local (or Vercel env vars)
// Skip trace / comps: set ANTHROPIC_API_KEY for live AI lookups (simulated otherwise)

import type { Lead, SkipTrace, Comps, Buyer, CategoryId } from './types';
import { CATEGORY_MAP, ZIP_TIERS } from './constants';

// ---------------------------------------------------------------------------
// Category → BatchLeads filter mapping
// ---------------------------------------------------------------------------
const CAT_TO_BATCHLEADS: Record<CategoryId, Record<string, unknown>> = {
  tx: { taxDelinquent: true },
  fc: { preForeclosure: true },
  cv: { codeViolation: true },
  pb: { probate: true },
  vc: { vacant: true },
  fs: { listingStatus: 'FSBO' },
  dv: { divorce: true },
  ex: { listingStatus: 'Expired' },
};

// ---------------------------------------------------------------------------
// Real scrub via BatchLeads API
// ---------------------------------------------------------------------------
export async function scrubLeads(
  zips: string[],
  categories: CategoryId[]
): Promise<{ leads: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>[]; demoMode: boolean; error?: string }> {
  const apiKey = process.env.BATCHLEADS_API_KEY;

  if (!apiKey) {
    return { leads: [], demoMode: true, error: 'No data source configured. Add BATCHLEADS_API_KEY to enable real scrubs.' };
  }

  const leads: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  for (const catId of categories) {
    const cat = CATEGORY_MAP[catId];
    if (!cat) continue;
    const filters = CAT_TO_BATCHLEADS[catId];

    try {
      const res = await fetch('https://api.batchleads.io/v2/lists/build', {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: {
            state: 'PA',
            county: 'Delaware',
            zipCodes: zips,
            ...filters,
          },
          page: 1,
          perPage: 50,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(`BatchLeads error for ${catId}:`, res.status, text);
        continue;
      }

      const data = await res.json();
      const properties: Record<string, unknown>[] = data.properties || data.results || data.data || [];

      for (const prop of properties) {
        const addr = [prop.address, prop.streetAddress, prop.propertyAddress]
          .find((a) => typeof a === 'string' && a.trim()) as string | undefined;
        if (!addr) continue;

        const zip = String(prop.zip || prop.zipCode || prop.postalCode || '');
        const area = ZIP_TIERS.find((z) => z.zip === zip)?.area || 'Delaware County';

        leads.push({
          title: `${addr}, ${area}, PA ${zip}`,
          category: cat.label,
          categoryId: catId,
          location: `${area}, PA ${zip}`,
          zip,
          details: buildDetails(prop, catId),
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
            text: `Lead discovered via BatchLeads ${cat.label} scrub`,
            date: new Date(),
          }],
        });
      }
    } catch (err) {
      console.error(`BatchLeads fetch failed for ${catId}:`, err);
    }
  }

  return { leads, demoMode: false };
}

function buildDetails(prop: Record<string, unknown>, catId: CategoryId): string {
  const parts: string[] = [];

  if (catId === 'tx') {
    const amt = prop.taxDelinquentAmount || prop.delinquentAmount;
    const yr = prop.taxDelinquentYear || prop.delinquentSince;
    if (amt) parts.push(`Tax delinquent $${Number(amt).toLocaleString()}`);
    if (yr) parts.push(`since ${yr}`);
  } else if (catId === 'fc') {
    const date = prop.foreclosureDate || prop.lisPendensDate;
    if (date) parts.push(`Lis pendens filed ${date}`);
    const lender = prop.lender || prop.foreclosingLender;
    if (lender) parts.push(`Lender: ${lender}`);
  } else if (catId === 'pb') {
    const date = prop.probateDate || prop.probateFiledDate;
    if (date) parts.push(`Probate filed ${date}`);
  } else if (catId === 'vc') {
    const since = prop.vacantSince || prop.vacantDate;
    if (since) parts.push(`Vacant since ${since}`);
  } else if (catId === 'ex') {
    const dom = prop.daysOnMarket || prop.expiredDom;
    if (dom) parts.push(`${dom} days on market`);
    const price = prop.listPrice || prop.lastListPrice;
    if (price) parts.push(`Listed at $${Number(price).toLocaleString()}`);
  }

  const sqft = prop.squareFeet || prop.sqft || prop.buildingSize;
  const beds = prop.bedrooms || prop.beds;
  const baths = prop.bathrooms || prop.baths;
  if (beds || baths) parts.push(`${beds ?? '?'}bd/${baths ?? '?'}ba${sqft ? ` · ${sqft} sqft` : ''}`);

  const yr = prop.yearBuilt;
  if (yr) parts.push(`Built ${yr}`);

  return parts.join(' · ') || 'Distressed property identified via public records';
}

// ---------------------------------------------------------------------------
// Simulated skip trace (demo — replace with real API when ANTHROPIC_API_KEY set)
// ---------------------------------------------------------------------------
const DEMO_OWNERS = [
  'James Wilson', 'Maria Rodriguez', 'Robert Chen', 'Patricia Davis', 'Michael Brown',
  'Linda Thompson', 'David Garcia', 'Susan Martinez', 'William Johnson', 'Jennifer Lee',
  'Charles Williams', 'Karen Taylor', 'Joseph Anderson', 'Margaret Thomas', 'Richard Jackson',
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone(): string {
  return `(484) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
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

// ---------------------------------------------------------------------------
// Simulated comps (demo)
// ---------------------------------------------------------------------------
export async function simulateComps(lead: Lead): Promise<Comps> {
  await new Promise(r => setTimeout(r, 2000));
  const basePrice = Math.floor(Math.random() * 100000) + 80000;
  const streets = ['Walnut St', 'Chester Ave', 'Providence Rd', 'Baltimore Pike', 'Market St', 'Highland Ave'];
  const comps = Array.from({ length: Math.floor(Math.random() * 3) + 3 }, () => {
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

// ---------------------------------------------------------------------------
// Simulated buyer finder (demo)
// ---------------------------------------------------------------------------
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
