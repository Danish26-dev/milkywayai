import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FileSearch,
  Filter,
  Search,
  ShieldAlert,
  UserCheck,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { investigationService } from '../../services';
import { InvestigationCase } from '../../types/models';

export const InvestigationsPage: React.FC = () => {
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchFilter = searchParams.get('search') || '';
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  useEffect(() => {
    async function loadCases() {
      setIsLoading(true);
      try {
        const data = await investigationService.getAllCases();
        setCases(data);
      } catch (err) {
        console.error('Failed to load cases:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCases();
  }, []);

  const filtered = cases.filter(c => {
    if (priorityFilter !== 'ALL' && c.priority !== priorityFilter) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      return (
        c.caseNumber.toLowerCase().includes(q) ||
        c.batchCode.toLowerCase().includes(q) ||
        c.facilityName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-[#26352D]" />
            <h1 className="text-2xl font-bold font-sans text-[#202521]">
              Investigation Dossiers
            </h1>
          </div>
          <p className="text-xs text-[#202521]/70 mt-1 font-normal">
            Formal food-safety discrepancy files, evidence collections, and physical inspection recommendations.
          </p>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2 text-xs font-mono bg-[#FFFDF7] p-1 rounded-lg border border-[#202521]/15">
          {['ALL', 'IMMEDIATE', 'HIGH', 'MEDIUM'].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                priorityFilter === p
                  ? 'bg-[#26352D] text-[#FFFDF7] font-bold'
                  : 'text-[#202521] hover:bg-[#F4F1E8]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-[#FFFDF7] p-3 rounded-xl border border-[#202521]/15 flex items-center gap-3">
        <Search className="w-4 h-4 text-[#202521]/40 shrink-0" />
        <input
          type="text"
          placeholder="Filter by case number, batch code, or facility name..."
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

      {/* Cases Table */}
      <div className="bg-[#FFFDF7] rounded-xl border border-[#202521]/15 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F4F1E8]/70 border-b border-[#202521]/10 font-mono text-[11px] text-[#202521]/80">
                <th className="py-3 px-4 font-semibold">Case Number</th>
                <th className="py-3 px-4 font-semibold">Batch</th>
                <th className="py-3 px-4 font-semibold">Facility</th>
                <th className="py-3 px-4 font-semibold">Primary Discrepancy</th>
                <th className="py-3 px-4 font-semibold text-center">Priority</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold">Assigned Officer</th>
                <th className="py-3 px-4 font-semibold text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202521]/10">
              {filtered.map((item) => {
                const isCrit = item.priority === 'IMMEDIATE';
                return (
                  <tr key={item.id} className="hover:bg-[#F4F1E8]/40 transition-colors">
                    {/* Case Number */}
                    <td className="py-3 px-4 font-mono font-bold text-[#26352D]">
                      <Link to={`/app/investigations/${item.id}`} className="hover:underline">
                        {item.caseNumber}
                      </Link>
                      <span className="text-[10px] text-[#202521]/60 font-mono block font-normal">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Batch */}
                    <td className="py-3 px-4 font-mono font-semibold text-[#202521]">
                      <Link to={`/app/batches/${item.batchId}`} className="hover:underline text-[#26352D]">
                        {item.batchCode}
                      </Link>
                    </td>

                    {/* Facility */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#202521]">{item.facilityName}</div>
                      <div className="text-[10px] font-mono text-[#202521]/60">{item.facilityId}</div>
                    </td>

                    {/* Primary Discrepancy */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-medium text-[#202521]">
                        {item.primaryAnomalyType.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[10px] font-mono text-[#202521]/70">
                        {item.discrepancyLitres !== 0
                          ? `Variance: ${item.discrepancyLitres > 0 ? '+' : ''}${item.discrepancyLitres} L (${item.variancePercentage > 0 ? '+' : ''}${item.variancePercentage}%)`
                          : 'Velocity Transit Discordance'}
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase ${
                          isCrit
                            ? 'bg-[#9E4939] text-[#FFFDF7]'
                            : item.priority === 'HIGH'
                            ? 'bg-[#B78632] text-[#FFFDF7]'
                            : 'bg-[#607481] text-[#FFFDF7]'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F4F1E8] border border-[#202521]/15 text-[#202521]">
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Assigned Officer */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-[#202521]">
                        <UserCheck className="w-3.5 h-3.5 text-[#66734A]" />
                        <span>{item.assignedOfficerName || 'Unassigned'}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/app/investigations/${item.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded bg-[#26352D] hover:bg-[#202521] text-[#FFFDF7] text-xs font-semibold transition-colors"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3 h-3" />
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
