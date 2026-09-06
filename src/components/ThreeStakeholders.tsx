import React from 'react';
import { ArrowRight, Tractor, Factory, ShieldAlert, CheckCircle2, AlertTriangle, Scale } from 'lucide-react';

export const ThreeStakeholders: React.FC = () => {
  return (
    <section id="three-worlds" className="py-20 bg-[#F4F1E8] border-b border-[#26352D]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#66734A]" />
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#66734A] font-bold">
              The Three Stakeholder Worlds
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#202521] tracking-tight font-sans">
            Three distinct worlds. Connected by one milk supply chain.
          </h2>
          <p className="mt-3 text-base text-[#202521]/80 leading-relaxed font-normal">
            MilkyWay never confuses the farmer with the supply chain, nor the supply chain with the investigator. Each stakeholder operates in a completely distinct physical and operational environment.
          </p>
        </div>

        {/* 3 Horizontal Connected Cards */}
        <div className="relative">
          {/* Continuous Supply Chain Trail Line */}
          <div className="hidden lg:block absolute top-1/2 left-12 right-12 h-0.5 bg-gradient-to-r from-[#66734A] via-[#607481] to-[#B78632] -translate-y-1/2 z-0 opacity-40" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            {/* 01: MILK FARMER — ORIGIN */}
            <div className="bg-[#FFFDF7] border-2 border-[#66734A]/30 rounded-3xl p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#66734A]/15 mb-5">
                  <span className="text-xs font-mono font-bold px-3 py-1 bg-[#66734A]/15 text-[#66734A] rounded-full">
                    01 • ORIGIN
                  </span>
                  <div className="w-10 h-10 rounded-full bg-[#66734A]/10 flex items-center justify-center text-[#66734A]">
                    <Tractor className="w-5 h-5" />
                  </div>
                </div>

                <div className="mb-2">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#8A6A4A] font-bold">
                    The Producer
                  </span>
                  <h3 className="text-2xl font-bold text-[#202521] mt-0.5">
                    Milk Farmer
                  </h3>
                </div>

                <p className="text-sm text-[#202521]/80 leading-relaxed mb-6 font-normal">
                  Rural agriculture, cattle, morning and evening milking, farm collection cans, and cooperative weigh stations.
                </p>

                <div className="space-y-3 pt-4 border-t border-[#66734A]/10">
                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#66734A] mt-2 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-[#202521] block">Primary role:</span>
                      <span className="text-xs text-[#202521]/75">“Where the milk originates.” Produces and records the initial batch.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8A6A4A] mt-2 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-[#202521] block">Digital action:</span>
                      <span className="text-xs text-[#202521]/75 font-mono">FARM_COLLECT event logged (volume, temperature, time).</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#66734A] mt-2 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-[#202521] block">Visual domain:</span>
                      <span className="text-xs text-[#202521]/75">Field Olive (#66734A) & Clay Brown (#8A6A4A). Natural, physical.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-7 pt-4 border-t border-[#26352D]/10 flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#66734A] font-bold">Origin Ledger Entry</span>
                <span className="text-xs font-mono text-[#202521]/60">1,000 L Dispatched</span>
              </div>
            </div>

            {/* 02: MILK / DAIRY SUPPLY CHAIN — MOVEMENT */}
            <div className="bg-[#FFFDF7] border-2 border-[#607481]/30 rounded-3xl p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#607481]/15 mb-5">
                  <span className="text-xs font-mono font-bold px-3 py-1 bg-[#607481]/15 text-[#607481] rounded-full">
                    02 • MOVEMENT
                  </span>
                  <div className="w-10 h-10 rounded-full bg-[#607481]/10 flex items-center justify-center text-[#607481]">
                    <Factory className="w-5 h-5" />
                  </div>
                </div>

                <div className="mb-2">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#607481] font-bold">
                    Physical Transfer
                  </span>
                  <h3 className="text-2xl font-bold text-[#202521] mt-0.5">
                    Dairy Supply Chain
                  </h3>
                </div>

                <p className="text-sm text-[#202521]/80 leading-relaxed mb-6 font-normal">
                  Chilling centres, industrial dairy processing plants, stainless-steel tanks, reefer tankers, and cold-storage silos.
                </p>

                <div className="space-y-3 pt-4 border-t border-[#607481]/10">
                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#607481] mt-2 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-[#202521] block">Primary role:</span>
                      <span className="text-xs text-[#202521]/75">“How milk moves.” Physical custody transfers and temperature maintenance.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#26352D] mt-2 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-[#202521] block">Digital action:</span>
                      <span className="text-xs text-[#202521]/75 font-mono">INTAKE, CHILL, DISPATCH, & TRANSIT custody seals.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#607481] mt-2 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-[#202521] block">Visual domain:</span>
                      <span className="text-xs text-[#202521]/75">Milk White (#FFFDF7), Dusty Blue (#607481), Stainless Steel.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-7 pt-4 border-t border-[#26352D]/10 flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#607481] font-bold">Deterministic Journal</span>
                <span className="text-xs font-mono text-[#202521]/60">Append-Only BigQuery</span>
              </div>
            </div>

            {/* 03: FOOD SAFETY OFFICER — INVESTIGATION */}
            <div className="bg-[#26352D] text-[#FFFDF7] border-2 border-[#B78632]/50 rounded-3xl p-7 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#B78632]/25 mb-5">
                  <span className="text-xs font-mono font-bold px-3 py-1 bg-[#B78632]/20 text-[#B78632] rounded-full border border-[#B78632]/30">
                    03 • INVESTIGATION
                  </span>
                  <div className="w-10 h-10 rounded-full bg-[#B78632]/15 flex items-center justify-center text-[#B78632]">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                </div>

                <div className="mb-2">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#B78632] font-bold">
                    Regulatory Authority
                  </span>
                  <h3 className="text-2xl font-bold text-[#FFFDF7] mt-0.5">
                    Food Safety Officer
                  </h3>
                </div>

                <p className="text-sm text-[#D8D3C7] leading-relaxed mb-6 font-normal">
                  Inspection priorities, anomaly dossiers, evidence correlation, facility audit trails, and physical inspector dispatch.
                </p>

                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B78632] mt-2 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-[#FFFDF7] block">Primary role:</span>
                      <span className="text-xs text-[#D8D3C7]">“Where discrepancies are investigated.” Ranks inspection urgency.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9E4939] mt-2 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-[#FFFDF7] block">Digital action:</span>
                      <span className="text-xs text-[#D8D3C7] font-mono">Agent reviews MCP evidence & issues inspection dossier.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B78632] mt-2 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-[#FFFDF7] block">Visual domain:</span>
                      <span className="text-xs text-[#D8D3C7]">Charcoal Green (#26352D), Ochre (#B78632), Brick Red (#9E4939).</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-7 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#B78632] font-bold">Inspection Triage</span>
                <span className="text-xs font-mono text-[#D8D3C7]">Physical Test Followup</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
