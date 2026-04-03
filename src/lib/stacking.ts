import type { Lead, CategoryId } from './types';
import { CATEGORY_MAP } from './constants';

export function normalizeAddress(addr: string): string {
  return addr
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 25);
}

export function stackLeads(leads: Lead[]): Lead[] {
  const groups = new Map<string, Lead[]>();

  for (const lead of leads) {
    const key = normalizeAddress(lead.title);
    if (!key) continue;
    const group = groups.get(key) || [];
    group.push(lead);
    groups.set(key, group);
  }

  const result: Lead[] = [];

  for (const group of groups.values()) {
    if (group.length === 1) {
      const lead = group[0];
      lead.stackedCategories = [lead.categoryId];
      lead.stackedLabels = [lead.category];
      lead.stackCount = 1;
      lead.isDuplicate = false;
      lead.stackedInto = null;
      result.push(lead);
      continue;
    }

    // Sort by creation date, oldest first = primary
    group.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const primary = group[0];

    const categoryIds = new Set<CategoryId>();
    const categoryLabels = new Set<string>();

    for (const lead of group) {
      categoryIds.add(lead.categoryId);
      categoryLabels.add(lead.category || CATEGORY_MAP[lead.categoryId]?.label || lead.categoryId);
    }

    primary.stackedCategories = [...categoryIds];
    primary.stackedLabels = [...categoryLabels];
    primary.stackCount = categoryIds.size;
    primary.isDuplicate = false;
    primary.stackedInto = null;

    // Merge details from duplicates
    for (let i = 1; i < group.length; i++) {
      const dup = group[i];
      if (dup.details && !primary.details.includes(dup.details)) {
        primary.details += `\n---\n${dup.category}: ${dup.details}`;
      }
      if (dup.skipTrace && !primary.skipTrace) {
        primary.skipTrace = dup.skipTrace;
      }
      dup.isDuplicate = true;
      dup.stackedInto = primary.id;
    }

    result.push(primary);
  }

  return result;
}
