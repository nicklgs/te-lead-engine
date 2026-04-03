import { NextResponse } from 'next/server';
import { scoreLead } from '@/lib/scoring';
import { addLead } from '@/lib/firebase';
import type { Lead } from '@/lib/types';

interface WebsiteLeadBody {
  address: string;
  name: string;
  phone: string;
  email: string;
  situation: string;
  notes: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WebsiteLeadBody;
    const { address, name, phone, email, situation, notes } = body;

    if (!address || !name) {
      return NextResponse.json(
        { error: 'address and name are required' },
        { status: 400 }
      );
    }

    // Extract zip from address if present (5-digit zip at end)
    const zipMatch = address.match(/\b(\d{5})\b/);
    const zip = zipMatch ? zipMatch[1] : '';

    // Build the lead object
    const now = new Date();
    const leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'> = {
      title: address,
      category: 'Website Lead',
      categoryId: 'fs', // default category for website leads
      location: address,
      zip,
      details: [
        situation && `Situation: ${situation}`,
        notes && `Notes: ${notes}`,
      ].filter(Boolean).join('\n'),
      sourceUrl: '',
      source: 'website',
      stage: 'new',
      followUp: null,
      stackedCategories: ['fs'],
      stackedLabels: ['Website Lead'],
      stackCount: 1,
      isDuplicate: false,
      stackedInto: null,
      skipTrace: {
        owner: name,
        phones: phone ? [phone] : [],
        emails: email ? [email] : [],
        mailingAddress: '',
        relatives: '',
        notes: 'Contact info provided via website form',
        timestamp: now,
      },
      comps: null,
      offer: null,
      activities: [
        {
          id: 1,
          type: 'note',
          text: `Inbound website lead from ${name}`,
          date: now,
        },
      ],
    };

    // Score the lead
    const fullLead: Lead = {
      ...leadData,
      id: 'temp',
      createdAt: now,
      updatedAt: now,
    };
    const { score, tier } = scoreLead(fullLead);
    leadData.score = score;
    leadData.scoreTier = tier;

    // Try to save to Firebase
    let leadId = `temp-${Date.now()}`;
    try {
      leadId = await addLead(leadData);
    } catch {
      console.warn('Could not save website lead to Firebase');
    }

    return NextResponse.json({
      success: true,
      leadId,
    });
  } catch (error) {
    console.error('Website lead webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process website lead' },
      { status: 500 }
    );
  }
}
