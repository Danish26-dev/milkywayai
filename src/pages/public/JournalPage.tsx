/**
 * MilkyWay — Milk Supply Journal (farmer / collection-operator data entry)
 *
 * A simple operational data-entry surface that records supply-chain events into the
 * append-only journal via the PUBLIC ingestion API (/api/journal/*). It shows NO officer
 * investigation data (no cases, alerts, evidence). The browser never touches BigQuery
 * directly — all writes go through the backend, which validates and server-stamps them.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  PackagePlus,
  Truck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Factory,
  Droplets
} from 'lucide-react';

const CANONICAL_EVENT_TYPES = [
  'MILK_COLLECTED',
  'TRANSFERRED',
  'STORED',
  'PROCESSED',
  'DISPATCHED',
  'RECEIVED'
] as const;

type Facility = { facilityId: string; name: string; type: string; location: string };
type Vehicle = { vehicleId: string; registrationNumber: string; capacityLitres: number };
type RecordedEvent = { eventId: string; batchId: string; eventType: string; timestamp: string; quantityLitres: number };

async function postJson(url: string, body: any) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const JournalPage: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Batch registration
  const [batchId, setBatchId] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [originFacilityId, setOriginFacilityId] = useState('');
  const [initialQuantity, setInitialQuantity] = useState<string>('');
  const [batchStatus, setBatchStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [batchRegistered, setBatchRegistered] = useState(false);

  // Event recording
  const [eventType, setEventType] = useState<string>('MILK_COLLECTED');
  const [eventQuantity, setEventQuantity] = useState<string>('');
  const [eventFacility, setEventFacility] = useState('');
  const [eventVehicle, setEventVehicle] = useState('');
  const [eventNotes, setEventNotes] = useState('');
  const [eventError, setEventError] = useState<string | null>(null);
  const [recorded, setRecorded] = useState<RecordedEvent[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/journal/facilities').then(r => r.json()).then(d => setFacilities(d.facilities || [])).catch(() => {});
    fetch('/api/journal/vehicles').then(r => r.json()).then(d => setVehicles(d.vehicles || [])).catch(() => {});
  }, []);

  const canRegister = useMemo(
    () => batchId.trim() && originFacilityId.trim() && Number(initialQuantity) > 0,
    [batchId, originFacilityId, initialQuantity]
  );

  const handleRegisterBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setBatchStatus(null);
    try {
      const data = await postJson('/api/journal/batches', {
        batchId: batchId.trim(),
        originFacilityId: originFacilityId.trim(),
        initialQuantityLitres: Number(initialQuantity),
        sourceId: sourceId.trim() || undefined
      });
      setBatchRegistered(true);
      setEventFacility(originFacilityId.trim());
      setBatchStatus({
        ok: true,
        msg: data.created ? `Batch ${data.batch.batchId} registered.` : `Batch ${data.batch.batchId} already exists — you can record events.`
      });
    } catch (err: any) {
      setBatchStatus({ ok: false, msg: err.message });
    }
  };

  const handleRecordEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEventError(null);
    setSubmitting(true);
    try {
      const data = await postJson('/api/journal/events', {
        batchId: batchId.trim(),
        eventType,
        quantityLitres: Number(eventQuantity),
        facilityId: eventFacility.trim() || undefined,
        vehicleId: eventVehicle.trim() || undefined,
        notes: eventNotes.trim() || undefined,
        sourceId: sourceId.trim() || undefined
      });
      setRecorded(prev => [data.event, ...prev]);
      setEventQuantity('');
      setEventNotes('');
    } catch (err: any) {
      setEventError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1E8] text-[#202521]">
      {/* Header */}
      <header className="bg-[#26352D] text-[#FFFDF7]">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#66734A] flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-sans">Milk Supply Journal</h1>
              <p className="text-[11px] font-mono text-[#D8D3C7]/80">Collection operator data entry • Append-only supply record</p>
            </div>
          </div>
          <Link to="/" className="text-xs font-mono text-[#D8D3C7]/80 hover:text-white">← Home</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="p-3 rounded-lg bg-[#E0C068]/15 border border-[#E0C068]/40 text-xs text-[#202521]/80 flex items-start gap-2">
          <Droplets className="w-4 h-4 text-[#8C6D1F] shrink-0 mt-0.5" />
          <span>
            Record real supply-chain movements. Entries are written to the append-only journal and used by
            Food Safety Officers for anomaly detection. This screen does not show investigation data.
          </span>
        </div>

        {/* Step 1: Register / select batch */}
        <section className="bg-[#FFFDF7] rounded-xl border border-[#202521]/10 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <PackagePlus className="w-5 h-5 text-[#2E4057]" />
            <h2 className="font-bold font-serif text-[#202521]">1. Create / Select Batch</h2>
          </div>
          <form onSubmit={handleRegisterBatch} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-xs font-semibold">Batch ID
              <input value={batchId} onChange={e => setBatchId(e.target.value)} placeholder="MW-10482"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202521]/20 bg-[#F4F1E8] font-mono text-sm" />
            </label>
            <label className="text-xs font-semibold">Source / Farm identifier
              <input value={sourceId} onChange={e => setSourceId(e.target.value)} placeholder="Anand-Coop-Circle-7"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202521]/20 bg-[#F4F1E8] font-mono text-sm" />
            </label>
            <label className="text-xs font-semibold">Origin facility
              <select value={originFacilityId} onChange={e => setOriginFacilityId(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202521]/20 bg-[#F4F1E8] text-sm">
                <option value="">Select facility…</option>
                {facilities.map(f => <option key={f.facilityId} value={f.facilityId}>{f.name} ({f.facilityId})</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold">Initial quantity (litres)
              <input type="number" min="0" step="0.1" value={initialQuantity} onChange={e => setInitialQuantity(e.target.value)} placeholder="1000"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202521]/20 bg-[#F4F1E8] font-mono text-sm" />
            </label>
            <div className="sm:col-span-2 flex items-center gap-3">
              <button type="submit" disabled={!canRegister}
                className="px-4 py-2 rounded-lg bg-[#26352D] text-[#FFFDF7] text-xs font-bold hover:bg-[#202521] disabled:opacity-40 flex items-center gap-1.5">
                Register Batch <ArrowRight className="w-3.5 h-3.5" />
              </button>
              {batchStatus && (
                <span className={`text-xs flex items-center gap-1.5 ${batchStatus.ok ? 'text-[#3D6E50]' : 'text-[#9E4939]'}`}>
                  {batchStatus.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {batchStatus.msg}
                </span>
              )}
            </div>
          </form>
        </section>

        {/* Step 2: Record event */}
        <section className={`bg-[#FFFDF7] rounded-xl border border-[#202521]/10 p-6 shadow-sm ${!batchRegistered ? 'opacity-60' : ''}`}>
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-5 h-5 text-[#3D6E50]" />
            <h2 className="font-bold font-serif text-[#202521]">2. Record Supply-Chain Event</h2>
          </div>
          <form onSubmit={handleRecordEvent} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-xs font-semibold">Event type
              <select value={eventType} onChange={e => setEventType(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202521]/20 bg-[#F4F1E8] text-sm font-mono">
                {CANONICAL_EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold">Quantity (litres)
              <input type="number" min="0" step="0.1" value={eventQuantity} onChange={e => setEventQuantity(e.target.value)} placeholder="650"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202521]/20 bg-[#F4F1E8] font-mono text-sm" />
            </label>
            <label className="text-xs font-semibold">Facility
              <select value={eventFacility} onChange={e => setEventFacility(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202521]/20 bg-[#F4F1E8] text-sm">
                <option value="">(none)</option>
                {facilities.map(f => <option key={f.facilityId} value={f.facilityId}>{f.name} ({f.facilityId})</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold">Vehicle (optional)
              <select value={eventVehicle} onChange={e => setEventVehicle(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202521]/20 bg-[#F4F1E8] text-sm">
                <option value="">(none)</option>
                {vehicles.map(v => <option key={v.vehicleId} value={v.vehicleId}>{v.registrationNumber} ({v.vehicleId})</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold sm:col-span-2">Operator notes (optional)
              <input value={eventNotes} onChange={e => setEventNotes(e.target.value)} placeholder="e.g. seal intact, temperature 4.3°C"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202521]/20 bg-[#F4F1E8] text-sm" />
            </label>
            <div className="sm:col-span-2 flex items-center gap-3">
              <button type="submit" disabled={!batchRegistered || submitting || !(Number(eventQuantity) >= 0 && eventQuantity !== '')}
                className="px-4 py-2 rounded-lg bg-[#3D6E50] text-[#FFFDF7] text-xs font-bold hover:bg-[#2f5940] disabled:opacity-40 flex items-center gap-1.5">
                {submitting ? 'Recording…' : 'Record Event'} <ArrowRight className="w-3.5 h-3.5" />
              </button>
              {eventError && (
                <span className="text-xs text-[#9E4939] flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> {eventError}
                </span>
              )}
            </div>
          </form>
        </section>

        {/* Recorded events log */}
        {recorded.length > 0 && (
          <section className="bg-[#FFFDF7] rounded-xl border border-[#202521]/10 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Factory className="w-5 h-5 text-[#8C6D1F]" />
              <h2 className="font-bold font-serif text-[#202521]">Recorded Events</h2>
            </div>
            <div className="space-y-2">
              {recorded.map(ev => (
                <div key={ev.eventId} className="p-3 rounded-lg bg-[#3D6E50]/8 border border-[#3D6E50]/25 text-xs font-mono">
                  <div className="flex items-center gap-2 text-[#3D6E50] font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Event recorded
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[#202521]/80">
                    <span>Event ID: <b>{ev.eventId}</b></span>
                    <span>Batch: <b>{ev.batchId}</b></span>
                    <span>Type: <b>{ev.eventType}</b></span>
                    <span>Quantity: <b>{ev.quantityLitres} L</b></span>
                    <span className="col-span-2">Timestamp: {new Date(ev.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
