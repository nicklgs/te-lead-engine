import { NextResponse } from 'next/server';
import { simulateSkipTrace } from '@/lib/ai';
import { updateLead } from '@/lib/firebase';
import type { Lead } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { leadId, leadTitle, leadDetails } = body as {
      leadId: string;
      leadTitle: string;
      leadDetails: string;
    };

    if (!leadId || !leadTitle) {
      return NextResponse.json(
        { error: 'leadId and leadTitle are required' },
        { status: 400 }
      );
    }

    // Build a minimal lead object for the simulator
    const leadStub = { title: leadTitle, details: leadDetails || '' } as Lead;

    // Run simulated skip trace
    const skipTrace = await simulateSkipTrace(leadStub);

    // Try to update the lead in Firebase
    try {
      await updateLead(leadId, {
        skipTrace,
        activities: [{
          id: Date.now(),
          type: 'skip_trace',
          text: `Skip trace completed — owner: ${skipTrace.owner}`,
          date: new Date(),
        }] as Lead['activities'],
      });
    } catch {
      // Firebase not configured — still return the data
      console.warn('Could not save skip trace to Firebase');
    }

    return NextResponse.json({
      leadId,
      skipTrace,
    });
  } catch (error) {
    console.error('Skip trace API error:', error);
    return NextResponse.json(
      { error: 'Failed to run skip trace' },
      { status: 500 }
    );
  }
}
