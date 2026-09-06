import React, { useState } from 'react';
import { Truck, Warehouse, Factory, Store, Milk, AlertTriangle, CheckCircle2, ArrowRight, ShieldAlert } from 'lucide-react';

export const SupplyChainFlow: React.FC = () => {
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number>(1); // Default to collection center where discrepancy appears

  const stages = [
    {
      num: '01',
      title: 'JOURNAL',
      description: 'Every movement of a milk batch becomes a traceable, write-once event in BigQuery.',
      detail: 'Timestamped weight, chilling temperatures, and truck seal telemetry committed to an append-only ledger.',
    },
    {
      num: '02',
      title: 'DETECT',
      description: 'The system compares input, output and expected process loss deterministically.',
      detail: 'Mass-balance formulas identify mathematical shortfalls without subjective inference or LLM guessing.',
    },
    {
      num: '03',
      title: 'INVESTIGATE',
      description: 'Gemini investigates flagged batches using verified supply-chain data.',
      detail: 'Autonomous agent queries facility history, driver manifests, and linked batches via scoped MCP tools.',
    },
    {
      num: '04',
      title: 'INSPECT',
      description: 'Food Safety Officers use the evidence to prioritize physical inspections.',
      detail: 'Actionable dossiers route human inspection teams to specific chilling vats or receiving docks.',
    },
  ];

  const nodes = [
    {
      id: 'node-farm',
      name: 'Dairy Farm',
      code: 'FARM-019',
      stage: 'FARM',
      icon: Milk,
      status: 'normal',
      input: '1,000 L (Morning Milk)',
      output: '1,000 L',
      temperature: '3.8°C',
      timestamp: '05:45:00 UTC',
      loss: '0.0%',
      note: 'Normal dispatch from certified dairy cooperative bulk storage vat.',
    },
    {
      id: 'node-collection',
      name: 'Collection Chilling Center',
      code: 'CC-204',
      stage: 'COLLECTION',
      icon: Warehouse,
      status: 'flagged',
      input: '1,000 L Received',
      output: '650 L Dispatched to Plant',
      temperature: '4.1°C',
      timestamp: '08:20:12 UTC',
      loss: '20 L (Expected process shrinkage: 2.0%)',
      discrepancy: '330 L Unaccounted Discrepancy',
      note: 'Significant physical quantity shortfall detected prior to tanker dispatch.',
    },
    {
      id: 'node-processing',
      name: 'Processing & Pasteurization',
      code: 'PLANT-P07',
      stage: 'PROCESSING',
      icon: Factory,
      status: 'normal',
      input: '650 L (Tanker V-22)',
      output: '637 L (Pasteurized & Bottled)',
      temperature: '72.5°C (HTST)',
      timestamp: '11:15:30 UTC',
      loss: '13 L (Standard pasteurization 2%)',
      note: 'Intake weight match with CC-204 dispatch docket. Shortfall originated upstream.',
    },
    {
      id: 'node-distribution',
      name: 'Cold-Chain Logistics',
      code: 'DIST-HUB-03',
      stage: 'DISTRIBUTION',
      icon: Truck,
      status: 'normal',
      input: '637 L (Packaged)',
      output: '637 L (Reefer Transits)',
      temperature: '3.2°C',
      timestamp: '14:40:00 UTC',
      loss: '0 L',
      note: 'Full custody seal verified upon transfer to refrigerated inter-district carriers.',
    },
    {
      id: 'node-retail',
      name: 'Retail Distribution',
      code: 'RETAIL-METRO',
      stage: 'RETAIL',
      icon: Store,
      status: 'normal',
      input: '637 L In Store',
      output: 'Inventory Stocked',
      temperature: '3.6°C',
      timestamp: '17:00:00 UTC',
      loss: '0 L',
      note: 'Finished shelf placement. Batch lineage fully linked back to Farm-019.',
    },
  ];

  const selectedNode = nodes[selectedNodeIndex];

  return (
    <section id="how-it-works" className="py-20 bg-[#F7F5EF] border-b border-[#12372A]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#12372A]" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#4F7D5A] font-semibold">
              The MilkyWay Workflow
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#17201B] tracking-tight font-sans">
            From movement to investigation.
          </h2>
          <p className="mt-3 text-base text-[#17201B]/75 leading-relaxed">
            A continuous digital pipeline transforming disjointed weight tickets, cooling telemetry, and dispatch dockets into a defensible investigation trail.
          </p>
        </div>

        {/* 4 Core Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stages.map((stg) => (
            <div
              key={stg.num}
              className="bg-[#E9E2D0]/30 border border-[#12372A]/10 rounded-2xl p-6 hover:bg-[#E9E2D0]/50 transition-all hover:shadow-lg flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-2xl font-bold font-mono text-[#12372A]/30 group-hover:text-[#12372A]/50 transition-colors">
                    {stg.num}
                  </span>
                  <span className="text-[10px] font-mono tracking-widest text-[#4F7D5A] font-bold uppercase py-0.5 px-2.5 rounded-full bg-[#4F7D5A]/10 border border-[#4F7D5A]/20">
                    Phase {stg.num}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#12372A] font-mono uppercase tracking-wider mb-2">
                  {stg.title}
                </h3>
                <p className="text-xs sm:text-[13px] text-[#12372A]/85 font-medium leading-relaxed mb-3">
                  {stg.description}
                </p>
              </div>
              <p className="text-[11px] text-[#12372A]/60 border-t border-[#12372A]/10 pt-3 leading-normal">
                {stg.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Interactive Supply Chain Trace Pipeline */}
        <div className="bg-[#12372A] text-[#F7F5EF] rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#F7F5EF]/15 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4F7D5A]" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#E9E2D0]">
                  Live Supply-Chain Ledger Simulation
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#F7F5EF] font-sans mt-1 tracking-tight">
                Batch Trace MW-10482 Lineage
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono bg-[#17201B] px-3.5 py-1.5 rounded-full border border-[#F7F5EF]/10 shadow-xs">
              <span className="text-[#E9E2D0]/70">Status:</span>
              <span className="text-[#C58B32] font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                330 L Unaccounted at CC-204
              </span>
            </div>
          </div>

          {/* Supply Chain Track: Horizontal Flow */}
          <div className="py-8 overflow-x-auto">
            <div className="min-w-[720px] flex items-center justify-between relative px-4">
              {/* Connecting Supply Line */}
              <div className="absolute top-1/2 left-8 right-8 h-[2px] bg-[#F7F5EF]/15 -translate-y-1/2 -z-0" />
              {/* Highlighted anomaly line between CC and Plant */}
              <div className="absolute top-1/2 left-[28%] right-[52%] h-[3px] bg-[#C58B32] -translate-y-1/2 -z-0" />

              {nodes.map((node, idx) => {
                const IconComponent = node.icon;
                const isSelected = selectedNodeIndex === idx;
                const isAnomaly = node.status === 'flagged';

                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNodeIndex(idx)}
                    className="relative z-10 flex flex-col items-center group focus:outline-hidden cursor-pointer"
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                        isAnomaly
                          ? 'bg-[#C58B32] text-[#17201B] ring-4 ring-[#C58B32]/30 shadow-xl scale-105'
                          : isSelected
                          ? 'bg-[#F7F5EF] text-[#12372A] ring-2 ring-[#4F7D5A] shadow-md'
                          : 'bg-[#17201B] text-[#F7F5EF]/80 border border-[#F7F5EF]/20 group-hover:border-[#F7F5EF]/50 hover:scale-105'
                      }`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>

                    <div className="mt-3 text-center">
                      <span className="block text-[11px] font-mono font-semibold tracking-wider text-[#E9E2D0] uppercase">
                        {node.stage}
                      </span>
                      <span className="block text-[12px] font-medium text-[#F7F5EF]/90 mt-0.5">
                        {node.code}
                      </span>
                      {isAnomaly && (
                        <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-[#C58B32] text-[#17201B] font-mono text-[9px] font-bold rounded-full animate-pulse shadow-xs">
                          -330 L SIGNAL
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Node Detail Drawer */}
          <div className="bg-[#17201B] border border-[#F7F5EF]/10 rounded-2xl p-5 sm:p-6 mt-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F7F5EF]/10 gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#4F7D5A] font-bold">
                  Facility Inspection Checkpoint
                </span>
                <h4 className="text-lg font-bold text-[#F7F5EF] flex items-center gap-2">
                  <span>{selectedNode.name}</span>
                  <span className="text-xs font-mono font-normal text-[#E9E2D0]/60">
                    ({selectedNode.code})
                  </span>
                </h4>
              </div>
              <div className="flex items-center gap-2">
                {selectedNode.status === 'flagged' ? (
                  <span className="px-3 py-1 bg-[#C58B32]/20 border border-[#C58B32] text-[#C58B32] text-xs font-mono font-bold rounded-full flex items-center gap-1.5 shadow-xs">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    PRIORITIZE PHYSICAL INSPECTION
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-[#4F7D5A]/20 border border-[#4F7D5A] text-[#E9E2D0] text-xs font-mono font-medium rounded-full flex items-center gap-1.5 shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4F7D5A]" />
                    VERIFIED INVENTORY BALANCE
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-4 font-mono text-xs">
              <div className="bg-[#12372A]/60 p-3.5 rounded-xl border border-[#F7F5EF]/5">
                <span className="text-[10px] text-[#E9E2D0]/60 uppercase block">Recorded Input</span>
                <span className="text-sm font-bold text-[#F7F5EF]">{selectedNode.input}</span>
              </div>
              <div className="bg-[#12372A]/60 p-3.5 rounded-xl border border-[#F7F5EF]/5">
                <span className="text-[10px] text-[#E9E2D0]/60 uppercase block">Recorded Output</span>
                <span className="text-sm font-bold text-[#F7F5EF]">{selectedNode.output}</span>
              </div>
              <div className="bg-[#12372A]/60 p-3.5 rounded-xl border border-[#F7F5EF]/5">
                <span className="text-[10px] text-[#E9E2D0]/60 uppercase block">Chilling Temp</span>
                <span className="text-sm font-bold text-[#F7F5EF]">{selectedNode.temperature}</span>
              </div>
              <div className="bg-[#12372A]/60 p-3.5 rounded-xl border border-[#F7F5EF]/5">
                <span className="text-[10px] text-[#E9E2D0]/60 uppercase block">Loss Allowance</span>
                <span className="text-sm font-bold text-[#F7F5EF]">{selectedNode.loss}</span>
              </div>
            </div>

            {selectedNode.discrepancy && (
              <div className="bg-[#C58B32]/15 border border-[#C58B32]/40 p-3.5 rounded-xl flex items-start gap-3 text-xs mb-3">
                <AlertTriangle className="w-4 h-4 text-[#C58B32] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#C58B32] font-mono">
                    Deterministic Shortfall: {selectedNode.discrepancy}
                  </span>
                  <p className="text-[#E9E2D0]/80 mt-0.5">
                    Milk input (1,000 L) minus permitted evaporation & transfer loss (20 L) does not reconcile with downstream tanker intake (650 L). 330 Litres disappeared between 06:15 and 08:20.
                  </p>
                </div>
              </div>
            )}

            <p className="text-xs text-[#E9E2D0]/70 italic mt-1">
              Inspection Note: {selectedNode.note}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
