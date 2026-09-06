import React, { useState } from 'react';
import { Bot, Terminal, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, Play, RefreshCw, FileText, ChevronRight, Cpu } from 'lucide-react';

export const InvestigationWorkflow: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(6); // Default to full brief generated
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const timeline = [
    {
      id: 'step-0',
      phase: 'ANOMALY',
      label: 'Deterministic Anomaly Trigger',
      tool: 'mass_balance_engine',
      detail: 'Batch MW-10482 flagged with 330 L physical shortfall (33.0% deficit outside 2% tolerance).',
      result: 'Investigation case initialized for autonomous agent triage.',
      status: 'SIGNAL_FLAGGED'
    },
    {
      id: 'step-1',
      phase: 'TRACE BATCH',
      label: 'Trace Batch Lineage',
      tool: 'trace_batch("MW-10482")',
      detail: 'Reconstructing graph of custody: Farm-019 → CC-204 → Tanker V-22 → Plant P-07.',
      result: 'Lineage mapped. Custody gap pinpointed to CC-204 holding vat prior to dispatch.',
      status: 'GRAPH_TRACED'
    },
    {
      id: 'step-2',
      phase: 'CHECK FACILITY',
      label: 'Facility Historical Profile',
      tool: 'get_facility_history("CC-204")',
      detail: 'Querying append-only BigQuery logs for Chilling Center CC-204 across trailing 90 days.',
      result: '2 previous unexplained shortfalls identified (MW-10410, MW-10444) at CC-204.',
      status: 'HISTORY_ACCESSED'
    },
    {
      id: 'step-3',
      phase: 'CHECK VEHICLE',
      label: 'Vehicle Telematics & Transit',
      tool: 'get_vehicle_history("V-22")',
      detail: 'Evaluating GPS coordinates, transit route velocity, and digital manifold valve seals.',
      result: 'Implausible velocity: 180 km traveled in 45 min recorded on intake docket.',
      status: 'VELOCITY_FLAGGED'
    },
    {
      id: 'step-4',
      phase: 'CHECK RELATED BATCHES',
      label: 'Contiguous Batch Cross-Check',
      tool: 'get_related_batches(["MW-10480", "MW-10481"])',
      detail: 'Auditing co-mingled milk handled at CC-204 during the same morning shift.',
      result: 'Batch MW-10480 from identical holding vat had 140 L missing volume.',
      status: 'CORRELATED_BATCHES'
    },
    {
      id: 'step-5',
      phase: 'CORRELATE EVIDENCE',
      label: 'Multi-Modal Evidence Synthesis',
      tool: 'correlate_evidence()',
      detail: 'Synthesizing facility recurrent deficits, vehicle timing anomalies, and volumetric shortfalls.',
      result: 'High evidence confidence isolating systematic discrepancy pattern at CC-204.',
      status: 'EVIDENCE_ALIGNED'
    },
    {
      id: 'step-6',
      phase: 'INVESTIGATION BRIEF',
      label: 'Non-Diagnostic Inspection Dossier',
      tool: 'generate_investigation_brief()',
      detail: 'Compiling structured brief with specific inspection priorities for Food Safety Officers.',
      result: 'Dossier ready: High inspection priority at CC-204. Zero subjective claims of adulteration.',
      status: 'DOSSIER_COMPLETE'
    }
  ];

  const handleSimulate = () => {
    setIsSimulating(true);
    setCurrentStepIndex(0);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < timeline.length) {
        setCurrentStepIndex(step);
      } else {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 650);
  };

  return (
    <section id="investigation-agent" className="py-20 bg-[#FFFDF7] border-b border-[#26352D]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#66734A]" />
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#66734A] font-bold">
              SECTION 5 • INVESTIGATION AGENT
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#202521] tracking-tight font-sans">
            From anomaly to investigation.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#202521]/80 leading-relaxed font-normal">
            When the deterministic mass-balance engine flags a discrepancy, Gemini acts as an evidence-driven investigator—calling scoped MCP tools against BigQuery to assemble an inspection brief for human officers.
          </p>
        </div>

        {/* 7-Stage Investigation Timeline Breadcrumb (Exact sequence requested) */}
        <div className="mb-10 bg-[#F4F1E8] border border-[#26352D]/15 rounded-3xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#26352D]/10 mb-4 gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#26352D]">
              Autonomous Investigation Pipeline (ANOMALY → INVESTIGATION BRIEF)
            </span>
            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="px-4 py-1.5 bg-[#26352D] hover:bg-[#202521] text-[#FFFDF7] text-xs font-mono font-bold rounded-full flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Tracing Pipeline...' : 'Re-Run Trace Pipeline'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs font-mono">
            {timeline.map((item, idx) => {
              const isPastOrActive = idx <= currentStepIndex;
              const isActive = idx === currentStepIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? 'bg-[#26352D] text-[#FFFDF7] border-[#26352D] shadow-md scale-[1.02]'
                      : isPastOrActive
                      ? 'bg-[#FFFDF7] text-[#202521] border-[#66734A]/40'
                      : 'bg-[#F4F1E8] text-[#202521]/40 border-transparent opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between text-[9px] font-bold">
                    <span>{idx + 1}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive
                          ? 'bg-[#B78632] animate-pulse'
                          : isPastOrActive
                          ? 'bg-[#66734A]'
                          : 'bg-gray-300'
                      }`}
                    />
                  </div>
                  <span className="font-bold text-[10px] mt-1.5 block leading-tight truncate">
                    {item.phase}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Column Layout: Left Agent Tool Calls, Right Non-Diagnostic Brief */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Terminal Agent Execution & Tool Calls */}
          <div className="lg:col-span-7 bg-[#202521] text-[#FFFDF7] rounded-3xl p-6 sm:p-7 border-2 border-[#26352D] shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#26352D] flex items-center justify-center text-[#B78632]">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#B78632] uppercase tracking-widest font-bold">
                      Agent Runtime Trace
                    </span>
                    <h4 className="text-sm font-bold text-[#FFFDF7] font-mono">
                      Gemini Investigation Agent via MCP Tools
                    </h4>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#D8D3C7]/60 bg-white/10 px-2.5 py-1 rounded-full">
                  Append-Only BigQuery Read
                </span>
              </div>

              {/* Terminal Step Log Display */}
              <div className="space-y-3 font-mono text-xs">
                {timeline.slice(0, currentStepIndex + 1).map((t, idx) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-2xl bg-[#26352D]/70 border border-white/10 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-[#B78632] font-bold">
                        &gt; {t.tool}
                      </span>
                      <span className="text-[10px] text-[#D8D3C7]/60">
                        {t.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#D8D3C7] font-sans">
                      {t.detail}
                    </p>
                    <div className="mt-2 text-[10px] text-[#FFFDF7] font-mono bg-black/40 p-2 rounded-xl border border-white/5 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#66734A] shrink-0" />
                      <span>{t.result}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#D8D3C7]/70">
              <span>Scoped MCP Tool Calls</span>
              <span className="text-[#66734A] font-bold">Zero Prompt Injections / Safe Boundaries</span>
            </div>
          </div>

          {/* Right Column: Non-Diagnostic Investigation Brief */}
          <div className="lg:col-span-5 bg-[#F4F1E8] border-2 border-[#26352D]/20 rounded-3xl p-6 sm:p-7 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#26352D]/15 mb-5">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#26352D] font-bold">
                    INVESTIGATION BRIEF OUTPUT
                  </span>
                  <h4 className="text-lg font-bold text-[#202521] font-mono mt-0.5">
                    Case MW-10482-BRIEF
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 bg-[#26352D] text-[#FFFDF7] rounded-full">
                  READY FOR FSO
                </span>
              </div>

              {/* Brief Content strictly obeying Non-Diagnostic rules */}
              <div className="space-y-4 text-xs font-sans text-[#202521]/85 leading-relaxed">
                <div className="bg-[#FFFDF7] p-4 rounded-2xl border border-[#26352D]/10">
                  <span className="font-bold text-[#202521] font-mono text-[11px] uppercase block mb-1">
                    1. Description of Discrepancy:
                  </span>
                  <p>
                    330 L unaccounted shortfall detected at CC-204 between aggregated farm receipts (1,000 L) and outgoing tanker loading (650 L). Permitted chilling tolerance was 20 L.
                  </p>
                </div>

                <div className="bg-[#FFFDF7] p-4 rounded-2xl border border-[#26352D]/10">
                  <span className="font-bold text-[#202521] font-mono text-[11px] uppercase block mb-1">
                    2. Discrepancy Confidence:
                  </span>
                  <p>
                    <strong className="text-[#202521]">HIGH (Deterministic)</strong>. Supported by write-once meter logs, weigh-bridge tickets, and correlated previous incident history on same route.
                  </p>
                </div>

                <div className="bg-[#FFFDF7] p-4 rounded-2xl border border-[#26352D]/10">
                  <span className="font-bold text-[#202521] font-mono text-[11px] uppercase block mb-1">
                    3. Recommended Human Action:
                  </span>
                  <p>
                    <strong className="text-[#9E4939]">HIGH INSPECTION PRIORITY</strong>. Route inspection team to Chilling Center CC-204 intake vat #03 and tanker V-22 manifold connection.
                  </p>
                </div>

                {/* Explicit Non-Diagnostic Safeguard Banner */}
                <div className="p-3.5 rounded-2xl bg-[#D8D3C7]/40 border border-[#26352D]/15 text-[11px] font-sans text-[#202521]/75">
                  <span className="font-bold text-[#202521] block font-mono text-[10px] uppercase mb-0.5">
                    NON-DIAGNOSTIC NOTICE:
                  </span>
                  MilkyWay does not determine whether milk is adulterated or contaminated. Physical inspection and laboratory testing by human authorities are required to verify actual food-safety violations.
                </div>
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-[#26352D]/15 flex items-center justify-between text-xs font-mono">
              <span className="text-[#66734A] font-bold">Investigator: Gemini Agent</span>
              <span className="text-[#202521]/60">Evidence-Backed Only</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
