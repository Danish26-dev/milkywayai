import React, { useState } from 'react';
import { Shield, MapPin, Eye, Filter, CheckCircle, AlertTriangle, Clock, ArrowUpRight, Search, FileCheck, ArrowRight, Compass } from 'lucide-react';

interface InvestigationItem {
  id: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  facility: string;
  facilityName: string;
  discrepancyText: string;
  timestamp: string;
  status: 'PENDING_INSPECTION' | 'INSPECTOR_DISPATCHED' | 'EVALUATING';
  route: string;
  evidenceConfidence: 'HIGH' | 'MEDIUM' | 'MODERATE';
  recommendation: string;
  anomalies: string[];
}

export const OfficerPreview: React.FC = () => {
  const [selectedBatchId, setSelectedBatchId] = useState<string>('MW-10482');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');

  const investigations: InvestigationItem[] = [
    {
      id: 'MW-10482',
      priority: 'HIGH',
      facility: 'CC-204',
      facilityName: 'Chilling Center CC-204 (Facility X)',
      discrepancyText: '330 L unaccounted shortfall (33.0% divergence)',
      timestamp: '08:20 AM Today',
      status: 'PENDING_INSPECTION',
      route: 'Farm-019 → CC-204 → Tanker V-22 → Plant P-07',
      evidenceConfidence: 'HIGH',
      recommendation: 'Prioritize physical inspection at Facility X (CC-204). Audit intake vat #03 and tanker V-22 manifold seals.',
      anomalies: [
        '330 L unaccounted quantity between intake and dispatch',
        'Previous related anomaly detected on same transit corridor (MW-10391)',
        'Vehicle V-22 implausible transit speed recorded (180 km in 45 min)'
      ]
    },
    {
      id: 'MW-10391',
      priority: 'HIGH',
      facility: 'Plant P-07',
      facilityName: 'Processing Plant P-07 Intake Bay',
      discrepancyText: 'Vehicle V-22 transit speed physically impossible (240 km/h)',
      timestamp: 'Yesterday 17:45',
      status: 'INSPECTOR_DISPATCHED',
      route: 'CC-204 → Tanker V-22 → Plant P-07',
      evidenceConfidence: 'HIGH',
      recommendation: 'Inspect driver manifest and compare GPS blackbox against logged docket timestamps.',
      anomalies: [
        'Recorded travel time 45 min for 180 km highway transit',
        'Back-dated arrival docket timestamped before actual GPS geofence entry',
        'Driver recorded manual override on manifold valve seal'
      ]
    },
    {
      id: 'MW-10422',
      priority: 'LOW',
      facility: 'CC-118',
      facilityName: 'District Dairy Cooperative CC-118',
      discrepancyText: 'Minor chilling discrepancy (42 L variance > normal 2% tolerance)',
      timestamp: 'Yesterday 11:10',
      status: 'EVALUATING',
      route: 'Farm-041 → CC-118',
      evidenceConfidence: 'MODERATE',
      recommendation: 'Request automated recalibration certificate from CC-118 weighmaster before scheduling inspection.',
      anomalies: [
        '42 L shortfall exceeds 2.0% accepted chilling loss by 0.8%',
        'No prior incident history for facility in trailing 180 days'
      ]
    },
  ];

  const filtered = investigations.filter((inv) =>
    filterPriority === 'ALL' ? true : inv.priority === filterPriority
  );

  const selected = investigations.find((inv) => inv.id === selectedBatchId) || investigations[0];

  return (
    <section id="officer-preview" className="py-20 bg-[#F4F1E8] border-b border-[#26352D]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header - Exact title */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B78632]" />
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#B78632] font-bold">
              SECTION 4 • THE FOOD SAFETY OFFICER
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#202521] tracking-tight font-sans">
            Limited inspectors. Too many places to check.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#202521]/80 leading-relaxed font-normal">
            Regulatory authorities cannot be everywhere at once. MilkyWay eliminates random spot-checks by synthesizing supply-chain telemetry into high-confidence physical inspection priorities.
          </p>
        </div>

        {/* Console Container in Charcoal Green */}
        <div className="bg-[#26352D] text-[#FFFDF7] border-2 border-[#26352D] rounded-3xl shadow-xl overflow-hidden">
          {/* Top Bar / App Header */}
          <div className="bg-[#202521] px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B78632] animate-pulse" />
              <span className="font-bold tracking-wider text-[#FFFDF7]">
                MILKYWAY REGULATORY ENFORCEMENT CONSOLE
              </span>
              <span className="text-[#D8D3C7]/40 hidden sm:inline">•</span>
              <span className="text-[#D8D3C7]/70 hidden sm:inline text-[11px]">
                Regional Milk Safety Division
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#D8D3C7]/60 text-[11px]">Credential:</span>
              <span className="bg-[#26352D] px-3.5 py-1 rounded-full text-[#FFFDF7] border border-white/15 font-bold shadow-xs">
                OFFICER FSO-7740 (Authorized)
              </span>
            </div>
          </div>

          {/* Sub-Header Controls */}
          <div className="bg-[#26352D]/90 px-6 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase text-[#D8D3C7] font-semibold">Inspection Priority Filter:</span>
              {(['ALL', 'HIGH', 'LOW'] as const).map((pri) => (
                <button
                  key={pri}
                  onClick={() => setFilterPriority(pri)}
                  className={`px-3.5 py-1 text-[11px] font-mono rounded-full transition-all cursor-pointer ${
                    filterPriority === pri
                      ? 'bg-[#FFFDF7] text-[#26352D] font-bold shadow-xs scale-102'
                      : 'bg-[#202521] text-[#D8D3C7]/80 hover:text-[#FFFDF7]'
                  }`}
                >
                  {pri}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-[#D8D3C7]/80">
              <span className="bg-[#202521] px-3 py-1 rounded-full border border-white/10">
                3 prioritized audit dossiers active
              </span>
            </div>
          </div>

          {/* Main Console Split: Left Queue, Right Dossier & Map */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
            {/* Left Queue: 5 Cols */}
            <div className="lg:col-span-5 p-5 sm:p-6 space-y-3 bg-[#202521]/60">
              <span className="text-[10px] font-mono text-[#D8D3C7]/70 uppercase tracking-[0.2em] block mb-2 font-bold">
                Triage Queue (Ranked by Inspection Urgency)
              </span>

              {filtered.map((item) => {
                const isSelected = selectedBatchId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedBatchId(item.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#202521] border-[#B78632] shadow-md ring-2 ring-[#B78632]/40'
                        : 'bg-[#26352D]/70 border-white/10 hover:bg-[#202521]/80'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#FFFDF7]">
                          {item.id}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                            item.priority === 'HIGH'
                              ? 'bg-[#9E4939] text-[#FFFDF7]'
                              : 'bg-[#B78632] text-[#202521]'
                          }`}
                        >
                          PRIORITY: {item.priority}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#D8D3C7]/70">
                        {item.timestamp}
                      </span>
                    </div>

                    <div className="mt-2 text-xs font-sans text-[#FFFDF7]">
                      <span className="font-semibold text-[#D8D3C7]">{item.facility}</span> — {item.facilityName}
                    </div>

                    <p className="text-[11px] font-mono text-[#B78632] mt-1.5 font-medium">
                      {item.discrepancyText}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-[#D8D3C7]/70">
                      <span>{item.route}</span>
                      <span className="text-[#B78632] font-bold">Confidence: {item.evidenceConfidence}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Dossier & Geographic Route: 7 Cols */}
            <div className="lg:col-span-7 p-6 sm:p-7 bg-[#202521]/95 flex flex-col justify-between">
              <div>
                {/* Dossier Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/10 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#B78632] font-bold">
                        EVIDENTIARY INSPECTION DOSSIER
                      </span>
                      <span className="text-[10px] font-mono text-[#D8D3C7]/50">• Status: {selected.status}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold font-mono text-[#FFFDF7] mt-1">
                      {selected.facilityName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-3 py-1.5 bg-[#9E4939]/20 text-[#9E4939] border border-[#9E4939]/40 rounded-full">
                      HIGH INSPECTION PRIORITY
                    </span>
                  </div>
                </div>

                {/* Evidence Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-5 font-mono text-xs">
                  <div className="bg-[#26352D] border border-white/10 rounded-2xl p-3.5">
                    <span className="text-[10px] text-[#D8D3C7]/70 uppercase block">Discrepancy</span>
                    <span className="text-base font-bold text-[#B78632] mt-1 block">330 L Missing</span>
                    <span className="text-[10px] text-[#D8D3C7]/60">33.0% from batch</span>
                  </div>

                  <div className="bg-[#26352D] border border-white/10 rounded-2xl p-3.5">
                    <span className="text-[10px] text-[#D8D3C7]/70 uppercase block">Evidence Confidence</span>
                    <span className="text-base font-bold text-[#FFFDF7] mt-1 block">{selected.evidenceConfidence}</span>
                    <span className="text-[10px] text-[#D8D3C7]/60">Deterministic match</span>
                  </div>

                  <div className="bg-[#26352D] border border-white/10 rounded-2xl p-3.5">
                    <span className="text-[10px] text-[#D8D3C7]/70 uppercase block">Related Vehicle</span>
                    <span className="text-base font-bold text-[#9E4939] mt-1 block">Tanker V-22</span>
                    <span className="text-[10px] text-[#D8D3C7]/60">Velocity flag attached</span>
                  </div>
                </div>

                {/* Evidence Correlation Breakdown */}
                <div className="bg-[#26352D] rounded-2xl p-5 border border-white/10 mb-5">
                  <span className="text-xs font-mono font-bold text-[#B78632] uppercase block mb-2.5">
                    Correlated Evidence Trail:
                  </span>
                  <ul className="space-y-2 text-xs text-[#D8D3C7] font-sans">
                    {selected.anomalies.map((ano, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B78632] mt-1.5 shrink-0" />
                        <span>{ano}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Formal Recommendation Box */}
                <div className="p-4 rounded-2xl bg-[#9E4939]/15 border-2 border-[#9E4939]/40 text-xs">
                  <span className="font-bold text-[#FFFDF7] uppercase font-mono block mb-1">
                    OFFICIAL RECOMMENDATION:
                  </span>
                  <p className="text-[#D8D3C7] leading-relaxed">
                    “{selected.recommendation}”
                  </p>
                </div>
              </div>

              {/* Bottom Notice: Non-Diagnostic Constraint */}
              <div className="pt-5 mt-5 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
                <span className="text-[#D8D3C7]/75">
                  Inspection Priority Metric • No Adulteration Probabilities Calculated
                </span>
                <span className="text-[#B78632] font-bold">
                  Physical Sampling Mandatory
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
