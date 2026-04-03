'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Lead, LeadStage, Activity, Offer } from '@/lib/types';
import { STAGES, CATEGORY_MAP, SKIP_TRACE_LINKS } from '@/lib/constants';
import { scoreLead } from '@/lib/scoring';
import { DEMO_LEADS } from '@/lib/demo-data';
import ScoreBar from '@/components/ScoreBar';
import ActivityTimeline from '@/components/ActivityTimeline';
import DataFreshness from '@/components/DataFreshness';
import OfferCalculator from '@/components/OfferCalculator';

type TabId = 'info' | 'skip' | 'comps' | 'crm' | 'offer';
const TABS: { id: TabId; label: string }[] = [{ id: 'info', label: 'Info' }, { id: 'skip', label: 'Skip Trace' }, { id: 'comps', label: 'Comps' }, { id: 'crm', label: 'CRM' }, { id: 'offer', label: 'Offer' }];

export default function LeadDetailPage() {
  const params = useParams(); const router = useRouter(); const id = params.id as string;
  const [lead, setLead] = useState<Lead | null>(null); const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('info'); const [skipLoading, setSkipLoading] = useState(false);
  const [compsLoading, setCompsLoading] = useState(false); const [newNote, setNewNote] = useState('');
  const [selectedStage, setSelectedStage] = useState<LeadStage>('new'); const [followUpDate, setFollowUpDate] = useState('');

  useEffect(() => {
    async function loadLead() {
      try {
        const { getLead } = await import('@/lib/firebase');
        const fbLead = await getLead(id);
        if (fbLead) { const { score, tier } = scoreLead(fbLead); setLead({ ...fbLead, score, scoreTier: tier }); setSelectedStage(fbLead.stage); if (fbLead.followUp) setFollowUpDate(new Date(fbLead.followUp).toISOString().split('T')[0]); return; }
      } catch { /* fall through */ }
      const demoLead = DEMO_LEADS.find((l) => l.id === id);
      if (demoLead) { const { score, tier } = scoreLead(demoLead); const scored = { ...demoLead, score, scoreTier: tier }; setLead(scored); setSelectedStage(scored.stage); if (scored.followUp) setFollowUpDate(new Date(scored.followUp).toISOString().split('T')[0]); }
      setLoading(false);
    }
    loadLead().finally(() => setLoading(false));
  }, [id]);

  const handleSkipTrace = async () => {
    if (!lead) return; setSkipLoading(true);
    try {
      const res = await fetch('/api/skip-trace', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId: lead.id, address: lead.title }) });
      const data = await res.json();
      if (data.skipTrace) { const act: Activity = { id: Date.now(), type: 'skip_trace', text: 'Skip trace completed - owner: ' + data.skipTrace.owner + ', ' + data.skipTrace.phones.length + ' phone(s) found', date: new Date() }; setLead({ ...lead, skipTrace: { ...data.skipTrace, timestamp: new Date(data.skipTrace.timestamp) }, activities: [...lead.activities, act] }); }
    } catch (err) { console.error(err); } finally { setSkipLoading(false); }
  };

  const handleRunComps = async () => {
    if (!lead) return; setCompsLoading(true);
    try {
      const res = await fetch('/api/comps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId: lead.id, address: lead.title, zip: lead.zip }) });
      const data = await res.json();
      if (data.comps) { const act: Activity = { id: Date.now(), type: 'comps', text: 'Comps pulled - ARV $' + data.comps.estimatedArv.toLocaleString() + ' (' + data.comps.confidence + ')', date: new Date() }; setLead({ ...lead, comps: { ...data.comps, timestamp: new Date(data.comps.timestamp) }, activities: [...lead.activities, act] }); }
    } catch (err) { console.error(err); } finally { setCompsLoading(false); }
  };

  const handleStageChange = async (stage: LeadStage) => {
    if (!lead) return; setSelectedStage(stage);
    const act: Activity = { id: Date.now(), type: 'stage', text: 'Stage changed: ' + (STAGES.find((s) => s.id === lead.stage)?.label) + ' -> ' + (STAGES.find((s) => s.id === stage)?.label), date: new Date() };
    const updated = { ...lead, stage, activities: [...lead.activities, act] }; setLead(updated);
    try { const { updateLead } = await import('@/lib/firebase'); await updateLead(lead.id, { stage, activities: updated.activities }); } catch { /* demo */ }
  };

  const handleFollowUp = async () => {
    if (!lead || !followUpDate) return; const date = new Date(followUpDate + 'T09:00:00');
    const act: Activity = { id: Date.now(), type: 'followup', text: 'Follow-up set for ' + date.toLocaleDateString(), date: new Date() };
    const updated = { ...lead, followUp: date, activities: [...lead.activities, act] }; setLead(updated);
    try { const { updateLead } = await import('@/lib/firebase'); await updateLead(lead.id, { followUp: date, activities: updated.activities }); } catch { /* demo */ }
  };

  const handleAddNote = async () => {
    if (!lead || !newNote.trim()) return;
    const act: Activity = { id: Date.now(), type: 'note', text: newNote.trim(), date: new Date() };
    const updated = { ...lead, activities: [...lead.activities, act] }; setLead(updated); setNewNote('');
    try { const { updateLead } = await import('@/lib/firebase'); await updateLead(lead.id, { activities: updated.activities }); } catch { /* demo */ }
  };

  const handleSaveOffer = async (offer: Offer) => {
    if (!lead) return;
    const act: Activity = { id: Date.now(), type: 'offer', text: 'Max offer: $' + offer.maxOffer.toLocaleString() + ' (70% rule)', date: new Date() };
    const updated = { ...lead, offer, activities: [...lead.activities, act] }; setLead(updated);
    try { const { updateLead } = await import('@/lib/firebase'); await updateLead(lead.id, { offer, activities: updated.activities }); } catch { /* demo */ }
  };

  if (loading) return (<div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-[#B8985A] border-t-transparent rounded-full animate-spin mx-auto" /></div>);
  if (!lead) return (<div className="max-w-3xl mx-auto px-4 py-12 text-center"><h2 className="text-xl font-bold text-[#1B2A4A] mb-2">Lead Not Found</h2><Link href="/leads" className="text-sm text-[#B8985A] hover:underline">Back to Leads</Link></div>);
  const stageInfo = STAGES.find((s) => s.id === lead.stage);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <button onClick={() => router.back()} className="text-sm text-[#B8985A] hover:underline mb-4 inline-block">&larr; Back</button>
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#1B2A4A] font-[family-name:var(--font-heading)] mb-1">{lead.title}</h1>
            <div className="flex flex-wrap gap-1.5 mb-2">{lead.stackedCategories.map((catId) => { const cat = CATEGORY_MAP[catId]; return (<span key={catId} className="inline-flex items-center gap-1 text-xs bg-[#F4EFE7] text-[#1B2A4A] px-2 py-0.5 rounded">{cat?.icon} {cat?.label || catId}</span>); })}{lead.stackCount > 1 && (<span className="text-xs bg-[#B8985A]/20 text-[#B8985A] font-bold px-2 py-0.5 rounded">Stacked x{lead.stackCount}</span>)}</div>
          </div>
          <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: stageInfo?.color }}>{stageInfo?.label}</span>
        </div>
        <ScoreBar score={lead.score ?? 0} tier={lead.scoreTier ?? 'cold'} size="lg" />
      </div>

      <div className="flex gap-1 mb-4 overflow-x-auto hide-scrollbar">{TABS.map((tab) => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={"px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors " + (activeTab === tab.id ? "bg-[#1B2A4A] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50")}>{tab.label}</button>))}</div>

      <div className="min-h-[400px]">
        {activeTab === 'info' && (<div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5"><h3 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider mb-3">Details</h3><p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{lead.details}</p></div>
          <div className="bg-white rounded-lg border border-gray-200 p-5"><h3 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider mb-3">Property Info</h3><div className="grid grid-cols-2 gap-3 text-sm"><div><span className="text-gray-500">Address:</span> <span className="font-medium">{lead.title}</span></div><div><span className="text-gray-500">Zip:</span> <span className="font-medium">{lead.zip}</span></div><div><span className="text-gray-500">Source:</span> <span className="font-medium capitalize">{lead.source}</span></div><div><span className="text-gray-500">Created:</span> <span className="font-medium">{new Date(lead.createdAt).toLocaleDateString()}</span></div>{lead.sourceUrl && (<div className="col-span-2"><span className="text-gray-500">Source URL:</span>{' '}<a href={lead.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[#B8985A] hover:underline break-all">{lead.sourceUrl}</a></div>)}</div></div>
          {lead.stackedCategories.length > 1 && (<div className="bg-white rounded-lg border border-gray-200 p-5"><h3 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider mb-3">Stacked Categories</h3><div className="flex flex-wrap gap-2">{lead.stackedLabels.map((label, i) => (<span key={i} className="text-sm bg-[#B8985A]/10 text-[#B8985A] px-3 py-1 rounded-lg font-medium">{label}</span>))}</div><p className="text-xs text-gray-500 mt-2">This property appears in {lead.stackCount} distress categories.</p></div>)}
          <div className="bg-white rounded-lg border border-gray-200 p-5"><h3 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider mb-3">Data Freshness</h3><div className="space-y-2"><DataFreshness date={lead.createdAt} label="Lead Created" /><DataFreshness date={lead.updatedAt} label="Last Updated" />{lead.skipTrace && <DataFreshness date={lead.skipTrace.timestamp} label="Skip Trace" />}{lead.comps && <DataFreshness date={lead.comps.timestamp} label="Comps" />}</div></div>
        </div>)}

        {activeTab === 'skip' && (<div className="space-y-4">
          {lead.skipTrace ? (<div className="bg-white rounded-lg border border-gray-200 p-5"><div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider">Skip Trace Results</h3><DataFreshness date={lead.skipTrace.timestamp} label="Pulled" /></div><div className="space-y-4"><div><p className="text-xs text-gray-500 uppercase mb-1">Owner</p><p className="text-lg font-bold text-[#1B2A4A]">{lead.skipTrace.owner}</p></div><div><p className="text-xs text-gray-500 uppercase mb-1">Phone Numbers</p><div className="space-y-1">{lead.skipTrace.phones.map((phone, i) => (<a key={i} href={"tel:" + phone} className="block text-sm text-[#2D7A4F] font-medium hover:underline">{phone}</a>))}</div></div>{lead.skipTrace.emails.length > 0 && (<div><p className="text-xs text-gray-500 uppercase mb-1">Emails</p><div className="space-y-1">{lead.skipTrace.emails.map((email, i) => (<a key={i} href={"mailto:" + email} className="block text-sm text-[#B8985A] hover:underline">{email}</a>))}</div></div>)}<div><p className="text-xs text-gray-500 uppercase mb-1">Mailing Address</p><p className="text-sm font-medium">{lead.skipTrace.mailingAddress}</p></div>{lead.skipTrace.relatives && (<div><p className="text-xs text-gray-500 uppercase mb-1">Relatives</p><p className="text-sm">{lead.skipTrace.relatives}</p></div>)}{lead.skipTrace.notes && (<div><p className="text-xs text-gray-500 uppercase mb-1">Notes</p><p className="text-sm text-gray-600">{lead.skipTrace.notes}</p></div>)}</div></div>
          ) : (<div className="bg-white rounded-lg border border-gray-200 p-8 text-center"><p className="text-gray-500 mb-4">No skip trace data yet.</p><button onClick={handleSkipTrace} disabled={skipLoading} className="bg-[#1B2A4A] text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-[#2a3d66] disabled:opacity-50">{skipLoading ? 'Running AI Skip Trace...' : 'Run AI Skip Trace'}</button></div>)}
          <div className="bg-white rounded-lg border border-gray-200 p-5"><h3 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider mb-3">Manual Lookup</h3><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{SKIP_TRACE_LINKS.map((link) => (<a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#B8985A] bg-[#F4EFE7] px-3 py-2 rounded hover:bg-[#e8e0d0] transition-colors text-center">{link.name}</a>))}</div></div>
        </div>)}

        {activeTab === 'comps' && (<div className="space-y-4">
          {lead.comps ? (<div className="bg-white rounded-lg border border-gray-200 p-5"><div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider">Comparable Sales</h3><DataFreshness date={lead.comps.timestamp} label="Pulled" /></div><div className="flex items-center gap-3 mb-4 p-3 bg-[#F4EFE7] rounded-lg"><div><p className="text-xs text-gray-500">Estimated ARV</p><p className="text-2xl font-bold text-[#2D7A4F]">${lead.comps.estimatedArv.toLocaleString()}</p></div><span className={"text-xs font-bold px-2 py-1 rounded " + (lead.comps.confidence === 'high' ? "bg-green-100 text-[#2D7A4F]" : lead.comps.confidence === 'medium' ? "bg-amber-100 text-amber-700" : "bg-red-100 text-[#8B1A1A]")}>{lead.comps.confidence.toUpperCase()} CONFIDENCE</span></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gray-200"><th className="text-left py-2 text-xs text-gray-500">Address</th><th className="text-right py-2 text-xs text-gray-500">Sold Price</th><th className="text-right py-2 text-xs text-gray-500">Date</th><th className="text-right py-2 text-xs text-gray-500">Bed/Bath</th><th className="text-right py-2 text-xs text-gray-500">Sqft</th></tr></thead><tbody>{lead.comps.comparables.map((comp, i) => (<tr key={i} className="border-b border-gray-100"><td className="py-2 font-medium">{comp.address}</td><td className="py-2 text-right text-[#2D7A4F] font-medium">{comp.soldPrice}</td><td className="py-2 text-right text-gray-500">{comp.saleDate}</td><td className="py-2 text-right">{comp.bedBath}</td><td className="py-2 text-right">{comp.sqft}</td></tr>))}</tbody></table></div></div>
          ) : (<div className="bg-white rounded-lg border border-gray-200 p-8 text-center"><p className="text-gray-500 mb-4">No comps data yet.</p><button onClick={handleRunComps} disabled={compsLoading} className="bg-[#1B2A4A] text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-[#2a3d66] disabled:opacity-50">{compsLoading ? 'Running Comps...' : 'Run Comps'}</button></div>)}
        </div>)}

        {activeTab === 'crm' && (<div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5"><h3 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider mb-3">Pipeline Stage</h3><div className="flex flex-wrap gap-2">{STAGES.map((stage) => (<button key={stage.id} onClick={() => handleStageChange(stage.id)} className={"text-xs px-3 py-1.5 rounded-full font-medium transition-colors " + (selectedStage === stage.id ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")} style={selectedStage === stage.id ? { backgroundColor: stage.color } : undefined}>{stage.label}</button>))}</div></div>
          <div className="bg-white rounded-lg border border-gray-200 p-5"><h3 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider mb-3">Follow-up Date</h3><div className="flex gap-2"><input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#B8985A] outline-none" /><button onClick={handleFollowUp} className="bg-[#2D7A4F] text-white px-4 py-2 rounded-lg text-sm font-medium">Set</button></div></div>
          <div className="bg-white rounded-lg border border-gray-200 p-5"><h3 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider mb-3">Add Note</h3><div className="flex gap-2"><textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Enter a note..." rows={2} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#B8985A] outline-none" /><button onClick={handleAddNote} disabled={!newNote.trim()} className="bg-[#1B2A4A] text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 self-end">Add</button></div></div>
          <div className="bg-white rounded-lg border border-gray-200 p-5"><h3 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider mb-3">Activity Timeline</h3><ActivityTimeline activities={lead.activities} /></div>
        </div>)}

        {activeTab === 'offer' && (<OfferCalculator initialOffer={lead.offer} compArv={lead.comps?.estimatedArv ?? null} onSave={handleSaveOffer} />)}
      </div>
    </div>
  );
}
