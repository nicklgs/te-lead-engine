import { NextResponse } from 'next/server';
import { scrubLeads } from '@/lib/ai';
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

    const { leads: rawLeads, demoMode, error } = await scrubLeads(zips, categories as CategoryId[]);

    // If no real data source configured, return immediately without saving anything
    if (demoMode) {
      return NextResponse.json({
        leadsFound: 0,
        newLeads: 0,
        leads: [],
        demoMode: true,
        configError: error,
      });
    }

    if (rawLeads.length === 0) {
      return NextResponse.json({ leadsFound: 0, newLeads: 0, leads: [], demoMode: false });
    }

    // Convert to full Lead objects for scoring and stacking
    const now = new Date();
    const leadsWithIds: Lead[] = rawLeads.map((raw, i) => ({
      ...raw,
      id: `temp-${Date.now()}-${i}`,
      createdAt: now,
      updatedAt: now,
    }));

    for (const lead of leadsWithIds) {
      const { score, tier } = scoreLead(lead);
      lead.score = score;
      lead.scoreTier = tier;
    }

    const stackedLeads = stackLeads(leadsWithIds);

    for (const lead of stackedLeads) {
      const { score, tier } = scoreLead(lead);
      lead.score = score;
      lead.scoreTier = tier;
    }

    const savedLeads: Lead[] = [];
    for (const lead of stackedLeads) {
      try {
        const { id, createdAt, updatedAt, ...leadData } = lead;
        const firebaseId = await addLead(leadData);
        savedLeads.push({ ...lead, id: firebaseId });
      } catch {
        savedLeads.push(lead);
      }
    }

    return NextResponse.json({
      leadsFound: rawLeads.length,
      newLeads: stackedLeads.length,
      leads: savedLeads,
      demoMode: false,
    });
  } catch (error) {
    console.error('Scrub API error:', error);
    return NextResponse.json(
      { error: 'Failed to run scrub' },
      { status: 500 }
    );
  }
}
