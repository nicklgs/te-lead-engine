'use client';

import { useState, useEffect } from 'react';
import type { Offer } from '@/lib/types';

interface OfferCalculatorProps {
  initialOffer?: Offer | null;
  compArv?: number | null;
  onSave: (offer: Offer) => void;
}

function fmt(n: number): string {
  return '$' + n.toLocaleString();
}

export default function OfferCalculator({ initialOffer, compArv, onSave }: OfferCalculatorProps) {
  const [arv, setArv] = useState(initialOffer?.arv ?? 0);
  const [repairs, setRepairs] = useState(initialOffer?.repairs ?? 15000);
  const [wholesaleFee, setWholesaleFee] = useState(initialOffer?.wholesaleFee ?? 8000);
  const [holdingCosts, setHoldingCosts] = useState(initialOffer?.holdingCosts ?? 3000);

  const maxOffer = Math.max(0, Math.round(arv * 0.7 - repairs - wholesaleFee - holdingCosts));

  useEffect(() => {
    if (initialOffer) {
      setArv(initialOffer.arv);
      setRepairs(initialOffer.repairs);
      setWholesaleFee(initialOffer.wholesaleFee);
      setHoldingCosts(initialOffer.holdingCosts);
    }
  }, [initialOffer]);

  const handleUseCompArv = () => {
    if (compArv) setArv(compArv);
  };

  const handleSave = () => {
    onSave({ arv, repairs, wholesaleFee, holdingCosts, maxOffer });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="text-lg font-bold text-[#1B2A4A] mb-4 font-[family-name:var(--font-heading)]">
        70% Rule Calculator
      </h3>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">After Repair Value (ARV)</label>
            {compArv && (
              <button
                onClick={handleUseCompArv}
                className="text-xs text-[#B8985A] hover:text-[#96783e] font-medium"
              >
                Use Comp ARV ({fmt(compArv)})
              </button>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
            <input
              type="number"
              value={arv || ''}
              onChange={(e) => setArv(Number(e.target.value))}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#B8985A] focus:border-[#B8985A] outline-none"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Estimated Repairs</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
            <input
              type="number"
              value={repairs || ''}
              onChange={(e) => setRepairs(Number(e.target.value))}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#B8985A] focus:border-[#B8985A] outline-none"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Wholesale Fee</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
            <input
              type="number"
              value={wholesaleFee || ''}
              onChange={(e) => setWholesaleFee(Number(e.target.value))}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#B8985A] focus:border-[#B8985A] outline-none"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Holding Costs</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
            <input
              type="number"
              value={holdingCosts || ''}
              onChange={(e) => setHoldingCosts(Number(e.target.value))}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#B8985A] focus:border-[#B8985A] outline-none"
              placeholder="0"
            />
          </div>
        </div>

        {/* Calculation breakdown */}
        <div className="bg-[#F4EFE7] rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">ARV x 70%</span>
            <span className="font-medium">{fmt(Math.round(arv * 0.7))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">- Repairs</span>
            <span className="font-medium text-[#8B1A1A]">-{fmt(repairs)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">- Wholesale Fee</span>
            <span className="font-medium text-[#8B1A1A]">-{fmt(wholesaleFee)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">- Holding Costs</span>
            <span className="font-medium text-[#8B1A1A]">-{fmt(holdingCosts)}</span>
          </div>
          <div className="border-t border-[#B8985A]/30 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-bold text-[#1B2A4A]">Max Offer</span>
              <span className="text-xl font-bold text-[#2D7A4F]">{fmt(maxOffer)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={arv === 0}
          className="w-full py-2.5 bg-[#1B2A4A] text-white rounded-lg font-medium text-sm hover:bg-[#2a3d66] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Save Offer
        </button>
      </div>
    </div>
  );
}
