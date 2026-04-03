import { NextResponse } from 'next/server';
import { simulateFindBuyers } from '@/lib/ai';
import { addBuyer } from '@/lib/firebase';
import type { Buyer } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { zips } = body as { zips: string[] };

    if (!zips?.length) {
      return NextResponse.json(
        { error: 'zips array is required' },
        { status: 400 }
      );
    }

    // Run simulated buyer search
    const rawBuyers = await simulateFindBuyers(zips);

    // Try to save each buyer to Firebase
    const savedBuyers: Buyer[] = [];
    for (const buyer of rawBuyers) {
      const now = new Date();
      try {
        const firebaseId = await addBuyer(buyer);
        savedBuyers.push({ ...buyer, id: firebaseId, createdAt: now });
      } catch {
        // Firebase not configured — assign a temp id
        savedBuyers.push({
          ...buyer,
          id: `temp-buyer-${Date.now()}-${savedBuyers.length}`,
          createdAt: now,
        });
      }
    }

    return NextResponse.json({
      buyersFound: savedBuyers.length,
      buyers: savedBuyers,
    });
  } catch (error) {
    console.error('Find buyers API error:', error);
    return NextResponse.json(
      { error: 'Failed to find buyers' },
      { status: 500 }
    );
  }
}
