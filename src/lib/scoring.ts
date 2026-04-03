import type { Lead, CategoryId, ScoreTier } from './types';
import { TIER1_ZIPS, TIER2_ZIPS } from './constants';

const CATEGORY_BASE_POINTS: Record<CategoryId, number> = {
  fc: 15, tx: 12, cv: 10, pb: 8, vc: 8, dv: 8, ex: 7, fs: 5,
};

const KEYWORD_BONUSES: [RegExp, number][] = [
  [/foreclosure|sheriff sale|lis pendens/i, 6],
  [/condemned|uninhabitable/i, 5],
  [/tax lien|tax sale|delinquent tax|upset sale/i, 5],
  [/vacant|abandoned|blighted|boarded/i, 4],
  [/behind on payments|default|delinquent mortgage/i, 4],
  [/code violation|failed inspection/i, 3],
  [/probate|estate|inherited|deceased/i, 3],
  [/divorce|separation/i, 3],
  [/fire damage|flood damage|mold/i, 3],
  [/eviction|non-paying/i, 2],
  [/expired|withdrawn|price reduction/i, 2],
];

function distressScore(lead: Lead): number {
  let score = CATEGORY_BASE_POINTS[lead.categoryId] ?? 5;
  const text = `${lead.title} ${lead.details}`.toLowerCase();
  for (const [pattern, points] of KEYWORD_BONUSES) {
    if (pattern.test(text)) score += points;
  }
  return Math.min(score, 40);
}

function propertyScore(lead: Lead): number {
  let score = 0;
  if (TIER1_ZIPS.includes(lead.zip)) score += 10;
  else if (TIER2_ZIPS.includes(lead.zip)) score += 6;
  else score += 3;

  const text = `${lead.title} ${lead.details}`.toLowerCase();
  if (/multi.?family|duplex|triplex/i.test(text)) score += 8;
  else if (/single.?family/i.test(text)) score += 5;
  if (/\b(19[0-9]{2}|200[0-9]|201[0-4])\b/.test(lead.details)) score += 5;
  if (/absentee|out.of.state/i.test(text)) score += 5;
  return Math.min(score, 25);
}

function equityScore(lead: Lead): number {
  let score = 0;
  const text = `${lead.title} ${lead.details}`.toLowerCase();
  if (/free and clear|paid off/i.test(text)) score += 10;
  if (/equity/i.test(text)) score += 6;
  if (/behind on payments/i.test(text)) score += 8;
  if (/tax sale|upset sale/i.test(text)) score += 10;
  return Math.min(score, 20);
}

function dataQualityScore(lead: Lead): number {
  let score = 0;
  if (/\d+\s+\w+/.test(lead.title)) score += 5;
  if (lead.skipTrace?.phones?.length) score += 4;
  if (lead.sourceUrl) score += 3;
  const age = (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (age < 30) score += 3;
  return Math.min(score, 15);
}

function stackingBonus(lead: Lead): number {
  const extra = (lead.stackCount ?? 1) - 1;
  return Math.min(extra * 5, 15);
}

export interface ScoreBreakdown {
  distress: number;
  property: number;
  equity: number;
  quality: number;
  stacking: number;
}

export function scoreLead(lead: Lead): { score: number; tier: ScoreTier; breakdown: ScoreBreakdown } {
  const distress = distressScore(lead);
  const property = propertyScore(lead);
  const equity = equityScore(lead);
  const quality = dataQualityScore(lead);
  const stacking = stackingBonus(lead);
  const score = Math.min(100, distress + property + equity + quality + stacking);
  let tier: ScoreTier;
  if (score >= 75) tier = 'hot';
  else if (score >= 50) tier = 'warm';
  else if (score >= 25) tier = 'cool';
  else tier = 'cold';
  return { score, tier, breakdown: { distress, property, equity, quality, stacking } };
}
