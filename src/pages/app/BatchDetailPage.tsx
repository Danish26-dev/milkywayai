import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Layers,
  Building2,
  Truck,
  Scale,
  FileSearch,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Hash
} from 'lucide-react';
import { supplyChainJournalService, investigationService } from '../../services';
import { Batch, SupplyChainEvent, InvestigationCase } from '../../types/models';

export const BatchDetailPage: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [events, setEvents] = useState<SupplyChainEvent[]>([]);
  const [associatedCase, setAssociatedCase] = useState<InvestigationCase | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadBatchDetails() {
      if (!batchId) return;
      setIsLoading(true);
      try {
        const b = await supplyChainJournalService.getBatchById(batchId);
        setBatch(b);

        if (b) {
          const evts = await supplyChainJournalService.getEventsForBatch(b.id);
          setEvents(evts);

          const cases = await investigationService.getAllCases();
          const match = cases.find(c => c.batchId === b.id);
          setAssociatedCase(match || null);
        }
      } catch (err) {
        console.error('Failed to load batch detail:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadBatchDetails();
  }, [batchId]);

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs font-mono text-[#202521]/60">
        Querying BigQuery Append-Only Journal...
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="p-8 text-center bg-[#FFFDF7] rounded-xl border border-[#202521]/15">
        <h2 className="text-lg font-bold text-[#202521]">Batch Not Found</h2>
        <p className="text-xs text-[#202521]/70 mt-1 font-mono">
          No records located for identifier: {batchId}
        </p>
        <Link
          to="/app/batches"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#26352D] text-[#FFFDF7] text-xs font-bold rounded-lg"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Ledger</span>
        </Link>
      </div>
    );
  }

  const isSurplus = batch.unaccountedDiscrepancyLitres > 0;
  const isLoss = batch.unaccountedDiscrepancyLitres < 0;

  return (
    <div className="space-y-6">
      {/* Back Link & Header */}
      <div>
        <Link
          to="/app/batches"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#202521]/70 hover:text-[#202521] mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Batch Ledger</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFDF7] p-6 rounded-xl border border-[#202521]/15 shadow-xs">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold font-mono text-[#202521]">
                {batch.batchCode}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  batch.status === 'SEALED_FOR_INSPECTION'
                    ? 'bg-[#9E4939] text-[#FFFDF7]'
                    : batch.status === 'UNDER_ACTIVE_INVESTIGATION'
                    ? 'bg-[#B78632] text-[#FFFDF7]'
                    : batch.status === 'ANOMALY_FLAGGED'
                    ? 'bg-[#8A6A4A] text-[#FFFDF7]'
                    : 'bg-[#66734A]/10 text-[#66734A]'
                }`}
              >
                {batch.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="text-xs text-[#202521]/70 mt-1 font-mono">
              Batch ID: {batch.id} • Registered: {new Date(batch.createdAt).toLocaleString()}
            </div>
          </div>

          {associatedCase && (
            <Link
              to={`/app/investigations/${associatedCase.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#26352D] hover:bg-[#202521] text-[#FFFDF7] text-xs font-bold font-mono shadow-xs transition-colors shrink-0"
            >
              <FileSearch className="w-4 h-4 text-[#66734A]" />
              <span>Open Investigation Case ({associatedCase.caseNumber})</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mass-Balance Reconciliation Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FFFDF7] p-5 rounded-xl border border-[#202521]/15">
          <span className="text-[10px] font-mono uppercase text-[#202521]/60 block font-bold">
            Intake Volume (Origin)
          </span>
          <span className="text-2xl font-bold font-mono text-[#202521] block mt-1">
            {batch.collectedLitres.toLocaleString()} L
          </span>
          <span className="text-xs text-[#202521]/70 mt-1 block">
            {batch.originFacilityName}
          </span>
        </div>

        <div className="bg-[#FFFDF7] p-5 rounded-xl border border-[#202521]/15">
          <span className="text-[10px] font-mono uppercase text-[#202521]/60 block font-bold">
            Current Recorded Volume
          </span>
          <span className="text-2xl font-bold font-mono text-[#202521] block mt-1">
            {batch.currentRecordedLitres.toLocaleString()} L
          </span>
          <span className="text-xs text-[#202521]/70 mt-1 block">
            {batch.currentFacilityName}
          </span>
        </div>

        <div className="bg-[#FFFDF7] p-5 rounded-xl border border-[#202521]/15">
          <span className="text-[10px] font-mono uppercase text-[#202521]/60 block font-bold">
            Unaccounted Discrepancy
          </span>
          <div className="flex items-center gap-2 mt-1">
            {isSurplus && <TrendingUp className="w-5 h-5 text-[#9E4939]" />}
            {isLoss && <TrendingDown className="w-5 h-5 text-[#8A6A4A]" />}
            <span
              className={`text-2xl font-bold font-mono ${
                isSurplus ? 'text-[#9E4939]' : isLoss ? 'text-[#8A6A4A]' : 'text-[#66734A]'
              }`}
            >
              {batch.unaccountedDiscrepancyLitres !== 0
                ? `${batch.unaccountedDiscrepancyLitres > 0 ? '+' : ''}${batch.unaccountedDiscrepancyLitres.toLocaleString()} L`
                : 'Balanced (0 L)'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#202521]/60 mt-1 block">
            Permitted tolerance: ±{batch.expectedLossLitres} L (Evaporation)
          </span>
        </div>
      </div>

      {/* Append-Only Chain of Custody Timeline */}
      <div className="bg-[#FFFDF7] rounded-xl border border-[#202521]/15 shadow-xs p-6">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#202521]/15">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#66734A]" />
              <h2 className="text-base font-bold text-[#202521] font-sans">
                Cryptographic Chain of Custody
              </h2>
            </div>
            <p className="text-xs text-[#202521]/70 mt-0.5 font-normal">
              BigQuery append-only events linked via SHA-256 integrity digests. Historical rows cannot be modified or deleted.
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#66734A] bg-[#66734A]/10 px-2 py-1 rounded font-bold">
            IMMUTABLE LEDGER
          </span>
        </div>

        <div className="space-y-6">
          {events.map((evt, idx) => {
            return (
              <div
                key={evt.eventId}
                className="relative pl-6 sm:pl-8 pb-6 border-l-2 border-[#26352D]/20 last:border-l-0 last:pb-0"
              >
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#26352D] border-2 border-white flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFFDF7]" />
                </div>

                <div className="bg-[#F4F1E8]/50 p-4 rounded-xl border border-[#202521]/10 text-xs font-sans">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <span className="font-bold text-[#202521] text-sm">
                      {evt.eventType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] font-mono text-[#202521]/70">
                      {new Date(evt.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px] text-[#202521]/80 pt-2 border-t border-[#202521]/10">
                    <div>
                      <span className="text-[#202521]/60">Facility:</span>{' '}
                      <span className="font-semibold text-[#202521]">{evt.facilityName}</span>
                    </div>
                    <div>
                      <span className="text-[#202521]/60">Quantity:</span>{' '}
                      <span className="font-bold text-[#202521]">{evt.quantityLitres.toLocaleString()} L</span>
                    </div>
                    {evt.temperatureCelsius && (
                      <div>
                        <span className="text-[#202521]/60">Temp:</span>{' '}
                        <span className="font-bold text-[#202521]">{evt.temperatureCelsius}°C</span>
                      </div>
                    )}
                  </div>

                  {/* Cryptographic Digest Display */}
                  <div className="mt-3 pt-2 border-t border-[#202521]/10 font-mono text-[10px] text-[#202521]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="truncate">
                      Hash: <code className="text-[#26352D] font-bold">{evt.cryptographicHash}</code>
                    </span>
                    <span className="truncate">
                      Prev: <code className="text-[#202521]/50">{evt.previousEventHash.substring(0, 16)}...</code>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
