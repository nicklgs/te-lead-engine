import { NextResponse } from 'next/server';
import { simulateComps } from '@/lib/ai';
import { updateLead } from '@/lib/firebase';
import type { Lead } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { leadId, leadTitle } = body as {
      leadId: string;
      leadTitle: string;
    };

    if (!leadId || !leadTitle) {
      return NextResponse.json(
        { error: 'leadId and leadTitle are required' },
        { status: 400 }
      );
    }

    // Build a minimal lead object for the simulator
    const leadStub = { title: leadTitle } as Lead;

    // Run simulated comps analysis
    const comps = await simulateComps(leadStub);

    // Try to update the lead in Firebase
    try {
      await updateLead(leadId, {
        comps,
        activities: [{
          id: Date.now(),
          type: 'comps',
          text: `Comps analysis completed — ARV: $${comps.estimatedArv.toLocaleString()} (${comps.confidence} confidence)`,
          date: new Date(),
        }] as Lead['activities'],
      });
    } catch {
      // Firebase not configured — still return the data
      console.warn('Could not save comps to Firebase');
    }

    return NextResponse.json({
      leadId,
      comps,
    });
  } catch (error) {
    console.error('Comps API error:', error);
    return NextResponse.json(
      { error: 'Failed to run comps analysis' },
      { status: 500 }
    );
  }
}
