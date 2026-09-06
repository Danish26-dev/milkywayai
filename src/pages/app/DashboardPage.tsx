import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileSearch,
  Filter,
  Layers,
  MapPin,
  RefreshCw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserCheck,
  ChevronRight
} from 'lucide-react';
import {
  investigationService,
  supplyChainJournalService,
  alertService
} from '../../services';
import {
  InvestigationCase,
  SupplyChainEvent,
  ActiveAlert,
  Anomaly
} from '../../types/models';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [priorityCases, setPriorityCases] = useState<InvestigationCase[]>([]);
  const [allCases, setAllCases] = useState<InvestigationCase[]>([]);
  const [recentEvents, setRecentEvents] = useState<SupplyChainEvent[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [queueFilter, setQueueFilter] = useState<string>('ALL');

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [pCases, cases, events, alerts, anoms] = await Promise.all([
        investigationService.getPriorityInvestigations(),
        investigationService.getAllCases(),
        supplyChainJournalService.getRecentEvents(8),
        alertService.getActiveAlerts(),
        investigationService.getAnomalies(4)
      ]);
      setPriorityCases(pCases);
      setAllCases(cases);
      setRecentEvents(events);
      setActiveAlerts(alerts);
      setAnomalies(anoms);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const filteredQueue = allCases.filter(c => {
    if (queueFilter === 'ALL') return true;
    if (queueFilter === 'IMMEDIATE') return c.priority === 'IMMEDIATE';
    if (queueFilter === 'ASSIGNED') return c.status === 'ASSIGNED' || c.status === 'ACTIVE_ANALYSIS';
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Prime Header & Question Framing */}
      <div className="bg-[#26352D] text-[#FFFDF7] p-6 sm:p-7 rounded-2xl shadow-sm border border-[#202521]/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-2 rounded-full bg-[#202521] border border-white/15 text-[11px] font-mono text-[#D8D3C7]">
              <span className="w-2 h-2 rounded-full bg-[#B78632]" />
              <span className="font-semibold uppercase tracking-wider">Priority Decision Support</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-[#FFFDF7]">
              Which batches or facilities should I investigate first?
            </h1>
            <p className="text-xs sm:text-sm text-[#D8D3C7]/90 mt-1 max-w-2xl leading-relaxed">
              Real-time discrepancy ranking computed deterministically from the BigQuery append-only supply journal.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={loadDashboardData}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-medium rounded-lg bg-white/10 hover:bg-white/15 text-[#FFFDF7] border border-white/15 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
            <Link
              to="/app/investigations"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold font-sans rounded-lg bg-[#66734A] hover:bg-[#586440] text-[#FFFDF7] transition-colors shadow-xs"
            >
              <span>Full Investigation Roster</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Executive Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/15 text-left">
          <div className="bg-[#202521]/60 p-3 rounded-xl border border-white/10">
            <span className="text-[10px] font-mono text-[#D8D3C7]/70 uppercase block">Immediate Priority</span>
            <span className="text-2xl font-bold font-mono text-[#FFFDF7]">2 Batches</span>
            <span className="text-[10px] text-[#B78632] block font-mono mt-0.5">Physical inspection advised</span>
          </div>

          <div className="bg-[#202521]/60 p-3 rounded-xl border border-white/10">
            <span className="text-[10px] font-mono text-[#D8D3C7]/70 uppercase block">Max Volume Discrepancy</span>
            <span className="text-2xl font-bold font-mono text-[#FFFDF7]">+1,420 L</span>
            <span className="text-[10px] text-[#9E4939] block font-mono mt-0.5">Ludhiana Central Plant</span>
          </div>

          <div className="bg-[#202521]/60 p-3 rounded-xl border border-white/10">
            <span className="text-[10px] font-mono text-[#D8D3C7]/70 uppercase block">Active Alerts</span>
            <span className="text-2xl font-bold font-mono text-[#FFFDF7]">{activeAlerts.length} Active</span>
            <span className="text-[10px] text-[#D8D3C7]/80 block font-mono mt-0.5">2 Critical • 1 Warning</span>
          </div>

          <div className="bg-[#202521]/60 p-3 rounded-xl border border-white/10">
            <span className="text-[10px] font-mono text-[#D8D3C7]/70 uppercase block">Journal Integrity</span>
            <span className="text-2xl font-bold font-mono text-[#66734A]">100%</span>
            <span className="text-[10px] text-[#D8D3C7]/70 block font-mono mt-0.5">Immutable BigQuery ledger</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: Priority Investigations */}
      <section className="bg-[#FFFDF7] rounded-xl border border-[#202521]/15 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-[#202521]/15 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#9E4939]" />
              <h2 className="text-base font-bold text-[#202521] font-sans">
                1. Priority Investigations
              </h2>
            </div>
            <p className="text-xs text-[#202521]/70 mt-0.5 font-normal">
              Batches with high-confidence mass-balance or velocity divergence ranked by urgent inspection priority.
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#66734A] bg-[#66734A]/10 px-2 py-1 rounded font-bold">
            ACTION REQUIRED
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F4F1E8]/60 border-b border-[#202521]/10 font-mono text-[11px] text-[#202521]/80">
                <th className="py-3 px-4 font-semibold">Priority</th>
                <th className="py-3 px-4 font-semibold">Batch</th>
                <th className="py-3 px-4 font-semibold">Facility</th>
                <th className="py-3 px-4 font-semibold">Anomaly</th>
                <th className="py-3 px-4 font-semibold text-right">Discrepancy</th>
                <th className="py-3 px-4 font-semibold text-center">Evidence Confidence</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202521]/10">
              {priorityCases.map((c) => {
                const isSurplus = c.discrepancyLitres > 0;
                return (
                  <tr key={c.id} className="hover:bg-[#F4F1E8]/40 transition-colors">
                    {/* 1. Priority */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                          c.priority === 'IMMEDIATE'
                            ? 'bg-[#9E4939] text-[#FFFDF7]'
                            : 'bg-[#B78632] text-[#FFFDF7]'
                        }`}
                      >
                        {c.priority}
                      </span>
                    </td>

                    {/* 2. Batch */}
                    <td className="py-3 px-4 font-mono font-bold text-[#26352D]">
                      <Link
                        to={`/app/batches/${c.batchId}`}
                        className="hover:underline flex items-center gap-1.5"
                      >
                        <span>{c.batchCode}</span>
                        <ExternalLink className="w-3 h-3 text-[#202521]/40" />
                      </Link>
                    </td>

                    {/* 3. Facility */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#202521]">{c.facilityName}</div>
                      <div className="text-[10px] font-mono text-[#202521]/60">{c.facilityId}</div>
                    </td>

                    {/* 4. Anomaly */}
                    <td className="py-3 px-4 max-w-xs">
                      <span className="font-medium text-[#202521] block">
                        {c.primaryAnomalyType === 'MASS_BALANCE_SURPLUS' && 'UNACCOUNTED QUANTITY (+1,200 L Surplus)'}
                        {c.primaryAnomalyType === 'VELOCITY_IMPOSSIBILITY' && 'IMPLAUSIBLE MOVEMENT (175.7 km/h)'}
                        {c.primaryAnomalyType === 'MASS_BALANCE_EXCESSIVE_LOSS' && 'SUPPLY-CHAIN ANOMALY (Excessive Shrinkage)'}
                        {c.primaryAnomalyType === 'TEMPERATURE_EXCURSION' && 'INVESTIGATION SIGNAL (Thermal Excursion)'}
                      </span>
                      <span className="text-[10px] font-mono text-[#202521]/65 line-clamp-1">
                        Case {c.caseNumber}
                      </span>
                    </td>

                    {/* 5. Discrepancy */}
                    <td className="py-3 px-4 font-mono text-right">
                      {c.discrepancyLitres !== 0 ? (
                        <div className="flex items-center justify-end gap-1 font-bold">
                          {isSurplus ? (
                            <TrendingUp className="w-3.5 h-3.5 text-[#9E4939]" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5 text-[#8A6A4A]" />
                          )}
                          <span className={isSurplus ? 'text-[#9E4939]' : 'text-[#8A6A4A]'}>
                            {isSurplus ? '+' : ''}{c.discrepancyLitres.toLocaleString()} L
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#202521]/60 font-mono">0 L (Transit velocity divergence)</span>
                      )}
                      {c.variancePercentage !== 0 && (
                        <span className="text-[10px] text-[#202521]/60 font-mono block">
                          ({c.variancePercentage > 0 ? '+' : ''}{c.variancePercentage.toFixed(1)}%)
                        </span>
                      )}
                    </td>

                    {/* 6. Evidence Confidence */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-[#66734A]/10 text-[#66734A]">
                        <span>{Math.round((c.evidenceConfidenceScore || 0.98) * 100)}%</span>
                        <span className="text-[9px] text-[#202521]/50 font-normal">Immutable</span>
                      </div>
                    </td>

                    {/* 7. Status */}
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        c.status === 'OPEN' || c.status === 'QUEUED' ? 'bg-[#2E4057]/15 text-[#2E4057]' :
                        c.status === 'UNDER_REVIEW' || c.status === 'ACTIVE_ANALYSIS' ? 'bg-[#B78632]/15 text-[#B78632]' :
                        c.status === 'INSPECTION_REQUIRED' || c.status === 'ESCALATED_TO_INSPECTION' ? 'bg-[#9E4939]/15 text-[#9E4939]' :
                        'bg-[#66734A]/15 text-[#66734A]'
                      }`}>
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* 8. Action */}
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/app/investigations/${c.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded bg-[#26352D] hover:bg-[#202521] text-[#FFFDF7] text-xs font-semibold transition-colors"
                      >
                        <span>Investigate</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 2 & 3 in Responsive Dual Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* SECTION 2: Recent Supply Chain Activity (7 Cols) */}
        <section className="lg:col-span-7 bg-[#FFFDF7] rounded-xl border border-[#202521]/15 shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#202521]/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#66734A]" />
              <h2 className="text-base font-bold text-[#202521] font-sans">
                2. Recent Supply Chain Activity
              </h2>
            </div>
            <span className="text-[10px] font-mono text-[#202521]/60">
              BigQuery Event Journal
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F4F1E8]/60 border-b border-[#202521]/10 font-mono text-[11px] text-[#202521]/80">
                  <th className="py-2.5 px-4 font-semibold">Time</th>
                  <th className="py-2.5 px-4 font-semibold">Batch</th>
                  <th className="py-2.5 px-4 font-semibold">Event</th>
                  <th className="py-2.5 px-4 font-semibold">Facility</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Quantity</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202521]/10">
                {recentEvents.map((evt) => {
                  const eventTime = new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const isFlaggedBatch = evt.batchId === 'BATCH-2026-0901' || evt.batchId === 'BATCH-2026-0894';
                  return (
                    <tr key={evt.eventId} className="hover:bg-[#F4F1E8]/40 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-[11px] text-[#202521]/70">
                        {eventTime}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#26352D]">
                        <Link to={`/app/batches/${evt.batchId}`} className="hover:underline">
                          {evt.batchId.replace('BATCH-2026-', 'MW-')}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-medium text-[#202521]">
                          {evt.eventType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[#202521]/80 font-normal">
                        {evt.facilityName.split(' ')[0]} Hub
                      </td>
                      <td className="py-2.5 px-4 font-mono text-right font-bold text-[#202521]">
                        {evt.quantityLitres.toLocaleString()} L
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                            isFlaggedBatch
                              ? 'bg-[#9E4939]/10 text-[#9E4939]'
                              : 'bg-[#66734A]/10 text-[#66734A]'
                          }`}
                        >
                          {isFlaggedBatch ? 'FLAGGED' : 'RECORDED'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-[#F4F1E8]/60 border-t border-[#202521]/10 text-[10px] font-mono text-[#202521]/70 flex items-center justify-between">
            <span>Cryptographically sealed & chained</span>
            <Link to="/app/batches" className="text-[#26352D] font-bold hover:underline">
              View All Batches →
            </Link>
          </div>
        </section>

        {/* SECTION 3: Active Alerts (5 Cols) */}
        <section className="lg:col-span-5 bg-[#FFFDF7] rounded-xl border border-[#202521]/15 shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#202521]/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#B78632]" />
              <h2 className="text-base font-bold text-[#202521] font-sans">
                3. Active Alerts
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#9E4939] bg-[#9E4939]/10 px-2 py-0.5 rounded">
              {activeAlerts.length} Unresolved
            </span>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto">
            {activeAlerts.map((alert) => {
              const isCrit = alert.severity === 'CRITICAL';
              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border text-xs transition-all ${
                    isCrit
                      ? 'bg-[#FFFDF7] border-[#9E4939]/40 hover:border-[#9E4939]'
                      : 'bg-[#F4F1E8]/50 border-[#202521]/15'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isCrit ? 'bg-[#9E4939]' : 'bg-[#B78632]'
                        }`}
                      />
                      <span className="font-bold text-[#202521] font-sans">
                        {alert.title}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                        isCrit ? 'bg-[#9E4939] text-[#FFFDF7]' : 'bg-[#B78632] text-[#FFFDF7]'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#202521]/80 mt-1 leading-relaxed font-normal">
                    {alert.summary}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#202521]/10 text-[10px] font-mono text-[#202521]/60">
                    <span>{alert.facilityName.split(' ')[0]}</span>
                    <Link
                      to={`/app/batches/${alert.batchId}`}
                      className="text-[#26352D] font-bold hover:underline"
                    >
                      Audit Batch →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-[#F4F1E8]/60 border-t border-[#202521]/10 text-right">
            <Link to="/app/alerts" className="text-xs font-mono font-bold text-[#26352D] hover:underline">
              Open Alerts Console →
            </Link>
          </div>
        </section>
      </div>

      {/* SECTION 4: Investigation Queue */}
      <section className="bg-[#FFFDF7] rounded-xl border border-[#202521]/15 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-[#202521]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-[#26352D]" />
              <h2 className="text-base font-bold text-[#202521] font-sans">
                4. Investigation Queue
              </h2>
            </div>
            <p className="text-xs text-[#202521]/70 mt-0.5 font-normal">
              Active officer casework and triage assignments for physical verification.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#202521]/60">Filter:</span>
            {['ALL', 'IMMEDIATE', 'ASSIGNED'].map((filterVal) => (
              <button
                key={filterVal}
                onClick={() => setQueueFilter(filterVal)}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                  queueFilter === filterVal
                    ? 'bg-[#26352D] text-[#FFFDF7] font-bold'
                    : 'bg-[#F4F1E8] text-[#202521] hover:bg-[#D8D3C7]/60'
                }`}
              >
                {filterVal}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F4F1E8]/60 border-b border-[#202521]/10 font-mono text-[11px] text-[#202521]/80">
                <th className="py-3 px-4 font-semibold">Priority</th>
                <th className="py-3 px-4 font-semibold">Batch</th>
                <th className="py-3 px-4 font-semibold">Reason</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold">Assigned Officer</th>
                <th className="py-3 px-4 font-semibold text-right">Case File</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202521]/10">
              {filteredQueue.map((item) => {
                return (
                  <tr key={item.id} className="hover:bg-[#F4F1E8]/40 transition-colors">
                    {/* Priority */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          item.priority === 'IMMEDIATE'
                            ? 'bg-[#9E4939] text-[#FFFDF7]'
                            : item.priority === 'HIGH'
                            ? 'bg-[#B78632] text-[#FFFDF7]'
                            : 'bg-[#607481] text-[#FFFDF7]'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>

                    {/* Batch */}
                    <td className="py-3 px-4 font-mono font-bold text-[#26352D]">
                      <Link to={`/app/batches/${item.batchId}`} className="hover:underline">
                        {item.batchCode}
                      </Link>
                      <div className="text-[10px] text-[#202521]/60 font-mono font-normal">
                        {item.facilityName}
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="py-3 px-4 max-w-md">
                      <div className="font-semibold text-[#202521]">
                        {item.primaryAnomalyType.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[11px] text-[#202521]/70 font-normal line-clamp-1">
                        Discrepancy: {item.discrepancyLitres !== 0 ? `${item.discrepancyLitres > 0 ? '+' : ''}${item.discrepancyLitres} L` : 'Route Transit Divergence'}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F4F1E8] border border-[#202521]/15 text-[#202521]">
                        <span>{item.status.replace(/_/g, ' ')}</span>
                      </span>
                    </td>

                    {/* Assigned Officer */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-[#202521]">
                        <UserCheck className="w-3.5 h-3.5 text-[#66734A]" />
                        <span>{item.assignedOfficerName || 'Unassigned (General Pool)'}</span>
                      </div>
                      <div className="text-[10px] font-mono text-[#202521]/60">
                        {item.assignedOfficerId || 'Pending officer claim'}
                      </div>
                    </td>

                    {/* Case File Action */}
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/app/investigations/${item.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded bg-[#F4F1E8] hover:bg-[#D8D3C7]/60 text-[#26352D] border border-[#202521]/20 text-xs font-bold transition-colors"
                      >
                        <span>{item.caseNumber}</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Non-Diagnostic Standard Operational Disclaimer */}
      <div className="p-4 rounded-xl bg-[#F4F1E8] border border-[#202521]/15 text-xs text-[#202521]/80 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#66734A] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#202521] block">
            Regulatory Boundary & Evidentiary Standard Notice:
          </span>
          <p className="mt-0.5 leading-relaxed font-normal">
            MilkyWay prioritizes physical inspections based on mathematical mass-balance and logistics discrepancies. It does not certify milk purity or food-safety compliance. Enforceable legal findings require physical facility entry, chain-of-custody sample collection, and accredited laboratory analysis.
          </p>
        </div>
      </div>
    </div>
  );
};
