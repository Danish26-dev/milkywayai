import React, { useState } from 'react';
import { Scale, AlertTriangle, CheckCircle2, Clock, MapPin, Gauge, ShieldAlert, FileText, ArrowRight } from 'lucide-react';

export const MassBalanceDemo: React.FC = () => {
  const [selectedAnomaly, setSelectedAnomaly] = useState<'mass-balance' | 'impossible-movement'>('mass-balance');

  return (
    <section id="the-discrepancy" className="py-20 bg-[#FFFDF7] border-b border-[#26352D]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B78632]" />
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#B78632] font-bold">
              SECTION 3 • THE DISCREPANCY
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#202521] tracking-tight font-sans">
            Every movement leaves a record.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#202521]/80 leading-relaxed font-normal">
            Milk cannot vanish or teleport without leaving physical evidence. MilkyWay's deterministic anomaly engine continuously audits every volume transfer and transit duration against physical laws.
          </p>
        </div>

        {/* 2 MVP Anomaly Toggle Pills */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <button
            onClick={() => setSelectedAnomaly('mass-balance')}
            className={`px-5 py-3 text-xs font-mono font-bold rounded-full transition-all cursor-pointer shadow-xs flex items-center gap-2 ${
              selectedAnomaly === 'mass-balance'
                ? 'bg-[#26352D] text-[#FFFDF7] shadow-md scale-[1.01]'
                : 'bg-[#F4F1E8] text-[#202521] border border-[#26352D]/15 hover:bg-[#D8D3C7]/60'
            }`}
          >
            <Scale className="w-4 h-4 text-[#B78632]" />
            <span>MVP Anomaly 1: Mass Balance Discrepancy (330 L Unaccounted)</span>
          </button>

          <button
            onClick={() => setSelectedAnomaly('impossible-movement')}
            className={`px-5 py-3 text-xs font-mono font-bold rounded-full transition-all cursor-pointer shadow-xs flex items-center gap-2 ${
              selectedAnomaly === 'impossible-movement'
                ? 'bg-[#26352D] text-[#FFFDF7] shadow-md scale-[1.01]'
                : 'bg-[#F4F1E8] text-[#202521] border border-[#26352D]/15 hover:bg-[#D8D3C7]/60'
            }`}
          >
            <Gauge className="w-4 h-4 text-[#9E4939]" />
            <span>MVP Anomaly 2: Impossible Movement (180 km in 45 min)</span>
          </button>
        </div>

        {/* Anomaly 1: Mass Balance Discrepancy View */}
        {selectedAnomaly === 'mass-balance' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Visual Equation Card */}
            <div className="lg:col-span-8 bg-[#F4F1E8] border-2 border-[#B78632]/40 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#26352D]/10 mb-6 gap-2">
                <div>
                  <span className="text-[10px] font-mono text-[#B78632] uppercase font-bold tracking-[0.2em] block">
                    DETERMINISTIC MASS-BALANCE RECONCILIATION
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#202521] font-sans mt-0.5">
                    Batch MW-10482: Physical Shortfall Flagged
                  </h3>
                </div>
                <span className="text-xs font-mono px-3.5 py-1.5 bg-[#B78632]/15 text-[#B78632] rounded-full border border-[#B78632]/30 font-bold">
                  INVESTIGATION SIGNAL
                </span>
              </div>

              {/* Arithmetic Breakdown - Exactly as specified */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
                {/* Step 1: Input */}
                <div className="bg-[#FFFDF7] border border-[#26352D]/10 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#202521]/60 tracking-wider font-semibold">
                      INPUT
                    </span>
                    <div className="text-2xl font-bold font-mono text-[#202521] mt-1">
                      1,000 <span className="text-xs font-normal">L</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#202521]/70 mt-2 font-mono">
                    Received from Farm 019
                  </span>
                </div>

                {/* Step 2: Expected Output */}
                <div className="bg-[#FFFDF7] border border-[#26352D]/10 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#202521]/60 tracking-wider font-semibold">
                      EXPECTED OUTPUT
                    </span>
                    <div className="text-2xl font-bold font-mono text-[#66734A] mt-1">
                      980 <span className="text-xs font-normal">L</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#202521]/70 mt-2 font-mono">
                    2% tolerance (-20 L)
                  </span>
                </div>

                {/* Step 3: Actual Output */}
                <div className="bg-[#FFFDF7] border border-[#26352D]/10 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#202521]/60 tracking-wider font-semibold">
                      ACTUAL OUTPUT
                    </span>
                    <div className="text-2xl font-bold font-mono text-[#202521] mt-1">
                      650 <span className="text-xs font-normal">L</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#202521]/70 mt-2 font-mono">
                    Tanker V-22 intake dock
                  </span>
                </div>

                {/* Step 4: Unaccounted */}
                <div className="bg-[#B78632]/15 border-2 border-[#B78632] rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#B78632] tracking-wider font-bold">
                      UNACCOUNTED
                    </span>
                    <div className="text-2xl font-bold font-mono text-[#B78632] mt-1">
                      330 <span className="text-xs font-normal">L</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#B78632] mt-2 font-mono">
                    Shortfall Flagged
                  </span>
                </div>
              </div>

              {/* Visual Balance Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs font-mono text-[#202521]/70 mb-2">
                  <span>Mass Allocation Breakdown (1,000 L Total Input)</span>
                  <span>Recorded: 650 L (65%) | Permitted Loss: 20 L (2%) | Discrepancy: 330 L (33%)</span>
                </div>
                <div className="w-full h-4 bg-[#D8D3C7] rounded-full overflow-hidden flex p-0.5 border border-[#26352D]/10">
                  <div
                    className="bg-[#26352D] h-full rounded-l-full"
                    style={{ width: '65%' }}
                    title="Actual Output: 650 L"
                  />
                  <div
                    className="bg-[#66734A] h-full"
                    style={{ width: '2%' }}
                    title="Expected Process Shrinkage: 20 L"
                  />
                  <div
                    className="bg-[#B78632] h-full rounded-r-full animate-pulse"
                    style={{ width: '33%' }}
                    title="Unaccounted Discrepancy: 330 L"
                  />
                </div>
              </div>

              {/* Non-Diagnostic Investigation Signal Notice */}
              <div className="p-4 rounded-2xl bg-[#B78632]/10 border border-[#B78632]/30 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#B78632] shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-[#202521] uppercase tracking-wider font-mono block">
                    INVESTIGATION SIGNAL — NOT PROOF OF ADULTERATION
                  </span>
                  <p className="text-xs text-[#202521]/80 mt-1 leading-relaxed">
                    This mathematical shortfall indicates that 330 litres left custody without physical accounting. It does not determine whether dilution occurred or water was added — that requires physical sample collection and laboratory testing by human officers.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Pillar: Operational Context */}
            <div className="lg:col-span-4 bg-[#26352D] text-[#FFFDF7] border border-[#26352D] rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-[#B78632]" />
                  <span className="text-[10px] font-mono tracking-[0.2em] text-[#D8D3C7] uppercase font-bold">
                    Arithmetic vs Inference
                  </span>
                </div>

                <h4 className="text-xl font-bold text-[#FFFDF7] font-sans leading-snug mb-4">
                  Deterministic Math. Zero Subjective Guessing.
                </h4>

                <div className="space-y-4 text-xs text-[#D8D3C7] leading-relaxed font-normal">
                  <p>
                    MilkyWay does not use LLMs to guess whether a batch is missing volume. Anomaly detection is computed purely through deterministic SQL and mass-balance formulas.
                  </p>
                  <p>
                    <strong>Input:</strong> Cumulative farm tickets.<br />
                    <strong>Tolerance:</strong> Standard 2.0% physical chilling shrinkage.<br />
                    <strong>Shortfall:</strong> Anything outside the physical bound is committed as an anomaly event.
                  </p>
                  <div className="p-3.5 bg-black/30 rounded-2xl border border-white/10 text-[11px] font-mono">
                    <code>UNACCOUNTED = INPUT - EXPECTED_LOSS - OUTPUT</code>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="text-[#B78632] font-bold">Audit Action:</span>
                <span className="text-[#D8D3C7]">Prioritize CC-204 Inspection</span>
              </div>
            </div>
          </div>
        )}

        {/* Anomaly 2: Impossible Movement View */}
        {selectedAnomaly === 'impossible-movement' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Visual Route Velocity Card */}
            <div className="lg:col-span-8 bg-[#F4F1E8] border-2 border-[#9E4939]/40 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#26352D]/10 mb-6 gap-2">
                <div>
                  <span className="text-[10px] font-mono text-[#9E4939] uppercase font-bold tracking-[0.2em] block">
                    TRANSIT VELOCITY & TIMESTAMP FEASIBILITY AUDIT
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#202521] font-sans mt-0.5">
                    Batch MW-10391: Physically Implausible Movement
                  </h3>
                </div>
                <span className="text-xs font-mono px-3.5 py-1.5 bg-[#9E4939]/15 text-[#9E4939] rounded-full border border-[#9E4939]/30 font-bold">
                  HIGH SEVERITY ANOMALY
                </span>
              </div>

              {/* Transit Parameters Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
                <div className="bg-[#FFFDF7] border border-[#26352D]/10 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#202521]/60 tracking-wider font-semibold">
                      TRANSIT ROUTE
                    </span>
                    <div className="text-base font-bold font-mono text-[#202521] mt-1">
                      CC-204 → Plant P-07
                    </div>
                  </div>
                  <span className="text-[10px] text-[#202521]/70 mt-2 font-mono">
                    Inter-District Corridor
                  </span>
                </div>

                <div className="bg-[#FFFDF7] border border-[#26352D]/10 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#202521]/60 tracking-wider font-semibold">
                      HIGHWAY DISTANCE
                    </span>
                    <div className="text-2xl font-bold font-mono text-[#202521] mt-1">
                      180 <span className="text-xs font-normal">km</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#202521]/70 mt-2 font-mono">
                    Verified GIS Route
                  </span>
                </div>

                <div className="bg-[#FFFDF7] border border-[#26352D]/10 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#202521]/60 tracking-wider font-semibold">
                      LOGGED TIME
                    </span>
                    <div className="text-2xl font-bold font-mono text-[#9E4939] mt-1">
                      45 <span className="text-xs font-normal">min</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#202521]/70 mt-2 font-mono">
                    Dispatch: 08:30 → Intake: 09:15
                  </span>
                </div>

                <div className="bg-[#9E4939]/15 border-2 border-[#9E4939] rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#9E4939] tracking-wider font-bold">
                      CALCULATED SPEED
                    </span>
                    <div className="text-2xl font-bold font-mono text-[#9E4939] mt-1">
                      240 <span className="text-xs font-normal">km/h</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#9E4939] mt-2 font-mono">
                    Physical Impossibility
                  </span>
                </div>
              </div>

              {/* Route Timeline Diagram */}
              <div className="bg-[#FFFDF7] rounded-2xl p-5 border border-[#26352D]/10 mb-6">
                <span className="text-xs font-mono font-bold text-[#202521] uppercase block mb-3">
                  Transit Log Comparison (Physical Highway vs Recorded Telemetry):
                </span>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-[#F4F1E8] rounded-xl border border-[#26352D]/10">
                    <span className="text-[#202521]/70">Standard Heavy Tanker Transit Time (at 60 km/h):</span>
                    <span className="font-bold text-[#202521]">180 Minutes (3.0 Hours)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-[#9E4939]/15 rounded-xl border border-[#9E4939]/30 text-[#9E4939]">
                    <span className="font-bold">Recorded Docket Dispatch-to-Intake Elapsed Time:</span>
                    <span className="font-bold">45 Minutes (-135 min gap)</span>
                  </div>
                </div>
              </div>

              {/* What this flag indicates */}
              <div className="p-4 rounded-2xl bg-[#9E4939]/10 border border-[#9E4939]/30 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#9E4939] shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-[#202521] uppercase tracking-wider font-mono block">
                    FLAG: PHYSICALLY IMPLAUSIBLE MOVEMENT
                  </span>
                  <p className="text-xs text-[#202521]/80 mt-1 leading-relaxed">
                    This flag indicates potential fraudulent logging (pre-signing dockets before delivery), severe data-entry errors, or an unregistered intermediate substitution point. It is an investigation signal, not proof of adulteration.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Pillar: Forensic Officer Implication */}
            <div className="lg:col-span-4 bg-[#26352D] text-[#FFFDF7] border border-[#26352D] rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-[#9E4939]" />
                  <span className="text-[10px] font-mono tracking-[0.2em] text-[#D8D3C7] uppercase font-bold">
                    Inspection Prioritization
                  </span>
                </div>

                <h4 className="text-xl font-bold text-[#FFFDF7] font-sans leading-snug mb-4">
                  Why Transit Timing Matters to Food Safety
                </h4>

                <div className="space-y-4 text-xs text-[#D8D3C7] leading-relaxed font-normal">
                  <p>
                    When tankers arrive hours ahead of schedule or dockets are back-dated, it frequently masks unlogged stops where milk was diverted, blended with unchilled liquid, or transferred without digital seals.
                  </p>
                  <p>
                    Rather than inspecting compliant routes, Food Safety Officers inspect the drivers, manifests, and intake docks associated with Vehicle V-22.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="text-[#9E4939] font-bold">Vehicle Flag:</span>
                <span className="text-[#D8D3C7]">Vehicle V-22 Custody Hold</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
