import { NextResponse } from 'next/server';
import { simulateScrub } from '@/lib/ai';
import { scoreLead } from '@/lib/scoring';
import { stackLeads } from '@/lib/stacking';
import { addLead } from '@/lib/firebase';
import type { Lead, CategoryId } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { zips, categories } = body as { zips: string[]; categories: string[] };

    if (!zips?.length || !categories?.length) {
      return NextResponse.json(
        { error: 'zips and categories are required' },
        { status: 400 }
      );
    }

    // Run simulated scrub
    const rawLeads = await simulateScrub(zips, categories as CategoryId[]);

    // Convert to full Lead objects with temporary ids for scoring and stacking
    const now = new Date();
    const leadsWithIds: Lead[] = rawLeads.map((raw, i) => ({
      ...raw,
      id: `temp-${Date.now()}-${i}`,
      createdAt: now,
      updatedAt: now,
    }));

    // Score each lead
    for (const lead of leadsWithIds) {
      const { score, tier } = scoreLead(lead);
      lead.score = score;
      lead.scoreTier = tier;
    }

    // Run list stacking to merge duplicates
    const stackedLeads = stackLeads(leadsWithIds);

    // Re-score after stacking (stack count affects score)
    for (const lead of stackedLeads) {
      const { score, tier } = scoreLead(lead);
      lead.score = score;
      lead.scoreTier = tier;
    }

    // Try to save each lead to Firebase
    const savedLeads: Lead[] = [];
    for (const lead of stackedLeads) {
      try {
        const { id, createdAt, updatedAt, ...leadData } = lead;
        const firebaseId = await addLead(leadData);
        savedLeads.push({ ...lead, id: firebaseId });
      } catch {
        // Firebase not configured or save failed — keep the lead with temp id
        savedLeads.push(lead);
      }
    }

    return NextResponse.json({
      leadsFound: rawLeads.length,
      newLeads: stackedLeads.length,
      leads: savedLeads,
    });
  } catch (error) {
    console.error('Scrub API error:', error);
    return NextResponse.json(
      { error: 'Failed to run scrub' },
      { status: 500 }
    );
  }
}
