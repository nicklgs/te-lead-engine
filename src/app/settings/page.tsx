'use client';

import { useState, useEffect } from 'react';
import { DEMO_LEADS, DEMO_BUYERS } from '@/lib/demo-data';

export default function SettingsPage() {
  const [fbStatus, setFbStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState('');
  const [clearing, setClearing] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  useEffect(() => {
    import('@/lib/firebase').then(({ checkConnection }) =>
      checkConnection().then(ok => setFbStatus(ok ? 'connected' : 'disconnected'))
    ).catch(() => setFbStatus('disconnected'));
  }, []);

  const handleSeedData = async () => {
    setSeeding(true); setSeedResult('');
    try {
      const { addLead, addBuyer } = await import('@/lib/firebase');
      for (const lead of DEMO_LEADS) {
        const { id, createdAt, updatedAt, ...rest } = lead;
        await addLead(rest as Parameters<typeof addLead>[0]);
      }
      for (const buyer of DEMO_BUYERS) {
        const { id, createdAt, ...rest } = buyer;
        await addBuyer(rest as Parameters<typeof addBuyer>[0]);
      }
      setSeedResult('Seeded ' + DEMO_LEADS.length + ' leads and ' + DEMO_BUYERS.length + ' buyers.');
    } catch {
      setSeedResult('Error: Firebase may not be configured. Demo data is used automatically.');
    } finally { setSeeding(false); }
  };

  const handleClearData = async () => {
    if (!clearConfirm) { setClearConfirm(true); return; }
    setClearing(true);
    try {
      const { clearAllData } = await import('@/lib/firebase');
      await clearAllData();
      setSeedResult('All data cleared.');
    } catch {
      setSeedResult('Error clearing data. Firebase may not be configured.');
    } finally { setClearing(false); setClearConfirm(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] mb-5">Settings</h1>
      <div className="space-y-4">
        {/* Firebase status */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider mb-3">Firebase Connection</h3>
          <div className="flex items-center gap-2">
            <div className={"w-3 h-3 rounded-full " + (fbStatus === 'connected' ? "bg-[#2D7A4F]" : fbStatus === 'disconnected' ? "bg-[#8B1A1A]" : "bg-[#B8985A] animate-pulse")} />
            <span className="text-sm font-medium">
              {fbStatus === 'connected' ? 'Connected to Firebase' : fbStatus === 'disconnected' ? 'Not connected - using demo data' : 'Checking connection...'}
            </span>
          </div>
          {fbStatus === 'disconnected' && (
            <p className="text-xs text-gray-500 mt-2">Set NEXT_PUBLIC_FIREBASE_* environment variables to connect. The app uses demo data in the meantime.</p>
          )}
        </div>

        {/* Seed data */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider mb-3">Demo Data</h3>
          <p className="text-xs text-gray-500 mb-3">Seed Firebase with {DEMO_LEADS.length} demo leads and {DEMO_BUYERS.length} demo buyers for testing.</p>
          <button onClick={handleSeedData} disabled={seeding} className="bg-[#B8985A] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#a0823e] transition-colors disabled:opacity-50">
            {seeding ? 'Seeding...' : 'Seed Demo Data'}
          </button>
        </div>

        {/* Clear data */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider mb-3">Clear Data</h3>
          <p className="text-xs text-gray-500 mb-3">Remove all leads and buyers from Firebase. This cannot be undone.</p>
          <button onClick={handleClearData} disabled={clearing}
            className={"px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 " + (clearConfirm ? "bg-[#8B1A1A] text-white hover:bg-[#6d1515]" : "bg-gray-200 text-gray-700 hover:bg-gray-300")}>
            {clearing ? 'Clearing...' : clearConfirm ? 'Click Again to Confirm' : 'Clear All Data'}
          </button>
        </div>

        {seedResult && (<div className="bg-[#F4EFE7] rounded-lg p-3"><p className="text-sm text-[#1B2A4A]">{seedResult}</p></div>)}

        {/* Environment */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider mb-3">Environment</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-gray-500">App</span><span className="font-medium">TE Home Buyers Lead Engine</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Framework</span><span className="font-medium">Next.js (App Router)</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Database</span><span className="font-medium">Firebase Firestore</span></div>
            <div className="flex justify-between"><span className="text-gray-500">AI</span><span className="font-medium">Claude (Anthropic)</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Target Market</span><span className="font-medium">Delaware County, PA</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
