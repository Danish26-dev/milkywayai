import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Layers,
  Filter,
  Search,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowRight
} from 'lucide-react';
import { supplyChainJournalService } from '../../services';
import { Batch } from '../../types/models';

export const BatchesPage: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchFilter = searchParams.get('search') || '';
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    async function loadBatches() {
      setIsLoading(true);
      try {
        const data = await supplyChainJournalService.getBatches({
          searchQuery: searchFilter || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined
        });
        setBatches(data);
      } catch (err) {
        console.error('Failed to load batches:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadBatches();
  }, [searchFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#26352D]" />
            <h1 className="text-2xl font-bold font-sans text-[#202521]">
              Supply-Chain Batch Ledger
            </h1>
          </div>
          <p className="text-xs text-[#202521]/70 mt-1 font-normal">
            Append-only mass-balance records across collection depots, chilling hubs, and processing units.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-mono bg-[#FFFDF7] p-1 rounded-lg border border-[#202521]/15">
            {['ALL', 'ANOMALY_FLAGGED', 'NORMAL'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#26352D] text-[#FFFDF7] font-bold'
                    : 'text-[#202521] hover:bg-[#F4F1E8]'
                }`}
              >
                {st === 'ALL' ? 'All Batches' : st === 'ANOMALY_FLAGGED' ? 'Flagged Only' : 'Normal'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-[#FFFDF7] p-3 rounded-xl border border-[#202521]/15 flex items-center gap-3">
        <Search className="w-4 h-4 text-[#202521]/40 shrink-0" />
        <input
          type="text"
          placeholder="Filter by batch code, facility name, or district..."
          value={searchFilter}
          onChange={(e) => setSearchParams(e.target.value ? { search: e.target.value } : {})}
          className="w-full text-xs font-mono bg-transparent border-none focus:outline-hidden text-[#202521]"
        />
        {searchFilter && (
          <button
            onClick={() => setSearchParams({})}
            className="text-xs font-mono text-[#202521]/60 hover:text-[#202521] px-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Batches Table */}
      <div className="bg-[#FFFDF7] rounded-xl border border-[#202521]/15 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F4F1E8]/70 border-b border-[#202521]/10 font-mono text-[11px] text-[#202521]/80">
                <th className="py-3 px-4 font-semibold">Batch Code</th>
                <th className="py-3 px-4 font-semibold">Origin Facility</th>
                <th className="py-3 px-4 font-semibold">Current Location</th>
                <th className="py-3 px-4 font-semibold text-right">Intake Litres</th>
                <th className="py-3 px-4 font-semibold text-right">Recorded Litres</th>
                <th className="py-3 px-4 font-semibold text-right">Discrepancy</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202521]/10">
              {batches.map((batch) => {
                const isFlagged = batch.status !== 'NORMAL';
                const hasSurplus = batch.unaccountedDiscrepancyLitres > 0;
                const hasLoss = batch.unaccountedDiscrepancyLitres < 0;

                return (
                  <tr key={batch.id} className="hover:bg-[#F4F1E8]/40 transition-colors">
                    {/* Batch Code */}
                    <td className="py-3 px-4 font-mono font-bold text-[#26352D]">
                      <Link to={`/app/batches/${batch.id}`} className="hover:underline flex items-center gap-1.5">
                        <span>{batch.batchCode}</span>
                        <ExternalLink className="w-3 h-3 text-[#202521]/40" />
                      </Link>
                      <span className="text-[10px] text-[#202521]/60 font-mono block font-normal">
                        {batch.eventCount} logged journal events
                      </span>
                    </td>

                    {/* Origin Facility */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#202521]">{batch.originFacilityName}</div>
                      <div className="text-[10px] font-mono text-[#202521]/60">{batch.originFacilityId}</div>
                    </td>

                    {/* Current Location */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#202521]">{batch.currentFacilityName}</div>
                      <div className="text-[10px] font-mono text-[#202521]/60">{batch.currentFacilityId}</div>
                    </td>

                    {/* Intake Litres */}
                    <td className="py-3 px-4 font-mono text-right font-medium text-[#202521]">
                      {batch.collectedLitres.toLocaleString()} L
                    </td>

                    {/* Recorded Litres */}
                    <td className="py-3 px-4 font-mono text-right font-bold text-[#202521]">
                      {batch.currentRecordedLitres.toLocaleString()} L
                    </td>

                    {/* Discrepancy */}
                    <td className="py-3 px-4 font-mono text-right font-bold">
                      {batch.unaccountedDiscrepancyLitres !== 0 ? (
                        <div className="flex items-center justify-end gap-1">
                          {hasSurplus ? (
                            <TrendingUp className="w-3.5 h-3.5 text-[#9E4939]" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5 text-[#8A6A4A]" />
                          )}
                          <span className={hasSurplus ? 'text-[#9E4939]' : 'text-[#8A6A4A]'}>
                            {hasSurplus ? '+' : ''}{batch.unaccountedDiscrepancyLitres.toLocaleString()} L
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#66734A]">0 L (Balanced)</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
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
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/app/batches/${batch.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#26352D] hover:bg-[#202521] text-[#FFFDF7] text-xs font-semibold transition-colors"
                      >
                        <span>Audit</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
