import React, { useState } from 'react';
import { Warehouse, Factory, Database, Truck, Store, ArrowDown, ArrowRight, CheckCircle2, ShieldCheck, Thermometer, Radio } from 'lucide-react';

export const MovementSection: React.FC = () => {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  const steps = [
    {
      step: '01',
      name: 'Collection Centre',
      role: 'Aggregation & Bulk Chilling',
      code: 'CC-204',
      icon: Warehouse,
      description: 'Farmers deliver morning cans to local chilling vats. Milk is cooled to 4°C within two hours of milking to arrest bacterial growth.',
      telemetry: {
        intakeWeight: '1,000 L',
        chillingTemp: '3.9°C',
        density: '1.029 g/cm³',
        holdingVat: 'Vat #03 (Stainless 304)',
        event: 'EVENT_COLLECTION_INTAKE'
      },
      physicalDetail: 'Mechanical agitation vats, plate heat exchangers, and barcode custody tags applied to tanker manifold connections.'
    },
    {
      step: '02',
      name: 'Processing Facility',
      role: 'Standardization & Pasteurization',
      code: 'PLANT-P07',
      icon: Factory,
      description: 'Raw milk is pumped through centrifugal clarifiers, standardized for butterfat, and pasteurized via High-Temperature Short-Time (HTST) plates.',
      telemetry: {
        intakeWeight: '650 L Received',
        pasteurTemp: '72.5°C (15s hold)',
        homogenized: 'Verified (2,000 PSI)',
        processingLoss: '13 L (2.0% expected)',
        event: 'EVENT_PASTEURIZATION_RUN'
      },
      physicalDetail: 'Hermetic valves, automated CIP rinse cycles, and digital continuous flow meters recording intake versus packaged yield.'
    },
    {
      step: '03',
      name: 'Storage Silos',
      role: 'Sterile Insulated Buffer',
      code: 'SILO-B02',
      icon: Database,
      description: 'Chilled pasteurized milk is buffered in jacketed vertical stainless silos under positive sterile air pressure before bottling lines.',
      telemetry: {
        currentCapacity: '45,000 L',
        siloTemp: '2.8°C continuous',
        airPad: '0.05 bar sterile N₂',
        agitatorCycle: '10 min / hour',
        event: 'EVENT_STORAGE_DEPOSIT'
      },
      physicalDetail: 'Twin-wall polyurethane foam insulation, vacuum relief valves, and sanitary diaphragm pressure transmitters.'
    },
    {
      step: '04',
      name: 'Milk Tanker',
      role: 'Refrigerated Inter-District Transit',
      code: 'TANKER-V22',
      icon: Truck,
      description: 'Tri-axle insulated road tankers transport batch milk between districts. Digital telemetry tracks valve seals, GPS coordinates, and cooling.',
      telemetry: {
        capacity: '18,000 L',
        valveSeals: 'SEAL-E9021 (Intact)',
        gpsVelocity: '62 km/h (Normal)',
        transitTemp: '3.4°C',
        event: 'EVENT_TRANSIT_DISPATCH'
      },
      physicalDetail: 'Multi-compartment baffle construction, electronic security seals on loading dome, and calibrated flow turbine on discharge pump.'
    },
    {
      step: '05',
      name: 'Distribution / Facility',
      role: 'Receiving Dock & Custody Transfer',
      code: 'DIST-HUB-03',
      icon: Store,
      description: 'Milk arrives at cold chain distribution hubs or packaging facilities. Receiving dock operators log custody transfer and volumetric reconciliation.',
      telemetry: {
        docketReconciliation: 'Matched against dispatch',
        temperatureIntake: '3.6°C',
        palletCount: '48 refrigerated skids',
        custodyTransfer: 'Signed & Recorded',
        event: 'EVENT_CUSTODY_HANDOFF'
      },
      physicalDetail: 'Dock bumper air locks, ultrasonic flow meters, and synchronized digital manifests matching central ledger.'
    }
  ];

  const activeStep = steps[activeStepIndex];

  return (
    <section id="movement-chain" className="py-20 bg-[#F4F1E8] border-b border-[#26352D]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#607481]" />
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#607481] font-bold">
              SECTION 2 • THE MOVEMENT
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#202521] tracking-tight font-sans">
            Then it starts moving.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#202521]/80 leading-relaxed font-normal">
            The physical dairy supply chain between farm origin and inspection is industrial, clean, and continuous. Each custody transfer and route movement creates an append-only event in the journal.
          </p>
        </div>

        {/* 5-Stage Sequence Breadcrumb Bar */}
        <div className="bg-[#FFFDF7] rounded-3xl p-4 sm:p-5 border border-[#607481]/25 mb-10 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {steps.map((st, idx) => {
              const Icon = st.icon;
              const isCurrent = activeStepIndex === idx;
              return (
                <button
                  key={st.step}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer border flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-[#26352D] text-[#FFFDF7] border-[#26352D] shadow-md scale-[1.02]'
                      : 'bg-[#F4F1E8] text-[#202521] border-[#607481]/20 hover:bg-[#D8D3C7]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-mono font-bold ${isCurrent ? 'text-[#607481]' : 'text-[#607481]'}`}>
                      {st.step} • {st.code}
                    </span>
                    <Icon className={`w-4 h-4 ${isCurrent ? 'text-[#FFFDF7]' : 'text-[#607481]'}`} />
                  </div>
                  <div>
                    <span className="font-bold text-xs sm:text-sm block truncate">
                      {st.name}
                    </span>
                    <span className={`text-[10px] block mt-0.5 truncate ${isCurrent ? 'text-[#D8D3C7]' : 'text-[#202521]/70'}`}>
                      {st.role}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Deep Dive into Selected Movement Node */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Node Description & Industrial Infrastructure */}
          <div className="lg:col-span-6 bg-[#FFFDF7] border border-[#607481]/30 rounded-3xl p-7 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#607481]/15 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#607481]/15 text-[#607481] flex items-center justify-center font-bold">
                    <activeStep.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#607481] uppercase tracking-widest font-bold">
                      Movement Node {activeStep.step}
                    </span>
                    <h3 className="text-2xl font-bold text-[#202521] mt-0.5 font-sans">
                      {activeStep.name}
                    </h3>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 bg-[#D8D3C7]/50 text-[#202521] rounded-full">
                  ID: {activeStep.code}
                </span>
              </div>

              <p className="text-sm sm:text-base text-[#202521]/80 leading-relaxed mb-6 font-normal">
                {activeStep.description}
              </p>

              <div className="bg-[#F4F1E8] rounded-2xl p-5 border border-[#607481]/20 mb-6">
                <span className="text-xs font-mono font-bold text-[#26352D] uppercase block mb-1">
                  Physical Infrastructure & Custody Safeguards:
                </span>
                <p className="text-xs text-[#202521]/80 leading-relaxed">
                  {activeStep.physicalDetail}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#26352D]/10 flex items-center justify-between">
              <span className="text-xs font-mono text-[#607481] font-bold">
                Supply Chain Phase: {activeStep.role}
              </span>
              <span className="text-xs font-mono text-[#202521]/60">
                Stainless 304/316 Standard
              </span>
            </div>
          </div>

          {/* Node Digital Telemetry & Append-Only Event Docket */}
          <div className="lg:col-span-6 bg-[#26352D] text-[#FFFDF7] border-2 border-[#607481]/40 rounded-3xl p-7 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-white/10 mb-6 gap-2">
                <div>
                  <span className="text-[10px] font-mono text-[#607481] font-bold uppercase tracking-[0.2em] block">
                    APPEND-ONLY JOURNAL EVENT
                  </span>
                  <h4 className="text-base sm:text-lg font-bold text-[#FFFDF7] font-mono mt-0.5">
                    {activeStep.telemetry.event}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#607481] animate-pulse" />
                  <span className="text-xs font-mono text-[#D8D3C7]">BigQuery Write-Once</span>
                </div>
              </div>

              <div className="space-y-3 font-mono text-xs mb-6">
                {Object.entries(activeStep.telemetry).map(([key, val]) => {
                  if (key === 'event') return null;
                  const label = key.replace(/([A-Z])/g, ' $1').toUpperCase();
                  return (
                    <div
                      key={key}
                      className="bg-black/25 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between"
                    >
                      <span className="text-[11px] text-[#D8D3C7]/80 uppercase tracking-wider">
                        {label}
                      </span>
                      <span className="font-bold text-[#FFFDF7]">
                        {val}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-xs text-[#D8D3C7] leading-relaxed">
                <span className="font-bold text-[#FFFDF7] block mb-1">
                  How MilkyWay Traces This Transfer:
                </span>
                Every transfer between tanks, tankers, or silos records signed volumetric meters and digital seal IDs. If volume is missing downstream without registered process shrinkage, MilkyWay flags it.
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-[#607481] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#607481]" />
                Custody Chain Verified
              </span>
              <span className="text-[#D8D3C7]">No In-Place Edits Allowed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
